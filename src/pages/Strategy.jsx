import { useState } from 'react';
import { ArrowRight, Bookmark, CalendarDays, Download, Orbit, X } from 'lucide-react';
import { Button, DemoBadge, EmptyState, Notice, PageHeader } from '../components/ui';
import StrategyDayCard from '../components/StrategyDayCard';
import { useApp } from '../context/AppContext';
import { buildStrategy, opportunities } from '../data/demo';
import { readStored, writeStored } from '../lib/storage';

export default function Strategy() {
  const { demoLoaded, loadDemo, savedIds, toggleOpportunity, setToast } = useApp();
  // Day numbers alone cannot identify completed work after priorities change.
  const [completed, setCompleted] = useState(() => {
    const stored = readStored('completedStrategyItems', []);
    return Array.isArray(stored) ? stored.filter(id => typeof id === 'string') : [];
  });
  const plan = buildStrategy(savedIds);
  const saved = savedIds.map(id => opportunities.find(item => item.id === id)).filter(Boolean);
  const completedCount = plan.filter(day => completed.includes(day.id)).length;
  function toggle(id) {
    const next = completed.includes(id) ? completed.filter(value => value !== id) : [...completed, id];
    setCompleted(next);
    if (!writeStored('completedStrategyItems', next)) setToast({ text: 'Progress is kept for this session; browser storage is unavailable.', type: 'warning' });
  }
  function download() {
    const text = '# IdeaPilot - Your 7-Day Content Strategy\n\nDEMO DATA - illustrative editorial plan, not live research.\nPrepared as a StrategyArchitect preview.\nFixed student-technology sample, with YouTube and Instagram examples.\nSaved ideas are prioritised; all five sample ideas remain in the plan.\nNo publishing is scheduled or automated.\n\n' + plan.map(day => `## Day ${day.day}: ${day.label}\nTopic: ${day.topic}\nPlatform: ${day.platform}\nFormat: ${day.format}\nAngle: ${day.angle}\nStrategic objective: ${day.objective}\nSequence reasoning: ${day.reason}\nCompleted locally: ${completed.includes(day.id) ? 'Yes' : 'No'}\n`).join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'IdeaPilot_7_Day_Demo_Strategy.md';
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <PageHeader eyebrow="GIVE YOUR IDEAS A DIRECTION" title="Your 7-Day Content Strategy" description="One connected story. Seven deliberate steps.">{demoLoaded && <Button variant="secondary" onClick={download} icon={Download}>Export demo plan</Button>}</PageHeader>
    {!demoLoaded ? <EmptyState title="Build a week with purpose." description="Open the sample research to see how opportunities become a connected seven-day plan."><Button onClick={loadDemo} icon={ArrowRight}>View Demo Strategy</Button><Button to="/research" variant="secondary">New Research</Button></EmptyState> : <>
      <div className="strategy-intro glass"><span className="agent-icon tone-amber"><Orbit size={25} /></span><div><span className="eyebrow">YOUR STRATEGIST</span><h2>StrategyArchitect</h2><p>Built from TrendScout, AudienceInsight and CompetitorGap findings.</p><small>Previewing the synthesis workflow with illustrative research directions.</small></div><DemoBadge /></div>
      <Notice title="An editorial plan, ready for your judgement.">This is the fixed student-technology sample, with YouTube and Instagram examples. Saved ideas move earlier; all five sample ideas remain included. Objectives follow each topic. No posts are scheduled or published.</Notice>
      <section className="saved-priorities glass" aria-labelledby="saved-priorities-title">
        <div className="research-context-heading"><div><h2 id="saved-priorities-title"><Bookmark size={18} />Your saved priorities</h2><p>{saved.length ? 'Priority follows the order you saved ideas. Remove an idea here to return it to the sample order.' : 'Save an opportunity to move it earlier in the sample plan.'}</p></div><Button to="/results" variant="ghost" icon={ArrowRight}>Choose opportunities</Button></div>
        {saved.length > 0 && <ol className="saved-priority-list">{saved.map(item => <li key={item.id}><span>{item.topic}</span><button type="button" className="icon-button" aria-label={`Remove priority: ${item.topic}`} onClick={() => toggleOpportunity(item.id)}><X size={16} /></button></li>)}</ol>}
      </section>
      <div className="strategy-summary"><span><CalendarDays size={16} /><strong>7</strong> connected days</span><span><strong>{saved.length}</strong> saved priorities</span><span><strong>{completedCount}/7</strong> marked complete</span><Button to="/results" variant="ghost" icon={ArrowRight}>Review opportunities</Button></div>
      <p className="strategy-progress-note">Completion follows the specific topic and task on each day. Replacing that task does not carry over its completion mark.</p>
      <div className="strategy-timeline">{plan.map(day => <StrategyDayCard day={day} completed={completed.includes(day.id)} key={day.id} onToggle={() => toggle(day.id)} />)}</div>
      <div className="strategy-end"><span>THE LOOP CONTINUES</span><p>Let what you learn guide what you create next.</p><Button to="/research" variant="secondary" icon={ArrowRight}>Start the next research brief</Button></div>
    </>}
  </>;
}
