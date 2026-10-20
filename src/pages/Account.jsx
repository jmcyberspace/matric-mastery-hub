import { useState } from 'react';
import { ShieldCheck, KeyRound, Download, LogOut, Trash2, Copy, Check, Users } from 'lucide-react';
import { api } from '../lib/api';
import { download, dateTime } from '../lib/format';
import { Button, Field, PageHeading, Notice, useLoad, LoadState, Modal } from '../components';
export function MfaSetup({ user, reload, notify, required = false }) {
  const [secret, setSecret] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function start(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await api('/auth/mfa/setup', { method: 'POST', body: { password: new FormData(e.currentTarget).get('password') } }); setSecret(r.secret); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function confirm(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api('/auth/mfa/confirm', { method: 'POST', body: { code: new FormData(e.currentTarget).get('code') } }); setSecret(null); await reload(); notify('Two-factor authentication is enabled.'); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <section className="panel stack"><div className="section-heading"><h2>Two-factor authentication</h2><ShieldCheck size={22} /></div>
    {user.mfaEnabled ? <Notice kind="success">Your account is protected with an authenticator code.</Notice> : <>
      <p>{required ? 'Staff accounts must enable an authenticator before accessing learner records.' : 'Add a second layer of protection with an authenticator app.'}</p><Notice>{error}</Notice>
      {!secret ? <form onSubmit={start} className="stack"><Field label="Confirm your password" name="password" type="password" autoComplete="current-password" required maxLength={128} /><Button busy={busy} type="submit"><KeyRound size={16} />Set up authenticator</Button></form> :
        <form onSubmit={confirm} className="stack"><p>In your authenticator app, add an account using a setup key. Choose a time-based, 6-digit code.</p><div className="secret-key"><code>{secret}</code><Button type="button" variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(secret); notify('Setup key copied. Keep it private.'); } catch { notify('Select and copy the setup key.', 'error'); } }}><Copy size={16} />Copy</Button></div><p className="small muted">Store this key in your password manager before continuing. It lets you restore your authenticator. If you lose access, contact your platform administrator.</p><Field label="6-digit code from your authenticator" name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" required /><Button type="submit" busy={busy}><Check size={16} />Confirm and enable</Button></form>}
    </>}
  </section>;
}
export function Settings({ user, reload, notify }) {
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [deleting, setDeleting] = useState(false);
  async function save(e, type) {
    e.preventDefault(); const form = e.currentTarget; const data = Object.fromEntries(new FormData(form)); setBusy(type); setError('');
    try {
      if (type === 'profile') { await api('/profile', { method: 'PATCH', body: { ...data, grade: Number(data.grade) } }); await reload(); }
      if (type === 'password') { if (!data.code) delete data.code; await api('/auth/password', { method: 'POST', body: data }); form.reset(); }
      if (type === 'delete') {
        if (!window.confirm('Delete your account, assessment results, study sessions and conversations? This cannot be undone from the app.')) return;
        if (!data.code) delete data.code; await api('/account', { method: 'DELETE', body: data }); await reload(); return;
      }
      notify(type === 'password' ? 'Password updated. Other sessions were signed out.' : 'Preferences saved.');
    } catch (err) { setError(err.message); } finally { setBusy(''); }
  }
  async function exportData() { try { const r = await api('/account/export'); download('matric-mastery-personal-data.json', JSON.stringify(r, null, 2), 'application/json'); } catch (e) { notify(e.message, 'error'); } }
  return <><PageHeading eyebrow="MAKE YOURSELF AT HOME" title="Your account & preferences." description="Choose how you learn. Keep your account protected." /><Notice>{error}</Notice><div className="two-columns align-start"><div className="stack">
    <section className="panel"><h2>Profile</h2><form className="stack" onSubmit={e => save(e, 'profile')}><Field label="Name" name="name" required minLength={2} maxLength={80} defaultValue={user.name} /><Field label="Email address" name="email" type="email" value={user.email} disabled hint="Contact the administrator to change your sign-in email." /><div className="two-columns"><Field label="Grade"><select name="grade" defaultValue={user.grade}><option value={11}>Grade 11</option><option value={12}>Grade 12</option></select></Field><Field label="Tutor reply language"><select name="language" defaultValue={user.language}>{['English','Afrikaans','Setswana'].map(l => <option key={l}>{l}</option>)}</select></Field></div><p className="small muted">This changes your tutor’s reply language. The application interface is in English.</p><Button type="submit" busy={busy === 'profile'}>Save preferences</Button></form></section>
    <section className="panel stack"><h2>Your data, your control</h2><p className="muted">Download a copy of your profile, assessment records, focus sessions, study plans and conversations.</p><Button variant="secondary" onClick={exportData}><Download size={16} />Download my data</Button><Button variant="secondary" onClick={async () => { try { await api('/auth/logout-all', { method: 'POST' }); await reload(); } catch (e) { notify(e.message, 'error'); } }}><LogOut size={16} />Sign out all devices</Button>{user.role === 'learner' && <Button variant="danger-outline" onClick={() => setDeleting(true)}><Trash2 size={16} />Delete my account</Button>}</section>
  </div><div className="stack"><MfaSetup user={user} reload={reload} notify={notify} /><section className="panel"><h2>Change password</h2><form className="stack" onSubmit={e => save(e, 'password')}><Field label="Current password" name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} /><Field label="New password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required hint="Use a unique passphrase with at least 12 characters." />{user.mfaEnabled && <Field label="Authenticator code" name="code" pattern="[0-9]{6}" inputMode="numeric" required maxLength={6} />}<Button type="submit" busy={busy === 'password'}>Update password</Button></form></section></div></div>
    {deleting && <Modal title="Delete your learner account" onClose={() => setDeleting(false)}><form className="stack" onSubmit={e => save(e, 'delete')}><p>This removes your learning records and conversations from the live platform. Existing server backups expire according to the operator’s backup policy.</p><Notice>{error}</Notice><Field label="Confirm your password" name="password" type="password" autoComplete="current-password" required maxLength={128} />{user.mfaEnabled && <Field label="Authenticator code" name="code" pattern="[0-9]{6}" required maxLength={6} />}<Button variant="danger" type="submit" busy={busy === 'delete'}>Permanently delete account</Button></form></Modal>}
  </>;
}
export function Administration({ notify }) {
  const users = useLoad('/admin/users'), events = useLoad('/admin/audit');
  async function toggle(user) {
    if (!window.confirm((user.enabled ? 'Disable ' : 'Enable ') + user.name + '?')) return;
    try { await api('/admin/users/' + user.id, { method: 'PATCH', body: { enabled: !user.enabled } }); users.refresh(); events.refresh(); notify('Account access updated.'); }
    catch (e) { notify(e.message, 'error'); }
  }
  return <><PageHeading eyebrow="PLATFORM ADMINISTRATION" title="Keep your learning space in order." description="Manage account access and review security events. Invite new teachers from Classes." />
    <section className="panel"><div className="section-heading"><h2>Accounts</h2><Users size={20} /></div><LoadState state={users}><div className="table-scroll"><table><thead><tr><th>Name</th><th>Role</th><th>Authenticator</th><th>Status</th><th>Access</th></tr></thead><tbody>{users.data?.users.map(u => <tr key={u.id}><td><strong>{u.name}</strong><small>{u.email}</small></td><td>{u.role}</td><td>{u.mfa_enabled ? 'Enabled' : 'Not enabled'}</td><td><span className={'pill ' + (u.enabled ? 'green' : 'neutral')}>{u.enabled ? 'Active' : 'Disabled'}</span></td><td>{u.role !== 'admin' && <Button variant="secondary" onClick={() => toggle(u)}>{u.enabled ? 'Disable' : 'Enable'}</Button>}</td></tr>)}</tbody></table></div></LoadState></section>
    <section className="panel"><h2>Recent security events</h2><LoadState state={events}><div className="table-scroll"><table><thead><tr><th>When</th><th>Account</th><th>Event</th></tr></thead><tbody>{events.data?.events.map(event => <tr key={event.id}><td>{dateTime(event.created_at)}</td><td>{event.actor_name || 'Removed account'}</td><td>{event.action.replaceAll('.', ' · ')}</td></tr>)}</tbody></table></div></LoadState></section>
  </>;
}
export function Privacy({ contact, navigate }) {
  return <main className="privacy-page"><Button variant="secondary" onClick={() => navigate('/')}>Back to Matric Mastery</Button><PageHeading eyebrow="YOUR DATA & YOUR LEARNING" title="Privacy, in plain language." description="Matric Mastery · Privacy notice v1" /><article className="panel prose">
    <h2>What this platform stores</h2><p>Your name, email address, account role, grade, language preference, class memberships, assessment answers and results, saved focus time, teacher study plans, and tutor conversations. Passwords are stored as hashes. Sign-in and account administration events are recorded for security.</p>
    <h2>Who can see learning records</h2><p>You can see your own learning records. Teachers see class membership and results from assessments assigned to classes they manage. Administrators manage platform accounts and class access. Classroom reports do not show your private tutor conversations. The server operator controls the infrastructure and backups.</p>
    <h2>Using the AI tutor</h2><p>When enabled, the tutor sends your question, recent conversation context, selected subject, grade and preferred language to Anthropic to generate a response. Your account email and name are not included by the application. Anything you type may be included, so avoid sharing personal, private or sensitive information. AI responses can be wrong; discuss important learning questions with your teacher.</p>
    <h2>Your choices</h2><p>You can use practice assessments without using the AI tutor. Download your personal data in Settings. Delete individual tutor conversations from the tutor screen. Learners can delete their account in Settings; staff should contact the administrator. Deletion from the live database does not immediately remove copies from existing backups.</p>
    <h2>Security and retention</h2><p>Sessions expire after 30 minutes of inactivity or 8 hours. Expired session and recovery records are cleaned up automatically. Security audit events are kept for up to 180 days. Learning records and conversations remain until removed through the platform or by its operator. Ask the operator for their backup retention policy.</p>
    <h2>School and family support</h2><p>Accounts are created by invitation. Schools and the platform operator should make sure learners and their parents or guardians understand the service before accounts are invited. Reports copied or downloaded by a teacher should be shared only with the intended person.</p>
    <h2>Questions or corrections</h2><p>Contact: <strong>{contact || 'your platform administrator'}</strong>. Ask about your information, correction of records, access concerns or deletion requests.</p>
  </article></main>;
}
