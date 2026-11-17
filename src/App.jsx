import { Component, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Atmosphere } from './components/Atmosphere';
import { DashboardLayout } from './components/Layout';
import { Button, EmptyState, ErrorState, Toast } from './components/ui';
import { useApp } from './context/AppContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Research from './pages/Research';
import Results from './pages/Results';
import Strategy from './pages/Strategy';
import History from './pages/History';
import Profile from './pages/Profile';

class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? <ErrorState onRetry={() => window.location.reload()} /> : this.props.children; }
}
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const names = { '/': 'Know What to Create Next.', '/login': 'Sign In', '/signup': 'Create Account', '/onboarding': 'Creator Onboarding', '/dashboard': 'Overview', '/research': 'New Research', '/results': 'Research Results', '/strategy': '7-Day Strategy', '/history': 'Research History', '/profile': 'Creator Profile' };
    document.title = `IdeaPilot — ${names[pathname] || 'Page Not Found'}`;
  }, [pathname]);
  return null;
}
export default function App() {
  const { settings } = useApp(); const { pathname } = useLocation();
  const marketing = ['/', '/login', '/signup', '/onboarding'].includes(pathname);
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.colorScheme = settings.theme;
  }, [settings.theme]);
  return <ErrorBoundary><div className="app-root" data-reduced-motion={settings.reducedMotion}><a className="skip-link" href="#main-content">Skip to content</a><Atmosphere subtle={!marketing} reducedMotion={settings.reducedMotion} /><RouteEffects /><Routes><Route path="/" element={<Landing />} /><Route path="/login" element={<Auth key="login" />} /><Route path="/signup" element={<Auth key="signup" signup />} /><Route path="/onboarding" element={<Onboarding />} /><Route element={<DashboardLayout />}><Route path="/dashboard" element={<div id="main-content"><Dashboard /></div>} /><Route path="/research" element={<div id="main-content"><Research /></div>} /><Route path="/results" element={<div id="main-content"><Results /></div>} /><Route path="/strategy" element={<div id="main-content"><Strategy /></div>} /><Route path="/history" element={<div id="main-content"><History /></div>} /><Route path="/profile" element={<div id="main-content"><Profile /></div>} /></Route><Route path="*" element={<main id="main-content" className="not-found"><EmptyState title="A little off course." description="This page doesn't exist. Head back to your workspace or start at home."><Button to="/">Back to home</Button><Button to="/dashboard" variant="secondary">Open workspace</Button></EmptyState></main>} /></Routes><Toast /></div></ErrorBoundary>;
}
