import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, X, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { api } from './lib/api';
export function useLoad(path) {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    api(path, { signal: controller.signal }).then(setData).catch(e => { if (e.name !== 'AbortError') setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading, refresh: () => setVersion(v => v + 1), setData };
}
export function Button({ children, variant = 'primary', busy, className = '', ...props }) {
  return <button className={'button ' + variant + ' ' + className} {...props} disabled={props.disabled || busy}>
    {busy && <Loader2 size={17} className="spin" aria-hidden="true" />}{children}
  </button>;
}
export function Field({ label, hint, children, ...props }) {
  const generatedId = useId(), fieldId = props.id || generatedId;
  const accessibility = { id: fieldId, 'aria-describedby': hint ? fieldId + '-hint' : undefined };
  return <div className="field"><label htmlFor={fieldId}>{label}</label>{children ? cloneElement(children, accessibility) : <input {...props} {...accessibility} />}{hint && <small id={fieldId + '-hint'}>{hint}</small>}</div>;
}
export function PageHeading({ eyebrow, title, description, action }) {
  return <header className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action}</header>;
}
export function Empty({ icon: Icon = BookOpen, title, children, action }) {
  return <div className="empty"><span className="empty-icon"><Icon size={25} /></span><h3>{title}</h3><p>{children}</p>{action}</div>;
}
export function Notice({ children, kind = 'error' }) {
  return children ? <div className={'notice ' + kind} role={kind === 'error' ? 'alert' : 'status'}><AlertCircle size={18} /><span>{children}</span></div> : null;
}
export function Loading() { return <div className="loading" role="status"><Loader2 className="spin" size={23} /><span>Loading your workspace…</span></div>; }
export function LoadState({ state, children }) {
  if (state.loading) return <Loading />;
  if (state.error) return <div><Notice>{state.error}</Notice><Button variant="secondary" onClick={state.refresh}>Try again</Button></div>;
  return children;
}
export function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const panel = ref.current;
    panel.querySelector('button,input,select,textarea')?.focus();
    const keydown = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const nodes = [...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,a[href],[tabindex="0"]')];
        const first = nodes[0], last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    panel.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = old; panel.removeEventListener('keydown', keydown); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><X /></button></header>{children}
    </section>
  </div>;
}
export function TextLink({ children, onClick }) { return <button className="text-link" onClick={onClick}>{children}<ArrowRight size={15} /></button>; }
export function Score({ value }) { return <span className={'score ' + (value === null ? '' : value >= 70 ? 'positive' : value >= 50 ? 'moderate' : 'attention')}>{value === null ? '—' : value + '%'}</span>; }
