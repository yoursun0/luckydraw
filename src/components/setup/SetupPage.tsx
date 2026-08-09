"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/store";
import { detectAndParse } from "@/lib/participants";
import { validateConfig } from "@/lib/config";
import type { SessionConfig } from "@/lib/types";

export default function SetupPage() {
  const router = useRouter();
  const { startSession } = useSession();

  const [eventTitle, setEventTitle] = useState("");
  const [input, setInput] = useState("");
  const [rounds, setRounds] = useState(1);
  const [winnersPerRound, setWinnersPerRound] = useState(1);
  const [filterWinners, setFilterWinners] = useState(true);

  const participants = useMemo(() => detectAndParse(input), [input]);

  const config: SessionConfig = useMemo(
    () => ({
      eventTitle: eventTitle.trim(),
      participants,
      rounds,
      winnersPerRound,
      filterWinners,
    }),
    [eventTitle, participants, rounds, winnersPerRound, filterWinners]
  );

  const validation = useMemo(() => validateConfig(config), [config]);

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
          <p className="text-xs text-zinc-500">
            Paste one name per line, or a single number to auto-generate. CSV
            with a header is detected automatically.
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
          <div className="flex flex-col">
            <span className="block text-sm font-medium text-zinc-300 mb-1">
              Filter
            </span>
            <label className="inline-flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={filterWinners}
                onChange={(e) => setFilterWinners(e.target.checked)}
                className="rounded bg-zinc-900 border-zinc-700"
              />
              <span className="text-sm text-zinc-300">No repeat winners</span>
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
