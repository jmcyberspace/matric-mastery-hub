export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const origin = env.APP_ORIGIN || 'http://localhost:5173';
  const parsed = new URL(origin);
  if (parsed.origin !== origin || (production && parsed.protocol !== 'https:')) throw new Error('APP_ORIGIN must be an exact HTTPS origin in production.');
  const encryptionKey = env.APP_ENCRYPTION_KEY;
  if (!/^[a-f0-9]{64}$/i.test(encryptionKey || '')) throw new Error('Set APP_ENCRYPTION_KEY to 32 random bytes encoded as hex.');
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  const number = (key, fallback, max) => {
    const n = Number(env[key] || fallback);
    if (!Number.isInteger(n) || n < 1 || n > max) throw new Error('Invalid ' + key);
    return n;
  };
  if (production && !env.PRIVACY_CONTACT) throw new Error('PRIVACY_CONTACT is required in production.');
  if (Boolean(env.ANTHROPIC_API_KEY) !== Boolean(env.ANTHROPIC_MODEL)) throw new Error('Configure both ANTHROPIC_API_KEY and ANTHROPIC_MODEL, or leave both blank.');
  const mailConfigured = [env.SMTP_HOST, env.SMTP_USER, env.SMTP_PASSWORD, env.MAIL_FROM].some(Boolean);
  if (mailConfigured && (!env.SMTP_HOST || !env.MAIL_FROM || Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD))) throw new Error('SMTP needs a host and sender; supply both username and password when using authentication.');
  return {
    production, origin, encryptionKey, databaseUrl: env.DATABASE_URL,
    port: number('PORT', 3010, 65535), host: env.HOST || '127.0.0.1',
    // Trust only the loopback reverse proxy by default. Never trust arbitrary X-Forwarded-For.
    trustProxy: env.TRUST_PROXY || 'loopback',
    enforceMfa: production || env.ENFORCE_STAFF_MFA === 'true',
    cookieName: production ? '__Host-matric_session' : 'matric_session',
    aiKey: env.ANTHROPIC_API_KEY || '', aiModel: env.ANTHROPIC_MODEL || '',
    aiDailyLimit: number('AI_DAILY_LIMIT', 30, 200),
    aiGlobalDailyLimit: number('AI_GLOBAL_DAILY_LIMIT', 1000, 100000),
    smtpHost: env.SMTP_HOST, smtpPort: number('SMTP_PORT', 587, 65535),
    smtpUser: env.SMTP_USER, smtpPass: env.SMTP_PASSWORD, mailFrom: env.MAIL_FROM,
    privacyContact: env.PRIVACY_CONTACT || 'the platform administrator',
  };
}
