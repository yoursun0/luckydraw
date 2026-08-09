// src/lib/config.ts
import type { SessionConfig } from "./types";
import { MAX_PARTICIPANTS, MIN_PARTICIPANTS } from "./types";

export type ValidationResult = { ok: true } | { ok: false; error: string };

export function validateConfig(config: SessionConfig): ValidationResult {
  if (config.participants.length < MIN_PARTICIPANTS) {
    return { ok: false, error: `Need at least ${MIN_PARTICIPANTS} participants.` };
  }
  if (config.participants.length > MAX_PARTICIPANTS) {
    return { ok: false, error: `At most ${MAX_PARTICIPANTS} participants allowed.` };
  }
  if (config.rounds < 1) {
    return { ok: false, error: "Rounds must be at least 1." };
  }
  if (config.winnersPerRound < 1) {
    return { ok: false, error: "Winners per round must be at least 1." };
  }
  if (config.filterWinners) {
    const total = config.rounds * config.winnersPerRound;
    if (total > config.participants.length) {
      return {
        ok: false,
        error: `Not enough participants (${config.participants.length}) for ${config.rounds} rounds × ${config.winnersPerRound} winners with filter ON.`,
      };
    }
  }
  const names = config.participants.map((p) => p.name);
  if (new Set(names).size !== names.length) {
    return { ok: false, error: "Duplicate participant names found." };
  }
  return { ok: true };
}
