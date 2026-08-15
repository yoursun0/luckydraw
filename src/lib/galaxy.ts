// src/lib/galaxy.ts

/**
 * Star-color palette used by the mini-galaxy visuals.
 *
 * Loosely reflects the real stellar color distribution: most stars are
 * yellow/white (sun-like, G/K + A/F types) with a minority of red
 * (M-type / red giants) and a small number of hot blue-white stars
 * (O/B-type). All values are kept light enough to read on a black
 * background.
 */
export const GALAXY_STAR_COLORS = {
  yellow: ["#ffd700", "#fff3a0", "#ffeb99", "#ffeb3b"],
  white: ["#ffffff", "#f5f5f5", "#fff8dc", "#fafad2"],
  blue: ["#a8d8ff", "#9ec5fe", "#b0e0e6", "#87cefa"],
  red: ["#ff9999", "#ffb3a7", "#ff7a7a", "#ffa07a"],
} as const;

/** All star colors flattened, useful for assertions. */
export const STAR_COLORS: readonly string[] = [
  ...GALAXY_STAR_COLORS.yellow,
  ...GALAXY_STAR_COLORS.white,
  ...GALAXY_STAR_COLORS.blue,
  ...GALAXY_STAR_COLORS.red,
];

/** Bucket ratios for a real-star-like distribution. Must sum to 1. */
const COLOR_BUCKETS: ReadonlyArray<{ colors: readonly string[]; weight: number }> = [
  { colors: GALAXY_STAR_COLORS.yellow, weight: 0.5 },
  { colors: GALAXY_STAR_COLORS.white, weight: 0.25 },
  { colors: GALAXY_STAR_COLORS.blue, weight: 0.13 },
  { colors: GALAXY_STAR_COLORS.red, weight: 0.12 },
];

/** Deterministic [0, 1) pseudo-random derived from (seed, i). */
function hash01(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pick<T>(arr: readonly T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

/** Pick a star color for a dot deterministically. */
export function dotColor(seed: number, i: number): string {
  const r1 = hash01(seed, i);
  const r2 = hash01(seed + 1, i + 1);
  let acc = 0;
  for (const bucket of COLOR_BUCKETS) {
    acc += bucket.weight;
    if (r1 < acc) return pick(bucket.colors, r2);
  }
  // Numerical safety net — last bucket should have caught all r1 values.
  return pick(COLOR_BUCKETS[COLOR_BUCKETS.length - 1].colors, r2);
}

/**
 * Same as {@link dotColor} but returns a 24-bit integer suitable for canvas
 * draw APIs (e.g. PixiJS `graphics.fill({ color })`).
 */
export function starColorNumber(seed: number, i: number): number {
  return parseInt(dotColor(seed, i).slice(1), 16);
}

/**
 * Returns deterministic positions for N "star" dots inside a 0-100 viewBox,
 * suitable for rendering a mini spiral galaxy SVG. Each call with the same
 * `count` and `seed` produces the same layout and colors.
 *
 * - `count`: number of dots (one per winner).
 * - `seed`: rotates the spiral and shifts the color assignment so different
 *           rounds look visually distinct.
 */
export function galaxyDotPositions(
  count: number,
  seed: number
): { x: number; y: number; r: number; color: string }[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0 : i / (count - 1);
    // Golden-angle-ish rotation, offset by seed so each round looks distinct.
    const angle = i * 1.2 + seed * 0.7;
    // Spiral outward from center.
    const radius = 12 + 26 * t;
    return {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      // Inner dots are bigger, outer ones smaller (galaxy-arm feel).
      r: Math.max(1.2, 3.2 - t * 1.8),
      color: dotColor(seed, i),
    };
  });
}
