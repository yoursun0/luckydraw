"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import type { Participant, SessionConfig, SessionState, Phase } from "./types";
import {
  createInitialSession,
  startReveal,
  markRevealComplete,
  advanceFromRevealed,
  advanceRound,
} from "./session";
import { selectWinners } from "./draw";
import { REVEAL_DURATION_MS } from "./reveal";

export interface SessionContextValue {
  state: SessionState | IdleState;
  startSession: (config: SessionConfig) => void;
  drawCurrentRound: (winners: Participant[]) => void;
  drawAuto: () => void;
  finishAndAdvance: () => void;
  returnToSetup: () => void;
}

interface IdleState {
  phase: "IDLE";
  config: SessionConfig | null;
  currentRound: 0;
  results: [];
  eligible: [];
}

type AnyState = SessionState | IdleState;

type Action =
  | { type: "START"; config: SessionConfig }
  | { type: "DRAW"; winners: Participant[] }
  | { type: "FINISH_AND_ADVANCE" }
  | { type: "RETURN_TO_SETUP" }
  | { type: "REVEAL_DONE" };

const initial: AnyState = {
  phase: "IDLE" as Phase,
  config: null,
  currentRound: 0,
  results: [],
  eligible: [],
} as AnyState;

function reducer(state: AnyState, action: Action): AnyState {
  switch (action.type) {
    case "START":
      return createInitialSession(action.config);
    case "DRAW": {
      if (state.phase !== "PRE_DRAW") return state;
      return startReveal(state as SessionState, action.winners);
    }
    case "FINISH_AND_ADVANCE": {
      // Triggered by user pressing Next in REVEALED. Advances to
      // ROUND_COMPLETE then to PRE_DRAW (or FINISHED).
      if (state.phase !== "REVEALED") return state;
      const completed = advanceFromRevealed(state as SessionState);
      return advanceRound(completed);
    }
    case "REVEAL_DONE": {
      // Auto-transition after the canvas reveal animation has finished:
      // REVEALING → REVEALED (applies filter so the next round's pool is
      // correct).
      if (state.phase !== "REVEALING") return state;
      return markRevealComplete(state as SessionState);
    }
    case "RETURN_TO_SETUP":
      // Reset session state but keep the last config so the setup form can
      // be pre-filled when the user clicks "New Draw".
      if (state.phase === "IDLE") return state;
      return { ...initial, config: (state as SessionState).config };
    default:
      return state;
  }
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
  children,
  preloadedState,
}: {
  children: React.ReactNode;
  preloadedState?: AnyState;
}) {
  const [state, dispatch] = useReducer(reducer, preloadedState ?? initial);

  const startSession = useCallback(
    (config: SessionConfig) => dispatch({ type: "START", config }),
    []
  );
  const drawCurrentRound = useCallback(
    (winners: Participant[]) => dispatch({ type: "DRAW", winners }),
    []
  );
  const finishAndAdvance = useCallback(
    () => dispatch({ type: "FINISH_AND_ADVANCE" }),
    []
  );
  const returnToSetup = useCallback(
    () => dispatch({ type: "RETURN_TO_SETUP" }),
    []
  );

  const drawAuto = useCallback(() => {
    if (state.phase !== "PRE_DRAW" || !state.config) return;
    const winners = selectWinners(state.eligible, state.config.winnersPerRound);
    dispatch({ type: "DRAW", winners });
  }, [state]);

  // Auto-transition REVEALING → REVEALED once the canvas reveal animation
  // has finished, so the winner cards appear and the user can advance.
  useEffect(() => {
    if (state.phase !== "REVEALING") return;
    const timer = setTimeout(() => {
      dispatch({ type: "REVEAL_DONE" });
    }, REVEAL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [state.phase]);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      startSession,
      drawCurrentRound,
      drawAuto,
      finishAndAdvance,
      returnToSetup,
    }),
    [state, startSession, drawCurrentRound, drawAuto, finishAndAdvance, returnToSetup]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
