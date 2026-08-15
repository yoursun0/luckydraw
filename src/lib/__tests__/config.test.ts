// src/lib/__tests__/config.test.ts
import { describe, it, expect } from "vitest";
import { validateConfig } from "../config";
import type { SessionConfig } from "../types";

const base: SessionConfig = {
  eventTitle: "Test",
  participants: Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1),
    name: `P${i + 1}`,
  })),
  rounds: 2,
  winnersPerRound: 1,
  filterWinners: true,
  showPreviousRounds: true,
};

describe("validateConfig", () => {
  it("passes for valid config", () => {
    expect(validateConfig(base)).toEqual({ ok: true });
  });

  it("rejects too few participants", () => {
    const result = validateConfig({
      ...base,
      participants: base.participants.slice(0, 2),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/at least 3/i);
    }
  });

  it("rejects too many participants", () => {
    const big = Array.from({ length: 1001 }, (_, i) => ({
      id: String(i + 1),
      name: `P${i + 1}`,
    }));
    const result = validateConfig({ ...base, participants: big });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/at most 1000/i);
    }
  });

  it("rejects rounds < 1", () => {
    const result = validateConfig({ ...base, rounds: 0 });
    expect(result.ok).toBe(false);
  });

  it("rejects winnersPerRound < 1", () => {
    const result = validateConfig({ ...base, winnersPerRound: 0 });
    expect(result.ok).toBe(false);
  });

  it("rejects when winnersPerRound * rounds > participants (with filter)", () => {
    const result = validateConfig({
      ...base,
      participants: base.participants.slice(0, 5),
      rounds: 3,
      winnersPerRound: 2,
      filterWinners: true,
      showPreviousRounds: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not enough/i);
    }
  });

  it("allows winnersPerRound * rounds > participants when filter is off", () => {
    const result = validateConfig({
      ...base,
      participants: base.participants.slice(0, 5),
      rounds: 3,
      winnersPerRound: 2,
      filterWinners: false,
      showPreviousRounds: true,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate participant names", () => {
    const result = validateConfig({
      ...base,
      participants: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
        { id: "3", name: "Alice" },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/duplicate/i);
    }
  });
});
