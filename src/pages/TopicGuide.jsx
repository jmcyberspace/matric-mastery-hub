import { useRef, useState } from 'react';
import { BookOpen, CheckCircle2, MessageCircle, RotateCcw } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Notice, useLoad, LoadState } from '../components';

export default function TopicGuide({ topicId, onAsk, aiAvailable, locked }) {
  const state = useLoad('/topics/' + topicId), [answers, setAnswers] = useState({}), [result, setResult] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const requestId = useRef(null), sending = useRef(false);
  async function check(e) {
    e.preventDefault(); if (sending.current) return;
    sending.current = true; setBusy(true); setError('');
    requestId.current ||= crypto.randomUUID();
    try {
      const r = await api('/topics/' + topicId + '/check', { method: 'POST', body: { requestId: requestId.current, version: state.data.topic.version, answers: state.data.questions.map(q => ({ questionId: q.id, answer: answers[q.id] })) } });
      setResult(r.check);
    } catch (e) { setError(e.message); }
    finally { sending.current = false; setBusy(false); }
  }
  function retry() { setResult(null); setAnswers({}); requestId.current = null; setError(''); state.refresh(); }
  return <LoadState state={state}>{state.data && <div className="topic-resources">
    <details className="topic-reference"><summary><BookOpen size={18} />Topic guide & worked example</summary><div className="reference-content"><p className="eyebrow">YOUR LEARNING GOAL</p><p className="learning-goal">{state.data.topic.goal}</p><h3>The key idea</h3><p>{state.data.topic.guide.idea}</p><ol>{state.data.topic.guide.steps.map(step => <li key={step}>{step}</li>)}</ol><div className="worked-example"><h3>Worked example</h3><p>{state.data.topic.guide.example.prompt}</p><ol>{state.data.topic.guide.example.steps.map(step => <li key={step}>{step}</li>)}</ol></div><p className="topic-caution"><strong>Watch out for this</strong>{state.data.topic.guide.caution}</p><Button variant="secondary" disabled={!aiAvailable || locked} onClick={() => onAsk('Please explain the worked example in this topic guide more simply, one step at a time.', 'explain')}>Talk it through with AI<MessageCircle size={17} /></Button></div></details>
    <details className="topic-reference"><summary><CheckCircle2 size={18} />Quick check · 2 questions</summary><div className="reference-content"><p className="small muted">A short practice check, not an exam mark. There are two question sets to revisit.</p>{state.data.lastCheck && !result && <p className="last-check">Last saved check: {state.data.lastCheck.score}/{state.data.lastCheck.total}</p>}<Notice>{error}</Notice>
      {result ? <div className="check-feedback"><h3>{result.score} of {result.total} correct</h3><p>{result.score === result.total ? 'You have answered this set correctly. Try explaining the reasoning in your own words.' : 'Let’s use these answers to find the next useful step.'}</p>{result.feedback.map(f => <div className={'feedback-item ' + (f.correct ? 'correct' : 'review')} key={f.questionId}><strong>{f.correct ? 'Correct' : 'Worth another look'} · {f.prompt}</strong><p>Your answer: {f.selected}</p>{!f.correct && <p>Correct answer: {f.correctAnswer}</p>}<p>{f.explanation}</p></div>)}<Button disabled={!aiAvailable || locked} onClick={() => onAsk('Help me understand my topic check. Explain the reasoning and then ask one similar question.\n' + result.feedback.map(f => f.prompt + '\nI chose: ' + f.selected + '. Feedback: ' + f.explanation).join('\n\n'), 'explain')}>Review my reasoning with AI<MessageCircle size={17} /></Button><Button variant="secondary" onClick={retry}><RotateCcw size={17} />Try the other question set</Button></div> : <form className="topic-check" onSubmit={check}>{state.data.questions.map((q, index) => <fieldset key={q.id}><legend><span>{index + 1}.</span> {q.prompt}</legend>{q.options.map((option, i) => <label className={'check-option ' + (answers[q.id] === i ? 'selected' : '')} key={option}><input type="radio" name={q.id} checked={answers[q.id] === i} disabled={busy} onChange={() => { setAnswers(a => ({ ...a, [q.id]: i })); requestId.current = null; }} /><span>{option}</span></label>)}</fieldset>)}<Button type="submit" busy={busy} disabled={state.data.questions.some(q => !Object.hasOwn(answers, q.id))}>Check my answers<CheckCircle2 size={17} /></Button></form>}
    </div></details>
  </div>}</LoadState>;
}
