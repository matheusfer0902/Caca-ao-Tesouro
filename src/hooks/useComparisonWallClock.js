import { useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';
import { isCompareMode } from '@/context/SimulationSliceContext.jsx';

const SIDES = ['bfs', 'dfs'];
const TICK_MS = 50;

function createClock() {
  return { ms: 0, runningSince: null };
}

function readClock(clock) {
  return clock.ms + (clock.runningSince != null ? performance.now() - clock.runningSince : 0);
}

function freezeClock(clock) {
  if (clock.runningSince != null) {
    clock.ms += performance.now() - clock.runningSince;
    clock.runningSince = null;
  }
  return clock.ms;
}

export const comparisonClocksRef = {
  current: { bfs: createClock(), dfs: createClock() },
};

export function resetComparisonClocks() {
  comparisonClocksRef.current = { bfs: createClock(), dfs: createClock() };
}

export function finalizeCompareSideClock(side) {
  return Math.round(freezeClock(comparisonClocksRef.current[side]));
}

export function useComparisonWallClock() {
  const { state, dispatch } = useGame();
  const stateRef = useRef(state);
  stateRef.current = state;
  const sessionRef = useRef(null);

  const sessionKey =
    state.start && state.end
      ? `${state.start.i},${state.start.j}-${state.end.i},${state.end.j}`
      : null;

  useEffect(() => {
    if (!isCompareMode(state) || !sessionKey) return;

    if (sessionRef.current !== sessionKey) {
      sessionRef.current = sessionKey;
      resetComparisonClocks();
    }

    const isPlaying = state.animation.isPlaying;

    for (const side of SIDES) {
      const phase = state.compare[side].phase;
      const completed = state.compare.timers[side].completed;
      const clock = comparisonClocksRef.current[side];
      const shouldRun = phase === GAME_PHASES.SEARCHING && isPlaying && !completed;

      if (shouldRun && clock.runningSince == null) {
        clock.runningSince = performance.now();
      } else if (!shouldRun && clock.runningSince != null) {
        freezeClock(clock);
      }
    }
  }, [
    sessionKey,
    state.algorithm,
    state.animation.isPlaying,
    state.compare?.bfs?.phase,
    state.compare?.dfs?.phase,
    state.compare?.timers?.bfs?.completed,
    state.compare?.timers?.dfs?.completed,
  ]);

  useEffect(() => {
    if (!isCompareMode(state)) return;

    const interval = setInterval(() => {
      const current = stateRef.current;
      if (!isCompareMode(current) || !current.animation.isPlaying) return;

      for (const side of SIDES) {
        const phase = current.compare[side].phase;
        const completed = current.compare.timers[side].completed;
        if (phase !== GAME_PHASES.SEARCHING || completed) continue;

        const elapsedMs = Math.round(readClock(comparisonClocksRef.current[side]));
        dispatch({ type: 'COMPARE_TIMER_UPDATE', payload: { side, elapsedMs } });
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [dispatch, state.algorithm]);
}
