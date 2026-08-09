// src/lib/draw.ts
import type { Participant } from "./types";

export interface SelectWinnersOptions {
  exclude?: Participant[];
  random?: () => number;
}

export function selectWinners(
  eligible: Participant[],
  count: number,
  options: SelectWinnersOptions = {}
): Participant[] {
  if (eligible.length === 0 || count <= 0) return [];

  const excludedIds = new Set((options.exclude ?? []).map((p) => p.id));
  const pool = eligible.filter((p) => !excludedIds.has(p.id));
  if (pool.length === 0) return [];

  const take = Math.min(count, pool.length);
  const rand = options.random ?? Math.random;

  const indices = pool.map((_, i) => i);
  for (let i = 0; i < take; i++) {
    const j = i + Math.floor(rand() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, take).map((i) => pool[i]);
}
