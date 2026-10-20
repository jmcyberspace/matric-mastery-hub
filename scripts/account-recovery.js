import { parseArgs } from 'node:util';
import { createDatabase } from '../server/db.js';
import { hashPassword, audit } from '../server/security.js';
import { email, password } from '../server/validation.js';
import { secretInput } from './terminal-input.js';
const { values } = parseArgs({ options: { email: { type: 'string' }, 'reset-mfa': { type: 'boolean', default: false } } });
const address = email.parse(values.email);
const first = password.parse(await secretInput('Replacement password (hidden): '));
if (first !== await secretInput('Confirm password (hidden): ')) throw new Error('Passwords do not match.');
const hashed = await hashPassword(first);
const db = createDatabase(process.env.DATABASE_URL);
try {
  await db.transaction(async tx => {
    const user = (await tx.query('UPDATE users SET password_hash=$1 WHERE email=$2 RETURNING id', [hashed,address])).rows[0];
    if (!user) throw new Error('Account not found.');
    if (values['reset-mfa']) await tx.query('UPDATE users SET mfa_secret=NULL,mfa_pending=NULL,mfa_pending_at=NULL,mfa_counter=-1 WHERE id=$1', [user.id]);
    await tx.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
    await tx.query('DELETE FROM reset_tokens WHERE user_id=$1', [user.id]);
    await audit(tx, user.id, values['reset-mfa'] ? 'operator.password-and-mfa-recovery' : 'operator.password-recovery');
  });
  console.log('Recovery complete. Existing sessions and reset links have been revoked.');
} finally { await db.close(); }
