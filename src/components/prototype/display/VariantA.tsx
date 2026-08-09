"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// PROTOTYPE — Variant A: Constellation
// Names as glowing star-dots in organic clusters, connected by faint lines.
// Winners pulse and bloom into readable name cards.

interface Star {
  name: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  brightness: number;
  twinklePhase: number;
  twinkleSpeed: number;
  color: string;
}

const STAR_COLORS = ["#e0f0ff", "#c8e0ff", "#f0e8ff", "#ffe8d0", "#ffffff", "#d0e8ff"];

function buildStars(names: string[], width: number, height: number): Star[] {
  const margin = 60;
  const clusters = Math.ceil(names.length / 12);
  const clusterCenters: { cx: number; cy: number }[] = [];

  for (let i = 0; i < clusters; i++) {
    clusterCenters.push({
      cx: margin + Math.random() * (width - margin * 2),
      cy: margin + Math.random() * (height - margin * 2),
    });
  }

  return names.map((name, i) => {
    const center = clusterCenters[i % clusters];
    const spread = 80 + Math.random() * 60;
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * spread;
    return {
      name,
      x: center.cx + Math.cos(angle) * dist,
      y: center.cy + Math.sin(angle) * dist,
      baseX: center.cx + Math.cos(angle) * dist,
      baseY: center.cy + Math.sin(angle) * dist,
      size: 1.5 + Math.random() * 3,
      brightness: 0.4 + Math.random() * 0.6,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.01 + Math.random() * 0.03,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    };
  });
}

export default function VariantA({
  participants,
  winners,
  onDraw,
}: {
  participants: string[];
  winners: string[];
  onDraw: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
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
      starsRef.current = buildStars(participants, canvas.clientWidth, canvas.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    let animId: number;

    const drawStar = (s: Star, t: number, glowScale: number) => {
      const twinkle = 0.6 + 0.4 * Math.sin(s.twinklePhase + t * s.twinkleSpeed);
      const alpha = s.brightness * twinkle * glowScale;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.size * 3 * glowScale;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * glowScale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawLine = (a: Star, b: Star, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha * 0.15;
      ctx.strokeStyle = "#aaccff";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    };

    const loop = (time: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // deep space background
      const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
      bg.addColorStop(0, "#0a0a1a");
      bg.addColorStop(1, "#020208");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const stars = starsRef.current;
      const phase = phaseRef.current;
      const revealElapsed = phase === "revealing" ? (time - revealStartRef.current) / 1000 : 0;
      const revealDuration = 1.2; // seconds
      const revealProgress = Math.min(revealElapsed / revealDuration, 1);

      // ease out cubic
      const ease = 1 - Math.pow(1 - revealProgress, 3);

      // Draw constellation lines (pre-draw only, fade during reveal)
      const lineAlpha = phase === "idle" ? 1 : Math.max(0, 1 - revealProgress * 2);
      if (lineAlpha > 0) {
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              drawLine(stars[i], stars[j], lineAlpha * (1 - dist / 100));
            }
          }
        }
      }

      // Draw stars
      for (const star of stars) {
        const isWinner = winners.includes(star.name);

        if (phase === "idle") {
          // gentle drift
          star.x = star.baseX + Math.sin(time * 0.0005 + star.twinklePhase) * 3;
          star.y = star.baseY + Math.cos(time * 0.0007 + star.twinklePhase) * 3;
          drawStar(star, time, 1);
        } else if (phase === "revealing" || phase === "drawn") {
          // drift stops, winners glow up
          if (isWinner) {
            const glowScale = 1 + ease * 4;
            // Winner text label
            if (ease > 0.5) {
              const textAlpha = (ease - 0.5) * 2;
              ctx.save();
              ctx.globalAlpha = textAlpha;
              ctx.fillStyle = "#ffd700";
              ctx.font = `bold ${14 + ease * 10}px system-ui, sans-serif`;
              ctx.textAlign = "center";
              ctx.shadowColor = "#ffd700";
              ctx.shadowBlur = 20 * ease;
              ctx.fillText(star.name, star.x, star.y - star.size * glowScale - 10);
              ctx.restore();
            }
            drawStar(star, time, glowScale);
          } else {
            const fadeAlpha = Math.max(0, 1 - ease * 3);
            drawStar(star, time, fadeAlpha);
          }
        }
      }

      if (phase === "revealing" && revealProgress >= 1) {
        phaseRef.current = "drawn";
        setPhase("drawn");
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
