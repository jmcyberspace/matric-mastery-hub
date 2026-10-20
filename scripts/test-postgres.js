// Run only against a fresh, migrated, disposable CI database.
import { spawnSync } from 'node:child_process';
const database = process.env.DATABASE_NAME;
if (!database?.endsWith('_test')) throw new Error('DATABASE_NAME must end in _test.');
if (!/^[a-f0-9]{64}$/i.test(process.env.APP_DB_PASSWORD || '')) throw new Error('Use setup-env.js to create the CI credentials.');
const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', 'tests/platform.test.js'], {
  stdio: 'inherit',
  env: { ...process.env, TEST_DATABASE_URL: `postgresql://matric_app:${process.env.APP_DB_PASSWORD}@127.0.0.1:55432/${database}` },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
