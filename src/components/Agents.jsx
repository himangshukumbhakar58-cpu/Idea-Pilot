import { ArrowDown, ArrowRight, CircleDashed, Layers3, Orbit, Radar, ScanSearch, UsersRound } from 'lucide-react';
import { agents } from '../data/demo';
import { DemoBadge } from './ui';
const icons = { Radar, UsersRound, ScanSearch, Orbit };
export function AgentStatusCard({ agent, compact = false }) {
  const Icon = icons[agent.icon];
  return <article className={`agent-card glass tone-${agent.color} ${compact ? 'agent-compact' : ''}`}><div className="agent-top"><span className="agent-icon"><Icon size={21} /></span><span className="agent-status"><CircleDashed size={11} /> Not connected</span></div><h3>{agent.name}</h3>{!compact && <span className="agent-role">{agent.role}</span>}<p>{compact ? agent.description : agent.activity}</p></article>;
}
export function AgentFlow({ compact = false, landing = false }) {
  return <div className={`agent-flow ${compact ? 'flow-compact' : ''} ${landing ? 'flow-landing' : ''}`}><div className="research-agents">{agents.slice(0, 3).map(agent => <AgentStatusCard key={agent.id} agent={agent} compact={compact} />)}</div><div className="flow-connector" aria-label="The three research agents feed their findings into StrategyArchitect"><span /><ArrowDown size={18} /><span /></div><div className="architect-wrap"><AgentStatusCard agent={agents[3]} compact={compact} /></div><div className="flow-output"><span><Layers3 size={14} />Top 5 opportunities</span><ArrowRight size={16} /><span>7-day strategy</span></div>{landing && <div className="flow-caption"><DemoBadge>FRONTEND PREVIEW</DemoBadge><span>Four perspectives. One considered strategy.</span></div>}</div>;
}
