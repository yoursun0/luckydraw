// src/lib/__tests__/store.test.tsx
import { describe, it, expect } from "vitest";
import { render, act, screen } from "@testing-library/react";
import { useSession, SessionProvider } from "../store";
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
};

function Reader() {
  const { state, startSession, drawCurrentRound, finishAndAdvance } = useSession();
  return (
    <div>
      <span data-testid="phase">{state.phase}</span>
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

  it("starts, draws, advances a session", () => {
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
    act(() => {
      screen.getByText("next").click();
    });
    expect(screen.getByTestId("phase").textContent).toBe("FINISHED");
  });
});
