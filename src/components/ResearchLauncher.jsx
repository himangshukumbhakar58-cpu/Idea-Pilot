import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUp, Compass, Instagram, Layers3, Sparkles, Youtube } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { createResearchDraft } from '../lib/research';
import { readStored, writeStored } from '../lib/storage';

const examples = [
  { label: 'Student tech', topic: 'Which AI tools would actually help college students?', platform: 'YouTube' },
  { label: 'Travel reels', topic: 'Find a fresh angle for budget travel reels in Kolkata.', platform: 'Instagram / Reels' },
  { label: 'Study habits', topic: 'What do students struggle with when building a study routine?', platform: 'YouTube' },
];

// Decorative example text only: this never indicates agent activity.
function useTypingHint(active, reducedMotion) {
  const [hint, setHint] = useState('');
  useEffect(() => {
    if (!active || reducedMotion) return;
    let timer, example = 0, length = 0, deleting = false;
    function tick() {
      const text = examples[example].topic;
      length = deleting ? Math.max(0, length - 2) : length + 1;
      setHint(text.slice(0, length));
      let wait = deleting ? 22 : 38;
      if (!deleting && length >= text.length) { deleting = true; wait = 2100; }
      else if (deleting && length === 0) { deleting = false; example = (example + 1) % examples.length; wait = 400; }
      timer = window.setTimeout(tick, wait);
    }
    setHint(''); timer = window.setTimeout(tick, 850);
    return () => window.clearTimeout(timer);
  }, [active, reducedMotion]);
  return reducedMotion ? examples[0].topic : hint;
}

export default function ResearchLauncher() {
  const { profile, settings, loadDemo, setToast } = useApp();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const [topic, setTopic] = useState(() => createResearchDraft(profile, readStored('researchDraft', {})).topic);
  const [platform, setPlatform] = useState(() => createResearchDraft(profile, readStored('researchDraft', {})).platform);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState('');
  const [systemReduced, setSystemReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = event => setSystemReduced(event.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const reducedMotion = settings.reducedMotion || systemReduced;
  const hint = useTypingHint(!focused && !topic, reducedMotion);

  function submit(event) {
    event.preventDefault();
    if (!topic.trim()) { setError('Add a topic or question to continue.'); textareaRef.current?.focus(); return; }
    const draft = { ...createResearchDraft(profile, readStored('researchDraft', {})), topic: topic.trim(), platform };
    const saved = writeStored('researchDraft', draft);
    if (!saved) setToast({ text: 'Your brief is carried to the research form. Browser storage is unavailable.', type: 'warning' });
    navigate('/research', saved ? undefined : { state: { researchDraft: draft } });
  }
  function chooseExample(example) {
    setTopic(example.topic); setPlatform(example.platform); setError(''); textareaRef.current?.focus();
  }
  function sheen(event) {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--launcher-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--launcher-y', `${event.clientY - rect.top}px`);
  }

  return <div className="research-launcher">
    <form className="launcher-card" aria-label="Start content research" onSubmit={submit} onPointerMove={sheen}>
      <div className="launcher-card-top"><span><Compass size={15} />YOUR NEXT IDEA STARTS HERE</span><span className="launcher-state"><i />Research preview</span></div>
      <div className="launcher-input-wrap">
        <label className="sr-only" htmlFor="hero-research-topic">What would you like to research?</label>
        <textarea id="hero-research-topic" ref={textareaRef} rows={2} maxLength={1000} value={topic} placeholder={focused ? 'Describe your topic, audience question or content challenge…' : ''} aria-describedby="hero-research-help hero-research-status" onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onChange={event => { setTopic(event.target.value); setError(''); }} onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submit(event);
        }} />
        {!topic && !focused && <span className="launcher-placeholder" aria-hidden="true">{hint}<i className="typing-caret" /></span>}
      </div>
      <div className="launcher-toolbar">
        <fieldset className="launcher-platforms"><legend className="sr-only">Research platform</legend>{[[Youtube, 'YouTube'], [Instagram, 'Instagram / Reels']].map(([Icon, label]) => <label className={platform === label ? 'selected' : ''} key={label}><input type="radio" name="hero-platform" value={label} checked={platform === label} onChange={() => setPlatform(label)} /><Icon size={15} /><span>{label}</span></label>)}</fieldset>
        <div className="launcher-send-group"><span><Layers3 size={14} />4 research agents</span><button className="launcher-send" type="submit" aria-label="Continue to research" title="Continue to research" disabled={!topic.trim()}><ArrowUp size={22} /></button></div>
      </div>
      {error && <p className="launcher-error" role="alert">{error}</p>}
    </form>
    <div className="launcher-examples"><span><Sparkles size={12} />Try an example</span>{examples.map(example => <button type="button" key={example.label} onClick={() => chooseExample(example)}>{example.label}<ArrowRight size={11} /></button>)}</div>
    <div className="launcher-help"><span id="hero-research-help">Enter to continue · Shift + Enter for a new line</span><button type="button" onClick={() => { loadDemo(); navigate('/results'); }}>Explore demo results<ArrowRight size={12} /></button></div>
    <p id="hero-research-status" className="launcher-disclosure">Continue to review your brief. Live AI research is not connected yet.</p>
  </div>;
}
