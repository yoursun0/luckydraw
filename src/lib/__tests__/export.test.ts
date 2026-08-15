// src/lib/__tests__/export.test.ts
import { describe, it, expect } from "vitest";
import { buildExportText, eventSlug, exportFilename } from "../export";
import type { RoundResult, SessionConfig } from "../types";

const config: SessionConfig = {
  eventTitle: "Annual Party 2026",
  participants: [],
  rounds: 3,
  winnersPerRound: 2,
  filterWinners: true,
  showPreviousRounds: true,
};

function result(round: number, winners: RoundResult["winners"]): RoundResult {
  return { roundNumber: round, drawnAt: round, winners };
}

describe("buildExportText", () => {
  it("writes the comment block with metadata and no timestamps", () => {
    const text = buildExportText(config, []);
    const lines = text.split("\r\n");
    expect(lines[0]).toBe("# Lucky Draw Export v1");
    expect(lines[1]).toBe("# Event: Annual Party 2026");
    expect(lines[2]).toBe(
      "# Config: rounds=3, winnersPerRound=2, filterWinners=true"
    );
    expect(lines[3]).toBe("# Total Winners: 0");
    expect(lines[4]).toBe(""); // blank separator
    expect(text).not.toMatch(/Exported|drawnAt|timestamp/i);
  });

  it("falls back to Untitled Event for an empty title", () => {
    const text = buildExportText({ ...config, eventTitle: "   " }, []);
    expect(text.split("\r\n")[1]).toBe("# Event: Untitled Event");
  });

  it("emits a header row of round, name, then sorted custom keys", () => {
    const text = buildExportText(config, [
      result(1, [
        { id: "1", name: "Alice", custom: { ticket: "101", department: "Sales" } },
      ]),
    ]);
    const lines = text.split("\r\n");
    expect(lines[5]).toBe("round\tname\tdepartment\tticket");
  });

  it("unions custom keys across all winners and sorts them", () => {
    const text = buildExportText(config, [
      result(1, [{ id: "1", name: "Alice", custom: { dept: "Sales" } }]),
      result(2, [{ id: "2", name: "Bob", custom: { ticket: "7" } }]),
    ]);
    const lines = text.split("\r\n");
    expect(lines[5]).toBe("round\tname\tdept\tticket");
  });

  it("has no custom key columns when winners have no custom fields", () => {
    const text = buildExportText(config, [
      result(1, [{ id: "1", name: "Alice" }]),
    ]);
    const lines = text.split("\r\n");
    expect(lines[5]).toBe("round\tname");
  });

  it("orders rounds ascending and winners alphabetically within a round", () => {
    const text = buildExportText(config, [
      result(2, [{ id: "3", name: "Zoe" }, { id: "4", name: "Adam" }]),
      result(1, [{ id: "1", name: "Bob" }, { id: "2", name: "Alice" }]),
    ]);
    const lines = text.split("\r\n");
    // Round 1 block, alphabetical
    expect(lines[6]).toBe("1\tAlice");
    expect(lines[7]).toBe("1\tBob");
    // Round 2 block, alphabetical
    expect(lines[8]).toBe("2\tAdam");
    expect(lines[9]).toBe("2\tZoe");
  });

  it("aligns custom values with their columns, empty when missing", () => {
    const text = buildExportText(config, [
      result(1, [
        { id: "1", name: "Alice", custom: { ticket: "101", department: "Sales" } },
        { id: "2", name: "Bob", custom: { department: "Finance" } },
      ]),
    ]);
    const lines = text.split("\r\n");
    // header: round  name  department  ticket
    expect(lines[6]).toBe("1\tAlice\tSales\t101");
    expect(lines[7]).toBe("1\tBob\tFinance\t");
  });

  it("escapes tabs and line breaks inside field values", () => {
    const text = buildExportText(config, [
      result(1, [
        { id: "1", name: "Tab\tHere" },
        { id: "2", name: "Multi\nLine", custom: { note: "a\tb" } },
      ]),
    ]);
    const lines = text.split("\r\n");
    // header: round  name  note
    expect(lines[5]).toBe("round\tname\tnote");
    // "Multi Line" < "Tab Here" alphabetically
    expect(lines[6]).toBe("1\tMulti Line\ta b");
    expect(lines[7]).toBe("1\tTab Here\t");
    expect(lines).toHaveLength(9); // 5 comment lines + header + 2 rows + trailing ""
    // no extra lines from embedded \n
    expect(lines).not.toContain("Multi"); // the \n inside the name is gone
  });

  it("sums total winners across rounds", () => {
    const text = buildExportText(config, [
      result(1, [{ id: "1", name: "A" }, { id: "2", name: "B" }]),
      result(2, [{ id: "3", name: "C" }]),
    ]);
    expect(text.split("\r\n")[3]).toBe("# Total Winners: 3");
  });

  it("ends with CRLF and no trailing blank lines", () => {
    const text = buildExportText(config, [
      result(1, [{ id: "1", name: "A" }]),
    ]);
    expect(text.endsWith("\r\n")).toBe(true);
    expect(text.split("\r\n").at(-1)).toBe("");
    // Exactly one trailing CRLF: join + one "\r\n" → last item is ""
    expect(text.split("\r\n").length).toBe(8);
  });
});

describe("eventSlug", () => {
  it("lowercases and collapses non-alphanumerics to dashes", () => {
    expect(eventSlug("Annual Party 2026!")).toBe("annual-party-2026");
  });

  it("falls back to lucky-draw when the slug would be empty", () => {
    expect(eventSlug("   ")).toBe("lucky-draw");
    expect(eventSlug("你好")).toBe("lucky-draw");
  });
});

describe("exportFilename", () => {
  it("builds winners-<slug>-<yyyyMMdd-HHmmss>.txt", () => {
    const date = new Date(2026, 7, 10, 9, 30, 5); // Aug 10 2026 09:30:05
    expect(exportFilename("Annual Party 2026", date)).toBe(
      "winners-annual-party-2026-20260810-093005.txt"
    );
  });

  it("zero-pads month/day/hour/minute/second", () => {
    const date = new Date(2026, 0, 5, 9, 5, 3);
    expect(exportFilename("Event", date)).toBe(
      "winners-event-20260105-090503.txt"
    );
  });
});
