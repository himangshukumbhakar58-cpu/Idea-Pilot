import { useEffect, useRef } from 'react';

const vertexSource = `
attribute vec2 aRibbon;
uniform float uTime;
uniform float uAspect;
varying vec2 vUv;
varying float vLight;
varying float vSide;
varying float vDepth;

void main() {
  float u = aRibbon.x;
  float side = aRibbon.y;
  
  // Single-cycle harmonic 3D S-curve wave matching reference coordinates:
  float t = uTime * 0.42;
  float phase = u * 6.2831853 - t;
  
  // Vertical S-wave (trough at u ~ 0.25, crest at u ~ 0.75):
  float waveOffset = sin(u * 5.0 - t * 0.8) * 0.035;
  float centerY = -sin(phase) * 0.36 + waveOffset + 0.08;
  
  // 3D Depth z (brings trough closer, sends crest into depth):
  float centerZ = cos(phase) * 0.26;
  
  // Twist: progressive 3D twist with pinch on left edge:
  float bodyTwist = cos(phase) * 0.44 + sin(u * 9.4 - t * 0.5) * 0.06;
  float pinch = exp(-pow((u - 0.02) * 36.0, 2.0)) * 1.45;
  float twist = bodyTwist + pinch;
  
  // Width of ribbon:
  float halfWidth = 0.155;
  
  float y = centerY + side * cos(twist) * halfWidth;
  float z = centerZ + side * sin(twist) * halfWidth;
  float x = mix(-1.42, 1.42, u);
  
  // 3D perspective projection:
  float lens = 1.0 / (1.0 - z * 0.42);
  gl_Position = vec4(x * lens, y * lens, z * 0.08, 1.0);
  
  // Continuous texture coordinate sliding along the ribbon:
  vUv = vec2(u * 4.4 - uTime * 0.065, (side + 1.0) * 0.5);
  
  // Satin lighting calculation:
  vLight = 0.65 + 0.35 * cos(twist);
  vSide = side;
  vDepth = z;
}
`;

const fragmentSource = `
precision mediump float;
uniform sampler2D uTexture;
uniform float uOpacity;
varying vec2 vUv;
varying float vLight;
varying float vSide;
varying float vDepth;

void main() {
  vec4 tex = texture2D(uTexture, vUv);
  
  // Satin rim lighting along edges:
  float edge = abs(vSide);
  float rim = pow(edge, 3.5) * 0.22;
  
  // Upper satin gloss streak:
  float satinStreak = pow(max(0.0, 1.0 - abs(vUv.y - 0.32) * 4.4), 4.5) * 0.28;
  
  // 3D depth lighting:
  float depthMod = 1.0 + vDepth * 0.35;
  
  tex.rgb = tex.rgb * (vLight * depthMod * 0.94) + satinStreak + rim;
  tex.a *= uOpacity;
  
  gl_FragColor = tex;
}
`;

