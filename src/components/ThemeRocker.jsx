import { Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function ThemeRocker({ className = '' }) {
  const { settings, updateSettings } = useApp();
  const light = settings.theme === 'light';

  return (
    <button
      type="button"
      className={`theme-rocker ${className}`}
      data-mode={light ? 'light' : 'dark'}
      aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
      aria-pressed={light}
      title={light ? 'Dark theme' : 'Light theme'}
      onClick={() => updateSettings({ ...settings, theme: light ? 'dark' : 'light' })}
    >
      <span className="theme-rocker-well" aria-hidden="true">
        <Sun className="theme-rocker-sun" size={13} />
        <Moon className="theme-rocker-moon" size={13} />
        <span className="theme-rocker-glow" />
        <span className="theme-rocker-key">
          {light ? <Sun size={13} /> : <Moon size={13} />}
        </span>
      </span>
    </button>
  );
}
