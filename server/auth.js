import { z } from 'zod';
import nodemailer from 'nodemailer';
import { id, token, digest, hashPassword, checkPassword, assert, rateLimit, audit, encrypt, decrypt, newTotpSecret, validTotp } from './security.js';
import { email, password, name, language, uuid } from './validation.js';
export const publicUser = user => user ? ({
  id: user.id, email: user.email, name: user.name, role: user.role, grade: user.grade,
  language: user.language, mfaEnabled: Boolean(user.mfa_secret),
}) : null;
export const needsMfa = (user, config) => config.enforceMfa && user.role !== 'learner' && !user.mfa_secret;
export function requireAuth(req, _res, next) {
  assert(req.user, 401, 'Please sign in to continue.');
  assert(!needsMfa(req.user, req.platformConfig), 403, 'Set up two-factor authentication before continuing.');
  next();
}
export function signedIn(req, _res, next) { assert(req.user, 401, 'Please sign in to continue.'); next(); }
export function staff(req, _res, next) { assert(req.user.role !== 'learner', 403, 'Teacher access is required.'); next(); }
export function admin(req, _res, next) { assert(req.user.role === 'admin', 403, 'Administrator access is required.'); next(); }
export async function createSession(db, res, userId, config) {
  const raw = token(), csrf = token();
  await db.query("INSERT INTO sessions(token_hash,user_id,csrf,expires_at) VALUES($1,$2,$3,now()+interval '8 hours')", [digest(raw), userId, csrf]);
  await db.query('DELETE FROM sessions WHERE user_id=$1 AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5)', [userId]);
  res.cookie(config.cookieName, raw, { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/', maxAge: 8 * 3600000 });
  return csrf;
}
async function checkMfa(db, user, code, config) {
  if (!user.mfa_secret) return;
  const counter = validTotp(decrypt(user.mfa_secret, config.encryptionKey), code, user.mfa_counter);
  assert(counter !== null, 401, 'Check your authenticator code and try again.');
  const result = await db.query('UPDATE users SET mfa_counter=$1 WHERE id=$2 AND mfa_counter<$1 RETURNING id', [counter, user.id]);
  assert(result.rows.length, 401, 'That code has already been used. Wait for a new code.');
}
export async function registerAuth(app, db, config) {
  const dummyHash = await hashPassword(token());
  const transport = config.smtpHost && config.mailFrom ? nodemailer.createTransport({
    host: config.smtpHost, port: config.smtpPort, secure: config.smtpPort === 465,
    requireTLS: config.smtpPort !== 465,
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined,
    connectionTimeout: 10000, socketTimeout: 10000, tls: { minVersion: 'TLSv1.2' },
  }) : null;
  app.get('/api/auth/session', (req, res) => res.json({
    user: publicUser(req.user), csrf: req.session?.csrf || null,
    mfaRequired: req.user ? needsMfa(req.user, config) : false,
    resetAvailable: Boolean(transport), aiAvailable: Boolean(config.aiKey && config.aiModel),
    privacyContact: config.privacyContact,
  }));
  app.post('/api/auth/login', async (req, res) => {
    await rateLimit(db, 'login-ip:' + req.ip, 100, 900);
    const data = z.object({ email, password: z.string().min(1).max(128), code: z.string().regex(/^\d{6}$/).optional() }).strict().parse(req.body);
    await rateLimit(db, 'login-email:' + data.email, 10, 900);
    const user = (await db.query('SELECT * FROM users WHERE email=$1', [data.email])).rows[0];
    const valid = await checkPassword(user?.password_hash || dummyHash, data.password);
    assert(valid && user?.enabled, 401, 'The email or password is incorrect.');
    if (user.mfa_secret && !data.code) return res.status(401).json({ error: 'Enter the code from your authenticator.', code: 'MFA_REQUIRED' });
    await checkMfa(db, user, data.code, config);
    if (req.session) await db.query('DELETE FROM sessions WHERE token_hash=$1', [req.session.token_hash]);
    const csrf = await createSession(db, res, user.id, config);
    await audit(db, user.id, 'auth.login');
    res.json({ user: publicUser(user), csrf, mfaRequired: needsMfa(user, config) });
  });
  app.post('/api/auth/logout', signedIn, async (req, res) => {
    await db.query('DELETE FROM sessions WHERE token_hash=$1', [req.session.token_hash]);
    res.clearCookie(config.cookieName, { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/' });
    res.json({ ok: true });
  });
  app.post('/api/auth/logout-all', signedIn, async (req, res) => {
    await db.query('DELETE FROM sessions WHERE user_id=$1', [req.user.id]);
    res.clearCookie(config.cookieName, { path: '/', secure: config.production, httpOnly: true, sameSite: 'strict' });
    res.json({ ok: true });
  });
  const invitationToken = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
  app.post('/api/auth/invitation', async (req, res) => {
    await rateLimit(db, 'invite-info:' + req.ip, 30, 900);
    const data = z.object({ token: invitationToken }).strict().parse(req.body);
    const invitation = (await db.query('SELECT email,role,expires_at FROM invitations WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now()', [digest(data.token)])).rows[0];
    assert(invitation, 404, 'This invitation has expired or has already been used.');
    res.json(invitation);
  });
  app.post('/api/auth/accept-invitation', async (req, res) => {
    await rateLimit(db, 'invite-accept:' + req.ip, 60, 900);
    const data = z.object({ token: invitationToken, name, password, grade: z.number().int().min(11).max(12),
      acceptedPrivacy: z.literal(true) }).strict().parse(req.body);
    const hashed = await hashPassword(data.password);
    const user = await db.transaction(async tx => {
      const invite = (await tx.query('SELECT * FROM invitations WHERE token_hash=$1 AND used_at IS NULL AND expires_at>now() FOR UPDATE', [digest(data.token)])).rows[0];
      assert(invite, 400, 'This invitation has expired or has already been used.');
      const inviter = (await tx.query('SELECT enabled,role FROM users WHERE id=$1', [invite.created_by])).rows[0];
      assert(inviter?.enabled && inviter.role !== 'learner', 400, 'This invitation is no longer available.');
      const existing = (await tx.query('SELECT id FROM users WHERE email=$1', [invite.email])).rows[0];
      assert(!existing, 409, 'An account already exists for this email. Sign in instead.');
      const userId = id();
      const row = (await tx.query('INSERT INTO users(id,email,name,password_hash,role,grade) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',
        [userId, invite.email, data.name, hashed, invite.role, data.grade])).rows[0];
      if (invite.class_id) await tx.query('INSERT INTO memberships(class_id,user_id) VALUES($1,$2)', [invite.class_id, userId]);
      await tx.query('UPDATE invitations SET used_at=now() WHERE token_hash=$1', [digest(data.token)]);
      await audit(tx, userId, 'account.accepted-privacy-v1');
      return row;
    });
    const csrf = await createSession(db, res, user.id, config);
    res.status(201).json({ user: publicUser(user), csrf, mfaRequired: needsMfa(user, config) });
  });
  app.post('/api/auth/forgot-password', async (req, res) => {
    assert(transport, 503, 'Password recovery is not configured. Contact the administrator.');
    await rateLimit(db, 'reset-ip:' + req.ip, 10, 3600);
    const data = z.object({ email }).strict().parse(req.body);
    await rateLimit(db, 'reset-email:' + data.email, 3, 3600);
    const user = (await db.query('SELECT id,email FROM users WHERE email=$1 AND enabled=true', [data.email])).rows[0];
    if (user) {
      const raw = token();
      await db.query('DELETE FROM reset_tokens WHERE user_id=$1', [user.id]);
      await db.query("INSERT INTO reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '20 minutes')", [digest(raw), user.id]);
      // Never log delivery payloads or reset tokens.
      try {
        await transport.sendMail({ from: config.mailFrom, to: user.email, subject: 'Reset your Matric Mastery password',
          text: 'A password reset was requested for your account. This link expires in 20 minutes:\n\n' + config.origin + '/reset#token=' + raw + '\n\nIf you did not request this, ignore this message. Your password has not changed.' });
      } catch {
        await db.query('DELETE FROM reset_tokens WHERE token_hash=$1', [digest(raw)]);
        console.error('Password reset mail delivery failed');
      }
    }
    res.json({ message: 'If the account exists, a reset link will be sent. Check your inbox and spam folder.' });
  });
  app.post('/api/auth/reset-password', async (req, res) => {
    await rateLimit(db, 'reset-use:' + req.ip, 10, 900);
    const data = z.object({ token: invitationToken, password, code: z.string().regex(/^\d{6}$/).optional() }).strict().parse(req.body);
    const hashed = await hashPassword(data.password);
    await db.transaction(async tx => {
      const reset = (await tx.query('SELECT * FROM reset_tokens WHERE token_hash=$1 AND expires_at>now() FOR UPDATE', [digest(data.token)])).rows[0];
      assert(reset, 400, 'This reset link has expired or has already been used.');
      const user = (await tx.query('SELECT * FROM users WHERE id=$1 AND enabled=true FOR UPDATE', [reset.user_id])).rows[0];
      assert(user, 400, 'This reset link is not available.');
      await checkMfa(tx, user, data.code, config);
      await tx.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hashed, user.id]);
      await tx.query('DELETE FROM reset_tokens WHERE user_id=$1', [user.id]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1', [user.id]);
      await audit(tx, user.id, 'auth.password-reset');
    });
    res.json({ message: 'Password updated. Sign in with your new password.' });
  });
  app.patch('/api/profile', requireAuth, async (req, res) => {
    const data = z.object({ name, grade: z.number().int().min(11).max(12), language }).strict().parse(req.body);
    const user = (await db.query('UPDATE users SET name=$1,grade=$2,language=$3 WHERE id=$4 RETURNING *', [data.name, data.grade, data.language, req.user.id])).rows[0];
    res.json({ user: publicUser(user) });
  });
  app.post('/api/auth/password', signedIn, async (req, res) => {
    await rateLimit(db, 'password-change:' + req.user.id, 5, 900);
    const data = z.object({ currentPassword: z.string().max(128), password, code: z.string().regex(/^\d{6}$/).optional() }).strict().parse(req.body);
    assert(await checkPassword(req.user.password_hash, data.currentPassword), 400, 'Current password is incorrect.');
    await checkMfa(db, req.user, data.code, config);
    const hashed = await hashPassword(data.password);
    await db.transaction(async tx => {
      await tx.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hashed, req.user.id]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1', [req.user.id]);
      await audit(tx, req.user.id, 'auth.password-changed');
    });
    const csrf = await createSession(db, res, req.user.id, config);
    res.json({ csrf, message: 'Password updated. Other sessions have been signed out.' });
  });
  app.post('/api/auth/mfa/setup', signedIn, async (req, res) => {
    await rateLimit(db, 'mfa-setup:' + req.user.id, 5, 900);
    const data = z.object({ password: z.string().max(128) }).strict().parse(req.body);
    assert(!req.user.mfa_secret, 409, 'Two-factor authentication is already enabled.');
    assert(await checkPassword(req.user.password_hash, data.password), 400, 'Password is incorrect.');
    const secret = newTotpSecret();
    const pending = await db.query('UPDATE users SET mfa_pending=$1,mfa_pending_at=now() WHERE id=$2 AND mfa_secret IS NULL RETURNING id', [encrypt(secret, config.encryptionKey), req.user.id]);
    assert(pending.rows.length, 409, 'Two-factor authentication is already enabled.');
    res.json({ secret, uri: 'otpauth://totp/Matric%20Mastery:' + encodeURIComponent(req.user.email) + '?secret=' + secret + '&issuer=Matric%20Mastery&algorithm=SHA1&digits=6&period=30' });
  });
  app.post('/api/auth/mfa/confirm', signedIn, async (req, res) => {
    await rateLimit(db, 'mfa-confirm:' + req.user.id, 5, 900);
    const data = z.object({ code: z.string().regex(/^\d{6}$/) }).strict().parse(req.body);
    await db.transaction(async tx => {
      // Read and verify the SAME pending key under a lock. Another tab may have restarted setup.
      const current = (await tx.query("SELECT *,mfa_pending_at>clock_timestamp()-interval '15 minutes' AS setup_valid FROM users WHERE id=$1 FOR UPDATE", [req.user.id])).rows[0];
      assert(current?.mfa_pending && !current.mfa_secret && current.setup_valid, 400, 'Start authenticator setup again. The setup key is no longer valid.');
      const counter = validTotp(decrypt(current.mfa_pending, config.encryptionKey), data.code);
      assert(counter !== null, 400, 'The authenticator code is incorrect.');
      await tx.query('UPDATE users SET mfa_secret=mfa_pending,mfa_pending=NULL,mfa_pending_at=NULL,mfa_counter=$1 WHERE id=$2', [counter, req.user.id]);
      await tx.query('DELETE FROM sessions WHERE user_id=$1', [req.user.id]);
      await audit(tx, req.user.id, 'auth.mfa-enabled');
    });
    const csrf = await createSession(db, res, req.user.id, config);
    res.json({ csrf, message: 'Two-factor authentication enabled.' });
  });
  app.get('/api/account/export', requireAuth, async (req, res) => {
    const results = {};
    for (const [key, sql] of Object.entries({
      attempts: 'SELECT * FROM attempts WHERE user_id=$1',
      studySessions: 'SELECT * FROM study_sessions WHERE user_id=$1',
      topicChecks: 'SELECT * FROM topic_checks WHERE user_id=$1',
      conversations: 'SELECT id,subject,topic_id,created_at,updated_at FROM threads WHERE user_id=$1',
      plans: 'SELECT * FROM plans WHERE learner_id=$1',
      messages: 'SELECT m.* FROM messages m JOIN threads t ON t.id=m.thread_id WHERE t.user_id=$1',
    })) results[key] = (await db.query(sql, [req.user.id])).rows;
    res.setHeader('Content-Disposition', 'attachment; filename="matric-mastery-personal-data.json"');
    res.json({ profile: publicUser(req.user), exportedAt: new Date().toISOString(), ...results });
  });
  app.delete('/api/account', requireAuth, async (req, res) => {
    assert(req.user.role === 'learner', 403, 'Staff account removal must be handled by the administrator.');
    await rateLimit(db, 'delete-account:' + req.user.id, 5, 900);
    const data = z.object({ password: z.string().max(128), code: z.string().regex(/^\d{6}$/).optional() }).strict().parse(req.body);
    assert(await checkPassword(req.user.password_hash, data.password), 400, 'Password is incorrect.');
    await checkMfa(db, req.user, data.code, config);
    await db.transaction(async tx => {
      await audit(tx, req.user.id, 'account.deleted');
      await tx.query('DELETE FROM users WHERE id=$1', [req.user.id]);
    });
    res.clearCookie(config.cookieName, { path: '/', secure: config.production, httpOnly: true, sameSite: 'strict' });
    res.json({ ok: true });
  });
}
