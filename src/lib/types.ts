// src/lib/types.ts
export interface Participant {
  id: string;
  name: string;
  custom?: Record<string, string>;
}

export interface SessionConfig {
  eventTitle: string;
  participants: Participant[];
  rounds: number;
  winnersPerRound: number;
  filterWinners: boolean;
}

export interface RoundResult {
  roundNumber: number;
  winners: Participant[];
  drawnAt: number;
}

export type Phase = "IDLE" | "PRE_DRAW" | "REVEALING" | "ROUND_COMPLETE" | "FINISHED";

export interface SessionState {
  config: SessionConfig;
  currentRound: number;
  phase: Exclude<Phase, "IDLE">;
  results: RoundResult[];
  eligible: Participant[];
}

export const MAX_PARTICIPANTS = 1000;
export const MIN_PARTICIPANTS = 3;
