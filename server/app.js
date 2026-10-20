import express from 'express';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { ZodError } from 'zod';
import { cookieValue, digest, safeEqual, assert, id, rateLimit } from './security.js';
import { registerAuth } from './auth.js';
import { registerLearning } from './learning.js';
import { registerTeaching } from './teaching.js';
import { registerTutor } from './tutor.js';
export async function createApp({ db, config, aiFetch, serveStatic = true }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(helmet({
    contentSecurityPolicy: config.production ? { directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'], fontSrc: ["'self'"], connectSrc: ["'self'"],
      objectSrc: ["'none'"], baseUri: ["'none'"], frameAncestors: ["'none'"], formAction: ["'self'"],
      upgradeInsecureRequests: [],
    } } : false,
    referrerPolicy: { policy: 'no-referrer' },
    strictTransportSecurity: config.production ? { maxAge: 31536000, includeSubDomains: false } : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use((req, res, next) => {
    req.requestId = id(); res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.get('/healthz', async (_req, res) => {
    try { await db.query('SELECT 1'); res.json({ status: 'ok' }); }
    catch { res.status(503).json({ status: 'unavailable' }); }
  });
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
      assert(req.get('origin') === config.origin, 403, 'This request origin is not allowed.');
      assert(req.is('application/json'), 415, 'Send requests as JSON.');
    }
    next();
  });
  app.use(express.json({ limit: '96kb', strict: true }));
  app.use('/api', async (req, _res, next) => {
    req.platformConfig = config;
    const raw = cookieValue(req.headers.cookie, config.cookieName);
    if (/^[A-Za-z0-9_-]{43}$/.test(raw)) {
      const row = (await db.query(
        "SELECT s.token_hash,s.csrf,u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND s.last_seen>now()-interval '30 minutes' AND u.enabled=true",
        [digest(raw)])).rows[0];
      if (row) {
        req.session = { token_hash: row.token_hash, csrf: row.csrf };
        req.user = row;
        await db.query("UPDATE sessions SET last_seen=now() WHERE token_hash=$1 AND last_seen<now()-interval '2 minutes'", [row.token_hash]);
      }
    }
    if (req.user) {
      await rateLimit(db, 'api-user:' + req.user.id, 240, 60);
      if (!['GET','HEAD','OPTIONS'].includes(req.method)) assert(safeEqual(req.get('x-csrf-token'), req.session.csrf), 403, 'Your session has changed. Reload this page and try again.');
    }
    next();
  });
  await registerAuth(app, db, config);
  registerLearning(app, db);
  registerTeaching(app, db, config);
  registerTutor(app, db, config, aiFetch);
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
  if (serveStatic) {
    const dist = resolve(process.cwd(), 'dist');
    app.use('/assets', express.static(resolve(dist, 'assets'), { immutable: true, maxAge: '1y', dotfiles: 'deny', fallthrough: false }));
    app.use(express.static(dist, { maxAge: 0, dotfiles: 'deny', index: false }));
    app.get('/{*path}', (_req, res) => { res.setHeader('Cache-Control', 'no-cache'); res.sendFile(resolve(dist, 'index.html')); });
  }
  app.use((error, req, res, _next) => {
    let status = error.status || 500, message = error.message;
    if (error instanceof ZodError) { status = 400; message = error.issues[0]?.message || 'Check the form and try again.'; }
    if (error.code === '23505') { status = 409; message = 'This record or request already exists. Refresh and try again.'; }
    if (error.type === 'entity.too.large') { status = 413; message = 'This request is too large.'; }
    if (error instanceof SyntaxError && error.type === 'entity.parse.failed') { status = 400; message = 'The request contains invalid JSON.'; }
    if (status >= 500) {
      // Do not log SQL parameters, tokens, credentials, messages or personal data.
      console.error(JSON.stringify({ event: 'request.error', requestId: req.requestId, code: error.code || 'internal', status }));
      message = status === 503 ? 'This service is temporarily unavailable. Please try again later.' : 'We could not complete this request. Please try again.';
    }
    if (status === 429) res.setHeader('Retry-After', '60');
    res.status(status).json({ error: message, requestId: req.requestId });
  });
  return app;
}
