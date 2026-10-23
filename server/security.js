import { randomBytes, randomUUID, createHash, createHmac, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
import { hash, verify, Algorithm } from '@node-rs/argon2';
export const id = () => randomUUID();
export const token = () => randomBytes(32).toString('base64url');
export const digest = value => createHash('sha256').update(value).digest('hex');
export const hashPassword = password => hash(password, { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 3, parallelism: 1, outputLen: 32 });
export const checkPassword = (hashValue, password) => verify(hashValue, password).catch(() => false);
export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function assert(condition, status, message) { if (!condition) throw new HttpError(status, message); }
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aa = Buffer.from(a), bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function cookieValue(header, name) {
  const raw = (header || '').split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  if (!raw) return '';
  try { return decodeURIComponent(raw.slice(name.length + 1)); } catch { return ''; }
}
export async function rateLimit(db, key, limit, seconds) {
  const result = await db.query(
    "INSERT INTO rate_limits(key,count,expires_at) VALUES($1,1,now()+$2*interval '1 second') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.expires_at<now() THEN 1 ELSE rate_limits.count+1 END, expires_at=CASE WHEN rate_limits.expires_at<now() THEN now()+$2*interval '1 second' ELSE rate_limits.expires_at END RETURNING count",
    [digest(key), seconds]);
  assert(result.rows[0].count <= limit, 429, 'Too many requests. Please wait and try again.');
}
export async function audit(db, actor, action, target = null) {
  await db.query('INSERT INTO audit_events(id,actor_id,action,target_id) VALUES($1,$2,$3,$4)', [id(), actor, action, target]);
}
export function encrypt(value, key) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), nonce);
  const output = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), output]).toString('base64url');
}
export function decrypt(value, key) {
  const input = Buffer.from(value, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), input.subarray(0, 12));
  decipher.setAuthTag(input.subarray(12, 28));
  return Buffer.concat([decipher.update(input.subarray(28)), decipher.final()]).toString('utf8');
}
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function newTotpSecret() {
  let bits = '';
  for (const byte of randomBytes(20)) bits += byte.toString(2).padStart(8, '0');
  return bits.match(/.{5}/g).map(b => alphabet[parseInt(b, 2)]).join('');
}
function base32Decode(secret) {
  const bits = [...secret].map(c => alphabet.indexOf(c).toString(2).padStart(5, '0')).join('');
  return Buffer.from(bits.match(/.{8}/g).map(b => parseInt(b, 2)));
}
export function totp(secret, counter) {
  const message = Buffer.alloc(8); message.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(message).digest();
  const offset = hmac[hmac.length - 1] & 15;
  return ((hmac.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
}
export function validTotp(secret, code, lastCounter = -1, now = Date.now()) {
  const counter = Math.floor(now / 30000);
  for (const n of [counter, counter - 1, counter + 1]) {
    if (n > Number(lastCounter) && safeEqual(totp(secret, n), code)) return n;
  }
  return null;
}
