import { useEffect, useRef } from 'react';
import { FRAGMENT_SHADER, GLYPHS } from './reference-art';

export function PixelText({ text, className = '', animate = false, delay = 0 }) {
  let cursor = 0;
  const cells = [];
  for (const [letter, char] of [...text].entries()) {
    const glyph = GLYPHS[char] || GLYPHS[char.toUpperCase()];
    if (!glyph) { cursor += 3; continue; }
    const rows = glyph.split('/');
    rows.forEach((row, y) => [...row].forEach((cell, x) => { if (cell === '#') cells.push([cursor + x, y, letter]); }));
    cursor += Math.max(...rows.map(row => row.length)) + 1;
  }
  return <svg className={`pixel-text ${animate ? 'pixel-text-animated' : ''} ${className}`} viewBox={`0 -0.3 ${cursor} 9`} role="img" aria-label={text}>
    {cells.map(([x, y, letter], i) => <rect key={i} x={x + .07} y={y + .07} width=".86" height=".86" rx=".1" className={animate ? 'pixel-build-cell' : undefined} style={animate ? {
      '--pixel-delay': `${delay + letter * .052 + (i % 7) * .012}s`,
      '--pixel-x': `${((i * 13) % 19 - 9) * .45}px`,
      '--pixel-y': `${((i * 7) % 17 - 8) * .4}px`,
      '--pixel-rotation': `${(i % 5 - 2) * 12}deg`,
    } : undefined} />)}
  </svg>;
}

// Decorative reference-inspired sky only. It never represents research activity.
export function Atmosphere({ subtle = false, reducedMotion = false }) {
  const skyRef = useRef(null);
  useEffect(() => {
    const sky = skyRef.current;
    if (!sky || typeof WebGLRenderingContext === 'undefined') return;
    // StrictMode runs setup again after cleanup. A lost WebGL context cannot
    // be reused, so each effect owns a fresh canvas, just like the reference.
    const canvas = document.createElement('canvas');
    sky.prepend(canvas);
    const discardCanvas = () => { delete sky.dataset.rendered; canvas.remove(); };
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) { discardCanvas(); return; }
    const shaders = [];
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
      shaders.push(shader); return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.,1.);}');
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertex || !fragment) { shaders.forEach(shader => gl.deleteShader(shader)); discardCanvas(); return; }
    const program = gl.createProgram();
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); shaders.forEach(shader => gl.deleteShader(shader)); discardCanvas(); return; }
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(['uRes','uTime','uMix','uPtr','uPtrOn','uAccent'].map(name => [name, gl.getUniformLocation(program, name)]));
    let frame = 0, last = 0, stopped = false;
    const started = performance.now();
    const pointer = { x: .5, y: .5, active: 0 };
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    function draw(time = 0) {
      if (stopped) return;
      const width = Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.25));
      const height = Math.round(window.innerHeight * Math.min(window.devicePixelRatio || 1, 1.25));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; gl.viewport(0, 0, width, height); }
      gl.uniform2f(uniforms.uRes, width, height);
      gl.uniform1f(uniforms.uTime, reducedMotion || media.matches ? 12 : (time - started) / 1000);
      const heroHeight = document.querySelector('.hero')?.offsetHeight || window.innerHeight;
      gl.uniform1f(uniforms.uMix, subtle ? .25 : Math.min(Math.max(0, window.scrollY - heroHeight * .65) / Math.max(1, window.innerHeight), 1.8));
      gl.uniform2f(uniforms.uPtr, pointer.x, pointer.y); gl.uniform1f(uniforms.uPtrOn, reducedMotion || media.matches ? 0 : pointer.active); gl.uniform3f(uniforms.uAccent, .55, .78, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!gl.isContextLost()) sky.dataset.rendered = 'true';
    }
    function tick(time) {
      if (stopped) return;
      if (!document.hidden && time - last > 40) { draw(time); last = time; }
      if (!reducedMotion && !media.matches) frame = requestAnimationFrame(tick);
    }
    function refresh() { draw(performance.now()); }
    function motionChange() { cancelAnimationFrame(frame); refresh(); if (!reducedMotion && !media.matches) frame = requestAnimationFrame(tick); }
    function move(event) { pointer.x = event.clientX / window.innerHeight; pointer.y = 1 - event.clientY / window.innerHeight; pointer.active = 1; }
    function leave() { pointer.active = 0; }
    function contextLost(event) { event.preventDefault(); delete sky.dataset.rendered; }
    refresh(); if (!reducedMotion && !media.matches) frame = requestAnimationFrame(tick);
    window.addEventListener('resize', refresh); window.addEventListener('scroll', refresh, { passive: true }); media.addEventListener('change', motionChange);
    window.addEventListener('pointermove', move, { passive: true }); document.documentElement.addEventListener('pointerleave', leave); canvas.addEventListener('webglcontextlost', contextLost);
    return () => { stopped = true; cancelAnimationFrame(frame); window.removeEventListener('resize', refresh); window.removeEventListener('scroll', refresh); window.removeEventListener('pointermove', move); document.documentElement.removeEventListener('pointerleave', leave); canvas.removeEventListener('webglcontextlost', contextLost); media.removeEventListener('change', motionChange); gl.deleteBuffer(buffer); gl.deleteProgram(program); shaders.forEach(shader => gl.deleteShader(shader)); gl.getExtension('WEBGL_lose_context')?.loseContext(); discardCanvas(); };
  }, [subtle, reducedMotion]);
  return <div ref={skyRef} aria-hidden="true" className={`atmosphere ${subtle ? 'atmosphere-subtle' : ''}`}><div className="mosaic-fallback"><MosaicFallback /></div><div className="sky-vignette" /></div>;
}

// A real tiled fallback preserves the reference pattern without WebGL.
const mosaicTiles = Array.from({ length: 46 * 32 }, (_, index) => {
  const x = index % 46, y = Math.floor(index / 46);
  const hash = Math.abs(Math.sin(index * 127.1 + 311.7) * 43758.5453) % 1;
  const glow = Math.exp(-((x - 24) ** 2 / 175 + (y - 17) ** 2 / 100));
  const light = Math.floor((glow * .7 + hash * .22) * 8) / 8;
  return <rect key={index} x={x * 24 + 1} y={y * 24 + 1} width="21" height="21" rx="2" fill={`rgb(${Math.round(15 + light * 105)},${Math.round(18 + light * 112)},${Math.round(25 + light * 126)})`} />;
});
function MosaicFallback() {
  return <svg viewBox="0 0 1104 768" preserveAspectRatio="xMidYMid slice" width="100%" height="100%"><rect width="1104" height="768" fill="#050609" />{mosaicTiles}</svg>;
}
