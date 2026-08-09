"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// PROTOTYPE — Variant C: Particle Galaxy
// Names as particles in a spiral galaxy. Cold blue outer, warm gold inner.
// Slowly rotating. On reveal: collapse into center → winners burst out.
// Inspired by galactic imagery — dramatic, cinematic.

interface GalaxyParticle {
  name: string;
  angle: number;      // orbital angle
  radius: number;      // distance from center
  baseRadius: number;
  baseAngle: number;
  size: number;
  speed: number;       // orbital speed
  height: number;      // slight vertical offset for 3D-ish effect
  color: { r: number; g: number; b: number };
}

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number
) {
  return {
    r: Math.round(r1 + (r2 - r1) * t),
    g: Math.round(g1 + (g2 - g1) * t),
    b: Math.round(b1 + (b2 - b1) * t),
  };
}

function buildGalaxy(names: string[], width: number, height: number): GalaxyParticle[] {
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) * 0.42;
  const minRadius = maxRadius * 0.05;
  const arms = 3;
  const armSpread = 0.5;

  return names.map((_, i) => {
    const t = i / names.length;
    // radius: more particles at outer edge (quadratic distribution)
    const rawRadius = Math.sqrt(t) * (maxRadius - minRadius) + minRadius;
    // spiral arm
    const armIndex = i % arms;
    const baseAngle = (armIndex / arms) * Math.PI * 2 + rawRadius * 0.02;
    const scatterAngle = (Math.random() - 0.5) * armSpread * (1 - rawRadius / maxRadius);
    const angle = baseAngle + scatterAngle;

    return {
      name: names[i],
      angle,
      radius: rawRadius,
      baseRadius: rawRadius,
      baseAngle: angle,
      size: 1 + Math.random() * 2.5,
      speed: 0.0002 + Math.random() * 0.0003,
      height: (Math.random() - 0.5) * 15,
      color: lerpColor(80, 140, 255, 255, 200, 50, rawRadius / maxRadius),
    };
  });
}

export default function VariantC({
  participants,
  winners,
  onDraw,
}: {
  participants: string[];
  winners: string[];
  onDraw: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<GalaxyParticle[]>([]);
  const cxRef = useRef(0);
  const cyRef = useRef(0);
  const phaseRef = useRef<"idle" | "revealing" | "drawn">("idle");
  const revealStartRef = useRef(0);
  const [, setPhase] = useState("idle");
  const manualAdvanceRef = useRef<(() => void) | null>(null);

  const trigger = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    phaseRef.current = "revealing";
    revealStartRef.current = performance.now();
    setPhase("revealing");
    onDraw();
  }, [onDraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      cxRef.current = canvas.clientWidth / 2;
      cyRef.current = canvas.clientHeight / 2;
      particlesRef.current = buildGalaxy(participants, canvas.clientWidth, canvas.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    let animId: number;

    const loop = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = cxRef.current;
      const cy = cyRef.current;
      ctx.clearRect(0, 0, w, h);

      // Space bg with subtle center glow
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "#08081a");
      bg.addColorStop(0.3, "#040412");
      bg.addColorStop(1, "#010108");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const particles = particlesRef.current;
      const phase = phaseRef.current;
      const maxRadius = Math.min(w, h) * 0.42;

      // Subtle galactic core glow
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.15);
      core.addColorStop(0, "rgba(255, 220, 100, 0.15)");
      core.addColorStop(1, "rgba(255, 220, 100, 0)");
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, w, h);

      if (phase === "idle") {
        // Smooth rotation
        for (const p of particles) {
          p.angle += p.speed;
          const px = cx + Math.cos(p.angle) * p.radius;
          const py = cy + Math.sin(p.angle) * p.radius + p.height * (p.radius / maxRadius);

          const { r, g, b } = p.color;
          ctx.save();
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.shadowColor = `rgb(${r},${g},${b})`;
          ctx.shadowBlur = p.size * 2;
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else {
        const elapsed = (time - revealStartRef.current) / 1000;
        const phase1Duration = 0.6; // collapse
        const phase2Duration = 0.6; // burst
        const p1 = Math.min(elapsed / phase1Duration, 1);
        const p2 = Math.max(0, Math.min((elapsed - phase1Duration) / phase2Duration, 1));
        const e1 = 1 - Math.pow(1 - p1, 2); // ease in
        const e2 = 1 - Math.pow(1 - p2, 3); // ease out

        const rotationBoost = time * 0.005 * (1 - p1); // spiral faster then stop

        for (const p of particles) {
          p.angle = p.baseAngle + rotationBoost;
          const isWinner = winners.includes(p.name);

          // Collapse phase
          p.radius = p.baseRadius - (p.baseRadius - 10) * e1;
          p.height = p.height * (1 - e1);

          const px = cx + Math.cos(p.angle) * p.radius;
          const py = cy + Math.sin(p.angle) * p.radius + p.height;

          if (isWinner) {
            // Burst phase: winners explode outward to form a card
            const burstRadius = 10 + e2 * 280;
            const burstAngle = p.baseAngle + e2 * (winners.indexOf(p.name) - (winners.length - 1) / 2) * 0.6;
            const bpx = cx + Math.cos(burstAngle) * burstRadius;
            const bpy = cy + Math.sin(burstAngle) * burstRadius;

            const tx = px + (bpx - px) * e2;
            const ty = py + (bpy - py) * e2;

            // Glow
            ctx.save();
            const glowRadius = 15 + e2 * 30;
            const glow = ctx.createRadialGradient(tx, ty, 0, tx, ty, glowRadius);
            glow.addColorStop(0, "rgba(255, 220, 50, 0.8)");
            glow.addColorStop(0.5, "rgba(255, 180, 20, 0.3)");
            glow.addColorStop(1, "rgba(255, 100, 0, 0)");
            ctx.fillStyle = glow;
            ctx.fillRect(tx - glowRadius, ty - glowRadius, glowRadius * 2, glowRadius * 2);
            ctx.restore();

            // Name card
            if (e2 > 0.3) {
              const textAlpha = (e2 - 0.3) / 0.7;
              ctx.save();
              ctx.globalAlpha = textAlpha;
              ctx.fillStyle = "#ffd700";
              ctx.font = `bold ${16 + e2 * 14}px system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.shadowColor = "#ffd700";
              ctx.shadowBlur = 24 * e2;
              ctx.fillText(p.name, tx, ty);
              ctx.restore();
            }
          } else {
            const alpha = Math.max(0, 1 - e1 * 2.5);
            if (alpha > 0.01) {
              const { r, g, b } = p.color;
              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.fillStyle = `rgb(${r},${g},${b})`;
              ctx.beginPath();
              ctx.arc(px, py, p.size * (1 - e1), 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }

        if (elapsed >= phase1Duration + phase2Duration && phase === "revealing") {
          phaseRef.current = "drawn";
          setPhase("drawn");
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [participants, winners]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {phaseRef.current === "idle" && (
        <button
          onClick={trigger}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-full text-lg font-semibold backdrop-blur transition-all"
        >
          Draw Winners
        </button>
      )}
    </div>
  );
}
