# Winner Export — `.txt` File Schema (v1)

This document defines the exact format of the `.txt` file produced by the
"Export Winners" button on the FINISHED page of the lucky draw app.

> **Status:** final. Implemented by `src/lib/export.ts` (`buildExportText`).
> Source of data: `SessionState.results` (`RoundResult[]`) + `SessionState.config`
> (`SessionConfig`) as defined in `src/lib/types.ts`.

## 1. Purpose

The file is consumed by a machine (admin tooling / scripts) that will further
process the winners. It therefore needs to be:

1. **Machine-parseable** — a strict, line-oriented format a script can read
   without ambiguity.
2. **Spreadsheet-friendly** — tab-separated values (TSV) so it also opens
   directly in Excel / Google Sheets / Numbers with columns intact.
3. **Self-describing** — a short comment block up top records event title and
   draw configuration.

## 2. Encoding & line endings

| Property | Value |
|---|---|
| Encoding | UTF-8 (no BOM) |
| Line ending | CRLF (`\r\n`) |
| Field delimiter | Tab (`\t`) |
| Comment prefix | `#` at the start of a line |
| Timestamps | **None.** The file contains no timestamp data of any kind. |
| Filename convention | `winners-<event-slug>-<yyyyMMdd-HHmmss>.txt`<br/>where `<event-slug>` is the event title lowercased, non-alphanumerics → `-` (empty → `lucky-draw`). |

## 3. File structure

```
┌───────────────────────────────────────────────────────┐
│ 1. Comment block (metadata)                           │
│    # Lucky Draw Export v1                             │
│    # Event: <event title>                             │
│    # Config: rounds=<n>, winnersPerRound=<m>,         │
│    #          filterWinners=<true|false>              │
│    # Total Winners: <k>                               │
│    (blank line)                                       │
├───────────────────────────────────────────────────────┤
│ 2. Table header row (one line)                        │
│    round\tname\t<custom key 1>\t<custom key 2>\t…     │
├───────────────────────────────────────────────────────┤
│ 3. Data rows — one line per winner, sorted per §6     │
│    <roundNumber>\t<name>\t<value 1>\t<value 2>\t…     │
└───────────────────────────────────────────────────────┘
```

## 4. Comment block (metadata)

Every line starts with `# ` (hash + space). Parsers **must** ignore all lines
beginning with `#`; the block is informational.

| Line | Example | Source |
|---|---|---|
| `# Lucky Draw Export v1` | `# Lucky Draw Export v1` | fixed — the schema version, for future compatibility |
| `# Event: <title>` | `# Event: Annual Party 2026` | `config.eventTitle` (empty title → `Untitled Event`) |
| `# Config: …` | `# Config: rounds=3, winnersPerRound=2, filterWinners=true` | `config.rounds`, `config.winnersPerRound`, `config.filterWinners` |
| `# Total Winners: <k>` | `# Total Winners: 6` | sum of `winners.length` across all rounds |

A single blank line separates the comment block from the table.

## 5. Table header row

One line: `round`, `name`, then **one column per distinct custom-field key**,
sorted alphabetically (case-sensitive, ascending).

- `round` — integer, 1-based round number.
- `name` — participant identifier (name or generated number).
- Custom keys — the **union** of `participant.custom` keys across **all
  winners** in the session, deduplicated and sorted. Participants without a
  given key get an empty cell.

Examples:

```text
round	name	ticket	department
round	name
round	name	photo_url	ticket
```

There is **no** `id` column: participant ids are internal
(`src/lib/participants.ts` renumbers on re-import) and not meaningful to a
machine.

There are **no** timestamp columns (`drawnAt` is deliberately not exported).

## 6. Data rows

- One line per winner.
- Rounds appear in **ascending round-number order** (`roundNumber`).
- Within a round, winners are sorted **alphabetically by name** (case-sensitive,
  ascending — the same comparison used for custom-key columns).
- Columns align with the header row: `round`, `name`, then each custom key's
  value (empty string if the winner has no value for that key).

```text
1	Alice	101	Sales
1	Bob	102	Engineering
2	Carol	103	Sales
```

## 7. Field escaping rules

| Character in value | Handling |
|---|---|
| Tab (`\t`) | replaced with a single space — cannot survive inside a field (protects the delimiter) |
| CR / LF (`\r`, `\n`) | replaced with a single space — output is always one row per winner |
| Empty name / empty value | output as empty cell between tabs (two adjacent tabs) |
| Everything else (incl. commas, quotes, non-ASCII) | written verbatim |

Consequence: parsing the file can safely split on `\t` and split rows on `\r\n`
(or `\n`) with no quoting state machine.

## 8. Worked example

Input state (3 rounds × 2 winners, filter ON, participants carry `ticket` /
`department` custom fields):

```text
# Lucky Draw Export v1
# Event: Annual Party 2026
# Config: rounds=3, winnersPerRound=2, filterWinners=true
# Total Winners: 6

round	name	ticket	department
1	Alice	101	Sales
1	Bob	102	Engineering
2	Carol	103	Sales
2	Dave			Finance
3	Eve	104	Marketing
3	Frank	105	Sales
```

Notes on the example:

- `Dave` has no `ticket` value → empty cell (`Dave\t\tFinance` → two tabs).
- Column order `ticket, department` is alphabetical; names within each round
  are alphabetical too.
- No timestamps anywhere: no export time, no draw time.

## 9. Implementation notes

- Pure function `buildExportText(config, results): string` in
  `src/lib/export.ts` — unit-testable, mirrors the style of `src/lib/session.ts`.
- `ExportWinnersButton` renders on the FINISHED phase in
  `src/components/display/DisplayPage.tsx`, next to the existing "New Draw"
  button; triggers a Blob download (`text/plain;charset=utf-8`).
- File name per §2 convention, generated at click time.
