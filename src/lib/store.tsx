"use client";

import React, { createContext, useContext, useReducer, useMemo, useCallback } from "react";
import type { Participant, SessionConfig, SessionState, Phase } from "./types";
import {
  createInitialSession,
  startReveal,
  finishReveal,
  advanceRound,
} from "./session";
import { selectWinners } from "./draw";

export interface SessionContextValue {
  state: SessionState | { phase: "IDLE"; config: null; currentRound: 0; results: []; eligible: [] };
  startSession: (config: SessionConfig) => void;
  drawCurrentRound: (winners: Participant[]) => void;
  drawAuto: () => void;
  finishAndAdvance: () => void;
  reset: () => void;
}

type AnyState = SessionContextValue["state"];

type Action =
  | { type: "START"; config: SessionConfig }
  | { type: "DRAW"; winners: Participant[] }
  | { type: "FINISH_AND_ADVANCE" }
  | { type: "RESET" };

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
      if (state.phase !== "REVEALING") return state;
      const finished = finishReveal(state as SessionState);
      return advanceRound(finished);
    }
    case "RESET":
      return initial;
    default:
      return state;
  }
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

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
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  const drawAuto = useCallback(() => {
    if (state.phase !== "PRE_DRAW" || !state.config) return;
    const winners = selectWinners(state.eligible, state.config.winnersPerRound);
    dispatch({ type: "DRAW", winners });
  }, [state]);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      startSession,
      drawCurrentRound,
      drawAuto,
      finishAndAdvance,
      reset,
    }),
    [state, startSession, drawCurrentRound, drawAuto, finishAndAdvance, reset]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
