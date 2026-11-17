import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, CircleAlert, Compass, LoaderCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Button({ children, to, variant = 'primary', className = '', icon: Icon, ...props }) {
  const cls = `button button-${variant} ${className}`;
  return to ? <Link className={cls} to={to} {...props}>{children}{Icon && <Icon size={16} />}</Link> : <button className={cls} type="button" {...props}>{children}{Icon && <Icon size={16} />}</button>;
}
export function Brand({ small = false }) {
  return <Link to="/" className={`brand ${small ? 'brand-small' : ''}`} aria-label="IdeaPilot home"><span className="brand-symbol"><svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m7 25 7-20 13 11L7 25ZM14 5l2 13 11-2M16 18l-9 7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg></span><span>IdeaPilot<span className="brand-dot">.</span></span></Link>;
}
export function DemoBadge({ children = 'DEMO DATA' }) { return <span className="demo-badge"><span />{children}</span>; }
export function Pill({ children, tone = '' }) { return <span className={`pill ${tone}`}>{children}</span>; }
export function Field({ label, error, hint, children, id }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && <small>{hint}</small>}{error && <small className="error-text" role="alert">{error}</small>}</div>;
}
export function Input({ label, hint, error, id: provided, className = '', ...props }) {
  const generated = useId(); const id = provided || generated;
  return <Field label={label} hint={hint} error={error} id={id}><input id={id} className={`input ${className}`} aria-invalid={!!error} {...props} /></Field>;
}
export function Select({ label, options, id: provided, ...props }) {
  const generated = useId(); const id = provided || generated;
  return <Field label={label} id={id}><select id={id} className="input" {...props}>{options.map(option => <option key={typeof option === 'string' ? option : option.value} value={typeof option === 'string' ? option : option.value}>{typeof option === 'string' ? option : option.label}</option>)}</select></Field>;
}
export function TextArea({ label, hint, id: provided, ...props }) {
  const generated = useId(); const id = provided || generated;
  return <Field label={label} hint={hint} id={id}><textarea id={id} className="input" rows={3} {...props} /></Field>;
}
export function Notice({ children, title, type = 'info' }) {
  return <div className={`notice notice-${type}`} role={type === 'error' ? 'alert' : 'note'}><CircleAlert size={17} /><div>{title && <strong>{title}</strong>}{children && <p>{children}</p>}</div></div>;
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null); const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...ref.current.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(el => !el.disabled);
    focusable()[0]?.focus();
    function handleKey(event) {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const elements = focusable(); const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = priorOverflow; document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={ref} className={`modal glass ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}><header><div><span className="eyebrow">IDEAPILOT / DETAILS</span><h2 id={titleId}>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></header>{children}</section></div>;
}
export function EmptyState({ title, description, children }) { return <div className="empty-state glass"><span className="empty-icon"><Compass size={30} /></span><h2>{title}</h2><p>{description}</p><div className="button-row">{children}</div></div>; }
export function LoadingState({ label = 'Loading page…' }) { return <div className="empty-state" role="status"><LoaderCircle className="spin" /><p>{label}</p></div>; }
export function ErrorState({ onRetry }) { return <EmptyState title="Something went wrong" description="Please try again. Your saved profile stays on this device."><Button onClick={onRetry}>Try again</Button></EmptyState>; }
export function PageHeader({ eyebrow, title, description, children }) { return <header className="page-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children && <div className="page-actions">{children}</div>}</header>; }
export function SectionHeading({ eyebrow, title, description, children }) { return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{children}</div>; }
export function Toast() {
  const { toast, setToast } = useApp();
  if (!toast) return null;
  return <div className={`toast ${toast.type}`} role="status"><Check size={17} /><span>{toast.text}</span><button className="icon-button" onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={16} /></button></div>;
}
export function TextLink({ to, children }) { return <Link className="text-link" to={to}>{children}<ArrowRight size={14} /></Link>; }
