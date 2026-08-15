// src/lib/__tests__/galaxy.test.ts
import { describe, it, expect } from "vitest";
import {
  galaxyDotPositions,
  dotColor,
  starColorNumber,
  GALAXY_STAR_COLORS,
  STAR_COLORS,
} from "../galaxy";

describe("galaxyDotPositions", () => {
  it("returns N dot positions for N > 0", () => {
    expect(galaxyDotPositions(5, 0)).toHaveLength(5);
    expect(galaxyDotPositions(1, 0)).toHaveLength(1);
    expect(galaxyDotPositions(20, 0)).toHaveLength(20);
  });

  it("returns an empty array for N <= 0", () => {
    expect(galaxyDotPositions(0, 0)).toEqual([]);
    expect(galaxyDotPositions(-1, 0)).toEqual([]);
  });

  it("returns positions inside the 0-100 viewBox", () => {
    for (const seed of [0, 1, 7, 42]) {
      const dots = galaxyDotPositions(15, seed);
      for (const d of dots) {
        expect(d.x).toBeGreaterThanOrEqual(0);
        expect(d.x).toBeLessThanOrEqual(100);
        expect(d.y).toBeGreaterThanOrEqual(0);
        expect(d.y).toBeLessThanOrEqual(100);
        expect(d.r).toBeGreaterThan(0);
      }
    }
  });

  it("is deterministic for the same seed", () => {
    const a = galaxyDotPositions(10, 3);
    const b = galaxyDotPositions(10, 3);
    expect(a).toEqual(b);
  });

  it("produces different layouts for different seeds (when count > 1)", () => {
    const a = galaxyDotPositions(10, 0);
    const b = galaxyDotPositions(10, 1);
    expect(a).not.toEqual(b);
  });

  it("returns a color from the palette for every dot", () => {
    const dots = galaxyDotPositions(40, 1);
    for (const d of dots) {
      expect(typeof d.color).toBe("string");
      expect(STAR_COLORS).toContain(d.color);
    }
  });

  it("distributes star colors like a real star map: mostly yellow/white with a minority of red and blue", () => {
    // Use a large sample so the distribution is statistically meaningful.
    const dots = galaxyDotPositions(800, 1);
    let yellow = 0;
    let white = 0;
    let blue = 0;
    let red = 0;
    for (const d of dots) {
      if ((GALAXY_STAR_COLORS.yellow as readonly string[]).includes(d.color)) yellow++;
      else if ((GALAXY_STAR_COLORS.white as readonly string[]).includes(d.color)) white++;
      else if ((GALAXY_STAR_COLORS.blue as readonly string[]).includes(d.color)) blue++;
      else if ((GALAXY_STAR_COLORS.red as readonly string[]).includes(d.color)) red++;
    }
    const total = dots.length;
    // Yellow + white should be the clear majority (>= 60% of stars).
    expect(yellow + white).toBeGreaterThanOrEqual(total * 0.6);
    // Yellow alone should be at least 35% of stars.
    expect(yellow).toBeGreaterThanOrEqual(total * 0.35);
    // Red and blue should each be a noticeable minority but small (< 25%).
    expect(red).toBeGreaterThan(0);
    expect(red).toBeLessThan(total * 0.25);
    expect(blue).toBeGreaterThan(0);
    expect(blue).toBeLessThan(total * 0.25);
  });

  it("is deterministic for color too", () => {
    const a = galaxyDotPositions(30, 7).map((d) => d.color);
    const b = galaxyDotPositions(30, 7).map((d) => d.color);
    expect(a).toEqual(b);
  });
});

describe("dotColor", () => {
  it("returns a color from the palette", () => {
    for (let i = 0; i < 50; i++) {
      expect(STAR_COLORS).toContain(dotColor(0, i));
    }
  });
});

describe("starColorNumber", () => {
  it("returns a 24-bit integer whose hex value is in the palette", () => {
    for (let i = 0; i < 20; i++) {
      const c = starColorNumber(0, i);
      expect(Number.isInteger(c)).toBe(true);
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(0x1000000);
      const hex = `#${c.toString(16).padStart(6, "0")}`;
      expect(STAR_COLORS).toContain(hex);
    }
  });

  it("produces a variety of colors for consecutive indices (not all gold)", () => {
    const colors = new Set<number>();
    for (let i = 0; i < 10; i++) {
      colors.add(starColorNumber(0, i));
    }
    // 10 winners should not all share the same color.
    expect(colors.size).toBeGreaterThan(1);
  });
});
