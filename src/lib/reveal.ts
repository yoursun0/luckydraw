// src/lib/reveal.ts
import type { Phase } from "./types";

export const REVEAL_DURATION_MS = 1200;

export interface RevealAnimState {
  revealing: boolean;
  revealStart: number;
  lastRevealedRound: number;
  lastRevealedWinners: string[];
}

export const initialRevealAnim: RevealAnimState = {
  revealing: false,
  revealStart: 0,
  lastRevealedRound: 0,
  lastRevealedWinners: [],
};

/**
 * Pure function: drives the reveal animation state for the galaxy canvas.
 *
 * Trigger rules (bug fix):
 * - Start a new reveal only when phase === "REVEALING" AND a new result was
 *   added (results.length > lastRevealedRound). This prevents the animation
 *   from re-triggering every frame while the user hasn't pressed Next.
 * - End the reveal when REVEAL_DURATION_MS has elapsed.
 *
 * Returns the SAME object reference when nothing changed, so callers can use
 * referential equality to skip downstream work.
 */
export function stepRevealAnim(
  state: RevealAnimState,
  now: number,
  phase: Phase,
  resultsLength: number,
  winnersForLatestResult: string[]
): RevealAnimState {
  if (phase === "REVEALING" && resultsLength > state.lastRevealedRound) {
    return {
      revealing: true,
      revealStart: now,
      lastRevealedRound: resultsLength,
      lastRevealedWinners: winnersForLatestResult,
    };
  }

  if (state.revealing && now - state.revealStart >= REVEAL_DURATION_MS) {
    return { ...state, revealing: false };
  }

  return state;
}

// Destination position for a winner after the reveal animation completes.
// Matches the burst end position used in the canvas reveal branch.
export const WINNER_BURST_RADIUS = 290;
export const WINNER_BURST_ANGLE_SPREAD = 0.6;

export function getWinnerDestination(
  baseAngle: number,
  index: number,
  total: number
): { radius: number; angle: number } {
  return {
    radius: WINNER_BURST_RADIUS,
    angle: baseAngle + (index - (total - 1) / 2) * WINNER_BURST_ANGLE_SPREAD,
  };
}
