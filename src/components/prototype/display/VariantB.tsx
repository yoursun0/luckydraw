"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// PROTOTYPE — Variant B: Nebula Flow
// Names as floating text in aurora-like ribbons.
// Colors flow in waves. Winners surge forward, non-winners dissolve into light.

interface RibbonName {
  name: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  waveOffset: number;
  opacity: number;
  hue: number; // base hue in HSL
}

function buildRibbons(names: string[], width: number, height: number): RibbonName[] {
  const ribbons = 3 + Math.floor(names.length / 20);
  const namesPerRibbon = Math.ceil(names.length / ribbons);
  const result: RibbonName[] = [];
  const ribbonHeight = height / (ribbons + 1);

  let nameIdx = 0;
  for (let r = 0; r < ribbons && nameIdx < names.length; r++) {
    const baseY = ribbonHeight * (r + 1);
    const count = Math.min(namesPerRibbon, names.length - nameIdx);
    const spacing = width / (count + 1);
    for (let i = 0; i < count; i++) {
      result.push({
        name: names[nameIdx],
        x: spacing * (i + 1),
        y: baseY,
        baseX: spacing * (i + 1),
        baseY,
        size: 10 + Math.random() * 14,
        waveOffset: Math.random() * Math.PI * 2,
        opacity: 0.5 + Math.random() * 0.5,
        hue: 220 + Math.random() * 60, // blues → purples
      });
      nameIdx++;
    }
  }
  return result;
}

export default function VariantB({
  participants,
  winners,
  onDraw,
}: {
  participants: string[];
  winners: string[];
  onDraw: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const namesRef = useRef<RibbonName[]>([]);
  const phaseRef = useRef<"idle" | "revealing" | "drawn">("idle");
  const revealStartRef = useRef(0);
  const [, setPhase] = useState("idle");

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
      namesRef.current = buildRibbons(participants, canvas.clientWidth, canvas.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    let animId: number;

    const loop = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Deep space bg
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#050510");
      bg.addColorStop(0.5, "#0a0520");
      bg.addColorStop(1, "#050510");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const names = namesRef.current;
      const phase = phaseRef.current;
      const t = time * 0.001;

      if (phase === "idle") {
        // Wave motion
        for (const n of names) {
          const waveY = Math.sin(t * 0.8 + n.waveOffset + n.baseX * 0.005) * 20;
          const waveX = Math.cos(t * 0.6 + n.waveOffset) * 10;
          n.x = n.baseX + waveX;
          n.y = n.baseY + waveY;

          // Aurora color shift
          const hueShift = Math.sin(t * 0.3 + n.baseY * 0.01) * 30;
          const hue = (n.hue + hueShift) % 360;
          const alpha = n.opacity * (0.7 + 0.3 * Math.sin(t * 0.5 + n.waveOffset));

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = `hsl(${hue}, 70%, 70%)`;
          ctx.font = `${n.size}px system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
          ctx.shadowBlur = 8;
          ctx.fillText(n.name, n.x, n.y);
          ctx.restore();
        }
      } else {
        const elapsed = (time - revealStartRef.current) / 1000;
        const progress = Math.min(elapsed / 1.0, 1);
        const ease = 1 - Math.pow(1 - progress, 3);

        for (const n of names) {
          const isWinner = winners.includes(n.name);
          const waveY = Math.sin(t * 0.5 + n.waveOffset) * 10 * (1 - ease);
          n.x = n.baseX + Math.cos(t * 0.3 + n.waveOffset) * 10 * (1 - ease);
          n.y = n.baseY + waveY;

          if (isWinner) {
            // Surge forward: grow, brighten, center
            const targetX = w / 2;
            const targetY = h / 2 + (winners.indexOf(n.name) - (winners.length - 1) / 2) * 50;
            n.x += (targetX - n.x) * ease;
            n.y += (targetY - n.y) * ease;
            const glowSize = n.size + ease * 18;

            ctx.save();
            ctx.globalAlpha = 0.7 + ease * 0.3;
            ctx.fillStyle = `hsl(45, 100%, ${60 + ease * 30}%)`; // warm gold
            ctx.font = `bold ${glowSize}px system-ui, sans-serif`;
            ctx.textAlign = "center";
            ctx.shadowColor = "#ffd700";
            ctx.shadowBlur = 30 * ease;
            ctx.fillText(n.name, n.x, n.y);
            ctx.restore();
          } else {
            // Dissolve into light particles
            const alpha = Math.max(0, n.opacity * (1 - ease * 2.5));
            if (alpha > 0.01) {
              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.fillStyle = `hsl(${n.hue}, 50%, 60%)`;
              ctx.font = `${n.size}px system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.fillText(n.name, n.x, n.y);
              ctx.restore();
            } else {
              // Particle scatter
              const px = n.x + (Math.random() - 0.5) * 30 * ease;
              const py = n.y + (Math.random() - 0.5) * 30 * ease;
              ctx.save();
              ctx.globalAlpha = 0.3 * (1 - progress);
              ctx.fillStyle = `hsl(${n.hue}, 70%, 80%)`;
              ctx.beginPath();
              ctx.arc(px, py, 1.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }

        if (progress >= 1 && phase === "revealing") {
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
