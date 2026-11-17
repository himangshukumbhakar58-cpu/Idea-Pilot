import { createContext, useContext, useState } from 'react';
import { DEMO_ID, emptyProfile, normaliseSavedIds } from '../data/demo';
import { readStored, writeStored } from '../lib/storage';

const AppContext = createContext(null);
const storedArray = (key) => { const value = readStored(key, []); return Array.isArray(value) ? value : []; };
export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => ({ ...emptyProfile, ...readStored('profile', {}) }));
  const [demoLoaded, setDemoLoaded] = useState(() => readStored('demoLoaded', false) === true);
  const [history, setHistory] = useState(() => storedArray('history').filter(item => item && item.id === DEMO_ID && typeof item.date === 'string'));
  const [savedIds, setSavedIds] = useState(() => normaliseSavedIds(storedArray('savedIds')));
  const [toast, setToast] = useState(null);
  const storedSettings = readStored('settings', {});
  const [settings, setSettings] = useState({ compact: false, reducedMotion: false, ...storedSettings, theme: storedSettings.theme === 'light' ? 'light' : 'dark' });
  function persist(key, value) {
    const saved = writeStored(key, value);
    if (!saved) setToast({ text: 'Browser storage is unavailable. Changes will last for this session only.', type: 'warning' });
    return saved;
  }
  function saveProfile(value) {
    const safe = Object.fromEntries(Object.keys(emptyProfile).map(key => [key, String(value[key] || '').trim()]));
    setProfile(safe);
    const saved = persist('profile', safe);
    if (saved) setToast({ text: 'Creator profile saved on this device.', type: 'success' });
  }
  function loadDemo() {
    setDemoLoaded(true); persist('demoLoaded', true); persist('demoSession', true);
    if (!history.some(item => item.id === DEMO_ID)) {
      const next = [{ id: DEMO_ID, topic: 'Practical AI for college students', platform: 'YouTube', date: new Date().toISOString(), count: 5, status: 'Demo preview' }, ...history];
      setHistory(next); persist('history', next);
    }
  }
  function toggleOpportunity(id) {
    if (!normaliseSavedIds([id]).length) return;
    const removing = savedIds.includes(id);
    const next = removing ? savedIds.filter(value => value !== id) : [...savedIds, id];
    setSavedIds(next);
    if (persist('savedIds', next)) setToast({ text: removing ? 'Opportunity removed from your local strategy.' : 'Opportunity added to your local strategy.', type: 'success' });
  }
  function updateSettings(next) { setSettings(next); persist('settings', next); }
  function enterDemo() { persist('demoSession', true); }
  function logout() { persist('demoSession', false); setToast({ text: 'Demo session ended. Your local profile and saved ideas are kept.', type: 'success' }); }
  return <AppContext.Provider value={{ profile, saveProfile, demoLoaded, loadDemo, history, savedIds, toggleOpportunity, toast, setToast, settings, updateSettings, enterDemo, logout }}>{children}</AppContext.Provider>;
}
export const useApp = () => useContext(AppContext);
