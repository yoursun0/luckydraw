// src/components/setup/__tests__/SetupPage.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupPage from "../SetupPage";
import { SessionProvider, useSession } from "@/lib/store";
import type { SessionConfig } from "@/lib/types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: (...args: unknown[]) => pushMock(...args), replace: vi.fn() }),
}));

function Inspector() {
  const { state } = useSession();
  return (
    <div>
      <span data-testid="phase">{state.phase}</span>
      <span data-testid="participantCount">
        {state.config?.participants.length ?? 0}
      </span>
    </div>
  );
}

function renderWith(preloadedState?: Parameters<typeof SessionProvider>[0]["preloadedState"]) {
  return render(
    <SessionProvider preloadedState={preloadedState}>
      <SetupPage />
      <Inspector />
    </SessionProvider>
  );
}

const previousConfig: SessionConfig = {
  eventTitle: "Annual Gala 2026",
  participants: ["Alice", "Bob", "Charlie", "Dana", "Eve"].map((n, i) => ({
    id: String(i + 1),
    name: n,
  })),
  rounds: 3,
  winnersPerRound: 2,
  filterWinners: false,
  showPreviousRounds: true,
};

describe("SetupPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders the title input and participant textarea", () => {
    renderWith();
    expect(screen.getByLabelText(/event title/i)).toBeTruthy();
    expect(screen.getByLabelText("Participants")).toBeTruthy();
  });

  it("parses pasted textarea into participants", async () => {
    const user = userEvent.setup();
    renderWith();
    const textarea = screen.getByLabelText("Participants");
    await user.type(textarea, "Alice\nBob\nCharlie\nDana");
    expect(screen.getByTestId("participant-count").textContent).toMatch(/4/);
  });

  it("auto-generates from a single number", async () => {
    const user = userEvent.setup();
    renderWith();
    const textarea = screen.getByLabelText("Participants");
    await user.type(textarea, "10");
    expect(screen.getByTestId("participant-count").textContent).toMatch(/10/);
  });

  it("Start button is disabled with < 3 participants", () => {
    renderWith();
    const start = screen.getByRole("button", { name: /start/i });
    expect((start as HTMLButtonElement).disabled).toBe(true);
  });

  it("Start button enables when valid and starts session", async () => {
    const user = userEvent.setup();
    renderWith();
    await user.type(screen.getByLabelText(/event title/i), "My Event");
    await user.type(screen.getByLabelText("Participants"), "Alice\nBob\nCharlie\nDana\nEve");
    const start = screen.getByRole("button", { name: /start/i }) as HTMLButtonElement;
    expect(start.disabled).toBe(false);
    await user.click(start);
    expect(screen.getByTestId("phase").textContent).toBe("PRE_DRAW");
    expect(pushMock).toHaveBeenCalledWith("/display");
  });

  it("pre-fills the form from a previous session's config", () => {
    // Pre-populated state simulates a session that was just `RETURN_TO_SETUP`-ed:
    // phase is IDLE, but config is still present from the last session.
    const preloadedState = {
      phase: "IDLE" as const,
      config: previousConfig,
      currentRound: 0 as const,
      results: [] as [],
      eligible: [] as [],
    };
    renderWith(preloadedState);

    expect((screen.getByLabelText(/event title/i) as HTMLInputElement).value).toBe(
      "Annual Gala 2026"
    );
    const textarea = screen.getByLabelText("Participants") as HTMLTextAreaElement;
    expect(textarea.value).toBe("Alice\nBob\nCharlie\nDana\nEve");
    expect(
      (screen.getByLabelText("Rounds") as HTMLInputElement).value
    ).toBe("3");
    expect(
      (screen.getByLabelText(/winners\/round/i) as HTMLInputElement).value
    ).toBe("2");
    // No repeat winners checkbox should be unchecked (false)
    const checkbox = screen.getByRole("checkbox", {
      name: /no repeat winners/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("Generate button fills the participants textarea with 1..N lines", async () => {
    const user = userEvent.setup();
    renderWith();

    const numInput = screen.getByLabelText(/number of participants/i);
    await user.clear(numInput);
    await user.type(numInput, "12");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    const textarea = screen.getByLabelText("Participants") as HTMLTextAreaElement;
    expect(textarea.value).toBe(
      "1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n11\n12"
    );
    expect(screen.getByTestId("participant-count").textContent).toContain("12");
  });

  it("Generate button is disabled when count is 0 or empty", () => {
    renderWith();
    const btn = screen.getByRole("button", { name: /generate/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("'Show previous rounds' checkbox is rendered and checked by default", () => {
    renderWith();
    const checkbox = screen.getByRole("checkbox", {
      name: /show previous rounds/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("pre-fills 'Show previous rounds' from previous config when off", () => {
    const preloadedState = {
      phase: "IDLE" as const,
      config: { ...previousConfig, showPreviousRounds: false },
      currentRound: 0 as const,
      results: [] as [],
      eligible: [] as [],
    };
    renderWith(preloadedState);
    const checkbox = screen.getByRole("checkbox", {
      name: /show previous rounds/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("Generate button replaces existing textarea content", async () => {
    const user = userEvent.setup();
    renderWith();

    // First populate with custom names
    const textarea = screen.getByLabelText("Participants") as HTMLTextAreaElement;
    await user.type(textarea, "Alice\nBob\nCharlie");

    // Then generate a numbered list — should overwrite
    const numInput = screen.getByLabelText(/number of participants/i);
    await user.clear(numInput);
    await user.type(numInput, "4");
    await user.click(screen.getByRole("button", { name: /generate/i }));

    expect(textarea.value).toBe("1\n2\n3\n4");
  });
});
