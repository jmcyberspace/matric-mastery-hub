import { test, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import React from 'react';
const window = new Window({ url: 'https://matric.example.test' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Node', 'Event', 'MouseEvent', 'MutationObserver', 'FormData']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === 'window' ? window : window[key] });
}
globalThis.React = React;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLElement.prototype.scrollIntoView = () => {};
window.confirm = () => true;
const { render, screen, fireEvent, waitFor, cleanup, act } = await import('@testing-library/react');
const { default: Auth } = await import('../src/Auth.jsx');
const { default: Tutor } = await import('../src/pages/Tutor.jsx');
const { Attempt } = await import('../src/pages/Learning.jsx');
const { AssessmentEditor } = await import('../src/pages/Teaching.jsx');
const { setCsrf } = await import('../src/lib/api.js');
const originalFetch = globalThis.fetch;
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
afterEach(() => { cleanup(); setCsrf(''); globalThis.fetch = originalFetch; });
after(async () => { await window.happyDOM.close(); });

test('sign-in carries the authenticator challenge through to a successful session', async () => {
  const requests = []; let signedIn = 0;
  globalThis.fetch = async (_path, options) => {
    const body = JSON.parse(options.body); requests.push(body);
    if (!body.code) return response({ error: 'Enter an authenticator code.', code: 'MFA_REQUIRED' }, 401);
    return response({ csrf: 'new-session-token', user: { role: 'teacher' } });
  };
  render(<Auth path="/login" token="" config={{}} navigate={() => {}} onSuccess={() => { signedIn++; }} />);
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'teacher@example.test' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a valid testing passphrase' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form'));
  const input = await screen.findByLabelText('Authenticator code');
  fireEvent.change(input, { target: { value: '123456' } });
  fireEvent.submit(input.closest('form'));
  await waitFor(() => assert.equal(signedIn, 1));
  assert.equal(requests[1].code, '123456'); assert.equal(requests[1].email, 'teacher@example.test');
});

test('invitation privacy notice preserves the account form and private link', async () => {
  const calls = []; let created = 0;
  globalThis.fetch = async (path, options) => {
    const body = JSON.parse(options.body); calls.push({ path, body });
    return response(path.endsWith('/invitation') ? { email: 'learner@example.test', role: 'learner' } : { csrf: 'invited-session' });
  };
  render(<Auth path="/invite" token="private-invitation" config={{}} navigate={() => { throw new Error('The form must stay open'); }} onSuccess={() => { created++; }} />);
  await screen.findByText('learner@example.test');
  const link = screen.getByRole('link', { name: /privacy notice/ });
  assert.equal(link.getAttribute('target'), '_blank'); assert.equal(link.getAttribute('href'), '/privacy');
  fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'New learner' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'a valid learner passphrase' } });
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.submit(screen.getByRole('button', { name: 'Create my account' }).closest('form'));
  await waitFor(() => assert.equal(created, 1));
  assert.equal(calls.at(-1).body.token, 'private-invitation'); assert.equal(calls.at(-1).body.acceptedPrivacy, true);
});

