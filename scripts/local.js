import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
import { checkLocalApp } from './local-check.js';

const project = dirname(dirname(fileURLToPath(import.meta.url)));
export async function prepareLocalEnvironment(directory) {
  const path = join(directory, '.env.local');
  const secret = () => randomBytes(32).toString('hex');
  const contents = [
    '# Local testing only. Keep this file while retaining your local database.',
    'LOCAL_PORT=3010',
    'LOCAL_POSTGRES_PASSWORD=' + secret(),
    'LOCAL_APP_DB_PASSWORD=' + secret(),
    'LOCAL_ENCRYPTION_KEY=' + secret(),
    'LOCAL_ANTHROPIC_API_KEY=', 'LOCAL_ANTHROPIC_MODEL=',
    'LOCAL_SMTP_HOST=', 'LOCAL_SMTP_PORT=587', 'LOCAL_SMTP_USER=',
    'LOCAL_SMTP_PASSWORD=', 'LOCAL_MAIL_FROM=', '',
  ].join('\n');
  try { await writeFile(path, contents, { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  const settings = parseEnv(await readFile(path, 'utf8'));
  for (const key of ['LOCAL_POSTGRES_PASSWORD', 'LOCAL_APP_DB_PASSWORD', 'LOCAL_ENCRYPTION_KEY']) {
    if (!/^[a-f0-9]{64}$/i.test(settings[key] || '')) throw new Error('Invalid ' + key + ' in .env.local. Restore the original local configuration; do not regenerate credentials for an existing database.');
  }
  const port = Number(settings.LOCAL_PORT);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('LOCAL_PORT must be between 1024 and 65535.');
  return settings;
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { email: { type: 'string' }, name: { type: 'string' } } });
  const action = positionals[0] || 'start';
  if (positionals.length > 1 || !['start', 'stop', 'logs', 'admin', 'check'].includes(action)) throw new Error('Use start, stop, logs, admin, or check.');
  if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error('Use Node.js 24 for this project.');
  const info = spawnSync('docker', ['info', '--format', '{{.OSType}}'], { cwd: project, encoding: 'utf8' });
  if (info.error || info.status !== 0 || info.stdout.trim() !== 'linux') throw new Error('Start Docker Desktop with Linux containers, then retry. Docker must be available in this terminal.');
  const envPath = join(project, '.env.local');
  if (!existsSync(envPath)) {
    if (action !== 'start') throw new Error('Run npm run local first.');
    const volume = spawnSync('docker', ['volume', 'inspect', 'matric-mastery-local_postgres_data'], { cwd: project, stdio: 'ignore' });
    if (volume.status === 0) throw new Error('The local database already exists, but .env.local is missing. Restore that file to retain access to existing accounts.');
  }
  const settings = await prepareLocalEnvironment(project);
  // Use only the dedicated local file for LOCAL_* values, even if the shell has old settings.
  const childEnv = { ...process.env };
  for (const key of Object.keys(childEnv)) if (key.startsWith('LOCAL_')) delete childEnv[key];
  Object.assign(childEnv, settings);
  const compose = (...args) => {
    const result = spawnSync('docker', ['compose', '--env-file', '.env.local', '-p', 'matric-mastery-local', '-f', 'compose.local.yaml', ...args], { cwd: project, env: childEnv, stdio: 'inherit' });
    if (result.error || result.status !== 0) throw new Error('Docker Compose could not complete this step. Review the output above; your database has not been deleted.');
  };
  if (action === 'start') {
    compose('build', 'app');
    compose('up', '-d', '--wait', 'db');
    compose('run', '--rm', 'manage');
    compose('run', '--rm', 'manage', 'node', 'scripts/seed.js');
    compose('up', '-d', '--wait', 'app');
    console.log('\nReady at http://localhost:' + settings.LOCAL_PORT);
    console.log('First run: npm run local:admin -- --email you@example.org --name "Your name"');
    console.log('Stop while keeping your records: npm run local:stop');
  } else if (action === 'admin') {
    if (!values.email || !values.name) throw new Error('Supply --email and --name. Your password will be requested privately.');
    compose('run', '--rm', 'manage', 'node', 'scripts/create-admin.js', '--email', values.email, '--name', values.name);
  } else if (action === 'stop') compose('stop', 'app', 'db');
  else if (action === 'logs') compose('logs', '--tail=100', 'app', 'db');
  else if (action === 'check') {
    // Exercise the same host port that the user's browser opens.
    await checkLocalApp('http://localhost:' + settings.LOCAL_PORT);
  }
}
if (resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
