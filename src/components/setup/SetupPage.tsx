"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import { detectAndParse, numberedListText } from "@/lib/participants";
import { validateConfig } from "@/lib/config";
import type { SessionConfig } from "@/lib/types";

export default function SetupPage() {
  const router = useRouter();
  const { startSession, state } = useSession();
  const lastConfig = state.config;

  // Pre-fill the form from the last session's config (kept after "New Draw"
  // via the store's returnToSetup action). Falls back to defaults when the
  // user has no previous session.
  const [eventTitle, setEventTitle] = useState(lastConfig?.eventTitle ?? "");
  const [input, setInput] = useState(
    lastConfig ? lastConfig.participants.map((p) => p.name).join("\n") : ""
  );
  const [rounds, setRounds] = useState(lastConfig?.rounds ?? 1);
  const [winnersPerRound, setWinnersPerRound] = useState(
    lastConfig?.winnersPerRound ?? 1
  );
  const [filterWinners, setFilterWinners] = useState(
    lastConfig?.filterWinners ?? true
  );
  const [showPreviousRounds, setShowPreviousRounds] = useState(
    lastConfig?.showPreviousRounds ?? true
  );
  // Separate state for the bulk-generate input. Independent of `input` so
  // typing here never clobbers a hand-written participant list until the user
  // explicitly clicks Generate.
  const [generateCount, setGenerateCount] = useState<number>(0);

  const participants = useMemo(() => detectAndParse(input), [input]);

  const config: SessionConfig = useMemo(
    () => ({
      eventTitle: eventTitle.trim(),
      participants,
      rounds,
      winnersPerRound,
      filterWinners,
      showPreviousRounds,
    }),
    [eventTitle, participants, rounds, winnersPerRound, filterWinners, showPreviousRounds]
  );

  const validation = useMemo(() => validateConfig(config), [config]);

  const handleGenerate = () => {
    if (generateCount < 1) return;
    setInput(numberedListText(generateCount));
  };

  const handleStart = () => {
    if (!validation.ok) return;
    startSession(config);
    router.push("/display");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Lucky Draw</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Configure your event and start drawing.
          </p>
        </header>

        <section className="space-y-2">
          <label
            htmlFor="event-title"
            className="block text-sm font-medium text-zinc-300"
          >
            Event title
          </label>
          <input
            id="event-title"
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="e.g. Annual Gala 2026"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </section>

        <section className="space-y-2">
          <label
            htmlFor="participants"
            className="block text-sm font-medium text-zinc-300"
          >
            Participants
          </label>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="generate-count"
                className="block text-xs text-zinc-500 mb-1"
              >
                Number of participants
              </label>
              <input
                id="generate-count"
                type="number"
                min={1}
                max={1000}
                value={generateCount || ""}
                onChange={(e) =>
                  setGenerateCount(Math.max(0, parseInt(e.target.value || "0", 10)))
                }
                placeholder="e.g. 200"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generateCount < 1}
              className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-zinc-200 border border-zinc-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Generate
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Paste one name per line, or a single number to auto-generate.
          </p>
          <textarea
            id="participants"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            placeholder={"Alice\nBob\nCharlie\n…\n100"}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white placeholder-zinc-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          <p className="text-xs text-zinc-500" data-testid="participant-count">
            {participants.length} participant
            {participants.length === 1 ? "" : "s"}
          </p>
        </section>

        <section className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="rounds"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Rounds
            </label>
            <input
              id="rounds"
              type="number"
              min={1}
              value={rounds}
              onChange={(e) =>
                setRounds(Math.max(1, parseInt(e.target.value || "1", 10)))
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>
          <div>
            <label
              htmlFor="wpr"
              className="block text-sm font-medium text-zinc-300 mb-1"
            >
              Winners/round
            </label>
            <input
              id="wpr"
              type="number"
              min={1}
              value={winnersPerRound}
              onChange={(e) =>
                setWinnersPerRound(
                  Math.max(1, parseInt(e.target.value || "1", 10))
                )
              }
              className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterWinners}
                onChange={(e) => setFilterWinners(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700"
              />
              <span className="text-sm text-zinc-300">No repeat winners</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={showPreviousRounds}
                onChange={(e) => setShowPreviousRounds(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700"
              />
              <span className="text-sm text-zinc-300">
                Show previous rounds
              </span>
            </label>
          </div>
        </section>

        {!validation.ok && (
          <p role="alert" className="text-sm text-rose-400">
            {validation.error}
          </p>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={!validation.ok}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold py-3 rounded-md transition-colors"
        >
          Start
        </button>
      </div>
    </main>
  );
}
