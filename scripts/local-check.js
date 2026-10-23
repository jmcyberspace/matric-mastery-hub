import assert from 'node:assert/strict';
export async function checkLocalApp(base) {
  assert.match(base, /^http:\/\/localhost:\d+$/);
  const get = path => fetch(base + path, { signal: AbortSignal.timeout(10000) });
  assert.equal((await get('/healthz')).status, 200);
  const session = await get('/api/auth/session');
  assert.equal(session.status, 200); assert.equal((await session.json()).user, null);
  assert.equal(session.headers.get('cache-control'), 'no-store');
  assert.equal((await get('/api/overview')).status, 401);
  const rejected = await fetch(base + '/api/auth/login', {
    method: 'POST', headers: { Origin: 'http://another-site.test', 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000),
  });
  assert.equal(rejected.status, 403);
  const page = await get('/login');
  assert.equal(page.status, 200); assert.match(await page.text(), /<title>Matric Mastery/);
  console.log('Local app passed: host port, PostgreSQL health, built page, protected records and origin checks.');
}
