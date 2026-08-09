"use client";

import { useSession } from "@/lib/store";

export default function RoundIndicator() {
  const { state } = useSession();
  if (state.phase === "IDLE") return null;
  const isFinished = state.phase === "FINISHED";
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
        {isFinished ? "Complete" : "Round"}
      </p>
      <p className="text-3xl font-semibold mt-1 text-white">
        {isFinished
          ? `${state.results.length} of ${state.config.rounds}`
          : `${state.currentRound} of ${state.config.rounds}`}
      </p>
    </div>
  );
}
