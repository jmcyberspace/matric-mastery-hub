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
const { default: Home } = await import('../src/pages/Home.jsx');
const { default: TopicGuide } = await import('../src/pages/TopicGuide.jsx');
const { topics, publicTopic } = await import('../db/topic-content.js');
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
    if (path === '/api/topics') return response({ topics: [] });
    if (path === '/api/threads' && options.method === 'GET') return response({ threads: [] });
    if (path === '/api/threads' && options.method === 'POST') return response({ thread: { id: 'thread-1', subject: 'maths' } });
    if (path === '/api/tutor') {
      requests.push(JSON.parse(options.body));
      if (requests.length === 1) return response({ error: 'The tutor is temporarily unavailable.', code: 'AI_REQUEST_FAILED' }, 503);
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

test('administrator home shows management data and opens the selected class', async () => {
  let destination;
  globalThis.fetch = async path => {
    assert.equal(path, '/api/workspace');
    return response({ stats: { classes: 1, learners: 4, assessments: 2, invitations: 0 }, classes: [{ id: 'class-1', name: 'Science A', subject: 'physics', grade: 12, learner_count: 4 }], platform: { active_accounts: 6, staff_without_mfa: 0, ai_replies: 3 } });
  };
  render(<Home user={{ role: 'admin', name: 'Local Administrator' }} config={{ aiAvailable: false }} navigate={path => { destination = path; }} />);
  fireEvent.click(await screen.findByRole('button', { name: /Science A/ }));
  assert.equal(destination, '/classes?id=class-1');
  assert.ok(screen.getByText('ADMINISTRATOR WORKSPACE'));
  assert.equal(screen.queryByText('Let’s make it'), null);
  assert.ok(screen.getByText('Setup needed'));
});

test('learner can find a topic by keyword and open guided learning', async () => {
  let destination;
  globalThis.fetch = async path => response(path === '/api/topics' ? { topics: topics.map(publicTopic) } : { threads: [] });
  render(<Home user={{ role: 'learner', name: 'Test Learner', grade: 12 }} config={{ aiAvailable: true }} navigate={path => { destination = path; }} />);
  await screen.findByRole('button', { name: /Quadratic equations/ });
  fireEvent.change(screen.getByLabelText('Search topics'), { target: { value: 'acceleration' } });
  assert.equal(screen.queryByRole('button', { name: /Quadratic equations/ }), null);
  fireEvent.click(screen.getByRole('button', { name: /Net force & acceleration/ }));
  assert.equal(destination, '/tutor?topic=net-force');
});

const topicDetail = topic => ({ topic: publicTopic(topic), questions: topic.questions.slice(0, 2).map(({ answer, explanation, ...q }) => q), lastCheck: null });
test('topic deep link and hint mode are sent only after the learner asks; history failure does not repeat the reply', async () => {
  const posts = [], notices = [], topic = topics.find(t => t.id === 'net-force');
  globalThis.fetch = async (path, options) => {
    if (path === '/api/topics') return response({ topics: topics.map(publicTopic) });
    if (path === '/api/topics/net-force') return response(topicDetail(topic));
    if (path === '/api/threads' && options.method === 'GET') return response({ threads: [] });
    if (options.method === 'POST') {
      const body = JSON.parse(options.body); posts.push({ path, body });
      return response(path === '/api/threads' ? { thread: { id: 'thread-1', subject: 'physics', topic_id: topic.id } } : { response: 'Choose a positive direction first.' });
    }
    assert.equal(path, '/api/threads/thread-1'); throw new TypeError('Network interrupted');
  };
  render(<React.StrictMode><Tutor config={{ aiAvailable: true }} search="?topic=net-force" notify={message => notices.push(message)} /></React.StrictMode>);
  await waitFor(() => assert.equal(screen.getByLabelText('Topic').value, 'net-force'));
  assert.equal(screen.getByLabelText('Study subject').value, 'physics'); assert.equal(posts.length, 0);
  fireEvent.click(screen.getByRole('button', { name: 'Give me a hint' }));
  fireEvent.change(screen.getByLabelText('Message to your tutor'), { target: { value: 'Do I add these forces?' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Send message' }).closest('form'));
  await screen.findByText('Choose a positive direction first.');
  await waitFor(() => assert.equal(notices.length, 1));
  assert.equal(posts[0].body.subject, 'physics'); assert.equal(posts[0].body.topicId, 'net-force');
  assert.equal(posts[1].body.mode, 'hint'); assert.equal(posts.length, 2);
  assert.equal(screen.queryByRole('button', { name: 'Check or retry this request' }), null);
});

test('ambiguous AI gateway errors reuse the request ID and original teaching mode', async () => {
  const requests = [];
  globalThis.fetch = async (path, options) => {
    if (path === '/api/topics') return response({ topics: [] });
    if (path === '/api/threads' && options.method === 'GET') return response({ threads: [] });
    if (path === '/api/threads' && options.method === 'POST') return response({ thread: { id: 'thread-1', subject: 'maths' } });
    if (path === '/api/tutor') {
      requests.push(JSON.parse(options.body));
      if (requests.length === 1) return response({ error: 'Gateway unavailable' }, 502);
      return response({ response: 'The saved reply.' });
    }
    return response({ messages: [{ role: 'assistant', content: 'The saved reply.' }] });
  };
  render(<Tutor config={{ aiAvailable: true }} notify={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Quiz me' }));
  fireEvent.change(screen.getByLabelText('Message to your tutor'), { target: { value: 'Test my understanding.' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Send message' }).closest('form'));
  const retry = await screen.findByRole('button', { name: 'Check or retry this request' });
  fireEvent.click(screen.getByRole('button', { name: 'Show an example' })); fireEvent.click(retry);
  await screen.findByText('The saved reply.');
  assert.equal(requests[1].requestId, requests[0].requestId); assert.equal(requests[1].mode, 'check');
});

test('topic checks work without live AI and send only the chosen answers for marking', async () => {
  const topic = topics[0]; let submitted, calls = 0;
  globalThis.fetch = async (_path, options) => {
    if (options.method === 'GET') return response(topicDetail(topic));
    submitted = JSON.parse(options.body); calls++;
    return response({ check: { score: 1, total: 2, feedback: [{ questionId: 'roots-a', prompt: 'Review the roots.', selected: 'x = 4 or 5', correct: true, correctAnswer: 'x = 4 or 5', explanation: 'Substitute both values to check.' }] } });
  };
  render(<TopicGuide topicId={topic.id} aiAvailable={false} locked={false} onAsk={() => { throw new Error('AI is not configured'); }} />);
  const summary = await screen.findByText('Quick check · 2 questions');
  summary.closest('details').open = true;
  assert.equal(screen.getByRole('button', { name: /Check my answers/ }).disabled, true);
  fireEvent.click(screen.getByLabelText('x = 4 or 5'));
  fireEvent.click(screen.getByLabelText('Both factors must equal 1'));
  fireEvent.submit(screen.getByRole('button', { name: /Check my answers/ }).closest('form'));
  await screen.findByText('1 of 2 correct');
  assert.equal(calls, 1); assert.equal(submitted.version, 1); assert.ok(submitted.requestId);
  assert.deepEqual(submitted.answers, [{ questionId: 'roots-a', answer: 2 }, { questionId: 'zero-product-a', answer: 0 }]);
  assert.equal(submitted.score, undefined);
  assert.equal(screen.getByRole('button', { name: /Review my reasoning with AI/ }).disabled, true);
});

test('changing a saved conversation URL to a new topic clears the old context', async () => {
  globalThis.fetch = async path => {
    if (path === '/api/topics') return response({ topics: topics.map(publicTopic) });
    if (path === '/api/threads') return response({ threads: [] });
    if (path === '/api/threads/old-thread') return response({ thread: { id: 'old-thread', subject: 'maths', topic_id: null }, messages: [{ role: 'assistant', content: 'An old algebra discussion.' }] });
    assert.equal(path, '/api/topics/net-force'); return response(topicDetail(topics.find(t => t.id === 'net-force')));
  };
  const props = { config: { aiAvailable: true }, notify: () => {} };
  const rendered = render(<React.StrictMode><Tutor {...props} search="?thread=old-thread" /></React.StrictMode>);
  await screen.findByText('An old algebra discussion.');
  rendered.rerender(<React.StrictMode><Tutor {...props} search="?topic=net-force" /></React.StrictMode>);
  await waitFor(() => assert.equal(screen.getByLabelText('Topic').value, 'net-force'));
  assert.equal(screen.queryByText('An old algebra discussion.'), null);
  assert.equal(screen.queryByRole('button', { name: 'Delete conversation' }), null);
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
