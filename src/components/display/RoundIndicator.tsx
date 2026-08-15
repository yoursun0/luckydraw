"use client";

import { useSession } from "@/lib/store";

export default function RoundIndicator() {
  const { state } = useSession();
  if (state.phase === "IDLE") return null;
  const isFinished = state.phase === "FINISHED";
  const totalWinners = state.results.reduce(
    (sum, r) => sum + r.winners.length,
    0
  );
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
        {isFinished ? "Complete" : "Round"}
      </p>
      <p className="text-3xl font-semibold mt-1 text-white">
        {isFinished
          ? `${totalWinners} ${totalWinners === 1 ? "winner" : "winners"}`
          : `${state.currentRound} of ${state.config.rounds}`}
      </p>
    </div>
  );
}
