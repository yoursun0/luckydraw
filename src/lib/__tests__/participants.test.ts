// src/lib/__tests__/participants.test.ts
import { describe, it, expect } from "vitest";
import {
  parseTextareaInput,
  generateParticipants,
  parseCSV,
  detectAndParse,
  numberedListText,
} from "../participants";

describe("parseTextareaInput", () => {
  it("returns empty array for blank input", () => {
    expect(parseTextareaInput("")).toEqual([]);
    expect(parseTextareaInput("   \n  \n")).toEqual([]);
  });

  it("parses one name per line", () => {
    expect(parseTextareaInput("Alice\nBob\nCharlie")).toEqual([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Charlie" },
    ]);
  });

  it("trims whitespace and skips empty lines", () => {
    expect(parseTextareaInput("  Alice  \n\n\n  Bob\n")).toEqual([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
  });

  it("assigns sequential ids", () => {
    const result = parseTextareaInput("A\nB\nC\nD");
    expect(result.map((p) => p.id)).toEqual(["1", "2", "3", "4"]);
    expect(result.map((p) => p.name)).toEqual(["A", "B", "C", "D"]);
  });
});

describe("generateParticipants", () => {
  it("generates '1'..'N' when count is N", () => {
    const result = generateParticipants(5);
    expect(result.map((p) => p.name)).toEqual(["1", "2", "3", "4", "5"]);
    expect(result).toHaveLength(5);
  });

  it("returns empty array for count <= 0", () => {
    expect(generateParticipants(0)).toEqual([]);
    expect(generateParticipants(-1)).toEqual([]);
  });
});

describe("parseCSV", () => {
  it("parses simple name-only CSV (no header)", () => {
    expect(parseCSV("Alice\nBob\nCharlie")).toEqual([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
      { id: "3", name: "Charlie" },
    ]);
  });

  it("parses CSV with header row", () => {
    const csv = "name,department\nAlice,Eng\nBob,Sales\n";
    expect(parseCSV(csv)).toEqual([
      { id: "1", name: "Alice", custom: { department: "Eng" } },
      { id: "2", name: "Bob", custom: { department: "Sales" } },
    ]);
  });

  it("parses tab-separated values", () => {
    const tsv = "name\tticket\nAlice\tA-001\nBob\tA-002\n";
    expect(parseCSV(tsv)).toEqual([
      { id: "1", name: "Alice", custom: { ticket: "A-001" } },
      { id: "2", name: "Bob", custom: { ticket: "A-002" } },
    ]);
  });

  it("handles quoted fields with commas", () => {
    const csv = 'name,note\n"Smith, John","VIP, please"';
    expect(parseCSV(csv)).toEqual([
      { id: "1", name: "Smith, John", custom: { note: "VIP, please" } },
    ]);
  });
});

describe("detectAndParse", () => {
  it("detects single number and returns auto-generated", () => {
    expect(detectAndParse("100")).toEqual(generateParticipants(100));
  });

  it("detects numeric list and returns auto-generated", () => {
    expect(detectAndParse("1\n2\n3\n4\n5")).toEqual(generateParticipants(5));
  });

  it("falls back to textarea parse for names", () => {
    expect(detectAndParse("Alice\nBob")).toEqual([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
  });
});

describe("numberedListText", () => {
  it("returns '1'..'N' joined by newlines for positive N", () => {
    expect(numberedListText(5)).toBe("1\n2\n3\n4\n5");
  });

  it("handles N=1", () => {
    expect(numberedListText(1)).toBe("1");
  });

  it("handles two-digit numbers correctly", () => {
    expect(numberedListText(12)).toBe(
      "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12"
    );
  });

  it("returns empty string for N <= 0", () => {
    expect(numberedListText(0)).toBe("");
    expect(numberedListText(-1)).toBe("");
  });

  it("result is parseable by detectAndParse into the same participants", () => {
    const text = numberedListText(10);
    expect(detectAndParse(text)).toEqual(generateParticipants(10));
  });
});
