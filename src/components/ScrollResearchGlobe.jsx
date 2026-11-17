import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { getGlobePose, spherePoints } from '../lib/globe';

const SIZE = 420;
const points = spherePoints(680);

function project(point, yaw, tilt) {
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const z = point.z * Math.cos(yaw) - point.x * Math.sin(yaw);
  const y = point.y * Math.cos(tilt) - z * Math.sin(tilt);
  const depth = point.y * Math.sin(tilt) + z * Math.cos(tilt);
  const perspective = 2.7 / (2.7 - depth * .23);
  return { x: x * perspective, y: y * perspective, z: depth };
}

// Original canvas artwork inspired by the reference's travelling particle globe.
// Its movement follows page scroll only; it does not indicate AI execution.
export default function ScrollResearchGlobe() {
  const layerRef = useRef(null), canvasRef = useRef(null);
  const { settings } = useApp();
  useEffect(() => {
    const layer = layerRef.current, canvas = canvasRef.current;
    if (!layer || !canvas || typeof CanvasRenderingContext2D === 'undefined') return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const root = layer.closest('.landing');
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let waypoints = [], frame = 0, lastPaint = -100, stopped = false, reduced = settings.reducedMotion || media.matches;
    const lightTheme = settings.theme === 'light';
    let current = null;

    function measure() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(SIZE * pixelRatio); canvas.height = Math.round(SIZE * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      waypoints = [...root.querySelectorAll('[data-globe-waypoint]')].map(element => {
        const rect = element.getBoundingClientRect();
        const maxRadius = element.dataset.globeWaypoint === 'hero' ? 166 : 132;
        return { x: rect.left + rect.width / 2, y: rect.top + window.scrollY + rect.height / 2, radius: Math.min(maxRadius, rect.width * .44) };
      });
      current = null; schedule();
    }

    function draw(pose, time) {
      const center = SIZE / 2, radius = pose.radius;
      context.clearRect(0, 0, SIZE, SIZE);
      const shade = context.createRadialGradient(center, center, radius * .35, center, center, radius * 1.4);
      shade.addColorStop(0, lightTheme ? 'rgba(225,239,248,.72)' : 'rgba(4,11,20,.86)');
      shade.addColorStop(.7, lightTheme ? 'rgba(225,239,248,.32)' : 'rgba(4,11,20,.55)');
      shade.addColorStop(1, lightTheme ? 'rgba(225,239,248,0)' : 'rgba(4,11,20,0)');
      context.fillStyle = shade; context.fillRect(0, 0, SIZE, SIZE);
      const glow = context.createRadialGradient(center, center, radius * .08, center, center, radius * 1.65);
      glow.addColorStop(0, lightTheme ? 'rgba(139,92,246,.16)' : 'rgba(69,233,164,.15)');
      glow.addColorStop(.56, lightTheme ? 'rgba(124,58,237,.07)' : 'rgba(34,197,94,.065)');
      glow.addColorStop(1, lightTheme ? 'rgba(124,58,237,0)' : 'rgba(34,197,94,0)');
      context.fillStyle = glow; context.fillRect(0, 0, SIZE, SIZE);
      const yaw = reduced ? .65 : pose.progress * Math.PI * 2.5 + time * .00008;
      const tilt = .33;
      for (let orbit = 0; orbit < 3; orbit++) {
        context.beginPath();
        for (let step = 0; step <= 100; step++) {
          const angle = step / 100 * Math.PI * 2;
          const p = project({ x: Math.cos(angle), y: Math.sin(angle) * Math.cos(orbit * .82 + .3), z: Math.sin(angle) * Math.sin(orbit * .82 + .3) }, yaw + orbit * .7, tilt);
          const x = center + p.x * radius * 1.12, y = center + p.y * radius * 1.12;
          if (step === 0) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.strokeStyle = lightTheme ? `rgba(109,40,217,${.24 + orbit * .035})` : `rgba(74,222,128,${.22 + orbit * .03})`; context.lineWidth = .75; context.stroke();
      }
      const visiblePoints = window.innerWidth < 600 ? points.filter((_, index) => index % 2 === 0) : points;
      const projected = visiblePoints.map(point => project(point, yaw, tilt)).sort((a, b) => a.z - b.z);
      for (const point of projected) {
        const depth = (point.z + 1) / 2;
        context.beginPath(); context.arc(center + point.x * radius, center + point.y * radius, .45 + depth * .85, 0, Math.PI * 2);
        context.fillStyle = lightTheme ? `rgba(109,40,217,${.28 + depth * .68})` : `rgba(110,231,162,${.24 + depth * .7})`; context.fill();
      }
      context.beginPath(); context.arc(center, center, 2.5, 0, Math.PI * 2); context.fillStyle = lightTheme ? 'rgba(91,33,182,.9)' : 'rgba(167,243,208,.9)'; context.fill();
    }

    function paint(time) {
      frame = 0;
      if (stopped) return;
      const target = getGlobePose(window.scrollY, window.innerHeight, waypoints, reduced);
      if (!target) return;
      if (!current || reduced) current = { ...target, documentY: target.y + window.scrollY };
      else {
        current.x += (target.x - current.x) * .24;
        current.documentY += (target.y + window.scrollY - current.documentY) * .24;
        current.radius += (target.radius - current.radius) * .24;
      }
      const y = current.documentY - window.scrollY;
      canvas.style.transform = `translate3d(${(current.x - SIZE / 2).toFixed(2)}px,${(y - SIZE / 2).toFixed(2)}px,0)`;
      root.style.setProperty('--network-reveal', target.connections.toFixed(3));
      root.dataset.globeDocked = String(target.docked);
      const visible = y > -SIZE / 2 && y < window.innerHeight + SIZE / 2;
      const targetVisible = target.y > -SIZE / 2 && target.y < window.innerHeight + SIZE / 2;
      const settling = Math.abs(current.documentY - target.y - window.scrollY) > .5 || Math.abs(current.x - target.x) > .5;
      if (visible && !document.hidden && (reduced || time - lastPaint > 33)) {
        draw({ ...target, radius: current.radius }, time); lastPaint = time; root.dataset.globeRendered = 'true';
      }
      if ((visible || targetVisible || settling) && !reduced && !document.hidden) schedule();
    }
    function schedule() { if (!frame && !stopped) frame = window.requestAnimationFrame(paint); }
    function motionChange() { reduced = settings.reducedMotion || media.matches; current = null; schedule(); }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    root.querySelectorAll('.hero,.problem-section,.how-section,.agent-network-stage').forEach(element => observer?.observe(element));
    window.addEventListener('scroll', schedule, { passive: true }); window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', schedule); media.addEventListener('change', motionChange);
    measure();
    return () => {
      stopped = true; window.cancelAnimationFrame(frame); observer?.disconnect();
      window.removeEventListener('scroll', schedule); window.removeEventListener('resize', measure); document.removeEventListener('visibilitychange', schedule); media.removeEventListener('change', motionChange);
      delete root.dataset.globeRendered; delete root.dataset.globeDocked; root.style.removeProperty('--network-reveal');
    };
  }, [settings.reducedMotion, settings.theme]);
  return <div ref={layerRef} className="research-globe-layer" aria-hidden="true"><canvas ref={canvasRef} className="research-globe-canvas" /></div>;
}
