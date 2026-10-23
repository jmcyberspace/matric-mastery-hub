# Deploy to your VPS

## 1. Confirm the host and domain

Use a dedicated hostname such as `learn.your-domain.co.za`; replace `learn.example.org` below with that chosen hostname. Its DNS must point to the VPS. Do not replace the Nginx configuration for any existing JM CYBER SPACE website.

Install a maintained Docker Engine (28 or later), its Compose plugin, Git, Nginx and Certbot. Use the [official Docker Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/). Compose needs support for `up --wait`. Maintain OS security updates and accurate time synchronization, which authenticator codes need. Keep SSH restricted to your management access and expose only the intended HTTP/HTTPS services. The example app and database each have a 1 GiB memory ceiling; allow additional capacity for the OS, Nginx, image builds and other sites. Actual learner capacity requires a load test on the chosen VPS.

The localhost-only Docker binding relies on a recent Docker networking implementation; see [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/). Do not add a public database port or use the CI override in production.

## 2. Prepare the checkout and secrets

The commands assume an operator with permission to manage Docker and Nginx. Use a clean checkout of the reviewed branch/release, not an old prototype directory:

```sh
git clone --branch codex/vps-production-upgrade https://github.com/jmcyberspace/matric-mastery-hub.git /opt/matric-mastery
cd /opt/matric-mastery
docker run --rm --user "$(id -u):$(id -g)" -v "$PWD:/work" -w /work node:24-bookworm-slim node scripts/setup-env.js --origin https://learn.example.org --privacy-contact privacy@example.org
```

The setup command generates distinct random database passwords and an MFA encryption key, writes `.env` with owner-only permissions, and refuses to overwrite an existing file. Keep the real file out of Git and support messages. Keep an encrypted offsite copy of it: losing `APP_ENCRYPTION_KEY` prevents decryption of existing authenticator secrets. Use the generated hexadecimal database passwords; changing an existing PostgreSQL user's password requires an intentional database rotation, not just editing `.env`.

Optional services can be configured in this file:

| Variables | Configuration |
| --- | --- |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Set both to enable tutoring. Choose a model enabled for your Anthropic account and set a provider budget. |
| `AI_DAILY_LIMIT`, `AI_GLOBAL_DAILY_LIMIT` | Defaults: 30 requests per user and 1,000 platform-wide per rolling 24-hour quota window. Failed provider calls consume quota too. |
| `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM` | Email recovery; port 587 uses required STARTTLS, port 465 uses implicit TLS. |
| `SMTP_USER`, `SMTP_PASSWORD` | Both required when using authenticated SMTP. Use a permitted sender with SPF/DKIM configured at your provider. |
| `PRIVACY_CONTACT` | The real contact shown in the platform privacy notice. |
| `PORT` | Host loopback port, default 3010. If changed, update the Nginx upstream too. |

Use single quotes in `.env` around provider credentials containing dollar signs, hashes or spaces so Compose does not interpolate them. Never put secrets in frontend `VITE_*` variables. Anthropic model access and SMTP delivery must be checked with your actual accounts; they cannot be proved by mocked tests.

## 3. Build, migrate and create the first administrator

```sh
docker compose build --pull app
docker compose up -d --wait db
docker compose run --rm manage
docker compose run --rm manage node scripts/seed.js
docker compose run --rm manage node scripts/create-admin.js --email you@example.org --name 'Your name'
docker compose up -d --wait app
```

The administrator command prompts twice for a hidden password of at least 12 characters. There are no default credentials. The seed command is optional and safe to repeat; it does not overwrite published questions. Migrations are transactional, checksum-verified and protected by a database advisory lock. Do not edit an already-applied migration; add a new numbered migration.

The `manage` service is an explicit operations profile and does not run continuously. The app connects as the restricted `matric_app` database role; its image runs as a non-root user with a read-only filesystem, dropped Linux capabilities and no privilege escalation.

