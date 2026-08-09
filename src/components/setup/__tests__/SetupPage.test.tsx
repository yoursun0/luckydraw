// src/components/setup/__tests__/SetupPage.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SetupPage from "../SetupPage";
import { SessionProvider, useSession } from "@/lib/store";

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

function renderWith() {
  return render(
    <SessionProvider>
      <SetupPage />
      <Inspector />
    </SessionProvider>
  );
}

describe("SetupPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("renders the title input and participant textarea", () => {
    renderWith();
    expect(screen.getByLabelText(/event title/i)).toBeTruthy();
    expect(screen.getByLabelText(/participants/i)).toBeTruthy();
  });

  it("parses pasted textarea into participants", async () => {
    const user = userEvent.setup();
    renderWith();
    const textarea = screen.getByLabelText(/participants/i);
    await user.type(textarea, "Alice\nBob\nCharlie\nDana");
    expect(screen.getByTestId("participant-count").textContent).toMatch(/4/);
  });

  it("auto-generates from a single number", async () => {
    const user = userEvent.setup();
    renderWith();
    const textarea = screen.getByLabelText(/participants/i);
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
    await user.type(screen.getByLabelText(/participants/i), "Alice\nBob\nCharlie\nDana\nEve");
    const start = screen.getByRole("button", { name: /start/i }) as HTMLButtonElement;
    expect(start.disabled).toBe(false);
    await user.click(start);
    expect(screen.getByTestId("phase").textContent).toBe("PRE_DRAW");
    expect(pushMock).toHaveBeenCalledWith("/display");
  });
});
