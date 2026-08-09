"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import RoundIndicator from "./RoundIndicator";
import GalaxyCanvas from "./GalaxyCanvas";
import DrawButton from "./DrawButton";
import WinnerCards from "./WinnerCards";
import ProgressBar from "./ProgressBar";

function FullscreenButton() {
  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="absolute top-6 right-6 z-30 text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 rounded-full px-3 py-1 transition-colors"
    >
      ⛶ Fullscreen
    </button>
  );
}

export default function DisplayPage() {
  const router = useRouter();
  const { state, reset } = useSession();

  useEffect(() => {
    if (state.phase === "IDLE") {
      router.replace("/");
    }
  }, [state.phase, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.phase === "FINISHED") {
        reset();
        router.push("/");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, router, reset]);

  if (state.phase === "IDLE") return null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <GalaxyCanvas />
      <RoundIndicator />
      <WinnerCards />
      <DrawButton />
      <ProgressBar />
      <FullscreenButton />
      {state.phase === "FINISHED" && (
        <button
          type="button"
          onClick={() => {
            reset();
            router.push("/");
          }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-3 rounded-full text-lg font-semibold backdrop-blur transition-all"
        >
          New Draw
        </button>
      )}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-zinc-500 font-mono z-30">
        {state.config.eventTitle || "Lucky Draw"}
      </p>
    </main>
  );
}
