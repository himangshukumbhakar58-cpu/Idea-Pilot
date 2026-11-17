import { useEffect, useRef } from 'react';

// Golden ratio for icosahedron geometry
const PHI = (1 + Math.sqrt(5)) / 2;

// 12 vertices of a regular icosahedron normalized to unit sphere
const RAW_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
].map(v => {
  const len = Math.hypot(...v);
  return [v[0] / len, v[1] / len, v[2] / len];
});

// 20 triangular faces
const FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
];

// Seeded 3D ambient particle constellation
const PARTICLES = Array.from({ length: 48 }, (_, i) => {
  const theta = (i * 1.618033) * Math.PI * 2;
  const phi = Math.acos(1 - 2 * ((i + 0.5) / 48));
  const r = 1.35 + (i % 5) * 0.14;
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.sin(phi) * Math.sin(theta),
    z: r * Math.cos(phi),
    size: 1.2 + (i % 3) * 0.9,
    phase: i * 0.4
  };
});

function rotate3D(v, rx, ry, rz) {
  let [x, y, z] = v;
  // X
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const y1 = y * cx - z * sx;
  const z1 = y * sx + z * cx;
  // Y
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const x2 = x * cy + z1 * sy;
  const z2 = -x * cy_sy(cy, sy, x, z1) || (-x * sy + z1 * cy);
  // Z
  const cz = Math.cos(rz), sz = Math.sin(rz);
  const x3 = x2 * cz - y1 * sz;
  const y3 = x2 * sz + y1 * cz;
  return [x3, y3, z2];
}

function cy_sy(cy, sy, x, z1) {
  return -x * sy + z1 * cy;
}

