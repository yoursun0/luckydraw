// src/lib/__tests__/reveal.test.ts
import { describe, it, expect } from "vitest";
import { stepRevealAnim, getWinnerDestination, REVEAL_DURATION_MS } from "../reveal";
import type { RevealAnimState } from "../reveal";

const idle: RevealAnimState = {
  revealing: false,
  revealStart: 0,
  lastRevealedRound: 0,
  lastRevealedWinners: [],
};

describe("stepRevealAnim", () => {
  it("does nothing in IDLE phase", () => {
    const next = stepRevealAnim(idle, 1000, "IDLE", 0, []);
    expect(next).toBe(idle);
  });

  it("does nothing in PRE_DRAW phase even with results", () => {
    const next = stepRevealAnim(idle, 1000, "PRE_DRAW", 1, ["Alice"]);
    expect(next).toBe(idle);
  });

  it("starts a reveal when entering REVEALING with a new result", () => {
    const next = stepRevealAnim(idle, 1000, "REVEALING", 1, ["Alice"]);
    expect(next.revealing).toBe(true);
    expect(next.revealStart).toBe(1000);
    expect(next.lastRevealedRound).toBe(1);
    expect(next.lastRevealedWinners).toEqual(["Alice"]);
  });

  it("does NOT re-trigger reveal when phase stays REVEALING but no new result (bug fix)", () => {
    const started = stepRevealAnim(idle, 1000, "REVEALING", 1, ["Alice"]);
    // Ticker keeps running with the same results.length
    const later = stepRevealAnim(started, 1500, "REVEALING", 1, ["Alice"]);
    expect(later).toBe(started);
  });

  it("ends the reveal after the duration has elapsed", () => {
    const started = stepRevealAnim(idle, 1000, "REVEALING", 1, ["Alice"]);
    const ended = stepRevealAnim(
      started,
      1000 + REVEAL_DURATION_MS + 1,
      "REVEALING",
      1,
      ["Alice"]
    );
    expect(ended.revealing).toBe(false);
    expect(ended.lastRevealedRound).toBe(1);
    expect(ended.lastRevealedWinners).toEqual(["Alice"]);
  });

  it("stays revealing while still within the duration window", () => {
    const started = stepRevealAnim(idle, 1000, "REVEALING", 1, ["Alice"]);
    const mid = stepRevealAnim(started, 1500, "REVEALING", 1, ["Alice"]);
    expect(mid.revealing).toBe(true);
  });

  it("starts a NEW reveal when a new round result is added", () => {
    let s = stepRevealAnim(idle, 1000, "REVEALING", 1, ["Alice"]);
    s = stepRevealAnim(s, 2500, "ROUND_COMPLETE", 1, ["Alice"]);
    s = stepRevealAnim(s, 3000, "PRE_DRAW", 1, ["Alice"]);
    // New round: state advances, user clicks Draw → REVEALING with results.length=2
    s = stepRevealAnim(s, 4000, "REVEALING", 2, ["Bob"]);
    expect(s.revealing).toBe(true);
    expect(s.revealStart).toBe(4000);
    expect(s.lastRevealedRound).toBe(2);
    expect(s.lastRevealedWinners).toEqual(["Bob"]);
  });

  it("does nothing in FINISHED phase when reveal has already ended", () => {
    const started = stepRevealAnim(idle, 1000, "REVEALING", 1, ["Alice"]);
    const ended = stepRevealAnim(
      started,
      3000,
      "REVEALING",
      1,
      ["Alice"]
    );
    // After duration: revealing is false
    const finished = stepRevealAnim(ended, 4000, "FINISHED", 1, ["Alice"]);
    // FINISHED phase doesn't reset; the result is the same as `ended`
    expect(finished).toBe(ended);
  });
});

describe("getWinnerDestination", () => {
  it("returns the burst radius", () => {
    const dest = getWinnerDestination(0, 0, 1);
    expect(dest.radius).toBe(290);
  });

  it("places a single winner at the base angle (no spread)", () => {
    const dest = getWinnerDestination(1.234, 0, 1);
    expect(dest.angle).toBeCloseTo(1.234);
  });

  it("spreads two winners symmetrically around the base angle", () => {
    const a = getWinnerDestination(0, 0, 2);
    const b = getWinnerDestination(0, 1, 2);
    expect(a.angle).toBeCloseTo(-0.3);
    expect(b.angle).toBeCloseTo(0.3);
  });

  it("centers three winners around the base angle", () => {
    expect(getWinnerDestination(0, 0, 3).angle).toBeCloseTo(-0.6);
    expect(getWinnerDestination(0, 1, 3).angle).toBeCloseTo(0);
    expect(getWinnerDestination(0, 2, 3).angle).toBeCloseTo(0.6);
  });

  it("all winners share the same radius regardless of position", () => {
    const positions = [0, 1, 2, 3, 4].map((i) =>
      getWinnerDestination(2.5, i, 5)
    );
    positions.forEach((p) => expect(p.radius).toBe(290));
  });
});
