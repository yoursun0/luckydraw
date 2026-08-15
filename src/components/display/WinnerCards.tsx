"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/lib/store";
import { galaxyDotPositions } from "@/lib/galaxy";

export default function WinnerCards() {
  const { state } = useSession();
  // Winners only show AFTER the canvas reveal animation finishes
  // (REVEALED → ROUND_COMPLETE → FINISHED). During REVEALING the canvas is
  // still running its collapse/burst animation, so we hide the cards.
  if (
    state.phase === "IDLE" ||
    state.phase === "PRE_DRAW" ||
    state.phase === "REVEALING"
  ) {
    return null;
  }

  if (state.phase === "FINISHED") {
    return <SummaryView results={state.results} />;
  }

  // REVEALED / ROUND_COMPLETE: current round, large cards + optional recap.
  const last = state.results[state.results.length - 1];
  if (!last) return null;
  const showPreviousRounds = state.config.showPreviousRounds;
  const previous = state.results.slice(0, -1);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
      <AnimatePresence>
        <motion.div
          key={`round-${last.roundNumber}-${state.phase}`}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
          className="flex flex-wrap gap-4 justify-center max-w-5xl px-6"
        >
          {last.winners.map((w) => (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, y: 20, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 140, damping: 16 }}
              className="rounded-xl border border-amber-300/40 bg-amber-300/10 px-6 py-4 text-amber-100 shadow-[0_0_60px_rgba(255,215,0,0.25)] backdrop-blur"
            >
              <p className="text-xs uppercase tracking-widest text-amber-200/70">
                Winner
              </p>
              <p className="text-2xl font-semibold mt-1">{w.name}</p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {showPreviousRounds && previous.length > 0 && (
        <div className="mt-10 text-center px-6 max-w-4xl">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
            Previous rounds
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            {previous.map((r) => (
              <PreviousRoundRecap key={r.roundNumber} round={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviousRoundRecap({ round }: { round: import("@/lib/types").RoundResult }) {
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1.5">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono">
        R{round.roundNumber}
      </p>
      <div className="rounded-full border border-amber-200/20 bg-amber-300/5 px-4 py-1.5 text-sm text-amber-100/80 max-w-xs truncate">
        {round.winners.map((w) => w.name).join(", ")}
      </div>
    </div>
  );
}

function SummaryView({
  results,
}: {
  results: import("@/lib/types").RoundResult[];
}) {
  // Each round gets an equal-sized card. The mini-galaxy SVG inside the
  // card visualises that round's winners as a spiral of colored stars, so
  // no single round visually dominates the final screen.
  //
  // The container is anchored to the top (justify-start) with a large
  // top padding so the COMPLETE / N winners indicator (positioned at
  // top-6 in RoundIndicator) never overlaps the first card.
  return (
    <div
      data-testid="finished-summary"
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-start px-6 pt-44 pb-16 overflow-y-auto"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl w-full">
        {results.map((r) => (
          <RoundSummaryCard key={r.roundNumber} round={r} />
        ))}
      </div>
    </div>
  );
}

function RoundSummaryCard({
  round,
}: {
  round: import("@/lib/types").RoundResult;
}) {
  const dots = galaxyDotPositions(round.winners.length, round.roundNumber);
  const gradId = `glow-${round.roundNumber}`;
  return (
    <div
      data-testid="round-summary-card"
      className="pointer-events-auto rounded-2xl border border-amber-200/20 bg-zinc-900/60 backdrop-blur p-5 flex flex-col items-center gap-3 shadow-[0_0_30px_rgba(255,215,0,0.08)]"
    >
      <p className="text-xs uppercase tracking-[0.25em] text-amber-200/70 font-mono">
        Round {round.roundNumber}
      </p>
      <svg
        data-testid="round-galaxy-svg"
        viewBox="0 0 100 100"
        className="w-32 h-32"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={gradId}>
            <stop offset="0%" stopColor="rgba(255,215,0,0.25)" />
            <stop offset="60%" stopColor="rgba(255,215,0,0.05)" />
            <stop offset="100%" stopColor="rgba(255,215,0,0)" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill={`url(#${gradId})`} />
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} />
        ))}
        <circle cx="50" cy="50" r="2" fill="#fff" opacity="0.9" />
      </svg>
      <p className="text-sm text-amber-100/80 text-center leading-relaxed">
        {round.winners.map((w) => w.name).join(", ")}
      </p>
    </div>
  );
}