export default function IdeaCore3D({ theme = 'light', reducedMotion = false, className = '' }) {
  const rootRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isHovered: false });

  useEffect(() => {
    const root = rootRef.current;
    const canvas = root?.querySelector('canvas');
    if (!root || !canvas) return;

    let ctx = null;
    try {
      ctx = canvas.getContext('2d');
    } catch {}
    if (!ctx) return;

    let animId = 0;
    let stopped = false;
    let lastTime = performance.now();

    let rotX = 0.35;
    let rotY = 0.5;
    let rotZ = 0.15;

    const isDark = theme === 'dark';

    // Light direction vector (normalized)
    const lightDir = [0.577, 0.577, 0.577];

    function render(now) {
      if (stopped) return;

      const dt = Math.min(0.06, (now - lastTime) / 1000);
      lastTime = now;

      const rect = root.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.28;

      // Mouse smoothing
      const m = mouseRef.current;
      m.x += (m.targetX - m.x) * 0.08;
      m.y += (m.targetY - m.y) * 0.08;

      // Rotate over time unless reduced motion
      if (!reducedMotion) {
        rotY += dt * 0.55 + m.x * dt * 0.6;
        rotX += dt * 0.3 + m.y * dt * 0.6;
        rotZ += dt * 0.18;
      }

      const activeRotX = rotX + m.y * 0.45;
      const activeRotY = rotY + m.x * 0.65;
      const activeRotZ = rotZ;

      // Ambient radial glow behind the core
      const glowGrad = ctx.createRadialGradient(cx, cy, scale * 0.2, cx, cy, scale * 1.9);
      if (isDark) {
        glowGrad.addColorStop(0, 'rgba(183, 223, 255, 0.18)');
        glowGrad.addColorStop(0.45, 'rgba(82, 39, 255, 0.08)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(82, 39, 255, 0.15)');
        glowGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.06)');
        glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, scale * 1.9, 0, Math.PI * 2);
      ctx.fill();

      // 1. Draw Background Gyroscope Rings (halves behind z < 0)
      drawGyroscopeRings(ctx, cx, cy, scale, now * 0.001, activeRotX, activeRotY, isDark, true);

      // 2. Draw 3D Floating Particles (back half)
      drawParticles(ctx, cx, cy, scale, now * 0.001, activeRotX, activeRotY, activeRotZ, isDark, true);

      // 3. Transform & Draw 3D Crystal Core (Icosahedron)
      const rotatedVerts = RAW_VERTICES.map(v => rotate3D(v, activeRotX, activeRotY, activeRotZ));

      // Calculate face depths and sort back-to-front
      const faceData = FACES.map(([iA, iB, iC]) => {
        const A = rotatedVerts[iA], B = rotatedVerts[iB], C = rotatedVerts[iC];
        const avgZ = (A[2] + B[2] + C[2]) / 3;

        // Normal vector
        const AB = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
        const AC = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
        const nx = AB[1] * AC[2] - AB[2] * AC[1];
        const ny = AB[2] * AC[0] - AB[0] * AC[2];
        const nz = AB[0] * AC[1] - AB[1] * AC[0];
        const nLen = Math.hypot(nx, ny, nz) || 1;
        const norm = [nx / nLen, ny / nLen, nz / nLen];

        return { A, B, C, avgZ, norm };
      }).sort((a, b) => a.avgZ - b.avgZ);

      // Render icosahedron faces
      faceData.forEach(({ A, B, C, norm, avgZ }) => {
        // Dot product with light
        const diffuse = Math.max(0.12, norm[0] * lightDir[0] + norm[1] * lightDir[1] + norm[2] * lightDir[2]);
        const specular = Math.pow(Math.max(0, norm[2]), 4.0) * 0.45;

        // Depth perspective
        const fov = 3.2;
        const pA = project(A, cx, cy, scale, fov);
        const pB = project(B, cx, cy, scale, fov);
        const pC = project(C, cx, cy, scale, fov);

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.lineTo(pC.x, pC.y);
        ctx.closePath();

        // Shading palette
        const intensity = diffuse + specular;
        if (isDark) {
          // Luminous cyber-ice crystal
          const r = Math.round(140 * intensity + 30);
          const g = Math.round(200 * intensity + 40);
          const b = Math.round(255 * intensity);
          const a = 0.55 + avgZ * 0.22;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0.2, Math.min(0.9, a))})`;
          ctx.strokeStyle = `rgba(183, 223, 255, ${0.45 + specular * 0.5})`;
        } else {
          // Royal iridescent amethyst crystal
          const r = Math.round(82 + 100 * intensity);
          const g = Math.round(39 + 70 * intensity);
          const b = Math.round(255 * intensity);
          const a = 0.65 + avgZ * 0.25;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0.3, Math.min(0.92, a))})`;
          ctx.strokeStyle = `rgba(235, 225, 255, ${0.5 + specular * 0.5})`;
        }

        ctx.lineWidth = 1.2 * dpr;
        ctx.fill();
        ctx.stroke();
      });

      // Inner glowing core point
      ctx.beginPath();
      ctx.arc(cx, cy, 5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? '#ffffff' : '#f8f5ff';
      ctx.shadowColor = isDark ? '#b7dfff' : '#7c3aed';
      ctx.shadowBlur = 16 * dpr;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 4. Draw Foreground Gyroscope Rings (halves in front z > 0)
      drawGyroscopeRings(ctx, cx, cy, scale, now * 0.001, activeRotX, activeRotY, isDark, false);

      // 5. Draw 3D Floating Particles (front half)
      drawParticles(ctx, cx, cy, scale, now * 0.001, activeRotX, activeRotY, activeRotZ, isDark, false);

      ctx.restore();

      if (!reducedMotion) {
        animId = requestAnimationFrame(render);
      }
    }

    function project(v, cx, cy, scale, fov) {
      const zFactor = fov / (fov - v[2]);
      return {
        x: cx + v[0] * scale * zFactor,
        y: cy - v[1] * scale * zFactor
      };
    }

    // Interactive mouse tracking
    const handleMouseMove = (e) => {
      const rect = root.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = nx;
      mouseRef.current.targetY = ny;
    };

    const handleMouseEnter = () => {
      mouseRef.current.isHovered = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.isHovered = false;
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    root.addEventListener('mousemove', handleMouseMove);
    root.addEventListener('mouseenter', handleMouseEnter);
    root.addEventListener('mouseleave', handleMouseLeave);

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      render(performance.now());
    });
    observer?.observe(root);

    render(performance.now());

    return () => {
      stopped = true;
      cancelAnimationFrame(animId);
      observer?.disconnect();
      root.removeEventListener('mousemove', handleMouseMove);
      root.removeEventListener('mouseenter', handleMouseEnter);
      root.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [theme, reducedMotion]);

  return (
    <div ref={rootRef} className={`idea-core-3d ${className}`} aria-hidden="true">
      <canvas />
    </div>
  );
}

