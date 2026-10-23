import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, Clock3, Play, Square, Target, CalendarDays, ClipboardCheck, Search, Printer } from 'lucide-react';
import { api } from '../lib/api';
import { SUBJECTS, subjectById, percentage, average, subjectResults, date, duration } from '../lib/format';
import { Button, PageHeading, Empty, Notice, LoadState, useLoad, Score } from '../components';
export function Dashboard({ user, navigate, notify }) {
  const state = useLoad('/overview'), [focusSubject, setFocusSubject] = useState('maths'), [busy, setBusy] = useState(false), [now, setNow] = useState(Date.now());
  useEffect(() => { if (!state.data?.activeFocus) return; setNow(Date.now()); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [state.data?.activeFocus?.id]);
  const data = state.data, results = data?.results || [];
  const offset = useRef(0);
  useEffect(() => { if (data?.serverNow) offset.current = new Date(data.serverNow).getTime() - Date.now(); }, [data?.serverNow]);
  async function focus() {
    setBusy(true);
    try {
      if (data.activeFocus) { await api('/focus/' + data.activeFocus.id + '/stop', { method: 'POST' }); notify('Study session saved.'); }
      else await api('/focus/start', { method: 'POST', body: { subject: focusSubject } });
      state.refresh();
    } catch (e) { notify(e.message, 'error'); } finally { setBusy(false); }
  }
  async function complete(plan) {
    try { await api('/plans/' + plan.id, { method: 'PATCH', body: { completed: !plan.completed_at } }); state.refresh(); }
    catch (e) { notify(e.message, 'error'); }
  }
  const score = data?.stats?.average ?? null;
  const studyMinutes = Math.floor((data?.focus || []).reduce((n, d) => n + d.seconds, 0) / 60);
  const pendingPlans = data?.plans.filter(p => !p.completed_at) || [];
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(Date.now() - (6 - i) * 86400000));
  const dailyValues = weekdays.map(day => {
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(day);
    return Math.round((data?.focus.find(item => String(item.day).slice(0, 10) === key)?.seconds || 0) / 60);
  });
  return <><PageHeading eyebrow="YOUR STUDY RECORD" title="See the work you have put in." description="Review your practice, follow your teacher’s plans and record a focused session." action={<span className="date-chip"><CalendarDays size={16} />{date(Date.now())}</span>} />
    <LoadState state={state}>{data && <>
      <div className="progress-focus">
        <section className="focus-card"><div className="section-heading"><h3>Make time for progress</h3><Clock3 size={18} /></div><p className="muted small">Start a focused study session. Save it when you finish.</p>
          <div className="focus-time">{data.activeFocus ? duration(Math.floor((now + offset.current - new Date(data.activeFocus.started_at).getTime()) / 1000)) : '00:00'}</div>
          <select aria-label="Study subject" value={data.activeFocus?.subject || focusSubject} disabled={Boolean(data.activeFocus)} onChange={e => setFocusSubject(e.target.value)}>{SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          <Button variant={data.activeFocus ? 'secondary' : 'primary'} busy={busy} onClick={focus}>{data.activeFocus ? <Square size={16} /> : <Play size={16} />}{data.activeFocus ? 'Finish & save session' : 'Start a session'}</Button><small className="muted">Sessions left open for 4 hours are discarded.</small>
        </section></div>
      <div className="stats-strip">
        <div><span>Practice completed</span><strong>{data.stats.completed}<small>assessments</small></strong></div>
        <div><span>Your recorded average</span><strong>{score === null ? '—' : score + '%'}<small>{score === null ? 'Start to see your results' : 'Across completed practice'}</small></strong></div>
        <div><span>Focus in the last 7 days</span><strong>{studyMinutes}<small>minutes saved</small></strong></div>
        <div><span>Teacher study plans</span><strong>{pendingPlans.length}<small>to work through</small></strong></div>
      </div>
      <div className="two-columns lower-grid"><section className="panel"><div className="section-heading"><h2>Your study rhythm</h2><span className="small muted">Last 7 days · minutes</span></div>
        <div className="activity-chart" aria-label={'Saved study minutes by day: ' + dailyValues.join(', ')}>{weekdays.map((day, i) => <div className="activity-column" key={i}><span>{dailyValues[i]}</span><svg viewBox="0 0 32 110" role="presentation"><rect x="3" y="0" width="26" height="110" rx="6" className="bar-track" /><rect x="3" y={110 - Math.max(3, dailyValues[i] / Math.max(1, ...dailyValues) * 105)} width="26" height={Math.max(3, dailyValues[i] / Math.max(1, ...dailyValues) * 105)} rx="6" className="bar-fill" /></svg><small>{new Intl.DateTimeFormat('en-ZA', { weekday: 'short', timeZone: 'Africa/Johannesburg' }).format(day)}</small></div>)}</div>
        {!studyMinutes && <p className="muted small">Your first saved focus session will appear here.</p>}
      </section><section className="panel"><div className="section-heading"><h2>Your next steps</h2><Target size={19} /></div>
        {data.plans.length ? data.plans.slice(0, 5).map(plan => <div className="plan-row" key={plan.id}><button className={'check-toggle ' + (plan.completed_at ? 'checked' : '')} aria-label={plan.completed_at ? 'Mark as unfinished' : 'Mark as complete'} onClick={() => complete(plan)}>{plan.completed_at && <Check size={14} />}</button><div><strong>{plan.title}</strong><p>{plan.notes}</p><small>{plan.class_name} · Due {date(plan.due_date)}</small></div></div>) :
          <Empty icon={Target} title="Space for your next goal">Your teacher’s study plans will appear here. You can start with a practice assessment today.</Empty>}
      </section></div>
      <section className="panel"><div className="section-heading"><h2>Recently completed</h2><ClipboardCheck size={18} /></div>{results.length ? <div className="result-list">{results.slice(0, 5).map(r => <button key={r.id} className="result-row" onClick={() => navigate('/practice/' + r.id)}><span className={'mini-subject ' + subjectById(r.subject).tone}>{subjectById(r.subject).mark}</span><div><strong>{r.title}</strong><small>{date(r.submitted_at)} · {r.score}/{r.total} correct</small></div><Score value={percentage(r.score, r.total)} /><ArrowRight size={17} /></button>)}</div> : <Empty title="Your progress starts with a question">Complete your first assessment to see a result and its explanations.</Empty>}</section>
    </>}</LoadState></>;
}
export function Practice({ navigate, search }) {
  const state = useLoad('/assessments'), [filter, setFilter] = useState(new URLSearchParams(search).get('subject') || 'all'), [query, setQuery] = useState(''), [busy, setBusy] = useState(''), [error, setError] = useState('');
  const rows = state.data?.assessments.filter(a => (filter === 'all' || a.subject === filter) && a.title.toLowerCase().includes(query.toLowerCase())) || [];
  async function start(a) { setBusy(a.id); setError(''); try { const r = await api('/assessments/' + a.id + '/start', { method: 'POST' }); navigate('/practice/' + r.id); } catch (e) { setError(e.message); } finally { setBusy(''); } }
  return <><PageHeading eyebrow="PRACTICE WITH PURPOSE" title="Build your understanding." description="Try an assessment, review the explanation, and decide what to study next." />
    <div className="resource-banner"><BookOpen size={22} /><div><strong>Looking for official past papers?</strong><p>Get the original papers and memoranda from the Department of Basic Education.</p></div><a href="https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx" target="_blank" rel="noopener noreferrer">Open DBE library<ArrowUpRight size={16} /></a></div>
    <div className="toolbar"><div className="tabs" role="group" aria-label="Filter by subject">{[{ id: 'all', short: 'All subjects' }, ...SUBJECTS].map(s => <button key={s.id} aria-pressed={filter === s.id} className={filter === s.id ? 'active' : ''} onClick={() => setFilter(s.id)}>{s.short}</button>)}</div><label className="search"><Search size={17} /><input aria-label="Search assessments" placeholder="Find a practice…" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
    <Notice>{error}</Notice><LoadState state={state}><div className="assessment-grid">{rows.map(a => <section className="assessment-card" key={a.id}><div className="section-heading"><span className={'pill ' + subjectById(a.subject).tone}>{subjectById(a.subject).name}</span><span className="small muted">Grade {a.grade}</span></div><h2>{a.title}</h2><p>{a.description}</p><div className="assessment-meta"><span><Clock3 size={15} />{a.duration_minutes} min</span><span><ClipboardCheck size={15} />{a.question_count} questions</span></div><small className="muted">{a.class_name || 'Shared practice library'}</small><div className="assessment-footer">{a.submitted_at ? <><Score value={percentage(a.score, a.total)} /><Button variant="secondary" onClick={() => navigate('/practice/' + a.attempt_id)}>Review answers<ArrowRight size={16} /></Button></> : <Button busy={busy === a.id} onClick={() => start(a)}>{a.attempt_id ? 'Continue practice' : 'Start practice'}<ArrowRight size={16} /></Button>}</div></section>)}</div>{!rows.length && <Empty title="No practice here yet">Try another subject, or ask your teacher to publish an assessment for your class.</Empty>}</LoadState>
    <p className="small muted footnote">One recorded attempt per assessment. The timer starts when you select Start. Official DBE papers are external resources; this app does not automatically mark uploaded papers.</p>
  </>;
}
export function Attempt({ attemptId, navigate, notify }) {
  const state = useLoad('/attempts/' + attemptId), [selected, setSelected] = useState({}), [saving, setSaving] = useState(''), [busy, setBusy] = useState(false), [remaining, setRemaining] = useState(null);
  const initial = useRef(false), saveQueue = useRef(Promise.resolve()), chosen = useRef({}), autoSubmitted = useRef(false), offset = useRef(0);
  useEffect(() => {
    if (!state.data) return;
    offset.current = new Date(state.data.serverNow).getTime() - Date.now();
    if (!initial.current) { initial.current = true; chosen.current = state.data.attempt.answers; setSelected(chosen.current); }
  }, [state.data]);
  useEffect(() => {
    if (!state.data || state.data.attempt.submitted_at) return;
    const tick = () => setRemaining(Math.max(0, Math.floor((new Date(state.data.attempt.deadline).getTime() - Date.now() - offset.current) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [state.data]);
  useEffect(() => { if (remaining === 0 && state.data && !state.data.attempt.submitted_at && !autoSubmitted.current) { autoSubmitted.current = true; submit(true); } }, [remaining]);
  function choose(q, value) {
    chosen.current = { ...chosen.current, [q]: value }; setSelected(chosen.current); const snapshot = { ...chosen.current }; setSaving('Saving…');
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => api('/attempts/' + attemptId, { method: 'PATCH', body: { answers: snapshot } })).then(() => setSaving('Answers saved')).catch(e => { setSaving('Not saved — check your connection'); notify(e.message, 'error'); });
  }
  async function submit(automatic = false) {
    if (!automatic && !window.confirm('Submit your answers? You can review them afterwards, but cannot change this attempt.')) return;
    setBusy(true);
    try { await saveQueue.current; await api('/attempts/' + attemptId + '/submit', { method: 'POST', body: { answers: chosen.current } }); state.refresh(); notify('Your answers have been marked.'); }
    catch (e) { notify(e.message, 'error'); autoSubmitted.current = false; } finally { setBusy(false); }
  }
  const done = Boolean(state.data?.attempt.submitted_at);
  return <><PageHeading eyebrow={done ? 'LEARN FROM YOUR RESULTS' : 'ONE QUESTION AT A TIME'} title={state.data?.assessment.title || 'Your practice'} action={<Button variant="secondary" onClick={() => navigate('/practice')}>Back to practice</Button>} />
    <LoadState state={state}>{state.data && <>
      <div className="attempt-status"><div><span className={'pill ' + subjectById(state.data.assessment.subject).tone}>{subjectById(state.data.assessment.subject).name}</span><span>Grade {state.data.assessment.grade}</span></div>{done ? <><Score value={percentage(state.data.attempt.score, state.data.attempt.total)} /><span>{state.data.attempt.score} of {state.data.attempt.total} correct</span><Button variant="secondary" onClick={() => window.print()}><Printer size={16} />Print results</Button></> : <><span role="status">{saving || 'Answers save as you choose'}</span><strong className={remaining < 120 ? 'attention' : ''}><Clock3 size={18} />{duration(remaining || 0)}</strong></>}</div>
      {done && <Notice kind="info">Your result reflects this assessment only. Use the explanations below to identify what to practise next.</Notice>}
      <div className="question-list">{state.data.questions.map((q, i) => {
        const value = done ? state.data.attempt.answers[q.id] : selected[q.id];
        return <fieldset className={'question-card ' + (done ? value === q.correct_index ? 'correct' : 'incorrect' : '')} key={q.id}><legend><span>QUESTION {i + 1}</span><small>{q.topic}</small></legend><h2>{q.prompt}</h2><div className="answer-options">{q.options.map((option, index) => <label key={index} className={'answer-option ' + (value === index ? 'selected ' : '') + (done && index === q.correct_index ? 'answer-correct' : '')}><input type="radio" name={q.id} value={index} checked={value === index} disabled={done || busy || remaining === 0} onChange={() => choose(q.id, index)} /><span className="answer-letter">{'ABCD'[index]}</span><span>{option}</span>{done && index === q.correct_index && <Check size={18} />}</label>)}</div>{done && <div className="answer-explanation"><strong>{value === q.correct_index ? 'Well understood.' : value === undefined ? 'Not answered.' : 'Something to revisit.'}</strong><p>{q.explanation}</p></div>}</fieldset>;
      })}</div>
      {!done && <div className="submit-bar"><span>{Object.keys(selected).length} of {state.data.questions.length} answered</span><Button busy={busy} onClick={() => submit(false)}>Submit my answers<ArrowRight size={16} /></Button></div>}
    </>}</LoadState></>;
}
