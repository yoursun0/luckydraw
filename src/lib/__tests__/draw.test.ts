// src/lib/__tests__/draw.test.ts
import { describe, it, expect } from "vitest";
import { selectWinners } from "../draw";
import type { Participant } from "../types";

const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
  id: String(i + 1),
  name: `P${i + 1}`,
}));

describe("selectWinners", () => {
  it("returns N winners from the eligible pool", () => {
    const winners = selectWinners(participants, 3);
    expect(winners).toHaveLength(3);
    winners.forEach((w) => {
      expect(participants).toContainEqual(w);
    });
  });

  it("returns all eligible if N >= pool size", () => {
    const winners = selectWinners(participants.slice(0, 3), 5);
    expect(winners).toHaveLength(3);
  });

  it("returns unique winners (no duplicates)", () => {
    const winners = selectWinners(participants, 8);
    const ids = winners.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("respects excluded list", () => {
    const excluded = participants.slice(0, 2);
    const winners = selectWinners(participants, 3, { exclude: excluded });
    winners.forEach((w) => {
      expect(excluded).not.toContainEqual(w);
    });
  });

  it("returns empty array if pool is empty", () => {
    expect(selectWinners([], 3)).toEqual([]);
  });

  it("uses injectable RNG for determinism", () => {
    // Simple deterministic PRNG (mulberry32)
    function makeRng(seed: number) {
      let a = seed;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const a = selectWinners(participants, 4, { random: makeRng(42) });
    const b = selectWinners(participants, 4, { random: makeRng(42) });
    expect(a).toEqual(b);
  });

  it("different seeds produce different (often) results", () => {
    function makeRng(seed: number) {
      let a = seed;
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const a = selectWinners(participants, 8, { random: makeRng(1) });
    const b = selectWinners(participants, 8, { random: makeRng(2) });
    // With 8 picks from 10, identical sequences are very unlikely from different seeds
    expect(a).not.toEqual(b);
  });
});
