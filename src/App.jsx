import { Component, lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, ClipboardCheck, MessageCircle, Users, Settings as SettingsIcon, ShieldCheck, LogOut, ArrowUpRight, X, BookOpen, Menu } from 'lucide-react';
import { api, setCsrf } from './lib/api';
import { Button, Loading, Notice, PageHeading } from './components';
import Auth from './Auth';
import './styles.css';
const Dashboard = lazy(() => import('./pages/Learning').then(m => ({ default: m.Dashboard })));
const Practice = lazy(() => import('./pages/Learning').then(m => ({ default: m.Practice })));
const Attempt = lazy(() => import('./pages/Learning').then(m => ({ default: m.Attempt })));
const Tutor = lazy(() => import('./pages/Tutor'));
const Classes = lazy(() => import('./pages/Teaching').then(m => ({ default: m.Classes })));
const AssessmentEditor = lazy(() => import('./pages/Teaching').then(m => ({ default: m.AssessmentEditor })));
const Memo = lazy(() => import('./pages/Teaching').then(m => ({ default: m.Memo })));
const Settings = lazy(() => import('./pages/Account').then(m => ({ default: m.Settings })));
const Administration = lazy(() => import('./pages/Account').then(m => ({ default: m.Administration })));
const MfaSetup = lazy(() => import('./pages/Account').then(m => ({ default: m.MfaSetup })));
const Privacy = lazy(() => import('./pages/Account').then(m => ({ default: m.Privacy })));
class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <main className="fatal"><h1>Let’s get you back on track.</h1><p>This page could not load. Refresh to get the latest version.</p><Button onClick={() => window.location.reload()}>Reload page</Button></main> : this.props.children; }
}
function Platform() {
  const [location, setLocation] = useState({ path: window.location.pathname, search: window.location.search });
  const [linkToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [session, setSession] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [toast, setToast] = useState(null), [menu, setMenu] = useState(false);
  const navigate = useCallback(url => {
    window.history.pushState({}, '', url);
    setLocation({ path: window.location.pathname, search: window.location.search }); setMenu(false); window.scrollTo(0, 0);
  }, []);
  const reload = useCallback(async () => {
    setError('');
    try { const result = await api('/auth/session'); setSession(result); setCsrf(result.csrf); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (linkToken) window.history.replaceState({}, '', window.location.pathname + window.location.search);
    reload();
    const pop = () => { setLocation({ path: window.location.pathname, search: window.location.search }); setMenu(false); };
    window.addEventListener('popstate', pop); window.addEventListener('session-expired', reload);
    return () => { window.removeEventListener('popstate', pop); window.removeEventListener('session-expired', reload); };
  }, [reload]);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(null), 6500); return () => clearTimeout(timeout); }, [toast]);
  const notify = useCallback((message, kind = 'success') => setToast({ message, kind }), []);
  async function logout() { try { await api('/auth/logout', { method: 'POST' }); setCsrf(''); setSession(s => ({ ...s, user: null })); navigate('/login'); } catch (e) { notify(e.message, 'error'); } }
  async function signedIn() { await reload(); navigate('/'); }
  const path = location.path, user = session?.user;
  if (loading) return <Loading />;
  if (error) return <main className="fatal"><h1>We couldn’t reach your workspace.</h1><Notice>{error}</Notice><Button onClick={reload}>Try again</Button></main>;
  if (path === '/privacy') return <Suspense fallback={<Loading />}><Privacy contact={session?.privacyContact} navigate={navigate} /></Suspense>;
  if (!user) return <Auth key={path} path={path} token={linkToken} onSuccess={signedIn} navigate={navigate} config={session} />;
  const isStaff = user.role !== 'learner';
  const nav = [
    { path: '/', label: 'Overview', icon: LayoutDashboard },
    { path: '/practice', label: 'Practice', icon: ClipboardCheck },
    { path: '/tutor', label: 'Study tutor', icon: MessageCircle },
    { path: '/classes', label: isStaff ? 'My classes' : 'My classroom', icon: Users },
    { path: '/settings', label: 'Settings', icon: SettingsIcon },
    ...(user.role === 'admin' ? [{ path: '/admin', label: 'Administration', icon: ShieldCheck }] : []),
  ];
  const active = item => item.path === '/' ? path === '/' : path.startsWith(item.path);
  let page = <Dashboard user={user} navigate={navigate} notify={notify} />;
  if (path === '/practice') page = <Practice navigate={navigate} search={location.search} />;
  else if (/^\/practice\/[a-f0-9-]+$/.test(path)) page = <Attempt key={path} attemptId={path.split('/').at(-1)} navigate={navigate} notify={notify} />;
  else if (path === '/tutor') page = <Tutor config={session} notify={notify} />;
  else if (path === '/classes') page = <Classes user={user} navigate={navigate} notify={notify} search={location.search} />;
  else if (path === '/settings') page = <Settings user={user} reload={reload} notify={notify} />;
  else if (path === '/admin' && user.role === 'admin') page = <Administration notify={notify} />;
  else if (path === '/teacher/assessment/new' && isStaff) page = <AssessmentEditor user={user} navigate={navigate} notify={notify} search={location.search} />;
  else if (/^\/teacher\/memo\/[a-f0-9-]+$/.test(path) && isStaff) page = <Memo assessmentId={path.split('/').at(-1)} />;
  else if (!['/','/login','/invite','/reset'].includes(path)) page = <><PageHeading title="This page isn’t available." description="Choose a page from your workspace navigation." /><Button onClick={() => navigate('/')}>Back to overview</Button></>;
  if (session.mfaRequired) page = <div className="narrow"><PageHeading eyebrow="PROTECT YOUR CLASSROOM" title="One step before you begin." description="Set up your authenticator to keep learner records protected." /><MfaSetup user={user} reload={reload} notify={notify} required /></div>;
  return <div className="app-shell"><a href="#main-content" className="skip-link">Skip to content</a>
    <aside className={'sidebar ' + (menu ? 'open' : '')}><button className="brand" onClick={() => navigate('/')} aria-label="Matric Mastery overview"><span className="brand-mark">m<span>.</span></span><span>matric<span>mastery</span></span></button><div className="workspace-label"><span className="status-dot" />{isStaff ? 'TEACHER WORKSPACE' : 'LEARNER WORKSPACE'}</div>
      <nav aria-label="Main navigation">{nav.map(item => <button key={item.path} className={active(item) ? 'active' : ''} onClick={() => navigate(item.path)} aria-current={active(item) ? 'page' : undefined}><item.icon size={19} />{item.label}</button>)}</nav>
      <div className="sidebar-note"><BookOpen size={22} /><strong>A little better, every day.</strong><p>Progress grows through practice, questions and showing up.</p></div>
      <footer><button onClick={() => navigate('/privacy')} className="text-link">Privacy & your data<ArrowUpRight size={14} /></button><p>JM CYBER SPACE</p></footer>
    </aside>
    {menu && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setMenu(false)} />}
    <div className="workspace"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMenu(v => !v)} aria-label="Toggle navigation">{menu ? <X /> : <Menu />}</button><div className="topbar-breadcrumb">Matric Mastery <span>/</span> {nav.find(active)?.label || 'Workspace'}</div><div className="account-chip"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.role === 'learner' ? 'Grade ' + user.grade + ' learner' : user.role === 'admin' ? 'Administrator' : 'Teacher'}</small></div><button className="icon-button" onClick={logout} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button></div></header>
      <main id="main-content" className="main-content"><Suspense fallback={<Loading />}>{page}</Suspense></main><footer className="workspace-footer"><span>Matric Mastery</span><span>Made for your next chapter.</span></footer>
    </div><nav className="mobile-nav" aria-label="Quick navigation">{nav.slice(0, 4).map(item => <button key={item.path} className={active(item) ? 'active' : ''} aria-current={active(item) ? 'page' : undefined} onClick={() => navigate(item.path)}><item.icon size={20} /><span>{item.label}</span></button>)}</nav>
    {toast && <div className={'toast ' + toast.kind} role={toast.kind === 'error' ? 'alert' : 'status'}><span>{toast.message}</span><button className="icon-button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={17} /></button></div>}
  </div>;
}
export default function App() { return <ErrorBoundary><Platform /></ErrorBoundary>; }
