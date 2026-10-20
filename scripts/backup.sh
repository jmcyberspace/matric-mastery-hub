#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/.."
: "${BACKUP_AGE_RECIPIENT:?Set an age public recipient key before running this script}"
command -v age >/dev/null
mkdir -p backups
exec 9>backups/.backup.lock
flock -n 9 || { echo 'Another backup is already running.' >&2; exit 1; }
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="backups/matric-${stamp}.dump.age"
temporary="${output}.partial"
trap 'rm -f "$temporary"' EXIT
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-password' |
  age -r "$BACKUP_AGE_RECIPIENT" -o "$temporary"
test -s "$temporary"
mv "$temporary" "$output"
sha256sum "$output" > "${output}.sha256"
echo "Encrypted backup created: $output"
# Set a documented retention policy and copy encrypted backups off the VPS.
