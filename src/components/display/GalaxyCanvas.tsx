"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/store";
import type { Participant } from "@/lib/types";

interface Particle {
  name: string;
  id: string;
  angle: number;
  baseAngle: number;
  radius: number;
  baseRadius: number;
  size: number;
  speed: number;
  color: { r: number; g: number; b: number };
}

const IDLE_AFTER_MS = 30_000;
const REVEAL_DURATION_MS = 1200;
const COLLAPSE_DURATION_MS = 600;

function lerpColor(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
  t: number
) {
  return {
    r: Math.round(r1 + (r2 - r1) * t),
    g: Math.round(g1 + (g2 - g1) * t),
    b: Math.round(b1 + (b2 - b1) * t),
  };
}

function buildParticles(
  participants: Participant[],
  width: number,
  height: number
): Particle[] {
  const maxRadius = Math.min(width, height) * 0.42;
  const minRadius = maxRadius * 0.05;
  const arms = 3;
  return participants.map((p, i) => {
    const t = participants.length === 0 ? 0 : i / participants.length;
    const rawRadius = Math.sqrt(t) * (maxRadius - minRadius) + minRadius;
    const armIndex = arms > 0 ? i % arms : 0;
    const baseAngle = (armIndex / Math.max(arms, 1)) * Math.PI * 2 + rawRadius * 0.02;
    const scatter = (Math.random() - 0.5) * 0.5 * (1 - rawRadius / maxRadius);
    return {
      id: p.id,
      name: p.name,
      angle: baseAngle + scatter,
      baseAngle: baseAngle + scatter,
      radius: rawRadius,
      baseRadius: rawRadius,
      size: 1 + Math.random() * 2.5,
      speed: 0.0002 + Math.random() * 0.0003,
      color: lerpColor(80, 140, 255, 255, 200, 50, rawRadius / maxRadius),
    };
  });
}

export default function GalaxyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { state } = useSession();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const PIXI = await import("pixi.js");
      if (cancelled) return;

      const app = new PIXI.Application();
      await app.init({
        background: 0x020208,
        resizeTo: container,
        antialias: true,
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }
      container.appendChild(app.canvas);

      const particles: Particle[] = [];
      const cursor = { x: -9999, y: -9999, active: false };
      let lastMove = performance.now();
      let revealing = false;
      let revealStart = 0;
      let lastRevealedWinners: string[] = [];

      function rebuildParticles() {
        const eligible = stateRef.current.eligible;
        const w = app.renderer.width;
        const h = app.renderer.height;
        const created = buildParticles(eligible, w, h);
        particles.length = 0;
        particles.push(...created);
      }

      rebuildParticles();

      const onResize = () => rebuildParticles();
      app.renderer.on("resize", onResize);

      const onMove = (e: MouseEvent) => {
        const rect = (app.canvas as HTMLCanvasElement).getBoundingClientRect();
        cursor.x = e.clientX - rect.left;
        cursor.y = e.clientY - rect.top;
        cursor.active = true;
        lastMove = performance.now();
      };
      const onLeave = () => {
        cursor.active = false;
      };
      app.canvas.addEventListener("mousemove", onMove);
      app.canvas.addEventListener("mouseleave", onLeave);

      const graphics = new PIXI.Graphics();
      app.stage.addChild(graphics);

      app.ticker.add(() => {
        const w = app.renderer.width;
        const h = app.renderer.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxRadius = Math.min(w, h) * 0.42;
        const now = performance.now();
        const idleMs = now - lastMove;
        const sleeping = idleMs > IDLE_AFTER_MS;
        const brightness = sleeping ? 0.4 : 1;
        const speedScale = sleeping ? 0.15 : 1;

        const currentPhase = stateRef.current.phase;
        if (currentPhase === "REVEALING" && !revealing) {
          revealing = true;
          revealStart = now;
        }
        if (currentPhase === "REVEALING") {
          const last = stateRef.current.results[stateRef.current.results.length - 1];
          if (last) lastRevealedWinners = last.winners.map((w) => w.name);
        }
        if (currentPhase === "PRE_DRAW" && !revealing) {
          // sync eligible if it changed (e.g., filter applied between rounds)
          if (stateRef.current.eligible.length !== particles.length) {
            rebuildParticles();
          }
        }

        graphics.clear();

        if (!revealing) {
          for (const p of particles) {
            p.angle += p.speed * speedScale;
            let px = cx + Math.cos(p.angle) * p.radius;
            let py = cy + Math.sin(p.angle) * p.radius;
            if (cursor.active) {
              const dx = cursor.x - px;
              const dy = cursor.y - py;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 220 && dist > 0) {
                const force = (1 - dist / 220) * 25;
                px += (dx / dist) * force;
                py += (dy / dist) * force;
              }
            }
            const { r, g, b } = p.color;
            graphics.circle(px, py, p.size);
            graphics.fill({ color: (r << 16) | (g << 8) | b, alpha: brightness });
          }
        } else {
          const elapsed = now - revealStart;
          const p1 = Math.min(elapsed / COLLAPSE_DURATION_MS, 1);
          const p2 = Math.max(
            0,
            Math.min(
              (elapsed - COLLAPSE_DURATION_MS) /
                (REVEAL_DURATION_MS - COLLAPSE_DURATION_MS),
              1
            )
          );
          const e1 = 1 - Math.pow(1 - p1, 2);
          const e2 = 1 - Math.pow(1 - p2, 3);
          for (const p of particles) {
            const isWinner = lastRevealedWinners.includes(p.name);
            p.radius = p.baseRadius - (p.baseRadius - 10) * e1;
            const px = cx + Math.cos(p.baseAngle) * p.radius;
            const py = cy + Math.sin(p.baseAngle) * p.radius;
            if (isWinner) {
              const burstR = 10 + e2 * 280;
              const idx = lastRevealedWinners.indexOf(p.name);
              const burstA =
                p.baseAngle +
                e2 * (idx - (lastRevealedWinners.length - 1) / 2) * 0.6;
              const bx = cx + Math.cos(burstA) * burstR;
              const by = cy + Math.sin(burstA) * burstR;
              const tx = px + (bx - px) * e2;
              const ty = py + (by - py) * e2;
              graphics.circle(tx, ty, 8 + e2 * 24);
              graphics.fill({ color: 0xffd700, alpha: 0.7 * e2 });
            } else {
              const alpha = Math.max(0, 1 - e1 * 2.5);
              if (alpha > 0.01) {
                const { r, g, b } = p.color;
                graphics.circle(px, py, p.size * (1 - e1));
                graphics.fill({ color: (r << 16) | (g << 8) | b, alpha: alpha * 0.5 });
              }
            }
          }
          if (elapsed >= REVEAL_DURATION_MS) {
            revealing = false;
          }
        }

        // core glow
        graphics.circle(cx, cy, maxRadius * 0.18);
        graphics.fill({ color: 0xffdc64, alpha: 0.05 * brightness });
      });

      cleanup = () => {
        app.canvas.removeEventListener("mousemove", onMove);
        app.canvas.removeEventListener("mouseleave", onLeave);
        app.renderer.off("resize", onResize);
        app.destroy(true, { children: true });
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}
