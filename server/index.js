import { loadConfig } from './config.js';
import { createDatabase } from './db.js';
import { createApp } from './app.js';
import { finaliseExpiredAttempts } from './learning.js';
const config = loadConfig();
const db = createDatabase(config.databaseUrl);
await db.query('SELECT id,mfa_pending_at FROM users LIMIT 1');
const app = await createApp({ db, config });
const server = app.listen(config.port, config.host, () => console.log('Matric Mastery server is listening on port ' + config.port));
server.requestTimeout = 35000; server.headersTimeout = 10000; server.keepAliveTimeout = 5000;
let marking = false;
async function markExpired() {
  if (marking) return;
  marking = true;
  try { await finaliseExpiredAttempts(db); }
  catch { console.error('Expired assessment marking failed'); }
  finally { marking = false; }
}
await markExpired();
const markingTimer = setInterval(markExpired, 30000).unref();
const maintenance = setInterval(async () => {
  try {
    await db.query("DELETE FROM sessions WHERE expires_at<now() OR last_seen<now()-interval '30 minutes'");
    await db.query('DELETE FROM rate_limits WHERE expires_at<now()');
    await db.query('DELETE FROM reset_tokens WHERE expires_at<now()');
    await db.query("DELETE FROM invitations WHERE expires_at<now()-interval '30 days'");
    await db.query("DELETE FROM ai_requests WHERE created_at<now()-interval '7 days'");
    await db.query("DELETE FROM audit_events WHERE created_at<now()-interval '180 days'");
    await db.query("UPDATE users SET mfa_pending=NULL,mfa_pending_at=NULL WHERE mfa_pending_at<now()-interval '15 minutes'");
  } catch { console.error('Scheduled database maintenance failed'); }
}, 3600000).unref();
let stopping = false;
async function shutdown() {
  if (stopping) return; stopping = true;
  clearInterval(maintenance); clearInterval(markingTimer);
  server.close(async () => { await db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 15000).unref();
}
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
