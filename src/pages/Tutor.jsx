import { useEffect, useRef, useState } from 'react';
import { Plus, ArrowUp, MessageCircle, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { SUBJECTS, subjectById, date } from '../lib/format';
import { Button, PageHeading, Notice, Empty, useLoad } from '../components';
export default function Tutor({ config, notify }) {
  const threads = useLoad('/threads'), [thread, setThread] = useState(null), [messages, setMessages] = useState([]), [subject, setSubject] = useState('maths');
  const [input, setInput] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(null), bottom = useRef(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, busy]);
  async function open(item) {
    setError('');
    try { const r = await api('/threads/' + item.id); setThread(r.thread); setMessages(r.messages); setSubject(r.thread.subject); setRetry(null); }
    catch (e) { setError(e.message); }
  }
  async function newThread() {
    setBusy(true); setError('');
    try { const r = await api('/threads', { method: 'POST', body: { subject } }); setThread(r.thread); setMessages([]); setRetry(null); threads.refresh(); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function send(e, previous) {
    e?.preventDefault(); const text = previous?.message || input.trim(); if (!text || busy) return;
    setBusy(true); setError('');
    let activeThread = thread;
    const requestId = previous?.requestId || crypto.randomUUID();
    try {
      if (!activeThread) { const r = await api('/threads', { method: 'POST', body: { subject } }); activeThread = r.thread; setThread(activeThread); }
      await api('/tutor', { method: 'POST', body: { threadId: activeThread.id, requestId, message: text } });
      const history = await api('/threads/' + activeThread.id);
      setMessages(history.messages);
      setInput(''); setRetry(null); threads.refresh();
    } catch (err) { setError(err.message); setRetry({ message: text, requestId: err.code === 'AI_REQUEST_FAILED' || err.status >= 500 ? null : requestId }); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!thread || !window.confirm('Permanently delete this conversation?')) return;
    try { await api('/threads/' + thread.id, { method: 'DELETE' }); setThread(null); setMessages([]); setRetry(null); threads.refresh(); notify('Conversation deleted.'); }
    catch (e) { setError(e.message); }
  }
  return <><PageHeading eyebrow="ASK. EXPLORE. UNDERSTAND." title="A little help goes a long way." description={'Your study tutor · Replies in your preferred language. Change it in Settings.'} />
    {!config.aiAvailable && <Notice kind="info">The tutor is not enabled yet. Your administrator needs to configure the AI service. Your other learning tools are available.</Notice>}
    <div className="tutor-layout"><aside className="conversation-list"><label className="field"><span>Study subject</span><select value={subject} disabled={busy} onChange={e => { setSubject(e.target.value); setThread(null); setMessages([]); setRetry(null); }}>{SUBJECTS.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label><Button variant="secondary" onClick={newThread} disabled={busy || !config.aiAvailable}><Plus size={16} />New conversation</Button><p className="eyebrow">YOUR CONVERSATIONS</p>
      <Notice>{threads.error}</Notice>{threads.data?.threads.map(t => <button className={'conversation-item ' + (thread?.id === t.id ? 'active' : '')} key={t.id} onClick={() => open(t)} disabled={busy}><MessageCircle size={16} /><span>{subjectById(t.subject).short}<small>{date(t.updated_at)}</small></span></button>)}
      {!threads.data?.threads.length && <p className="muted small">Your saved conversations will appear here.</p>}
    </aside><section className="chat-panel"><header><div><span className={'mini-subject ' + subjectById(subject).tone}>{subjectById(subject).mark}</span><div><h2>{subjectById(subject).name}</h2><p>JM CYBER SPACE · Study tutor</p></div></div>{thread && <button className="icon-button" aria-label="Delete conversation" onClick={remove} disabled={busy}><Trash2 size={18} /></button>}</header>
      <div className="chat-messages" aria-live="polite">{messages.length ? messages.map((m, i) => <article key={m.id || i} className={'chat-message ' + m.role}><small>{m.role === 'user' ? 'YOU' : 'YOUR TUTOR'}</small><p>{m.content}</p></article>) : <Empty icon={MessageCircle} title="Start with what you’re curious about.">Ask for an explanation, a worked example, or a hint with a topic you are studying.</Empty>}
        {busy && <div className="chat-thinking" role="status"><Loader2 className="spin" size={18} />Working through your question…</div>}<div ref={bottom} /></div>
      <div className="chat-composer"><Notice>{error}</Notice>{retry && <button className="text-link" disabled={busy} onClick={e => send(e, retry)}>Check or retry this request</button>}
        <form onSubmit={send}><textarea aria-label="Message to your tutor" placeholder="What would you like to understand?" maxLength={4000} rows={2} value={input} disabled={busy || !config.aiAvailable} onChange={e => { setInput(e.target.value); setRetry(null); }} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }} /><Button type="submit" disabled={!input.trim() || !config.aiAvailable} busy={busy} aria-label="Send message"><ArrowUp size={20} /></Button></form>
        <p className="small muted"><ShieldCheck size={13} />AI can make mistakes. Check explanations with your teacher. Avoid sharing personal details.</p>
      </div>
    </section></div>
  </>;
}
