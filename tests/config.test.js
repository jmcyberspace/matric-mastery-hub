import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../server/config.js';
const base = { NODE_ENV: 'production', APP_ORIGIN: 'https://school.example.test', DATABASE_URL: 'postgresql://localhost/matric_test', APP_ENCRYPTION_KEY: 'a'.repeat(64), PRIVACY_CONTACT: 'privacy@example.test' };
test('production configuration rejects insecure origins and incomplete services', () => {
  assert.throws(() => loadConfig({ ...base, APP_ORIGIN: 'http://school.example.test' }), /HTTPS/);
  assert.throws(() => loadConfig({ ...base, APP_ORIGIN: 'https://school.example.test/subpath' }), /origin/);
  assert.throws(() => loadConfig({ ...base, APP_ENCRYPTION_KEY: 'placeholder' }), /32 random bytes/);
  assert.throws(() => loadConfig({ ...base, ANTHROPIC_API_KEY: 'test-only' }), /both/);
  assert.throws(() => loadConfig({ ...base, SMTP_HOST: 'smtp.example.test' }), /SMTP/);
  assert.throws(() => loadConfig({ ...base, AI_DAILY_LIMIT: '0' }), /AI_DAILY_LIMIT/);
  const config = loadConfig(base);
  assert.equal(config.enforceMfa, true); assert.equal(config.cookieName, '__Host-matric_session');
});
