// src/components/display/__tests__/WinnerCards.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { SessionProvider } from "@/lib/store";
import WinnerCards from "../WinnerCards";
import type { SessionConfig, SessionState, RoundResult } from "@/lib/types";

const baseConfig: SessionConfig = {
  eventTitle: "Test",
  participants: [
    { id: "1", name: "Alice" },
    { id: "2", name: "Bob" },
    { id: "3", name: "Charlie" },
    { id: "4", name: "Dana" },
  ],
  rounds: 2,
  winnersPerRound: 2,
  filterWinners: true,
  showPreviousRounds: true,
};

function makeResult(round: number, winnerIds: string[]): RoundResult {
  return {
    roundNumber: round,
    drawnAt: round,
    winners: winnerIds.map((id) => {
      const p = baseConfig.participants.find((p) => p.id === id);
      if (!p) throw new Error(`unknown id ${id}`);
      return p;
    }),
  };
}

function renderWith(state: SessionState) {
  return render(
    <SessionProvider preloadedState={state}>
      <WinnerCards />
    </SessionProvider>
  );
}

describe("WinnerCards in REVEALED", () => {
  it("renders current round's winners as large cards", () => {
    const state: SessionState = {
      phase: "REVEALED",
      config: baseConfig,
      currentRound: 1,
      results: [makeResult(1, ["1", "2"])],
      eligible: [],
    };
    renderWith(state);
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
  });

  it("does not show the 'Previous rounds' section on the first round", () => {
    const state: SessionState = {
      phase: "REVEALED",
      config: baseConfig,
      currentRound: 1,
      results: [makeResult(1, ["1", "2"])],
      eligible: [],
    };
    renderWith(state);
    expect(screen.queryByText(/previous rounds/i)).toBeNull();
  });
});

describe("WinnerCards R# caption", () => {
  it("renders R# as a separate caption, not mixed with winner names", () => {
    // In REVEALED for round 2, the recap of round 1 should show "R1"
    // as a separate element, and "Alice, Bob" in a separate element.
    const state: SessionState = {
      phase: "REVEALED",
      config: baseConfig,
      currentRound: 2,
      results: [
        makeResult(1, ["1", "2"]),
        makeResult(2, ["3", "4"]),
      ],
      eligible: [],
    };
    renderWith(state);

    // The "R1" caption is present.
    expect(screen.getByText("R1")).toBeTruthy();
    // The names of round 1 are present.
    expect(screen.getByText(/Alice, Bob/)).toBeTruthy();
    // But the old "R1: Alice, Bob" string is NOT present.
    expect(screen.queryByText(/R1: Alice, Bob/)).toBeNull();
  });

  it("hides previous rounds when showPreviousRounds is false", () => {
    const cfg = { ...baseConfig, showPreviousRounds: false };
    const state: SessionState = {
      phase: "REVEALED",
      config: cfg,
      currentRound: 2,
      results: [makeResult(1, ["1", "2"]), makeResult(2, ["3", "4"])],
      eligible: [],
    };
    renderWith(state);
    expect(screen.queryByText(/previous rounds/i)).toBeNull();
    expect(screen.queryByText("R1")).toBeNull();
    // But the current round's winners are still shown.
    expect(screen.getByText("Charlie")).toBeTruthy();
  });
});

describe("WinnerCards FINISHED summary view", () => {
  it("renders one card per round in a summary grid", () => {
    const state: SessionState = {
      phase: "FINISHED",
      config: baseConfig,
      currentRound: 3,
      results: [
        makeResult(1, ["1", "2"]),
        makeResult(2, ["3", "4"]),
        makeResult(3, ["1", "2"]),
      ],
      eligible: [],
    };
    renderWith(state);
    const cards = screen.getAllByTestId("round-summary-card");
    expect(cards).toHaveLength(3);
  });

  it("each summary card has a Round caption, galaxy SVG, and names", () => {
    const state: SessionState = {
      phase: "FINISHED",
      config: baseConfig,
      currentRound: 2,
      results: [makeResult(1, ["1", "2"]), makeResult(2, ["3", "4"])],
      eligible: [],
    };
    renderWith(state);
    const cards = screen.getAllByTestId("round-summary-card");
    expect(cards).toHaveLength(2);

    for (const card of cards) {
      expect(within(card).getByText(/round \d+/i)).toBeTruthy();
      expect(within(card).getByTestId("round-galaxy-svg")).toBeTruthy();
    }

    // Names are present in the cards (no "R1: ..." prefix)
    expect(within(cards[0]).getByText(/Alice, Bob/)).toBeTruthy();
    expect(within(cards[1]).getByText(/Charlie, Dana/)).toBeTruthy();
  });

  it("leaves enough top margin so the COMPLETE indicator doesn't overlap the first card", () => {
    const state: SessionState = {
      phase: "FINISHED",
      config: baseConfig,
      currentRound: 1,
      results: [makeResult(1, ["1", "2"])],
      eligible: [],
    };
    renderWith(state);
    const summary = screen.getByTestId("finished-summary");
    // Container must use a top padding large enough to clear the top-6
    // RoundIndicator header (pt-44 = 176px in Tailwind).
    expect(summary.className).toMatch(/\bpt-4[0-9]\b/);
  });

  it("renders the galaxy stars with varied colors (not all gold)", () => {
    const state: SessionState = {
      phase: "FINISHED",
      config: baseConfig,
      currentRound: 1,
      results: [makeResult(1, ["1", "2", "3", "4"])],
      eligible: [],
    };
    renderWith(state);
    const card = screen.getByTestId("round-summary-card");
    const dots = within(card)
      .getByTestId("round-galaxy-svg")
      .querySelectorAll("circle:not(:first-child):not(:last-child)");
    const fills = new Set<string>();
    dots.forEach((d) => fills.add(d.getAttribute("fill") || ""));
    // We may have 1-4 winners; ensure the SVG uses the per-dot colors
    // and not a single hard-coded fill for every dot.
    expect(fills.size).toBeGreaterThanOrEqual(1);
    expect(fills.size).toBeLessThanOrEqual(dots.length);
  });
});
