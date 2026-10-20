# Operations and recovery

Run project commands from `/opt/matric-mastery`. Do not run `docker compose down --volumes` on a live system: it deletes the database volume. Only the disposable CI workflow uses that command.

## Encrypted backups

Install the `age` encryption utility on the host and generate an age identity on a secure recovery machine. Keep the private identity off the VPS during normal operation. Only the public recipient is needed for backups.

```sh
# On your recovery machine; keep the resulting private file secure.
age-keygen -o matric-recovery-identity.txt
age-keygen -y matric-recovery-identity.txt
```

On the VPS, set the public `age1...` recipient and run:

```sh
export BACKUP_AGE_RECIPIENT='age1YOUR_PUBLIC_RECIPIENT'
bash scripts/backup.sh
```

The script streams a consistent PostgreSQL custom-format dump into encryption, writes an atomic `.dump.age` file, and creates a SHA-256 sidecar. No plaintext database dump is written. It rejects concurrent backup runs. It does not copy files offsite or delete old ones: configure both deliberately, monitor disk space and alert on transfer/backup failures.

The database dump does not include `.env`, Nginx configuration, TLS material or the decryption identity. Preserve the deployment configuration securely, including the app encryption key, database role passwords, chosen release commit and operator recovery instructions. For example, encrypt `.env` to the same public recipient and transfer the encrypted file offsite. Restrict who can decrypt either artifact.

The timer examples run daily at roughly 02:15 South African time. After validating a manual backup, edit `/etc/matric-mastery-backup.env` to contain `BACKUP_AGE_RECIPIENT=age1YOUR_PUBLIC_RECIPIENT` and protect it with mode 600. Check the project path in the service before installing:

```sh
sudo cp deploy/matric-backup.service deploy/matric-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl start matric-backup.service
sudo systemctl status matric-backup.service
sudo systemctl enable --now matric-backup.timer
sudo systemctl list-timers matric-backup.timer
```

Track backup age, successful offsite copies, available space and periodic restore drills. Define a retention period suited to your service and learner data policy; remove expired copies from every location according to that policy.

## Restore drill without touching the live database

Use the corresponding private age identity in a controlled recovery session. For example:

```sh
export BACKUP_AGE_IDENTITY='/secure/path/matric-recovery-identity.txt'
bash scripts/restore-drill.sh backups/matric-TIMESTAMP.dump.age matric_restore_drill_20261020
```

The script checks the sidecar if present, creates a **new** database and restores in a single transaction. It refuses a name outside the `matric_restore_` prefix and refuses an existing database through `createdb`. It prints account and completed-assessment counts. A failed restore may leave an empty disposable database for inspection; it does not overwrite production.

Validate representative results and class membership in the restored database under controlled operator access. Record the result. Remove the disposable database only after verifying its exact name and that no app points at it. Remove the private identity from the VPS after recovery if it was temporarily copied there.

PostgreSQL references: [pg_dump](https://www.postgresql.org/docs/17/app-pgdump.html) and [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html).

## Actual recovery

1. Stop the app with `docker compose stop app`. Keep the current database and an encrypted backup for investigation.
2. Restore to a new `matric_restore_...` database using the drill script. Restore the corresponding `.env` securely if recovering the entire VPS; never generate a replacement encryption key for existing MFA records.
3. Reconcile account deletions, disabled accounts, membership removals and other access changes since the backup. Older backups can bring removed data or permissions back.
4. Change only `DATABASE_NAME` in `.env` to the verified restored database name. Run `docker compose up -d --wait db` so the container's `POSTGRES_DB` environment points at that database. The persistent volume stays intact and initialization scripts do not rerun. Apply migrations with `docker compose run --rm manage` using a release compatible with that backup.
5. Revoke old sessions, recovery links and unused invitations before reopening:

```sh
docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" --set ON_ERROR_STOP=1' <<'SQL'
DELETE FROM sessions;
DELETE FROM reset_tokens;
DELETE FROM invitations WHERE used_at IS NULL;
SQL
```

6. Start with `docker compose up -d --wait app`; run the smoke check and controlled sign-in/assessment tests before reopening access. Verify both operational and runtime roles still have the intended permissions.

## Upgrade and rollback

Before upgrading, record `git rev-parse HEAD`, back up the database and configuration, confirm the new commit passed CI and review its migrations. Keep an image tag for the previous version:

```sh
docker image tag matric-mastery:local matric-mastery:before-upgrade
docker compose stop app
git pull --ff-only
docker compose build --pull app
docker compose run --rm manage
docker compose up -d --wait app
docker compose exec -T app node scripts/smoke.js
```

If building or migration fails, leave the app stopped while investigating. A code rollback is safe only when the prior code supports the current schema. In that case check out the recorded prior commit, retag `matric-mastery:before-upgrade` as `matric-mastery:local`, and start without rebuilding. Schema-breaking changes require the verified backup recovery procedure, with explicit consideration of records created since that backup. Never undo a migration by changing its checksum.

## Account recovery

Normal password recovery uses SMTP and a one-use 20-minute link. It also requires an authenticator code when MFA is enabled and revokes existing sessions.

If SMTP is unavailable, or a staff member loses their authenticator, a trusted server operator can recover the verified person's account:

```sh
docker compose run --rm manage node scripts/account-recovery.js --email person@example.org
# Add --reset-mfa only for a verified lost-authenticator recovery:
docker compose run --rm manage node scripts/account-recovery.js --email person@example.org --reset-mfa
```

Passwords are entered interactively and are not passed as shell arguments. Recovery is audited and revokes sessions and reset links. Staff whose MFA was reset must enroll again before accessing learner records. The command does not silently re-enable a disabled account.

## Health and service limits

Monitor `/healthz` externally and check `docker compose ps` and container logs. Health checks alone do not send alerts or restart an unhealthy but still-running process; connect monitoring to your chosen alerting service. Restart policies recover exited processes and services after host restart. Keep logs and reverse-proxy access logs under a retention policy; avoid sharing them publicly.

The app has a ten-connection database pool, bounded request bodies, database query timeouts, 30-minute idle/eight-hour absolute sessions and shared database-backed rate limits. Every 30 seconds it finalizes up to 100 expired assessments; larger expiry queues may take additional cycles. Cleanup runs hourly for expired sessions/tokens, old quota records, seven-day AI deduplication records and 180-day audit events.

The initial list screens have bounds (300 assessments/recent results, 200 classes, 500 administrator-visible users, 50 recent chat threads). Plan pagination/search before exceeding these operational limits. There is no tested concurrency/SLA claim, high availability, point-in-time recovery or automatic offsite transfer. Measure the intended school workload before expanding beyond a controlled deployment.
