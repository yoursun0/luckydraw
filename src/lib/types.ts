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
  /** When true, the display shows a "previous rounds" recap under the
   *  current round's winners (REVEALED / ROUND_COMPLETE) and a full
   *  per-round summary on the final screen (FINISHED). */
  showPreviousRounds: boolean;
}

export interface RoundResult {
  roundNumber: number;
  winners: Participant[];
  drawnAt: number;
}

export type Phase =
  | "IDLE"
  | "PRE_DRAW"
  | "REVEALING"
  | "REVEALED"
  | "ROUND_COMPLETE"
  | "FINISHED";

export interface SessionState {
  config: SessionConfig;
  currentRound: number;
  phase: Exclude<Phase, "IDLE">;
  results: RoundResult[];
  eligible: Participant[];
}

export const MAX_PARTICIPANTS = 1000;
export const MIN_PARTICIPANTS = 3;