Check the local service without signing in over plain HTTP:

```sh
curl --fail http://127.0.0.1:3010/healthz
docker compose exec -T app node scripts/smoke.js
docker compose ps
```

## 4. Configure the existing Nginx and HTTPS

Create a separate site file. Replace `learn.example.org` in the copied file with your actual domain and preserve the proxy forwarding directives. If a CDN is introduced later, explicitly validate its trusted addresses; this example expects Nginx directly facing the internet.

```sh
sudo cp deploy/nginx-limits.conf /etc/nginx/conf.d/matric-limits.conf
sudo cp deploy/nginx-http.conf /etc/nginx/sites-available/matric-mastery
sudo nano /etc/nginx/sites-available/matric-mastery
sudo ln -s /etc/nginx/sites-available/matric-mastery /etc/nginx/sites-enabled/matric-mastery
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d learn.example.org --redirect
sudo nginx -t
sudo certbot renew --dry-run
```

Check the final HTTPS virtual host still proxies the app and overwrites `X-Forwarded-For` with `$remote_addr`. App requests must reach the same origin as `APP_ORIGIN`, including the scheme and any port. Production cookies are secure, HTTP-only, same-site strict and host-only; login is intended for HTTPS.

```sh
curl --fail https://learn.example.org/healthz
curl -I https://learn.example.org/login
docker compose exec -T app node scripts/smoke.js https://learn.example.org
```

The public smoke check requires the container to resolve and reach the public domain. If the host has no hairpin connectivity, run it from a separate machine with Node.js 24 instead. Do not disable TLS verification.

## 5. Verify before inviting learners

1. Sign in over HTTPS and complete authenticator setup. Staff cannot access records before MFA enrollment. Sign out, wait for a fresh code and sign in again.
2. Create a teacher invitation, a class and a learner invitation using test accounts you control. Verify the correct roles, class membership and expired/used invitation behavior.
3. Publish a small assessment. On the learner account, save answers, refresh, submit and review the result. Check it in the teacher report. Leave a second assessment until its deadline and confirm server marking without learner action.
4. Open a second teacher account and confirm the first teacher's class is inaccessible. Test disabling a learner and signing out all sessions.
5. Test focus recording, study plans, CSV output and Print / Save as PDF. Check keyboard use and narrow/mobile screens in actual browsers.
6. Send a real password reset, verify inbox delivery and single-use behavior. If using AI, send a short question, reload its history and check the preferred reply language.
7. Complete the encrypted backup and isolated restore drill in [Operations](OPERATIONS.md). Select offsite storage, retention and a person who monitors failed backups and service health.
8. Review the foundation content, privacy contact and school/family onboarding process. The supplied privacy notice describes the software; it is not a legal compliance certification.

Record the tested commit, domain, date, browser/device coverage and results. Use a small controlled rollout first. Repository tests passing alone do not verify TLS, email delivery, provider access or the VPS's operating security.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| App exits at startup | `.env`, database health and migrations. Use `docker compose logs --tail=100 app`; avoid sharing secrets or account content. |
| Database password authentication fails | Database initialization runs only for a fresh volume. Restore the correct credentials or rotate the database role deliberately. Do not delete the volume. |
| Login loops or origin rejected | Use HTTPS, the exact `APP_ORIGIN`, and the same hostname; inspect the Nginx forwarding configuration. |
| Authenticator rejected | Device/server clock, the newest code and whether that code was already used. Enrollment expires after 15 minutes. |
| Tutor unavailable | Both AI settings, account model access, outbound connectivity, request quotas and provider budget. |
| Recovery mail not received | SMTP settings, permitted sender, TLS, provider logs and spam folder. The app deliberately returns a generic response. |
| Older assets fail after update | Reload the page. Production HTML is revalidated and hashed assets are cached. |

This deployment guide does not modify or deploy any other JM CYBER SPACE application.
