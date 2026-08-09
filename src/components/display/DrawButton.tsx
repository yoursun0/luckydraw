"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/store";

export default function DrawButton() {
  const { state, drawAuto, finishAndAdvance } = useSession();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable
      )
        return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (state.phase === "PRE_DRAW") drawAuto();
        else if (state.phase === "REVEALING") finishAndAdvance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, drawAuto, finishAndAdvance]);

  if (state.phase === "PRE_DRAW") {
    return (
      <button
        type="button"
        onClick={drawAuto}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-full text-lg font-semibold backdrop-blur transition-all"
      >
        Draw
      </button>
    );
  }

  if (state.phase === "REVEALING") {
    return (
      <button
        type="button"
        onClick={finishAndAdvance}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-amber-300/20 hover:bg-amber-300/30 text-amber-100 border border-amber-200/40 px-6 py-2 rounded-full text-sm font-medium backdrop-blur transition-all"
      >
        Next ▸
      </button>
    );
  }

  return null;
}
