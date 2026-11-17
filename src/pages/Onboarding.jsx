import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Compass, Instagram, Sparkles, Youtube } from 'lucide-react';
import { Brand, Button, DemoBadge, Input, Notice, TextArea } from '../components/ui';
import { ProfileReferences } from '../components/CreatorProfileForm';
import { useApp } from '../context/AppContext';
import { goals } from '../data/demo';
import { validateReferences } from '../lib/storage';

const steps = [
  { label: 'Your platform', title: 'Where do you create?', description: 'Choose your primary home. Your strategy starts with the platform.' },
  { label: 'Your niche', title: 'What is your corner of the internet?', description: 'A focused niche helps uncover more relevant opportunities.' },
  { label: 'Your audience', title: 'Who are you creating for?', description: 'Think about their interests, experience and everyday challenges.' },
  { label: 'Your language', title: 'What language connects you?', description: 'Choose the language you use with your audience.' },
  { label: 'Your goal', title: 'What would you like to achieve?', description: 'One clear goal gives your content a useful direction.' },
  { label: 'Your references', title: 'Add a little more context.', description: 'Share public links if you have them. This step is completely optional.' },
];
export default function Onboarding() {
  const { profile, saveProfile, enterDemo } = useApp(); const navigate = useNavigate();
  const [value, setValue] = useState(profile); const [step, setStep] = useState(0); const [error,setError] = useState('');
  const props = key => ({ value: value[key], onChange: event => setValue({ ...value, [key]: event.target.value }) });
  function submit(event) {
    event.preventDefault(); setError('');
    if (step === 0 && !value.name.trim()) { setError('Please enter your creator name.'); return; }
    const key = { 1: 'niche', 2: 'audience', 3: 'language' }[step];
    if (key && !value[key].trim()) { setError('Please complete this field to continue.'); return; }
    if (step === 5) {
      const problem = validateReferences(value); if (problem) { setError(problem); return; }
      saveProfile(value); enterDemo(); navigate('/dashboard');
    } else setStep(step + 1);
  }
  return <div className="onboarding-page"><header className="simple-header"><Brand /><DemoBadge>LOCAL DEMO SETUP</DemoBadge><Link to="/" className="muted">Back to home<ArrowLeft size={14} /></Link></header><main className="onboarding-layout" id="main-content"><aside className="onboarding-aside"><span className="eyebrow">A LITTLE ABOUT YOU</span><h1>Let's Build Your<br /><span className="ice-text">Creator Profile</span></h1><p>Good research starts with understanding the person behind the content.</p><ol className="onboarding-steps">{steps.map((item,i) => <li className={i === step ? 'current' : i < step ? 'done' : ''} key={item.label}><button disabled={i > step} onClick={() => { setStep(i); setError(''); }} aria-current={i === step ? 'step' : undefined}><span>{i < step ? <Check size={13} /> : `0${i+1}`}</span>{item.label}</button></li>)}</ol><div className="onboarding-footnote"><Sparkles size={18} /><p>Your perspective.<br />Four agents. A clearer direction.</p></div></aside><section className="onboarding-card glass"><div className="onboarding-progress"><span>STEP 0{step+1} <span>/ 06</span></span><span>{steps[step].label}</span></div><div className="step-segments" aria-label={`Profile step ${step+1} of 6`}>{steps.map((_,i) => <span className={i <= step ? 'filled' : ''} key={i} />)}</div><form onSubmit={submit} key={step}><div className="onboarding-question"><span className="question-icon"><Compass size={23} /></span><h2>{steps[step].title}</h2><p>{steps[step].description}</p></div><div className="onboarding-fields">
    {step === 0 && <><Input label="Creator name" placeholder="Your name or creator name" required maxLength={80} autoComplete="name" {...props('name')} /><span className="field-label">Primary platform</span><div className="platform-options">{[[Youtube,'YouTube','Long form, Shorts & community'],[Instagram,'Instagram / Reels','Reels & audience conversations']].map(([Icon,label,description]) => <button className={`platform-option ${value.platform === label ? 'selected' : ''}`} type="button" aria-pressed={value.platform === label} key={label} onClick={() => setValue({ ...value, platform: label })}><Icon size={27} /><strong>{label}</strong><small>{description}</small>{value.platform === label && <Check className="option-check" size={14} />}</button>)}</div></>}
    {step === 1 && <><Input label="Content niche" placeholder="e.g. Technology for students" required maxLength={100} {...props('niche')} /><div className="choice-chips">{['Technology','Education','Gaming','Finance','Lifestyle','Travel'].map(niche => <button type="button" className={value.niche === niche ? 'selected' : ''} aria-pressed={value.niche === niche} onClick={() => setValue({ ...value, niche })} key={niche}>{niche}</button>)}</div></>}
    {step === 2 && <TextArea label="Target audience" placeholder="e.g. College students who want to use technology to study smarter on a limited budget." required maxLength={500} rows={5} hint="Be specific. Who are they, and what are they trying to do?" {...props('audience')} />}
    {step === 3 && <><Input label="Preferred language" placeholder="e.g. English" required maxLength={60} {...props('language')} /><div className="choice-chips">{['English','Bengali','Hindi','Hinglish'].map(language => <button type="button" aria-pressed={value.language === language} className={value.language === language ? 'selected' : ''} onClick={() => setValue({ ...value, language })} key={language}>{language}</button>)}</div></>}
    {step === 4 && <div className="goal-options">{goals.map(goal => <label key={goal} className={value.goal === goal ? 'selected' : ''}><input type="radio" name="goal" checked={value.goal === goal} onChange={() => setValue({ ...value, goal })} /><span>{goal}</span>{value.goal === goal && <Check size={16} />}</label>)}</div>}
    {step === 5 && <ProfileReferences value={value} onChange={setValue} />}
    </div>{error && <Notice title={error} type="error" />}<div className="onboarding-actions">{step > 0 ? <Button variant="ghost" onClick={() => { setStep(step-1); setError(''); }}><ArrowLeft size={15} />Back</Button> : <Link to="/" className="subtle-button"><ArrowLeft size={14} />Home</Link>}<Button type="submit" icon={step === 5 ? Check : ArrowRight}>{step === 5 ? 'Create My IdeaPilot Profile' : 'Continue'}</Button></div><p className="local-note">Your profile stays in this browser. This is not account creation.</p></form></section></main></div>;
}
