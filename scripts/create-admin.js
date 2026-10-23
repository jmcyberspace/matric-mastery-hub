import { parseArgs } from 'node:util';
import { createDatabase } from '../server/db.js';
import { hashPassword, id, audit } from '../server/security.js';
import { email, name, password } from '../server/validation.js';
import { secretInput } from './terminal-input.js';
const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });
const address = email.parse(values.email), displayName = name.parse(values.name);
const first = password.parse(await secretInput('New administrator password (hidden): '));
if (first !== await secretInput('Confirm password (hidden): ')) throw new Error('Passwords do not match.');
const hashed = await hashPassword(first), userId = id();
const db = createDatabase(process.env.DATABASE_URL);
try {
  await db.transaction(async tx => {
    await tx.query("INSERT INTO users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,'admin')", [userId,address,displayName,hashed]);
    await audit(tx, userId, 'account.admin-created');
  });
  console.log('Administrator created. Set up the authenticator at first sign-in.');
} finally { await db.close(); }
