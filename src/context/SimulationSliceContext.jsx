import { createContext, useContext, useMemo } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';

const SimulationSliceContext = createContext(null);

export function SimulationSliceProvider({ side, children }) {
  const { state } = useGame();
  const isCompare = state.algorithm === 'compare';

  const value = useMemo(() => {
    if (!isCompare || !side) {
      return {
        side: null,
        grid: state.grid,
        phase: state.phase,
        searchSnapshot: state.searchSnapshot,
        stats: state.stats,
        shipPathIndex: state.shipPathIndex,
        shipAnimating: state.shipAnimating,
        globalPhase: state.phase,
        start: state.start,
        end: state.end,
      };
    }

    const slice = state.compare[side];
    return {
      side,
      grid: slice.grid,
      phase: slice.phase,
      searchSnapshot: slice.searchSnapshot,
      stats: slice.stats,
      shipPathIndex: slice.shipPathIndex,
      shipAnimating: slice.shipAnimating,
      globalPhase: state.phase,
      start: state.start,
      end: state.end,
    };
  }, [isCompare, side, state]);

  return (
    <SimulationSliceContext.Provider value={value}>{children}</SimulationSliceContext.Provider>
  );
}

export function useSimulationSlice() {
  const slice = useContext(SimulationSliceContext);
  const { state } = useGame();

  if (slice) return slice;

  return {
    side: null,
    grid: state.grid,
    phase: state.phase,
    searchSnapshot: state.searchSnapshot,
    stats: state.stats,
    shipPathIndex: state.shipPathIndex,
    shipAnimating: state.shipAnimating,
    globalPhase: state.phase,
    start: state.start,
    end: state.end,
  };
}

export function isCompareMode(state) {
  return state.algorithm === 'compare';
}

export function isCompareSearching(state) {
  if (!isCompareMode(state)) return state.phase === GAME_PHASES.SEARCHING;
  return (
    state.compare.bfs.phase === GAME_PHASES.SEARCHING ||
    state.compare.dfs.phase === GAME_PHASES.SEARCHING
  );
}

export function isCompareFinished(state) {
  if (!isCompareMode(state)) {
    return state.phase === GAME_PHASES.FOUND || state.phase === GAME_PHASES.NO_PATH;
  }
  const { bfs, dfs } = state.compare;
  const done = (p) => p === GAME_PHASES.FOUND || p === GAME_PHASES.NO_PATH;
  return done(bfs.phase) && done(dfs.phase);
}

export function getCompareSlice(state, side) {
  if (!isCompareMode(state)) return null;
  return state.compare[side];
}
