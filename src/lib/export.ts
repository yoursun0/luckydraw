// src/lib/export.ts
import type { Participant, RoundResult, SessionConfig } from "./types";

/**
 * Serialize the winners of a completed draw into the .txt export format.
 *
 * Format spec: docs/winner-export-schema.md
 *
 * - Comment block (metadata) followed by a blank line, then a flat
 *   tab-separated table: header row + one line per winner.
 * - No timestamps of any kind.
 * - Rounds ascending; winners alphabetical by name within each round.
 * - Custom-field keys = union across all winners, sorted alphabetically.
 * - CRLF line endings; fields are escaped so no value can contain a tab
 *   or line break.
 */
export function buildExportText(
  config: SessionConfig,
  results: RoundResult[]
): string {
  const lines: string[] = [];

  // --- Comment block (metadata) ---
  lines.push("# Lucky Draw Export v1");
  lines.push(`# Event: ${config.eventTitle.trim() || "Untitled Event"}`);
  lines.push(
    `# Config: rounds=${config.rounds}, winnersPerRound=${config.winnersPerRound}, ` +
      `filterWinners=${config.filterWinners}`
  );
  const totalWinners = results.reduce(
    (sum, r) => sum + r.winners.length,
    0
  );
  lines.push(`# Total Winners: ${totalWinners}`);
  lines.push("");

  // --- Column set: round, name, then every custom key across all winners ---
  const customKeys = new Set<string>();
  for (const r of results) {
    for (const w of r.winners) {
      if (w.custom) {
        for (const key of Object.keys(w.custom)) customKeys.add(key);
      }
    }
  }
  const keys = [...customKeys].sort(compareAsc);

  lines.push(["round", "name", ...keys].join("\t"));

  // --- Data rows: rounds ascending, winners alphabetical within a round ---
  const byRound = [...results].sort((a, b) => a.roundNumber - b.roundNumber);
  for (const round of byRound) {
    const winners = [...round.winners].sort((a, b) => compareAsc(a.name, b.name));
    for (const winner of winners) {
      lines.push(rowFor(round.roundNumber, winner, keys));
    }
  }

  return lines.join("\r\n") + "\r\n";
}

/** Compare two strings case-sensitively, ascending. */
function compareAsc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Build one data row; tabs/CR/LF inside values are replaced with spaces. */
function rowFor(
  roundNumber: number,
  winner: Participant,
  keys: string[]
): string {
  const cells = [
    String(roundNumber),
    escapeField(winner.name),
    ...keys.map((key) => escapeField(winner.custom?.[key] ?? "")),
  ];
  return cells.join("\t");
}

/** Neutralize characters that would break the tab/CRLF-delimited format. */
function escapeField(value: string): string {
  return value.replace(/[\t\r\n]/g, " ");
}

/**
 * Turn an event title into a filesystem-friendly slug for the export
 * filename: lowercase, non-alphanumerics collapsed to `-`. Empty → "lucky-draw".
 */
export function eventSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "lucky-draw";
}

/** Export filename per the schema: winners-<event-slug>-<yyyyMMdd-HHmmss>.txt */
export function exportFilename(eventTitle: string, date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `winners-${eventSlug(eventTitle)}-${stamp}.txt`;
}
