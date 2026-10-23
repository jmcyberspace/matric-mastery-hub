import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareLocalEnvironment } from '../scripts/local.js';

test('local setup creates unique secrets, preserves them on restart and leaves VPS settings untouched', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'matric-local-'));
  try {
    await writeFile(join(directory, '.env'), 'APP_ORIGIN=https://production.example.test\n');
    const first = await prepareLocalEnvironment(directory);
    assert.equal(new Set([first.LOCAL_POSTGRES_PASSWORD, first.LOCAL_APP_DB_PASSWORD, first.LOCAL_ENCRYPTION_KEY]).size, 3);
    assert.deepEqual(await prepareLocalEnvironment(directory), first);
    assert.equal(await readFile(join(directory, '.env'), 'utf8'), 'APP_ORIGIN=https://production.example.test\n');
    const changed = (await readFile(join(directory, '.env.local'), 'utf8')).replace('LOCAL_PORT=3010', 'LOCAL_PORT=3011');
    await writeFile(join(directory, '.env.local'), changed);
    assert.equal((await prepareLocalEnvironment(directory)).LOCAL_PORT, '3011');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('local setup rejects damaged saved credentials without silently replacing them', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'matric-local-'));
  try {
    const original = 'LOCAL_POSTGRES_PASSWORD=broken\n';
    await writeFile(join(directory, '.env.local'), original);
    await assert.rejects(prepareLocalEnvironment(directory), /Restore the original local configuration/);
    assert.equal(await readFile(join(directory, '.env.local'), 'utf8'), original);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
