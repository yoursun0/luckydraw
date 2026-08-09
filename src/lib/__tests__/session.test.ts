// src/lib/__tests__/session.test.ts
import { describe, it, expect } from "vitest";
import { createInitialSession, startReveal, finishReveal, advanceRound } from "../session";
import type { SessionConfig, Participant } from "../types";

const config: SessionConfig = {
  eventTitle: "Test",
  participants: Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1),
    name: `P${i + 1}`,
  })),
  rounds: 3,
  winnersPerRound: 2,
  filterWinners: true,
};

describe("createInitialSession", () => {
  it("initializes with round 1, phase PRE_DRAW, eligible = all", () => {
    const state = createInitialSession(config);
    expect(state.currentRound).toBe(1);
    expect(state.phase).toBe("PRE_DRAW");
    expect(state.eligible).toEqual(config.participants);
    expect(state.results).toEqual([]);
  });
});

describe("startReveal", () => {
  it("moves to REVEALING and stores winners for current round", () => {
    const state0 = createInitialSession(config);
    const winners: Participant[] = [
      { id: "1", name: "P1" },
      { id: "2", name: "P2" },
    ];
    const state1 = startReveal(state0, winners);
    expect(state1.phase).toBe("REVEALING");
    expect(state1.results).toHaveLength(1);
    expect(state1.results[0].roundNumber).toBe(1);
    expect(state1.results[0].winners).toEqual(winners);
  });

  it("does nothing if not in PRE_DRAW", () => {
    const state0 = createInitialSession(config);
    const state1 = startReveal(state0, [{ id: "1", name: "P1" }]);
    const state2 = startReveal(state1, [{ id: "2", name: "P2" }]);
    expect(state2.results).toHaveLength(1);
  });
});

describe("finishReveal", () => {
  it("moves to ROUND_COMPLETE and applies filter if enabled", () => {
    const state0 = createInitialSession(config);
    const winners: Participant[] = [
      { id: "1", name: "P1" },
      { id: "2", name: "P2" },
    ];
    const state1 = startReveal(state0, winners);
    const state2 = finishReveal(state1);
    expect(state2.phase).toBe("ROUND_COMPLETE");
    expect(state2.eligible).toHaveLength(8);
    expect(state2.eligible.find((p) => p.id === "1")).toBeUndefined();
  });

  it("does not filter if filterWinners is false", () => {
    const cfg = { ...config, filterWinners: false };
    const state0 = createInitialSession(cfg);
    const winners: Participant[] = [
      { id: "1", name: "P1" },
      { id: "2", name: "P2" },
    ];
    const state1 = startReveal(state0, winners);
    const state2 = finishReveal(state1);
    expect(state2.eligible).toHaveLength(10);
  });

  it("does nothing if not in REVEALING", () => {
    const state0 = createInitialSession(config);
    const state1 = finishReveal(state0);
    expect(state1.phase).toBe("PRE_DRAW");
  });
});

describe("advanceRound", () => {
  it("moves to next PRE_DRAW or FINISHED if last round", () => {
    let state = createInitialSession(config);
    for (let i = 1; i <= 2; i++) {
      const winners = state.eligible.slice(0, 2);
      state = startReveal(state, winners);
      state = finishReveal(state);
      state = advanceRound(state);
      expect(state.currentRound).toBe(i + 1);
      expect(state.phase).toBe(i + 1 <= config.rounds ? "PRE_DRAW" : "FINISHED");
    }
  });

  it("moves to FINISHED after last round", () => {
    const cfg: SessionConfig = { ...config, rounds: 1 };
    let state = createInitialSession(cfg);
    const winners = state.eligible.slice(0, 1);
    state = startReveal(state, winners);
    state = finishReveal(state);
    state = advanceRound(state);
    expect(state.phase).toBe("FINISHED");
  });

  it("moves to FINISHED if eligible pool is too small for next round", () => {
    const cfg: SessionConfig = { ...config, rounds: 3, winnersPerRound: 2 };
    let state = createInitialSession(cfg);
    // Round 1
    state = startReveal(state, state.eligible.slice(0, 2));
    state = finishReveal(state);
    state = advanceRound(state);
    expect(state.phase).toBe("PRE_DRAW");
    // Round 2
    state = startReveal(state, state.eligible.slice(0, 2));
    state = finishReveal(state);
    state = advanceRound(state);
    // 6 picked, 4 left, but need 2 → can still draw
    expect(state.phase).toBe("PRE_DRAW");
    // Round 3
    state = startReveal(state, state.eligible.slice(0, 2));
    state = finishReveal(state);
    state = advanceRound(state);
    // 8 picked, 2 left, but rounds=3 → FINISHED
    expect(state.phase).toBe("FINISHED");
  });
});
