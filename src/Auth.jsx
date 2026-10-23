import { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, ShieldCheck, GraduationCap } from 'lucide-react';
import { api } from './lib/api';
import { Button, Field, Notice } from './components';
export default function Auth({ path, token, onSuccess, navigate, config }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState(''), [grade, setGrade] = useState(12);
  const [code, setCode] = useState(''), [mfa, setMfa] = useState(path === '/reset'), [privacy, setPrivacy] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [invite, setInvite] = useState(null);
  const mode = path === '/invite' ? 'invite' : path === '/reset' ? 'reset' : path === '/forgot' ? 'forgot' : 'login';
  useEffect(() => {
    if (mode === 'invite') {
      if (!token) { setError('Open the complete invitation link sent to you.'); return; }
      api('/auth/invitation', { method: 'POST', body: { token } }).then(setInvite).catch(e => setError(e.message));
    }
  }, [mode, token]);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'login') { await api('/auth/login', { method: 'POST', body: { email, password, ...(code ? { code } : {}) } }); await onSuccess(); }
      if (mode === 'invite') { await api('/auth/accept-invitation', { method: 'POST', body: { token, name, password, grade, acceptedPrivacy: privacy } }); await onSuccess(); }
      if (mode === 'forgot') { const result = await api('/auth/forgot-password', { method: 'POST', body: { email } }); setMessage(result.message); }
      if (mode === 'reset') { const result = await api('/auth/reset-password', { method: 'POST', body: { token, password, ...(code ? { code } : {}) } }); setMessage(result.message); setPassword(''); }
    } catch (err) { setError(err.message); if (err.code === 'MFA_REQUIRED') setMfa(true); }
    finally { setBusy(false); }
  }
  const title = { login: 'Welcome back.', invite: 'Your next chapter starts here.', forgot: 'Find your way back.', reset: 'Set a new password.' }[mode];
  return <main className="auth-layout">
    <aside className="auth-story"><div className="brand light"><span className="brand-mark">m<span>.</span></span><span>matric<span>mastery</span></span></div>
      <div className="auth-story-body"><p className="eyebrow">A little progress, every day.</p><h1>Big futures.<br /><em>Small steps.</em></h1><p>A calmer place to practise, ask questions and build the confidence to move forward.</p>
        <div className="story-rule" /><div className="story-points"><span><BookOpen /> Learn with purpose</span><span><GraduationCap /> Grade 11 & 12</span><span><ShieldCheck /> Your own study space</span></div>
      </div><p className="story-footer">Built by JM CYBER SPACE · South Africa</p>
    </aside>
    <section className="auth-form"><div className="auth-inner"><p className="eyebrow">MATRIC MASTERY</p><h2>{title}</h2>
      <p className="muted">{mode === 'login' ? 'Sign in to pick up where you left off.' : mode === 'invite' ? 'Set up the account your teacher invited you to use.' : 'Keep your account and your progress protected.'}</p>
      <Notice>{error}</Notice><Notice kind="success">{message}</Notice>
      <form onSubmit={submit} className="stack">
        {mode === 'invite' && <><div className="info-box"><small>YOUR INVITATION</small><strong>{invite?.email || 'Checking invitation…'}</strong><span>{invite?.role === 'teacher' ? 'Teacher account' : 'Learner account'}</span></div>
          <Field label="Your name" name="name" autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} />
          <Field label="Grade"><select value={grade} onChange={e => setGrade(Number(e.target.value))}><option value={11}>Grade 11</option><option value={12}>Grade 12</option></select></Field></>}
        {(mode === 'login' || mode === 'forgot') && <Field label="Email address" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />}
        {mode !== 'forgot' && <Field label={mode === 'reset' ? 'New password' : 'Password'} name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} hint={mode !== 'login' ? 'Use a unique passphrase of at least 12 characters.' : null} />}
        {mfa && <Field label="Authenticator code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required={mode === 'login'} value={code} onChange={e => setCode(e.target.value)} hint={mode === 'reset' ? 'Required if you enabled two-factor authentication.' : null} />}
        {mode === 'invite' && <label className="checkbox-row"><input type="checkbox" required checked={privacy} onChange={e => setPrivacy(e.target.checked)} /><span>I have read the <a className="inline-link" href="/privacy" target="_blank" rel="noopener noreferrer">privacy notice (opens in a new tab)</a> and understand how my learning records are used.</span></label>}
        <Button busy={busy} disabled={mode === 'invite' && !invite} type="submit">{mode === 'login' ? 'Sign in' : mode === 'invite' ? 'Create my account' : mode === 'forgot' ? 'Send reset link' : 'Update password'}<ArrowRight size={17} /></Button>
      </form>
      {mode === 'login' ? <><button className="inline-link auth-help" onClick={() => navigate('/forgot')}>Forgot your password?</button><p className="small muted">New here? Ask your teacher or administrator for an invitation.</p></> : <button className="inline-link auth-help" onClick={() => navigate('/login')}>Back to sign in</button>}
      <footer><button className="inline-link" onClick={() => navigate('/privacy')}>Privacy & your data</button><span>JM CYBER SPACE</span></footer>
    </div></section>
  </main>;
}
