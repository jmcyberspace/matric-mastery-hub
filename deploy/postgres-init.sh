#!/usr/bin/env bash
set -euo pipefail
if [[ ! "${APP_DB_PASSWORD:-}" =~ ^[a-fA-F0-9]{64}$ ]]; then
  echo "APP_DB_PASSWORD must be 64 hexadecimal characters." >&2
  exit 1
fi
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1 <<SQL
CREATE ROLE matric_app LOGIN PASSWORD '${APP_DB_PASSWORD}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
SQL
