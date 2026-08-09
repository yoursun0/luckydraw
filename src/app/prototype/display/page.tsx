"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import PrototypeSwitcher from "@/components/prototype/PrototypeSwitcher";
import VariantA from "@/components/prototype/display/VariantA";
import VariantB from "@/components/prototype/display/VariantB";
import VariantC from "@/components/prototype/display/VariantC";
import { SAMPLE_PARTICIPANTS, SAMPLE_WINNERS } from "./sample-data";

// PROTOTYPE — throwaway page for display screen variants
// Question: "Which visual interpretation of the celestial/cosmic starfield
// + instant winner reveal feels right?"
// Three variants, switchable via ?variant= URL param and ← → keys.

const VARIANTS = [
  { key: "A", name: "Constellation" },
  { key: "B", name: "Nebula Flow" },
  { key: "C", name: "Particle Galaxy" },
];

function VariantRouter() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";
  const [winners, setWinners] = useState<string[]>([]);
  const [drawn, setDrawn] = useState(false);

  const handleDraw = useCallback(() => {
    setWinners(SAMPLE_WINNERS);
    setDrawn(true);
  }, []);

  const handleReset = useCallback(() => {
    setWinners([]);
    setDrawn(false);
  }, []);

  return (
    <>
      {variant === "A" && (
        <VariantA
          participants={SAMPLE_PARTICIPANTS}
          winners={drawn ? winners : []}
          onDraw={handleDraw}
        />
      )}
      {variant === "B" && (
        <VariantB
          participants={SAMPLE_PARTICIPANTS}
          winners={drawn ? winners : []}
          onDraw={handleDraw}
        />
      )}
      {variant === "C" && (
        <VariantC
          participants={SAMPLE_PARTICIPANTS}
          winners={drawn ? winners : []}
          onDraw={handleDraw}
        />
      )}

      {/* Reset button after draw */}
      {drawn && (
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border border-white/20 px-4 py-2 rounded-full text-sm backdrop-blur transition-all z-40"
        >
          ↺ Reset
        </button>
      )}
    </>
  );
}

export default function Page() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Prototype info bar */}
      <div className="absolute top-4 left-4 text-white/40 text-xs font-mono z-40">
        PROTOTYPE — /prototype/display?variant=A|B|C
      </div>

      <Suspense fallback={<div className="w-full h-full bg-black" />}>
        <VariantRouter />
      </Suspense>

      {/* Floating switcher */}
      <Suspense fallback={null}>
        <PrototypeSwitcher variants={VARIANTS} />
      </Suspense>
    </div>
  );
}
