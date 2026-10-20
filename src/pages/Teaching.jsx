import { useState } from 'react';
import { Plus, Users, ArrowRight, Copy, Download, Printer, BookOpen, Trash2, Check, RotateCw } from 'lucide-react';
import { api } from '../lib/api';
import { SUBJECTS, subjectById, date, percentage, csv, download } from '../lib/format';
import { Button, Field, PageHeading, Empty, Notice, LoadState, useLoad, Modal, Score } from '../components';
export function Classes({ user, navigate, notify, search }) {
  const state = useLoad('/classes'), [modal, setModal] = useState(null), [selected, setSelected] = useState(new URLSearchParams(search).get('id'));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [inviteUrl, setInviteUrl] = useState('');
  const teacher = user.role !== 'learner';
  async function submit(e) {
    e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget)); setBusy(true); setError('');
    try {
      if (modal === 'new') await api('/classes', { method: 'POST', body: { ...data, grade: Number(data.grade) } });
      if (modal === 'join') await api('/classes/join', { method: 'POST', body: data });
      if (modal === 'invite') {
        const r = await api('/invitations', { method: 'POST', body: { email: data.email, role: data.role || 'learner', classId: data.classId || null } });
        setInviteUrl(r.url); return;
      }
      setModal(null); state.refresh(); notify(modal === 'join' ? 'You joined the class.' : 'Class created.');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const close = () => { setModal(null); setError(''); setInviteUrl(''); };
  return <><PageHeading eyebrow={teacher ? 'TEACHER WORKSPACE' : 'LEARNING TOGETHER'} title={teacher ? 'Your classes. Their next steps.' : 'Your learning circle.'} description={teacher ? 'A clear view of your learners, their practice and the support they need.' : 'Join your teacher’s class to receive assessments and study plans.'}
      action={<div className="button-row">{teacher && <Button variant="secondary" onClick={() => { setModal('invite'); setInviteUrl(''); }}>Invite someone</Button>}<Button onClick={() => setModal(teacher ? 'new' : 'join')}><Plus size={17} />{teacher ? 'Create class' : 'Join a class'}</Button></div>} />
    <LoadState state={state}>{state.data && <><div className="class-grid">{state.data.classes.map(c => <section className={'class-card ' + (selected === c.id ? 'selected' : '')} key={c.id}><span className={'pill ' + subjectById(c.subject).tone}>{subjectById(c.subject).name}</span><h2>{c.name}</h2><p>{c.school || c.teacher_name} · Grade {c.grade}</p><div className="class-card-footer"><span><Users size={15} />{c.learner_count} learners</span>{teacher ? <Button variant="secondary" onClick={() => setSelected(c.id)}>Open class<ArrowRight size={15} /></Button> : <Button variant="secondary" onClick={() => navigate('/practice?subject=' + c.subject)}>Find practice<ArrowRight size={15} /></Button>}</div></section>)}</div>
      {!state.data.classes.length && <Empty icon={Users} title={teacher ? 'Build your first learning group.' : 'Your class is waiting.'}>{teacher ? 'Create a class, invite learners and publish their first assessment.' : 'Use a class code from your teacher to get started.'}</Empty>}
      {selected && teacher && <ClassReport key={selected} classId={selected} notify={notify} navigate={navigate} onChanged={state.refresh} />}
    </>}</LoadState>
    {modal && <Modal title={modal === 'new' ? 'Create a class' : modal === 'join' ? 'Join a class' : 'Invite a new account'} onClose={close}><Notice>{error}</Notice>{inviteUrl ? <div className="stack"><Notice kind="success">Invitation created. It expires in 7 days and can be used once.</Notice><p>Share this private link directly with the intended person. It grants access to their account setup.</p><textarea readOnly aria-label="Private invitation link" rows={4} value={inviteUrl} /><Button onClick={async () => { try { await navigator.clipboard.writeText(inviteUrl); notify('Invitation copied.'); } catch { notify('Select and copy the link above.', 'error'); } }}><Copy size={16} />Copy invitation</Button></div> :
      <form className="stack" onSubmit={submit}>
        {modal === 'new' && <><Field label="Class name" name="name" required minLength={2} maxLength={100} placeholder="Grade 12 Mathematics" /><Field label="School (optional)" name="school" maxLength={120} /><div className="two-columns"><Field label="Subject"><select name="subject">{SUBJECTS.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></Field><Field label="Grade"><select name="grade"><option value={12}>Grade 12</option><option value={11}>Grade 11</option></select></Field></div></>}
        {modal === 'join' && <Field label="Class code" name="code" required minLength={8} maxLength={20} hint="Class codes are case-sensitive." />}
        {modal === 'invite' && <><Field label="Email address" name="email" type="email" required maxLength={254} />{user.role === 'admin' && <Field label="Account type"><select name="role"><option value="learner">Learner</option><option value="teacher">Teacher</option></select></Field>}<Field label="Learner class"><select name="classId" required={user.role !== 'admin'}><option value="">No class (administrator invitations only)</option>{state.data?.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><p className="small muted">For a teacher invitation, choose “No class”. An existing learner can join using a class code.</p></>}
        <Button busy={busy} type="submit">{modal === 'invite' ? 'Create private invitation' : modal === 'join' ? 'Join class' : 'Create class'}</Button>
      </form>}</Modal>}
  </>;
}
function ClassReport({ classId, notify, navigate, onChanged }) {
  const state = useLoad('/classes/' + classId + '/report'), [learner, setLearner] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const data = state.data;
  async function plan(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api('/plans', { method: 'POST', body: { ...Object.fromEntries(new FormData(e.currentTarget)), classId, learnerId: learner.id } }); setLearner(null); state.refresh(); notify('Study plan saved for the learner.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  function exportCsv() { download('matric-class-results.csv', csv([['Learner','Completed assessments','Average (%)','Last submission'], ...data.learners.map(l => [l.name,l.completed,l.average ?? '',date(l.last_submission)])]), 'text/csv;charset=utf-8'); }
  async function parentUpdate(l) {
    const text = 'Progress update for ' + l.name + '\n' + data.classroom.name + '\nCompleted assessments: ' + l.completed + '\nRecorded average: ' + (l.average === null ? 'No results yet' : l.average + '%') + '\nPlease encourage regular practice and discuss any questions with the teacher.\nMatric Mastery · ' + date(Date.now());
    try { await navigator.clipboard.writeText(text); notify('Parent update copied. Review it before sharing.'); } catch { download('parent-progress-update.txt', text); notify('Parent update downloaded.'); }
  }
  async function remove(l) {
    if (!window.confirm('Remove ' + l.name + ' from this class? Their personal account remains active.')) return;
    try { await api('/classes/' + classId + '/members/' + l.id, { method: 'DELETE' }); state.refresh(); onChanged(); }
    catch (e) { notify(e.message, 'error'); }
  }
  return <section className="class-report panel"><LoadState state={state}>{data && <>
    <div className="section-heading"><div><p className="eyebrow">CLASS SNAPSHOT</p><h2>{data.classroom.name}</h2></div><div className="button-row"><Button variant="secondary" onClick={exportCsv}><Download size={15} />CSV</Button><Button variant="secondary" onClick={() => window.print()}><Printer size={15} />Print / PDF</Button><Button onClick={() => navigate('/teacher/assessment/new?class=' + classId)}><Plus size={16} />Assessment</Button></div></div>
    <div className="class-code no-print"><div><span className="small muted">JOIN CODE</span><code>{data.classroom.join_code}</code></div><Button variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(data.classroom.join_code); notify('Class code copied.'); } catch { notify('Select and copy the code.', 'error'); } }}><Copy size={16} />Copy</Button><Button variant="ghost" onClick={async () => { try { await api('/classes/' + classId + '/rotate-code', { method: 'POST' }); state.refresh(); notify('Previous class code replaced.'); } catch (e) { notify(e.message, 'error'); } }}><RotateCw size={15} />Replace code</Button></div>
    <p className="small muted">Results below cover assessments assigned to this class. “Needs a check-in” means a recorded average below 50%; it is not a pass prediction.</p>
    {data.learners.length ? <div className="table-scroll"><table><thead><tr><th>Learner</th><th>Completed</th><th>Average</th><th>Next step</th><th className="no-print">Support</th></tr></thead><tbody>{data.learners.map(l => <tr key={l.id}><td><strong>{l.name}</strong><small>Last submitted {date(l.last_submission)}</small></td><td>{l.completed}</td><td><Score value={l.average} /></td><td><span className={'pill ' + (l.average === null ? 'neutral' : l.average < 50 ? 'coral' : 'green')}>{l.average === null ? 'Awaiting first result' : l.average < 50 ? 'Needs a check-in' : 'Keep practising'}</span></td><td className="no-print"><div className="button-row"><button className="text-link" onClick={() => { setLearner(l); setError(''); }}>Add plan</button><button className="icon-button" title="Copy parent update" aria-label={'Copy progress update for ' + l.name} onClick={() => parentUpdate(l)}><Copy size={15} /></button><button className="icon-button" aria-label={'Remove ' + l.name + ' from class'} onClick={() => remove(l)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div> : <Empty icon={Users} title="Ready for your first learner">Share a private account invitation, or a class code with a learner who already has an account.</Empty>}
    {data.plans.length > 0 && <><h3 className="subheading">Study plans & check-ins</h3><div className="plan-list">{data.plans.map(p => <div className="plan-row" key={p.id}><span className={'check-toggle ' + (p.completed_at ? 'checked' : '')}>{p.completed_at && <Check size={14} />}</span><div><strong>{p.title}</strong><p>{p.learner_name} · Due {date(p.due_date)}</p><small>{p.notes}</small></div><span className="small muted">{p.completed_at ? 'Completed' : 'Open'}</span></div>)}</div></>}
    <p className="small muted print-footer">Matric Mastery · Generated {date(data.generatedAt)} · Private class report</p>
  </>}</LoadState>
  {learner && <Modal title={'Study plan for ' + learner.name} onClose={() => setLearner(null)}><form className="stack" onSubmit={plan}><Notice>{error}</Notice><Field label="Focus or check-in title" name="title" required minLength={3} maxLength={140} /><Field label="Steps for the learner"><textarea name="notes" rows={5} maxLength={3000} required placeholder="Describe the topic, practice and next check-in." /></Field><Field label="Due / check-in date" name="dueDate" type="date" required /><p className="small muted">The plan will appear in the learner’s dashboard. This does not send SMS or email reminders.</p><Button type="submit" busy={busy}>Save study plan</Button></form></Modal>}
  </section>;
}
const blankQuestion = () => ({ topic: '', prompt: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });
export function AssessmentEditor({ user, navigate, notify, search }) {
  const classes = useLoad('/classes'), [classId, setClassId] = useState(new URLSearchParams(search).get('class') || ''), [questions, setQuestions] = useState([blankQuestion()]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const classroom = classes.data?.classes.find(c => c.id === classId);
  function change(index, key, value) { setQuestions(all => all.map((q, i) => i === index ? { ...q, [key]: value } : q)); }
  async function publish(e) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget));
    if (!window.confirm('Publish this assessment? Learners will be able to start it. Published questions are kept fixed to protect recorded results.')) return;
    setBusy(true); setError('');
    try {
      const result = await api('/assessments', { method: 'POST', body: {
        title: f.title, description: f.description, subject: classroom?.subject || f.subject, grade: classroom?.grade || Number(f.grade),
        classId: classId || null, durationMinutes: Number(f.durationMinutes), questions,
      } });
      notify('Assessment published.'); navigate('/teacher/memo/' + result.id);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <><PageHeading eyebrow="DESIGNED BY YOU" title="Create meaningful practice." description="Write the questions, check each answer and give learners an explanation they can learn from." /><LoadState state={classes}><form className="stack" onSubmit={publish}><Notice>{error}</Notice>
    <section className="panel stack"><h2>Assessment details</h2><Field label="Title" name="title" required minLength={3} maxLength={140} /><Field label="Introduction"><textarea name="description" rows={3} maxLength={1500} /></Field><div className="three-columns"><Field label="Class"><select value={classId} onChange={e => setClassId(e.target.value)} required={user.role !== 'admin'}><option value="">{user.role === 'admin' ? 'Shared practice library' : 'Choose a class'}</option>{classes.data?.classes.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></Field><Field label="Subject"><select name="subject" key={'subject-' + classId} defaultValue={classroom?.subject || 'maths'} disabled={Boolean(classroom)}>{SUBJECTS.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></Field><Field label="Grade"><select name="grade" key={'grade-' + classId} defaultValue={classroom?.grade || 12} disabled={Boolean(classroom)}><option value={11}>Grade 11</option><option value={12}>Grade 12</option></select></Field></div><Field label="Time allowed (minutes)" name="durationMinutes" type="number" required min={5} max={180} defaultValue={20} /></section>
    {questions.map((q, i) => <section className="panel stack" key={i}><div className="section-heading"><h2>Question {i + 1}</h2>{questions.length > 1 && <Button type="button" variant="ghost" onClick={() => setQuestions(all => all.filter((_, index) => index !== i))}><Trash2 size={16} />Remove</Button>}</div><Field label="Topic" name={'topic-' + i} value={q.topic} onChange={e => change(i, 'topic', e.target.value)} required maxLength={100} /><Field label="Question"><textarea rows={3} required minLength={3} maxLength={3000} value={q.prompt} onChange={e => change(i, 'prompt', e.target.value)} /></Field><div className="two-columns">{q.options.map((option, index) => <Field key={index} label={'Option ' + 'ABCD'[index]} name={'option-' + i + '-' + index} required maxLength={500} value={option} onChange={e => change(i, 'options', q.options.map((o, j) => j === index ? e.target.value : o))} />)}</div><Field label="Correct answer"><select value={q.correctIndex} onChange={e => change(i, 'correctIndex', Number(e.target.value))}>{q.options.map((_, index) => <option key={index} value={index}>{'ABCD'[index]}</option>)}</select></Field><Field label="Explanation shown after submission"><textarea rows={3} required minLength={3} maxLength={3000} value={q.explanation} onChange={e => change(i, 'explanation', e.target.value)} /></Field></section>)}
    <div className="button-row"><Button type="button" variant="secondary" disabled={questions.length >= 50} onClick={() => setQuestions(all => [...all, blankQuestion()])}><Plus size={16} />Add question</Button><Button type="submit" busy={busy}>Publish assessment<ArrowRight size={16} /></Button></div><p className="small muted">Each question earns one mark. Review accuracy and grade suitability before publishing. Published assessments cannot be edited in place.</p>
  </form></LoadState></>;
}
export function Memo({ assessmentId }) {
  const state = useLoad('/assessments/' + assessmentId + '/memo'), [showMemo, setShowMemo] = useState(false);
  return <><PageHeading eyebrow="TEACHER COPY" title={state.data?.assessment.title || 'Assessment'} action={<div className="button-row"><Button variant="secondary" onClick={() => setShowMemo(v => !v)}>{showMemo ? 'Hide answers' : 'Show memorandum'}</Button><Button onClick={() => window.print()}><Printer size={16} />Print / save PDF</Button></div>} /><LoadState state={state}>{state.data && <div className="print-document"><p>{state.data.assessment.description}</p><p className="muted">{state.data.assessment.duration_minutes} minutes · {state.data.questions.length} marks</p>{state.data.questions.map((q, i) => <section className="panel" key={q.id}><h3>{i + 1}. {q.prompt}</h3><ol type="A">{q.options.map((o, n) => <li key={n}>{o}</li>)}</ol>{showMemo && <div className="answer-explanation"><strong>Answer: {'ABCD'[q.correct_index]}</strong><p>{q.explanation}</p></div>}</section>)}</div>}</LoadState></>;
}
