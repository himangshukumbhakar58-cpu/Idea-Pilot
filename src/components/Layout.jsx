import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronRight, Compass, FlaskConical, History, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Brand, Button, DemoBadge, Modal } from './ui';
import LiquidNavbar from './LiquidNavbar';
import ThemeRocker from './ThemeRocker';
import InteractiveHoverButton from './ui/InteractiveHoverButton';

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/research', label: 'New Research', icon: Compass },
  { to: '/results', label: 'Opportunities', icon: Sparkles },
  { to: '/strategy', label: 'Strategy', icon: CalendarDays },
  { to: '/history', label: 'Research History', icon: History },
  { to: '/profile', label: 'Creator Profile', icon: UserRound },
];
export function Navbar() {
  const [open, setOpen] = useState(false);
  const items = [{ label: 'Product', id: 'product' }, { label: 'How It Works', id: 'how-it-works' }, { label: 'AI Agents', id: 'agents' }, { label: 'Features', id: 'features' }];
  return <header className="landing-nav"><div className="nav-inner"><Brand /><LiquidNavbar items={items} open={open} onNavigate={() => setOpen(false)}><InteractiveHoverButton to="/onboarding" className="mobile-only" /></LiquidNavbar><div className="nav-actions"><ThemeRocker /><NavLink to="/login" className="signin-link">Sign In</NavLink><InteractiveHoverButton to="/onboarding" /><button className="icon-button mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={21} /> : <Menu size={21} />}</button></div></div></header>;
}
export function DashboardLayout() {
  const [open, setOpen] = useState(false); const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const sidebarRef = useRef(null); const menuTriggerRef = useRef(null);
  const { profile, demoLoaded, settings, updateSettings, logout } = useApp(); const location = useLocation(); const navigate = useNavigate();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = event => { setMobile(event.matches); setOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!mobile || !open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...sidebarRef.current.querySelectorAll('a[href],button,input')].filter(element => !element.disabled && element.getClientRects().length);
    focusable()[0]?.focus();
    const trap = event => {
      if (event.key !== 'Tab') return;
      const elements = focusable(), first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', trap);
    return () => { document.body.style.overflow = before; document.removeEventListener('keydown', trap); menuTriggerRef.current?.focus(); };
  }, [mobile, open]);
  useEffect(() => { if (!open) return; const close = event => { if (event.key === 'Escape') setOpen(false); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [open]);
  const current = navigation.find(item => item.to === location.pathname)?.label || 'Workspace';
  return <div className={`dashboard-shell ${settings.compact ? 'is-compact' : ''}`}>
    {open && <button className="sidebar-scrim" onClick={() => setOpen(false)} aria-label="Close navigation" />}
    <aside ref={sidebarRef} inert={mobile && !open ? "" : undefined} aria-hidden={mobile && !open ? true : undefined} className={`sidebar ${open ? 'is-open' : ''}`} aria-label="Workspace navigation"><div className="sidebar-brand"><Brand /><button className="icon-button mobile-only" aria-label="Close navigation" onClick={() => setOpen(false)}><X size={19} /></button></div><div className="workspace-switch"><span className="workspace-avatar">{(profile.name || 'C').slice(0,1).toUpperCase()}</span><div><strong>Creator workspace</strong><small>Personal · frontend demo</small></div></div><span className="sidebar-label">WORKSPACE</span><nav>{navigation.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} className={({isActive}) => `sidebar-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span>{to === '/results' && <span className="nav-count">{demoLoaded ? 5 : 0}</span>}</NavLink>)}</nav><div className="sidebar-note"><FlaskConical size={19} /><strong>Good ideas start with a signal.</strong><p>Explore the product with an honest, local demo.</p><Button to="/research" variant="secondary" icon={ArrowRight}>Find your next idea</Button></div><div className="sidebar-bottom"><button className="sidebar-link" onClick={() => { setOpen(false); setSettingsOpen(true); }}><Settings size={18} /><span>Settings</span></button><button className="sidebar-link" onClick={() => { logout(); navigate('/login'); }}><LogOut size={18} /><span>Logout</span></button><div className="sidebar-person"><span className="workspace-avatar">{(profile.name || 'C').slice(0,1).toUpperCase()}</span><div><strong>{profile.name || 'Creator'}</strong><small>Local demo profile</small></div><ShieldCheck size={16} /></div></div></aside>
    <div className="workspace-main"><header className="workspace-bar"><div className="breadcrumb"><button className="icon-button mobile-menu" ref={menuTriggerRef} aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={20} /></button><span>Workspace</span><ChevronRight size={12} /><strong>{current}</strong></div><div className="workspace-tools"><ThemeRocker /><span className="connection-state"><i />Backend disconnected</span><DemoBadge>DEMO MODE</DemoBadge></div></header><div className="workspace-content"><Outlet /></div><footer className="workspace-footer"><span><span className="tiny-mark">↗</span> Make something worth creating.</span><span>IdeaPilot · Frontend preview</span></footer></div>
    {settingsOpen && <Modal title="Workspace settings" onClose={() => setSettingsOpen(false)}><p className="muted">Preferences are saved only in this browser.</p><label className="setting-row"><div><strong>Compact workspace</strong><span>Use tighter spacing on desktop.</span></div><input type="checkbox" checked={settings.compact} onChange={event => updateSettings({ ...settings, compact: event.target.checked })} /></label><label className="setting-row"><div><strong>Reduce decorative motion</strong><span>Keep the background still.</span></div><input type="checkbox" checked={settings.reducedMotion} onChange={event => updateSettings({ ...settings, reducedMotion: event.target.checked })} /></label><Button onClick={() => setSettingsOpen(false)}>Done</Button></Modal>}
  </div>;
}
