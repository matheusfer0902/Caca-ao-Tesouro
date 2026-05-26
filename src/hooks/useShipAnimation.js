import { useEffect } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES, SHIP_ROUTE_STEP_MS } from '@/utils/constants.js';
import { isCompareMode } from '@/context/SimulationSliceContext.jsx';

const SIDES = ['bfs', 'dfs'];

export function useShipAnimation() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (isCompareMode(state)) {
      for (const side of SIDES) {
        const slice = state.compare[side];
        const path = slice.searchSnapshot.path;
        const pathLength = path?.length ?? 0;

        if (slice.phase !== GAME_PHASES.FOUND || pathLength < 2) continue;
        if (slice.shipAnimating) continue;
        if (slice.shipPathIndex >= pathLength - 1) continue;
        dispatch({ type: 'START_SHIP_ROUTE', payload: { side } });
      }
      return;
    }

    const path = state.searchSnapshot.path;
    const pathLength = path?.length ?? 0;

    if (state.phase !== GAME_PHASES.FOUND || pathLength < 2) return;
    if (state.shipAnimating) return;
    if (state.shipPathIndex >= pathLength - 1) return;
    dispatch({ type: 'START_SHIP_ROUTE' });
  }, [
    state.phase,
    state.shipAnimating,
    state.shipPathIndex,
    state.searchSnapshot.path,
    state.compare,
    state.algorithm,
    dispatch,
    state,
  ]);

  useEffect(() => {
    if (isCompareMode(state)) {
      const animating = SIDES.some((side) => state.compare[side].shipAnimating);
      if (!animating) return;

      const interval = setInterval(() => {
        for (const side of SIDES) {
          if (state.compare[side].shipAnimating) {
            dispatch({ type: 'ADVANCE_SHIP', payload: { side } });
          }
        }
      }, SHIP_ROUTE_STEP_MS);

      return () => clearInterval(interval);
    }

    if (!state.shipAnimating) return;

    const pathLength = state.searchSnapshot.path?.length ?? 0;
    if (pathLength < 2) return;

    const interval = setInterval(() => {
      dispatch({ type: 'ADVANCE_SHIP' });
    }, SHIP_ROUTE_STEP_MS);

    return () => clearInterval(interval);
  }, [
    state.shipAnimating,
    state.searchSnapshot.path,
    state.compare,
    state.algorithm,
    dispatch,
    state,
  ]);
}
