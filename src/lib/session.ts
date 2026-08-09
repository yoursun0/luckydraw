// src/lib/session.ts
import type { Participant, SessionConfig, SessionState, RoundResult } from "./types";

export function createInitialSession(config: SessionConfig): SessionState {
  return {
    config,
    currentRound: 1,
    phase: "PRE_DRAW",
    results: [],
    eligible: [...config.participants],
  };
}

export function startReveal(state: SessionState, winners: Participant[]): SessionState {
  if (state.phase !== "PRE_DRAW") return state;
  const result: RoundResult = {
    roundNumber: state.currentRound,
    winners,
    drawnAt: Date.now(),
  };
  return {
    ...state,
    phase: "REVEALING",
    results: [...state.results, result],
  };
}

export function finishReveal(state: SessionState): SessionState {
  if (state.phase !== "REVEALING") return state;
  const lastResult = state.results[state.results.length - 1];
  const winnerIds = new Set(lastResult.winners.map((w) => w.id));
  const eligible = state.config.filterWinners
    ? state.eligible.filter((p) => !winnerIds.has(p.id))
    : state.eligible;
  return { ...state, phase: "ROUND_COMPLETE", eligible };
}

export function advanceRound(state: SessionState): SessionState {
  if (state.phase !== "ROUND_COMPLETE") return state;
  const nextRound = state.currentRound + 1;
  const canDrawNextRound =
    nextRound <= state.config.rounds &&
    state.eligible.length >= state.config.winnersPerRound;
  if (!canDrawNextRound) {
    return { ...state, phase: "FINISHED" };
  }
  return {
    ...state,
    currentRound: nextRound,
    phase: "PRE_DRAW",
  };
}
