"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/lib/store";

export default function WinnerCards() {
  const { state } = useSession();
  if (state.phase === "IDLE" || state.phase === "PRE_DRAW") return null;

  const last = state.results[state.results.length - 1];
  if (!last) return null;

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

      {state.results.length > 1 && (
        <div className="mt-10 text-center px-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Previous rounds
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-2 max-w-4xl">
            {state.results.slice(0, -1).map((r) => (
              <div
                key={r.roundNumber}
                className="text-xs text-amber-100/70 border border-amber-200/20 rounded-full px-3 py-1"
              >
                R{r.roundNumber}: {r.winners.map((w) => w.name).join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
