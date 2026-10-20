let csrf = '';
export function setCsrf(value) { csrf = value || ''; }
export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch('/api' + path, {
      method, credentials: 'same-origin', signal,
      headers: { ...(method !== 'GET' ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}) },
      body: method !== 'GET' ? JSON.stringify(body ?? {}) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot connect right now. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'The request could not be completed.');
    error.status = response.status; error.code = data.code;
    if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('session-expired'));
    throw error;
  }
  if (Object.hasOwn(data, 'csrf')) setCsrf(data.csrf);
  return data;
}
