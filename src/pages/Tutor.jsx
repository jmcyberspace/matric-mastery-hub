import { useEffect, useRef, useState } from 'react';
import { Plus, ArrowUp, MessageCircle, Trash2, Loader2, ArrowRight, History, BookOpen } from 'lucide-react';
import { api } from '../lib/api';
import { SUBJECTS, subjectById, date } from '../lib/format';
import { Button, PageHeading, Notice, useLoad } from '../components';
import TopicGuide from './TopicGuide';

const MODES = [
  { id: 'explain', label: 'Explain simply', description: 'Build the idea from the beginning, in smaller steps.', prompt: 'Explain this topic from the beginning in simple language, then ask me one question to see what I understand.' },
  { id: 'example', label: 'Show an example', description: 'See how to work through a problem and why each step matters.', prompt: 'Show me one worked example for this topic. Explain why each step works, then give me a similar question to try.' },
  { id: 'hint', label: 'Give me a hint', description: 'Share the question and what you have tried. Get help with the next step.', prompt: 'Help me take the first step on this topic. Give me a short practice question and one hint, without revealing its answer.' },
  { id: 'check', label: 'Quiz me', description: 'Try one question at a time and talk through your reasoning.', prompt: 'Ask me one short question about this topic to check my understanding. Wait for my answer before explaining the solution.' },
];
export default function Tutor({ config, notify, search = '', navigate }) {
  const catalog = useLoad('/topics'), threads = useLoad('/threads');
  const [thread, setThread] = useState(null), [messages, setMessages] = useState([]), [subject, setSubject] = useState('maths'), [topicId, setTopicId] = useState('');
  const [mode, setMode] = useState('explain'), [input, setInput] = useState(''), [busy, setBusy] = useState(false), [opening, setOpening] = useState(false);
  const [error, setError] = useState(''), [retry, setRetry] = useState(null), [pending, setPending] = useState('');
  const bottom = useRef(null), sending = useRef(false), appliedSearch = useRef(null), view = useRef(0);
  const topics = catalog.data?.topics || [], topic = topics.find(t => t.id === topicId);
  const initializing = Boolean(search) && (!catalog.data || appliedSearch.current !== search), locked = busy || opening || initializing;
  const selectedMode = MODES.find(m => m.id === mode);
  useEffect(() => { if (messages.length || pending) bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, pending]);
  useEffect(() => () => { view.current++; appliedSearch.current = null; }, []);
  useEffect(() => {
    if (busy || !catalog.data || appliedSearch.current === search) return;
    const changed = appliedSearch.current !== null;
    appliedSearch.current = search;
    const params = new URLSearchParams(search), requested = topics.find(t => t.id === params.get('topic'));
    if (params.get('thread')) { openThread({ id: params.get('thread') }); return; }
    if (changed || search) { view.current++; setThread(null); setMessages([]); setRetry(null); setError(''); setInput(''); setOpening(false); }
    if (requested) { setTopicId(requested.id); setSubject(requested.subject); }
    else { setTopicId(''); setSubject(SUBJECTS.some(s => s.id === params.get('subject')) ? params.get('subject') : 'maths'); }
    if (params.get('topic') && !requested) setError('That topic guide is unavailable. Choose another topic or ask your own question.');
  }, [catalog.data, search, busy]);
  async function openThread(item) {
    if (sending.current) return;
    const version = ++view.current; setOpening(true); setError(''); setRetry(null);
    try {
      const r = await api('/threads/' + item.id);
      if (version !== view.current) return;
      setThread(r.thread); setMessages(r.messages); setSubject(r.thread.subject); setTopicId(r.thread.topic_id || ''); setInput('');
    } catch (e) { if (version === view.current) setError(e.message); }
    finally { if (version === view.current) setOpening(false); }
  }
  function selectContext(nextSubject, nextTopic = '') {
    if (locked) return;
    view.current++; setThread(null); setMessages([]); setRetry(null); setError(''); setInput(''); setSubject(nextSubject); setTopicId(nextTopic);
    navigate?.(nextTopic ? '/tutor?topic=' + nextTopic : '/tutor?subject=' + nextSubject);
  }
  function newConversation() { selectContext(subject, topicId); }
  async function send(event, previous, suggested, requestedMode) {
    event?.preventDefault();
    const text = previous?.message || suggested || input.trim();
    if (!text || sending.current || opening || initializing || !config.aiAvailable) return;
    sending.current = true; setBusy(true); setError(''); setPending(text);
    const requestId = previous?.requestId || crypto.randomUUID(), chosenMode = previous?.mode || requestedMode || mode;
    let activeThread = thread;
    try {
      if (!activeThread) {
        const r = await api('/threads', { method: 'POST', body: { subject, topicId: topicId || null } });
        activeThread = r.thread; setThread(activeThread);
      }
      const answer = await api('/tutor', { method: 'POST', body: { threadId: activeThread.id, requestId, message: text, mode: chosenMode } });
      setMessages(old => [...old, { id: requestId + '-user', role: 'user', content: text }, { id: requestId + '-reply', role: 'assistant', content: answer.response }]);
      setInput(''); setRetry(null); setPending('');
      // A history refresh failure must not cause a second paid request for a received reply.
      try { const history = await api('/threads/' + activeThread.id); setMessages(history.messages); }
      catch { notify?.('Your reply was received. Reopen the conversation later to refresh its history.'); }
      threads.refresh();
    } catch (err) {
      setError(err.message);
      setRetry({ message: text, mode: chosenMode, requestId: err.code === 'AI_REQUEST_FAILED' ? null : requestId });
    } finally { sending.current = false; setBusy(false); setPending(''); }
  }
  function askGuide(message, teachingMode) { setMode(teachingMode); send(null, null, message, teachingMode); }
  async function remove() {
    if (!thread || locked || !window.confirm('Permanently delete this conversation?')) return;
    setOpening(true); setError('');
    try { await api('/threads/' + thread.id, { method: 'DELETE' }); setThread(null); setMessages([]); setRetry(null); threads.refresh(); notify?.('Conversation deleted.'); navigate?.(topicId ? '/tutor?topic=' + topicId : '/tutor?subject=' + subject); }
    catch (e) { setError(e.message); } finally { setOpening(false); }
  }
  return <><PageHeading eyebrow="YOUR AI LEARNING PARTNER" title="Understand it. In your own way." description="Ask a question, try a different explanation and work through the next step together." />
    {!config.aiAvailable && <Notice kind="info">Live AI replies are not connected yet. Topic guides and quick checks still work. Your administrator needs to enable the AI service.</Notice>}
    <div className="tutor-studio"><aside className="learning-context" aria-label="Learning topic and history">
      <div className="context-selectors"><label className="field"><span>Study subject</span><select value={subject} disabled={locked} onChange={e => selectContext(e.target.value)}>{SUBJECTS.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label className="field"><span>Topic</span><select value={topicId} disabled={locked || catalog.loading} onChange={e => selectContext(subject, e.target.value)}><option value="">My own question</option>{topics.filter(t => t.subject === subject).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label></div>
      <Notice>{catalog.error}</Notice>{catalog.error && <Button variant="secondary" onClick={catalog.refresh}>Reload topics</Button>}
      {topicId && <TopicGuide key={topicId} topicId={topicId} onAsk={askGuide} aiAvailable={config.aiAvailable} locked={locked} />}
      <Button variant="secondary" onClick={newConversation} disabled={locked}><Plus size={17} />New conversation</Button>
      <details className="conversation-history"><summary><History size={18} />Saved conversations</summary><Notice>{threads.error}</Notice><div>{threads.data?.threads.map(t => <button className={'conversation-item ' + (thread?.id === t.id ? 'active' : '')} key={t.id} onClick={() => navigate ? navigate('/tutor?thread=' + t.id) : openThread(t)} disabled={locked}><MessageCircle size={17} /><span>{t.topic_title || subjectById(t.subject).name}<small>{date(t.updated_at)}</small></span></button>)}{!threads.data?.threads.length && <p className="small muted">Your conversations appear here after you start asking questions.</p>}</div></details>
    </aside><section className="chat-panel guided-chat" aria-label="AI tutor conversation"><header><div><span className={'mini-subject ' + subjectById(subject).tone}>{subjectById(subject).mark}</span><div><h2>{topic?.title || subjectById(subject).name}</h2><p>{config.user?.language || 'Your preferred language'} · AI study tutor</p></div></div>{thread && <button className="icon-button" aria-label="Delete conversation" onClick={remove} disabled={locked}><Trash2 size={18} /></button>}</header>
      <div className="teaching-controls"><div className="teaching-modes" role="group" aria-label="How should your tutor help?">{MODES.map(m => <button key={m.id} aria-pressed={mode === m.id} onClick={() => setMode(m.id)} disabled={locked}>{m.label}</button>)}</div><p>{selectedMode.description}</p></div>
      <div className="chat-messages" aria-live="polite" aria-busy={locked}>{messages.length ? messages.map((m, i) => <article key={m.id || i} className={'chat-message ' + m.role}><small>{m.role === 'user' ? 'YOU' : 'YOUR AI TUTOR'}</small><p>{m.content}</p></article>) : !opening && <div className="tutor-welcome"><span className="tutor-welcome-icon"><BookOpen size={30} /></span><p className="eyebrow">NO QUESTION IS TOO SMALL</p><h3>{topic ? 'Let’s explore ' + topic.title.toLowerCase() + '.' : 'What is not clicking yet?'}</h3><p>{topic ? topic.goal : 'Choose a topic or type the question you are working on. Tell your tutor what you have tried so far.'}</p>{topic && <Button disabled={!config.aiAvailable || locked} onClick={() => send(null, null, selectedMode.prompt)}>{selectedMode.label}<ArrowRight size={17} /></Button>}<div className="starter-questions">{['Explain it more simply', 'Why does this step work?', 'Can we try another example?'].map(text => <button key={text} disabled={locked || !config.aiAvailable} onClick={() => setInput(text)}>{text}</button>)}</div></div>}
        {pending && <article className="chat-message user"><small>YOU</small><p>{pending}</p></article>}
        {locked && <div className="chat-thinking" role="status"><Loader2 className="spin" size={18} />{opening ? 'Opening your conversation…' : 'Your tutor is working through it…'}</div>}<div ref={bottom} /></div>
      <div className="chat-composer"><Notice>{error}</Notice>{retry && <button className="text-link" disabled={locked} onClick={e => send(e, retry)}>Check or retry this request</button>}
        <form onSubmit={send}><textarea aria-label="Message to your tutor" placeholder={mode === 'hint' ? 'Share the question and the step you are stuck on…' : 'Ask your question or tell me what you understand so far…'} maxLength={4000} rows={3} value={input} disabled={locked || !config.aiAvailable} onChange={e => { setInput(e.target.value); setRetry(null); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(e); } }} /><Button type="submit" disabled={!input.trim() || !config.aiAvailable || opening || initializing} busy={busy} aria-label="Send message"><ArrowUp size={21} /></Button></form>
        <p className="small muted">AI can be wrong. Check important explanations with your teacher. Keep personal details out of questions.</p>
      </div>
    </section></div>
  </>;
}
