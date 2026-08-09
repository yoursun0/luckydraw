"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

type Variant = {
  key: string;
  name: string;
};

export default function PrototypeSwitcher({
  variants,
}: {
  variants: Variant[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("variant") ?? variants[0]?.key ?? "A";

  const goTo = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("variant", key);
      router.replace(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const cycle = useCallback(
    (dir: 1 | -1) => {
      const idx = variants.findIndex((v) => v.key === current);
      const next = (idx + dir + variants.length) % variants.length;
      goTo(variants[next].key);
    },
    [current, variants, goTo]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle]);

  if (process.env.NODE_ENV === "production") return null;

  const currentVariant = variants.find((v) => v.key === current);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-lg border border-zinc-700 text-sm font-mono">
      <button
        onClick={() => cycle(-1)}
        className="hover:text-cyan-400 transition-colors px-1"
      >
        ←
      </button>
      <span className="text-zinc-400">
        <span className="text-cyan-400 font-bold">{currentVariant?.key}</span>
        <span className="mx-1">—</span>
        {currentVariant?.name}
      </span>
      <button
        onClick={() => cycle(1)}
        className="hover:text-cyan-400 transition-colors px-1"
      >
        →
      </button>
    </div>
  );
}
