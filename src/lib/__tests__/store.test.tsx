// src/lib/__tests__/store.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, act, screen } from "@testing-library/react";
import { useSession, SessionProvider } from "../store";
import { REVEAL_DURATION_MS } from "../reveal";
import type { SessionConfig } from "../types";

const config: SessionConfig = {
  eventTitle: "Test",
  participants: Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    name: `P${i + 1}`,
  })),
  rounds: 1,
  winnersPerRound: 1,
  filterWinners: true,
  showPreviousRounds: true,
};

function Reader() {
  const { state, startSession, drawCurrentRound, finishAndAdvance, returnToSetup } = useSession();
  return (
    <div>
      <span data-testid="phase">{state.phase}</span>
      <span data-testid="configTitle">{state.config?.eventTitle ?? ""}</span>
      <span data-testid="participantCount">
        {state.config?.participants.length ?? 0}
      </span>
      <button onClick={() => startSession(config)}>start</button>
      <button
        onClick={() => {
          if (state.phase === "PRE_DRAW") {
            const winners = state.eligible.slice(0, config.winnersPerRound);
            drawCurrentRound(winners);
          }
        }}
      >
        draw
      </button>
      <button onClick={() => finishAndAdvance()}>next</button>
      <button onClick={() => returnToSetup()}>returnToSetup</button>
    </div>
  );
}

describe("SessionProvider", () => {
  it("starts with no session (phase IDLE)", () => {
    render(
      <SessionProvider>
        <Reader />
      </SessionProvider>
    );
    expect(screen.getByTestId("phase").textContent).toBe("IDLE");
  });

  it("starts, draws, auto-advances reveal, then user advances", () => {
    vi.useFakeTimers();
    render(
      <SessionProvider>
        <Reader />
      </SessionProvider>
    );
    act(() => {
      screen.getByText("start").click();
    });
    expect(screen.getByTestId("phase").textContent).toBe("PRE_DRAW");
    act(() => {
      screen.getByText("draw").click();
    });
    expect(screen.getByTestId("phase").textContent).toBe("REVEALING");

    // After REVEAL_DURATION_MS the auto-transition fires: REVEALING → REVEALED
    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS + 50);
    });
    expect(screen.getByTestId("phase").textContent).toBe("REVEALED");

    // User clicks Next → ROUND_COMPLETE → advanceRound → FINISHED (1 round)
    act(() => {
      screen.getByText("next").click();
    });
    expect(screen.getByTestId("phase").textContent).toBe("FINISHED");
    vi.useRealTimers();
  });

  it("returnToSetup clears phase/results but preserves config", () => {
    vi.useFakeTimers();
    render(
      <SessionProvider>
        <Reader />
      </SessionProvider>
    );
    act(() => {
      screen.getByText("start").click();
    });
    act(() => {
      screen.getByText("draw").click();
    });
    act(() => {
      vi.advanceTimersByTime(REVEAL_DURATION_MS + 50);
    });
    expect(screen.getByTestId("phase").textContent).toBe("REVEALED");

    act(() => {
      screen.getByText("returnToSetup").click();
    });

    // Phase is reset to IDLE so the DisplayPage redirects home, BUT config
    // is preserved so the SetupPage can pre-fill the form.
    expect(screen.getByTestId("phase").textContent).toBe("IDLE");
    expect(screen.getByTestId("configTitle").textContent).toBe("Test");
    expect(screen.getByTestId("participantCount").textContent).toBe("5");
    vi.useRealTimers();
  });
});
