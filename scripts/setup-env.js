import { parseArgs } from 'node:util';
import { randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
const { values } = parseArgs({ options: { origin: { type: 'string' }, 'privacy-contact': { type: 'string' } } });
const origin = new URL(values.origin || '');
if (origin.protocol !== 'https:' || origin.origin !== values.origin) throw new Error('Provide an exact https origin without a trailing slash.');
const contact = values['privacy-contact'];
if (!contact || /[\r\n"'\\$]/.test(contact)) throw new Error('Provide a valid privacy contact email or plain text.');
const secret = () => randomBytes(32).toString('hex');
const contents = [
  'NODE_ENV=production', 'APP_ORIGIN=' + origin.origin,
  'PRIVACY_CONTACT="' + contact + '"', 'PORT=3010', 'DATABASE_NAME=matric_mastery',
  'POSTGRES_PASSWORD=' + secret(), 'APP_DB_PASSWORD=' + secret(), 'APP_ENCRYPTION_KEY=' + secret(),
  'ANTHROPIC_API_KEY=', 'ANTHROPIC_MODEL=', 'AI_DAILY_LIMIT=30', 'AI_GLOBAL_DAILY_LIMIT=1000',
  'SMTP_HOST=', 'SMTP_PORT=587', 'SMTP_USER=', 'SMTP_PASSWORD=', 'MAIL_FROM=', '',
].join('\n');
await writeFile('.env', contents, { mode: 0o600, flag: 'wx' });
console.log('Created .env with unique secrets and owner-only file permissions. Existing files are never overwritten.');