function makeTexture(text, theme) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  const dark = theme === 'dark';

  // Base satin gradient:
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  if (!dark) {
    // Royal electric purple matching reference design:
    gradient.addColorStop(0.0, '#7c5aff');
    gradient.addColorStop(0.24, '#5b2cf6');
    gradient.addColorStop(0.68, '#4b1ee6');
    gradient.addColorStop(1.0, '#2d08a8');
  } else {
    // Emerald green for dark theme:
    gradient.addColorStop(0.0, '#8ef4c5');
    gradient.addColorStop(0.35, '#20c479');
    gradient.addColorStop(0.75, '#12995b');
    gradient.addColorStop(1.0, '#065735');
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Soft satin highlight overlay:
  const sheen = context.createLinearGradient(0, 0, 0, canvas.height);
  sheen.addColorStop(0.0, 'rgba(255, 255, 255, 0.38)');
  sheen.addColorStop(0.14, 'rgba(255, 255, 255, 0.2)');
  sheen.addColorStop(0.38, 'rgba(255, 255, 255, 0.0)');
  sheen.addColorStop(0.85, 'rgba(0, 0, 0, 0.0)');
  sheen.addColorStop(1.0, 'rgba(0, 0, 0, 0.32)');
  context.fillStyle = sheen;
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Top and bottom satin trim lines:
  context.strokeStyle = dark ? 'rgba(220, 255, 236, 0.35)' : 'rgba(235, 226, 255, 0.4)';
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(0, 3);
  context.lineTo(canvas.width, 3);
  context.moveTo(0, canvas.height - 3);
  context.lineTo(canvas.width, canvas.height - 3);
  context.stroke();

  // Bold typography:
  context.fillStyle = '#ffffff';
  context.font = '900 58px -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif';
  context.textBaseline = 'middle';
  context.letterSpacing = '4px';

  const phrase = `${text.toUpperCase()}   •   `;
  const phraseWidth = Math.max(460, context.measureText(phrase).width);
  for (let x = -60; x < canvas.width + phraseWidth * 2; x += phraseWidth) {
    context.fillText(phrase, x, canvas.height / 2 + 2);
  }

  return canvas;
}

export default function RibbonType({
  text = 'MAKE SPACE FOR IDEAS · CREATE WITH DIRECTION',
  theme = 'light',
  reducedMotion = false,
  className = '',
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = root?.querySelector('canvas');
    if (!root || !canvas || typeof WebGLRenderingContext === 'undefined') return;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!gl) return;

    const compile = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      gl.deleteProgram(program);
      return;
    }

    const segments = 220;
    const vertices = new Float32Array((segments + 1) * 4);
    for (let i = 0; i <= segments; i++) {
      const offset = i * 4;
      const u = i / segments;
      vertices[offset] = u;
      vertices[offset + 1] = -1;
      vertices[offset + 2] = u;
      vertices[offset + 3] = 1;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, makeTexture(text, theme));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.useProgram(program);
    const ribbon = gl.getAttribLocation(program, 'aRibbon');
    gl.enableVertexAttribArray(ribbon);
    gl.vertexAttribPointer(ribbon, 2, gl.FLOAT, false, 0, 0);

    const timeUniform = gl.getUniformLocation(program, 'uTime');
    const aspectUniform = gl.getUniformLocation(program, 'uAspect');
    const opacityUniform = gl.getUniformLocation(program, 'uOpacity');

    gl.uniform1i(gl.getUniformLocation(program, 'uTexture'), 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const started = performance.now();
    let frame = 0;
    let stopped = false;
    let lastPaint = 0;

    function draw(time = performance.now()) {
      const rect = root.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      const still = reducedMotion || media.matches;
      const elapsed = still ? 2.3 : (time - started) / 1000;
      const intro = Math.min(1, elapsed / 1.1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(timeUniform, elapsed);
      gl.uniform1f(aspectUniform, width / height);
      gl.uniform1f(opacityUniform, intro);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, (segments + 1) * 2);
      root.dataset.rendered = 'true';
    }

    function tick(time) {
      if (stopped) return;
      if (!document.hidden && time - lastPaint > 30) {
        draw(time);
        lastPaint = time;
      }
      if (!reducedMotion && !media.matches) {
        frame = requestAnimationFrame(tick);
      }
    }

    function refresh() {
      draw(performance.now());
    }

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(refresh);
    observer?.observe(root);
    media.addEventListener('change', refresh);

    refresh();
    if (!reducedMotion && !media.matches) {
      frame = requestAnimationFrame(tick);
    }

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      media.removeEventListener('change', refresh);
      delete root.dataset.rendered;
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [text, theme, reducedMotion]);

  return (
    <div ref={rootRef} className={`ribbon-type ${className}`} aria-hidden="true">
      <canvas />
      <div className="ribbon-type-fallback">
        <span>{text}</span>
      </div>
    </div>
  );
}
