#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
backup="${1:?Pass the path to an encrypted .dump.age backup}"
target="${2:?Pass a NEW database name beginning matric_restore_}"
: "${BACKUP_AGE_IDENTITY:?Set the path to the private age identity file}"
if [[ ! "$target" =~ ^matric_restore_[a-z0-9_]+$ ]]; then
  echo "Refusing to restore into a production or invalid database name." >&2
  exit 1
fi
test -f "$backup"
test -f "$BACKUP_AGE_IDENTITY"
command -v age >/dev/null
if [[ -f "${backup}.sha256" ]]; then
  read -r expected _ < "${backup}.sha256"
  actual="$(sha256sum "$backup")"
  if [[ ! "$expected" =~ ^[a-f0-9]{64}$ || "${actual%% *}" != "$expected" ]]; then
    echo 'The encrypted backup checksum does not match.' >&2
    exit 1
  fi
fi
docker compose exec -T db createdb -U matric_owner "$target"
age --decrypt -i "$BACKUP_AGE_IDENTITY" "$backup" |
  docker compose exec -T db pg_restore -U matric_owner -d "$target" --no-owner --exit-on-error --single-transaction
docker compose exec -T db psql -U matric_owner -d "$target" --set ON_ERROR_STOP=1 -c "SELECT count(*) AS accounts FROM users; SELECT count(*) AS submitted_attempts FROM attempts WHERE submitted_at IS NOT NULL;"
echo "Restored into $target. The live database has not been replaced."
