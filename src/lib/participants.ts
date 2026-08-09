// src/lib/participants.ts
import type { Participant } from "./types";

export function parseTextareaInput(input: string): Participant[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((name, i) => ({ id: String(i + 1), name }));
}

export function generateParticipants(count: number): Participant[] {
  if (count <= 0) return [];
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: String(i + 1),
  }));
}

export function parseCSV(input: string): Participant[] {
  const rows = parseCSVRows(input);
  if (rows.length === 0) return [];

  const firstRow = rows[0];
  const hasDelimiters = /[,\t]/.test(input);
  // Only treat as CSV-with-header when there are delimiters AND first row has letters
  const hasHeader =
    hasDelimiters &&
    firstRow.some((cell) => /[a-zA-Z]/.test(cell));

  let headers: string[];
  let dataRows: string[][];
  if (hasHeader) {
    headers = firstRow.map((h) => h.toLowerCase().trim());
    dataRows = rows.slice(1);
  } else {
    headers = ["name"];
    dataRows = rows;
  }

  let nameIdx = headers.indexOf("name");
  if (nameIdx < 0) nameIdx = 0;

  return dataRows
    .filter((row) => row.length > 0 && row.some((c) => c.trim().length > 0))
    .map((row, i) => {
      const name = (row[nameIdx] ?? "").trim();
      if (!name) return null;
      const custom: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (idx !== nameIdx) {
          const v = (row[idx] ?? "").trim();
          if (v) custom[h] = v;
        }
      });
      return {
        id: String(i + 1),
        name,
        custom: Object.keys(custom).length > 0 ? custom : undefined,
      } as Participant;
    })
    .filter((p): p is Participant => p !== null);
}

function parseCSVRows(input: string): string[][] {
  const text = input.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === "," || ch === "\t") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function detectAndParse(input: string): Participant[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (/^\d+$/.test(trimmed)) {
    return generateParticipants(parseInt(trimmed, 10));
  }

  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const allNumeric = lines.length > 1 && lines.every((l) => /^\d+$/.test(l));
  if (allNumeric) {
    return generateParticipants(lines.length);
  }

  return parseTextareaInput(input);
}
