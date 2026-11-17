import { useState } from 'react';
import { Check, Save } from 'lucide-react';
import { goals, platforms } from '../data/demo';
import { validateReferences } from '../lib/storage';
import { Button, Input, Notice, Select, TextArea } from './ui';

export function ProfileReferences({ value, onChange }) {
  const props = key => ({ value: value[key], onChange: event => onChange({ ...value, [key]: event.target.value }) });
  return <><Input label="Channel URL" placeholder="https://www.youtube.com/@yourchannel" type="url" {...props('channelUrl')} /><Input label="Existing content link" placeholder="https://…" type="url" {...props('contentUrl')} /><TextArea label="Competitor references" placeholder="One public channel or content URL per line" hint="Publicly available content only. No private analytics are accessed." {...props('competitors')} /></>;
}
export default function CreatorProfileForm({ initialValue, onSave }) {
  const [value, setValue] = useState(initialValue); const [error, setError] = useState('');
  const props = key => ({ value: value[key], onChange: event => setValue({ ...value, [key]: event.target.value }) });
  function submit(event) {
    event.preventDefault(); const problem = validateReferences(value);
    if (!value.name.trim() || !value.niche.trim() || !value.audience.trim() || !value.language.trim()) { setError('Please complete your name, niche, audience and language.'); return; }
    if (problem) { setError(problem); return; }
    setError(''); onSave(value);
  }
  return <form onSubmit={submit} className="profile-form"><section className="form-panel glass"><div className="form-section-heading"><span className="step-index">01</span><div><h2>The creator behind the content</h2><p>Your context gives every recommendation a direction.</p></div></div><div className="form-grid"><Input label="Creator name" required maxLength={80} autoComplete="name" placeholder="What should we call you?" {...props('name')} /><Select label="Platform" options={platforms} {...props('platform')} /><Input label="Content niche" required maxLength={100} placeholder="e.g. Technology" {...props('niche')} /><Input label="Preferred language" required maxLength={60} placeholder="e.g. English, Bengali, Hindi" {...props('language')} /><div className="field-full"><TextArea label="Target audience" required maxLength={500} placeholder="Who are you creating for?" {...props('audience')} /></div><div className="field-full"><Select label="Creator goal" options={goals} {...props('goal')} /></div></div></section><section className="form-panel glass"><div className="form-section-heading"><span className="step-index">02</span><div><h2>A little more context</h2><p>Optional references for future research integrations.</p></div></div><div className="reference-fields"><ProfileReferences value={value} onChange={setValue} /></div></section>{error && <Notice type="error" title={error} />}<div className="form-save"><small><Check size={14} />Saved only on this device. No account required.</small><Button type="submit" icon={Save}>Save Changes</Button></div></form>;
}
