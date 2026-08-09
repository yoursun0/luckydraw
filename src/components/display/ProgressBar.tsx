"use client";

import { useSession } from "@/lib/store";

export default function ProgressBar() {
  const { state } = useSession();
  if (state.phase === "IDLE") return null;
  const total = state.config.rounds;
  const done = state.results.length;
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-64">
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-300/80 transition-all duration-500"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