test('assessment submission waits for autosaves and marks the latest choice', async () => {
  const questionId = 'q1'; let submitted = false, saveCount = 0, releaseFirst;
  const saved = [], notifications = [];
  const data = () => ({
    assessment: { title: 'Forces check', subject: 'physics', grade: 12 },
    attempt: { answers: submitted ? { [questionId]: 2 } : {}, deadline: new Date(Date.now() + 300000).toISOString(), submitted_at: submitted ? new Date().toISOString() : null, score: 1, total: 1 },
    questions: [{ id: questionId, topic: 'Forces', prompt: 'What is the acceleration?', options: ['One', 'Two', 'Three', 'Four'], ...(submitted ? { correct_index: 2, explanation: 'Force divided by mass.' } : {}) }],
    serverNow: new Date().toISOString(),
  });
  globalThis.fetch = async (path, options) => {
    if (options.method === 'GET') return response(data());
    const body = JSON.parse(options.body);
    if (options.method === 'PATCH') {
      saved.push(body.answers); saveCount++;
      if (saveCount === 1) await new Promise(resolve => { releaseFirst = resolve; });
      return response({ saved: true });
    }
    assert.ok(path.endsWith('/submit')); assert.equal(body.answers[questionId], 2); submitted = true;
    return response({ attempt: data().attempt });
  };
  render(<Attempt attemptId="attempt-1" navigate={() => {}} notify={message => notifications.push(message)} />);
  await screen.findByRole('heading', { name: 'What is the acceleration?' });
  const radios = screen.getAllByRole('radio');
  fireEvent.click(radios[0]);
  await waitFor(() => assert.equal(saveCount, 1));
  fireEvent.click(radios[2]);
  fireEvent.click(screen.getByRole('button', { name: 'Submit my answers' }));
  assert.equal(submitted, false);
  await act(async () => { releaseFirst(); });
  await screen.findByText('Well understood.');
  assert.deepEqual(saved, [{ [questionId]: 0 }, { [questionId]: 2 }]);
  assert.ok(screen.getAllByRole('radio').every(input => input.disabled));
  assert.ok(notifications.includes('Your answers have been marked.'));
});

test('tutor recovers from a confirmed provider failure without duplicating saved messages', async () => {
  const requests = []; let complete = false;
  globalThis.fetch = async (path, options) => {
    if (path === '/api/threads' && options.method === 'GET') return response({ threads: [] });
    if (path === '/api/threads' && options.method === 'POST') return response({ thread: { id: 'thread-1', subject: 'maths' } });
    if (path === '/api/tutor') {
      requests.push(JSON.parse(options.body));
      if (requests.length === 1) return response({ error: 'The tutor is temporarily unavailable.' }, 503);
      complete = true; return response({ response: 'Try isolating x.' });
    }
    assert.equal(path, '/api/threads/thread-1');
    return response({ messages: complete ? [{ id: 'm1', role: 'user', content: 'Help with algebra.' }, { id: 'm2', role: 'assistant', content: 'Try isolating x.' }] : [] });
  };
  render(<Tutor config={{ aiAvailable: true }} notify={() => {}} />);
  fireEvent.change(screen.getByLabelText('Message to your tutor'), { target: { value: 'Help with algebra.' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Send message' }).closest('form'));
  fireEvent.click(await screen.findByRole('button', { name: 'Check or retry this request' }));
  await screen.findByText('Try isolating x.');
  assert.equal(requests.length, 2); assert.notEqual(requests[0].requestId, requests[1].requestId);
  assert.equal(screen.getAllByText('Help with algebra.').length, 1);
});

test('teacher publishes an assessment using the selected class subject and grade', async () => {
  let published, destination;
  globalThis.fetch = async (path, options) => {
    if (path === '/api/classes') return response({ classes: [{ id: 'class-1', name: 'Science class', grade: 12, subject: 'physics' }] });
    assert.equal(path, '/api/assessments'); published = JSON.parse(options.body); return response({ id: 'assessment-1' });
  };
  render(<AssessmentEditor user={{ role: 'teacher' }} search="?class=class-1" notify={() => {}} navigate={path => { destination = path; }} />);
  await screen.findByLabelText('Title');
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'A useful assessment' } });
  fireEvent.change(screen.getByLabelText('Topic'), { target: { value: 'Forces' } });
  fireEvent.change(screen.getByLabelText('Question'), { target: { value: 'What is the net force?' } });
  for (const option of ['A','B','C','D']) fireEvent.change(screen.getByLabelText('Option ' + option), { target: { value: 'Answer ' + option } });
  fireEvent.change(screen.getByLabelText('Correct answer'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('Explanation shown after submission'), { target: { value: 'Add the vectors to find the resultant.' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Publish assessment' }).closest('form'));
  await waitFor(() => assert.equal(destination, '/teacher/memo/assessment-1'));
  assert.equal(published.subject, 'physics'); assert.equal(published.grade, 12); assert.equal(published.classId, 'class-1');
  assert.equal(published.questions[0].correctIndex, 2);
});
