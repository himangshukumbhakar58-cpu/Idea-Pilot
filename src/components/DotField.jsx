import { useEffect, useRef } from 'react';

function rgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? [...value].map(part => part + part).join('') : value;
  return [0, 2, 4].map(index => Number.parseInt(full.slice(index, index + 2), 16));
}
function blend(from, to, amount) {
  return from.map((value, index) => Math.round(value + (to[index] - value) * amount));
}
function smooth(value) { const clamped = Math.max(0, Math.min(1, value)); return clamped * clamped * (3 - 2 * clamped); }

export default function DotField({
  gradientFrom = '#5227FF', gradientTo = '#10b981', dotRadius = 1.5, dotSpacing = 14,
  cursorRadius = 240, bulgeStrength = .6, glowRadius = 160, pattern = 'grid',
  glowColor = '#ffffff', gradientAngle = 135, twist = 0, glowIntensity = .8,
  baseOpacity = .55, waveAmplitude = 0, speed = 1, sparkle = false,
  interactive = true, holdToZoom = true, intro = true, lightMode = false,
}) {
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = layerRef.current, canvas = layer?.querySelector('canvas');
    const context = canvas?.getContext('2d');
    if (!layer || !context) return;
    const start = performance.now();
    const from = rgb(gradientFrom), to = rgb(gradientTo), glow = rgb(glowColor);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, active: 0, targetActive: 0, held: 0, targetHeld: 0 };
    let frame = 0, stopped = false, lastPaint = 0;

    function resize() {
      const rect = layer.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width)), height = Math.max(1, Math.round(rect.height));
      const pixelWidth = Math.round(width * ratio), pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth; canvas.height = pixelHeight;
        canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      return { width, height };
    }
    function locate(event) {
      if (!interactive) return;
      const rect = layer.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      pointer.targetActive = inside ? 1 : 0;
      if (inside) { pointer.targetX = event.clientX - rect.left; pointer.targetY = event.clientY - rect.top; }
    }
    function press(event) { locate(event); if (holdToZoom && pointer.targetActive) pointer.targetHeld = 1; }
    function release() { pointer.targetHeld = 0; }

    function draw(time = performance.now()) {
      const { width, height } = resize();
      context.clearRect(0, 0, width, height);
      const reduced = media.matches;
      const easing = reduced ? 1 : .16;
      pointer.x += (pointer.targetX - pointer.x) * easing; pointer.y += (pointer.targetY - pointer.y) * easing;
      pointer.active += (pointer.targetActive - pointer.active) * easing; pointer.held += (pointer.targetHeld - pointer.held) * .12;
      const introProgress = intro && !reduced ? smooth((time - start) / 1100) : 1;
      const zoom = 1 + pointer.held * .1;
      const angle = gradientAngle * Math.PI / 180;
      const directionX = Math.cos(angle), directionY = Math.sin(angle);
      const projectionMin = Math.min(0, width * directionX) + Math.min(0, height * directionY);
      const projectionSpan = Math.abs(width * directionX) + Math.abs(height * directionY) || 1;
      if (pointer.active > .01) {
        const halo = context.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, glowRadius);
        halo.addColorStop(0, `rgba(${glow.join(',')},${.11 * glowIntensity * pointer.active})`);
        halo.addColorStop(1, `rgba(${glow.join(',')},0)`);
        context.fillStyle = halo; context.fillRect(pointer.x - glowRadius, pointer.y - glowRadius, glowRadius * 2, glowRadius * 2);
      }
      const spacing = Math.max(7, dotSpacing), offset = spacing / 2;
      const timeWave = reduced ? 0 : time * .001 * speed;
      const centerX = width / 2, centerY = height / 2;
      for (let row = -1; row <= Math.ceil(height / spacing); row++) {
        for (let column = -1; column <= Math.ceil(width / spacing); column++) {
          let x = offset + column * spacing, y = offset + row * spacing;
          if (pattern === 'staggered' && row % 2) x += spacing / 2;
          if (twist) {
            const dx = x - centerX, dy = y - centerY, turn = twist * .0004 * Math.hypot(dx, dy);
            x = centerX + dx * Math.cos(turn) - dy * Math.sin(turn); y = centerY + dx * Math.sin(turn) + dy * Math.cos(turn);
          }
          if (waveAmplitude) y += Math.sin(column * .23 + row * .16 + timeWave) * waveAmplitude;
          if (pointer.held > .001) { x = pointer.x + (x - pointer.x) * zoom; y = pointer.y + (y - pointer.y) * zoom; }
          let dx = x - pointer.x, dy = y - pointer.y, distance = Math.hypot(dx, dy);
          const influence = pointer.active * smooth(1 - distance / cursorRadius);
          if (influence > 0 && distance > .01) {
            const lift = influence * influence * bulgeStrength * 34;
            x += dx / distance * lift; y += dy / distance * lift;
            dx = x - pointer.x; dy = y - pointer.y; distance = Math.hypot(dx, dy);
          }
          const glowAmount = pointer.active * smooth(1 - distance / glowRadius) * glowIntensity;
          const projection = (x * directionX + y * directionY - projectionMin) / projectionSpan;
          const base = blend(from, to, Math.max(0, Math.min(1, projection)));
          const color = blend(base, glow, glowAmount * .72);
          const twinkle = sparkle && !reduced ? .75 + Math.sin(timeWave * 2 + row * 2.7 + column) * .25 : 1;
          const radius = dotRadius * (1 + influence * .8 + glowAmount * .35) * introProgress;
          if (radius <= .05) continue;
          context.globalAlpha = Math.min(1, (baseOpacity + glowAmount * .38) * introProgress * twinkle);
          context.fillStyle = `rgb(${color.join(',')})`;
          context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2); context.fill();
        }
      }
      context.globalAlpha = 1;
    }
    function tick(time) {
      if (stopped) return;
      if (!document.hidden && time - lastPaint > 33) { draw(time); lastPaint = time; }
      frame = window.requestAnimationFrame(tick);
    }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => draw());
    observer?.observe(layer); window.addEventListener('pointermove', locate, { passive: true });
    window.addEventListener('pointerdown', press, { passive: true }); window.addEventListener('pointerup', release, { passive: true });
    window.addEventListener('pointercancel', release, { passive: true });
    draw(); frame = window.requestAnimationFrame(tick);
    return () => {
      stopped = true; window.cancelAnimationFrame(frame); observer?.disconnect();
      window.removeEventListener('pointermove', locate); window.removeEventListener('pointerdown', press); window.removeEventListener('pointerup', release); window.removeEventListener('pointercancel', release);
    };
  }, [gradientFrom, gradientTo, dotRadius, dotSpacing, cursorRadius, bulgeStrength, glowRadius, pattern, glowColor, gradientAngle, twist, glowIntensity, baseOpacity, waveAmplitude, speed, sparkle, interactive, holdToZoom, intro]);
  return <div ref={layerRef} className={`dot-field ${lightMode ? 'dot-field-light' : ''}`} aria-hidden="true"><canvas /></div>;
}
