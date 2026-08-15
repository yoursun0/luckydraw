"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/store";
import { getAudioContext, playFanfare } from "@/lib/audio";

/**
 * Plays the "ta-da" fanfare exactly once each time the session transitions
 * into REVEALED (i.e. the canvas reveal animation has just finished and
 * winners are about to be displayed).
 */
export default function AudioController() {
  const phase = useSession().state.phase;
  const lastPhase = useRef(phase);

  useEffect(() => {
    if (lastPhase.current !== "REVEALED" && phase === "REVEALED") {
      try {
        const ctx = getAudioContext();
        playFanfare(ctx);
      } catch {
        // Audio is a nice-to-have; never break the app if Web Audio is
        // unavailable (e.g. SSR, very old browsers).
      }
    }
    lastPhase.current = phase;
  }, [phase]);

  return null;
}
