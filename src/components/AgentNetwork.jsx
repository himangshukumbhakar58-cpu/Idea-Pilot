import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Layers3 } from 'lucide-react';
import { agents } from '../data/demo';
import { AgentStatusCard } from './Agents';
import { DemoBadge } from './ui';

function nearEdge(rect, target) {
  const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
  const dx = target.x - x, dy = target.y - y;
  if (Math.abs(dx / rect.width) > Math.abs(dy / rect.height)) return { x: dx > 0 ? rect.x + rect.width : rect.x, y };
  return { x, y: dy > 0 ? rect.y + rect.height : rect.y };
}

export default function AgentNetwork() {
  const stageRef = useRef(null);
  const marker = `network-arrow-${useId().replace(/:/g, '')}`;
  const [geometry, setGeometry] = useState({ width: 1100, height: 550, edges: [] });
  useEffect(() => {
    const stage = stageRef.current;
    function layout() {
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const dock = stage.querySelector('[data-globe-waypoint="dock"]').getBoundingClientRect();
      const core = { x: dock.left - bounds.left + dock.width / 2, y: dock.top - bounds.top + dock.height / 2 };
      const radius = dock.width * .35;
      const edges = agents.map(agent => {
        const rect = stage.querySelector(`[data-network-agent="${agent.id}"]`).getBoundingClientRect();
        const card = { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height };
        const edge = nearEdge(card, core);
        const length = Math.hypot(edge.x - core.x, edge.y - core.y) || 1;
        const surface = { x: core.x + (edge.x - core.x) / length * radius, y: core.y + (edge.y - core.y) / length * radius };
        const outgoing = agent.id === 'strategy';
        const start = outgoing ? surface : edge, end = outgoing ? edge : surface;
        let d;
        if (window.innerWidth <= 760 && ['trend', 'audience'].includes(agent.id)) {
          const gutter = agent.id === 'trend' ? 4 : bounds.width - 4;
          d = `M ${start.x} ${start.y} C ${start.x} ${start.y + 30},${gutter} ${start.y + 30},${gutter} ${start.y + 65} L ${gutter} ${core.y - 40} Q ${gutter} ${core.y},${end.x} ${end.y}`;
        } else if (Math.abs(end.x - start.x) > Math.abs(end.y - start.y) * .5) {
          const middle = (start.x + end.x) / 2;
          d = `M ${start.x} ${start.y} C ${middle} ${start.y},${middle} ${end.y},${end.x} ${end.y}`;
        } else {
          const middle = (start.y + end.y) / 2;
          d = `M ${start.x} ${start.y} C ${start.x} ${middle},${end.x} ${middle},${end.x} ${end.y}`;
        }
        return { id: agent.id, d, outgoing };
      });
      setGeometry({ width: bounds.width, height: bounds.height, edges });
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(layout);
    observer?.observe(stage); layout(); window.addEventListener('resize', layout);
    return () => { observer?.disconnect(); window.removeEventListener('resize', layout); };
  }, []);
  return <div className="agent-network">
    <div className="agent-network-stage" ref={stageRef}>
      <svg className="network-wires" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
        <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="currentColor" /></marker></defs>
        {geometry.edges.map((edge, index) => <g key={edge.id} className={edge.outgoing ? 'network-edge outgoing' : 'network-edge'} style={{ '--edge-start': edge.outgoing ? .36 : index * .06 }}><path className="network-wire-base" d={edge.d} /><path className="network-wire-lit" d={edge.d} pathLength="1" markerEnd={`url(#${marker})`} /></g>)}
      </svg>
      <div className="network-globe-dock" data-globe-waypoint="dock" aria-hidden="true"><svg className="globe-fallback" viewBox="0 0 200 200"><circle cx="100" cy="100" r="78" /><ellipse cx="100" cy="100" rx="35" ry="78" /><ellipse cx="100" cy="100" rx="78" ry="30" /><ellipse cx="100" cy="100" rx="60" ry="78" transform="rotate(38 100 100)" /></svg></div>
      <div className="network-core-label"><span>THE SHARED RESEARCH CORE</span><p>Three perspectives.<br />One clear direction.</p></div>
      {agents.map(agent => <div className={`network-node network-node-${agent.id}`} data-network-agent={agent.id} key={agent.id}><AgentStatusCard agent={agent} compact /></div>)}
    </div>
    <div className="network-result-strip"><span><Layers3 size={16} />Top 5 content opportunities</span><ArrowRight size={17} /><span><CalendarDays size={16} />7-day content strategy</span></div>
    <div className="network-caption"><DemoBadge>FRONTEND PREVIEW</DemoBadge><p>A visual map of the workflow. AI agents are not connected yet.</p></div>
  </div>;
}