// Draw rotating 3D gyroscope gimbal rings with orbital tick nodes
function drawGyroscopeRings(ctx, cx, cy, scale, time, rx, ry, isDark, isBackHalf) {
  const rings = [
    { radius: 1.55, tiltX: 1.1, rotSpeed: 0.45, stroke: isDark ? 'rgba(183, 223, 255, 0.4)' : 'rgba(82, 39, 255, 0.45)', bead: true },
    { radius: 1.32, tiltX: -0.85, rotSpeed: -0.6, stroke: isDark ? 'rgba(33, 196, 122, 0.4)' : 'rgba(124, 58, 237, 0.4)', bead: true },
    { radius: 1.15, tiltX: 0.5, rotSpeed: 0.8, stroke: isDark ? 'rgba(183, 223, 255, 0.3)' : 'rgba(59, 130, 246, 0.35)', bead: false }
  ];

  rings.forEach((ring, idx) => {
    const ringAngle = time * ring.rotSpeed;
    const segments = 48;
    const pts = [];

    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const rawX = Math.cos(theta) * ring.radius;
      const rawY = Math.sin(theta) * ring.radius;

      // Tilt ring around X and rotate around Y
      const cosT = Math.cos(ring.tiltX), sinT = Math.sin(ring.tiltX);
      const yT = rawY * cosT;
      const zT = rawY * sinT;

      const cosR = Math.cos(ringAngle + ry * 0.3), sinR = Math.sin(ringAngle + ry * 0.3);
      const xRot = rawX * cosR + zT * sinR;
      const zRot = -rawX * sinR + zT * cosR;

      pts.push({ x: xRot, y: yT, z: zRot });
    }

    // Split ring by depth
    for (let i = 0; i < segments; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const avgZ = (p1.z + p2.z) / 2;

      if ((isBackHalf && avgZ < 0) || (!isBackHalf && avgZ >= 0)) {
        const fov = 3.2;
        const zF1 = fov / (fov - p1.z);
        const zF2 = fov / (fov - p2.z);

        ctx.beginPath();
        ctx.moveTo(cx + p1.x * scale * zF1, cy - p1.y * scale * zF1);
        ctx.lineTo(cx + p2.x * scale * zF2, cy - p2.y * scale * zF2);
        ctx.strokeStyle = ring.stroke;
        ctx.lineWidth = (avgZ >= 0 ? 1.6 : 1.0);
        ctx.stroke();
      }
    }

    // Draw orbital data satellite node on the ring
    if (ring.bead) {
      const beadTheta = ringAngle * 2.2 + idx * 2.0;
      const bRawX = Math.cos(beadTheta) * ring.radius;
      const bRawY = Math.sin(beadTheta) * ring.radius;
      const cosT = Math.cos(ring.tiltX), sinT = Math.sin(ring.tiltX);
      const byT = bRawY * cosT;
      const bzT = bRawY * sinT;
      const cosR = Math.cos(ringAngle + ry * 0.3), sinR = Math.sin(ringAngle + ry * 0.3);
      const bxRot = bRawX * cosR + bzT * sinR;
      const bzRot = -bRawX * sinR + bzT * cosR;

      if ((isBackHalf && bzRot < 0) || (!isBackHalf && bzRot >= 0)) {
        const fov = 3.2;
        const zF = fov / (fov - bzRot);
        const bx = cx + bxRot * scale * zF;
        const by = cy - byT * scale * zF;

        ctx.beginPath();
        ctx.arc(bx, by, (bzRot >= 0 ? 3.5 : 2.2), 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#b7dfff' : '#5227ff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx, by, (bzRot >= 0 ? 7 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(183, 223, 255, 0.3)' : 'rgba(82, 39, 255, 0.25)';
        ctx.fill();
      }
    }
  });
}

// Draw 3D sparkling stardust particles
function drawParticles(ctx, cx, cy, scale, time, rx, ry, rz, isDark, isBackHalf) {
  PARTICLES.forEach(p => {
    // Gentle sine drift
    const driftY = Math.sin(time * 0.8 + p.phase) * 0.08;
    const pos = rotate3D([p.x, p.y + driftY, p.z], rx * 0.5, ry * 0.5, rz * 0.2);

    if ((isBackHalf && pos[2] < 0) || (!isBackHalf && pos[2] >= 0)) {
      const fov = 3.2;
      const zFactor = fov / (fov - pos[2]);
      const px = cx + pos[0] * scale * zFactor;
      const py = cy - pos[1] * scale * zFactor;

      const alpha = Math.max(0.15, Math.min(0.85, 0.5 + pos[2] * 0.35));
      ctx.beginPath();
      ctx.arc(px, py, p.size * (0.8 + pos[2] * 0.3), 0, Math.PI * 2);
      ctx.fillStyle = isDark
        ? `rgba(183, 223, 255, ${alpha})`
        : `rgba(82, 39, 255, ${alpha * 0.9})`;
      ctx.fill();
    }
  });
}
