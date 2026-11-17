import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, FlaskConical, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { AgentFlow } from '../components/Agents';
import { ProfileReferences } from '../components/CreatorProfileForm';
import { Button, DemoBadge, Input, Notice, PageHeader, Select, TextArea } from '../components/ui';
import { useApp } from '../context/AppContext';
import { goals, platforms } from '../data/demo';
import { buildResearchRequest, createResearchDraft, researchObjectives } from '../lib/research';
import { readStored, validateReferences, writeStored } from '../lib/storage';
import { requestResearch } from '../services/api';

export default function Research() {
  const { profile, loadDemo, setToast } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState(() => createResearchDraft(profile, location.state?.researchDraft || readStored('researchDraft', {})));
  const [message, setMessage] = useState('');
  function updateValues(next) {
    setValues(next); setMessage('');
    if (!writeStored('researchDraft', next)) setToast({ text: 'This draft will last for this page only because browser storage is unavailable.', type: 'warning' });
  }
  const props = key => ({ value: values[key], onChange: event => updateValues({ ...values, [key]: event.target.value }) });
  function useCurrentProfile() {
    const saved = writeStored('researchDraft', createResearchDraft(profile, { topic: values.topic, objective: values.objective }));
    setValues(createResearchDraft(profile, { topic: values.topic, objective: values.objective })); setMessage('');
    setToast({ text: saved ? 'Creator context refreshed. Your topic and research objective are kept.' : 'Creator context refreshed for this page; browser storage is unavailable.', type: saved ? 'success' : 'warning' });
  }
  async function submit(event) {
    event.preventDefault();
    if (![values.niche, values.topic, values.audience, values.objective, values.language, values.goal].every(value => value.trim())) { setMessage('Please complete the research fields, language and creator goal.'); return; }
    const referenceError = validateReferences(values);
    if (referenceError) { setMessage(referenceError); return; }
    try { await requestResearch(buildResearchRequest(values, profile)); }
    catch (error) { setMessage(error.message || 'The research service is unavailable. Your local draft is kept.'); }
  }
  return <>
    <PageHeader eyebrow="START WITH A QUESTION" title="Discover Your Next Content Opportunity" description="Tell IdeaPilot what you want to explore. Our research agents will investigate trends, audience needs and competitor gaps." />
    <div className="research-layout">
      <form className="research-form glass" onSubmit={submit}>
        <div className="form-section-heading"><span className="feature-icon"><Search size={21} /></span><div><h2>What are you curious about?</h2><p>A little context makes a better starting point.</p></div></div>
        <div className="form-grid">
          <Select label="Platform" options={platforms} {...props('platform')} />
          <Input label="Niche" placeholder="e.g. Technology for students" required maxLength={120} {...props('niche')} />
          <div className="field-full"><TextArea label="Topic / Question" required maxLength={1000} rows={3} placeholder="e.g. Which AI workflows could help college students study more effectively?" {...props('topic')} /></div>
          <div className="field-full"><TextArea label="Target Audience" required maxLength={500} rows={2} placeholder="Who should find this useful?" {...props('audience')} /></div>
          <div className="field-full"><Select label="Research Objective" options={researchObjectives} {...props('objective')} /></div>
        </div>
        <section className="research-context" aria-labelledby="creator-context-title">
          <div className="research-context-heading"><div><h2 id="creator-context-title">Your creator context</h2><p>Review the profile details for this brief.</p></div><button type="button" className="subtle-button" onClick={useCurrentProfile}><RefreshCw size={14} />Use current creator profile</button></div>
          <div className="form-grid"><Input label="Preferred language" required maxLength={60} {...props('language')} /><Select label="Creator goal" options={goals} {...props('goal')} /></div>
          <details className="research-references"><summary>Optional channel and competitor references</summary><div className="reference-fields"><ProfileReferences value={values} onChange={updateValues} /></div></details>
        </section>
        <Notice title="Live AI research requires backend integration.">Your brief includes language, goal and public references. Submitting does not run agents or generate results.</Notice>
        {message && <div className="form-message" role="status">{message}</div>}
        <div className="research-submit"><Button type="submit" icon={ArrowRight}>Research Content Opportunities</Button><span><ShieldCheck size={13} />No API calls in this preview</span></div>
        <p className="research-draft-note">Your draft is kept in this browser as you edit. Opening the sample does not research this brief.</p>
      </form>
      <aside className="research-side glass">
        <span className="sample-icon"><FlaskConical size={25} /></span><DemoBadge>FRONTEND PREVIEW</DemoBadge><h2>Take a look around.</h2><p>Explore five illustrative content opportunities and a connected seven-day plan.</p>
        <div className="demo-context"><span>EXAMPLE RESEARCH BRIEF</span><strong>Practical AI for college students</strong><small>YouTube + short-form adaptations · English</small></div>
        <Button variant="secondary" onClick={() => { loadDemo(); navigate('/results'); }} icon={ArrowRight}>View Demo Research</Button><small>The sample uses its own niche, language and mixed platforms. It is independent of your profile and brief.</small>
      </aside>
    </div>
    <section className="workspace-section"><div className="section-heading"><div><span className="eyebrow">SPECIALISED BY DESIGN</span><h2>Research Team</h2><p>Demo Preview — AI Agents Not Connected Yet</p></div><DemoBadge>NO LIVE EXECUTION</DemoBadge></div><div className="team-panel glass"><AgentFlow /></div><p className="future-status-note">Future backend statuses: Pending · Running · Completed · Failed. All agents are currently disconnected.</p></section>
  </>;
}
