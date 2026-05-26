import { useEffect } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES, SHIP_ROUTE_STEP_MS } from '@/utils/constants.js';

export function useShipAnimation() {
  const { state, dispatch } = useGame();
  const path = state.searchSnapshot.path;
  const pathLength = path?.length ?? 0;

  useEffect(() => {
    if (state.phase !== GAME_PHASES.FOUND || pathLength < 2) return;
    if (state.shipAnimating) return;
    if (state.shipPathIndex >= pathLength - 1) return;
    dispatch({ type: 'START_SHIP_ROUTE' });
  }, [state.phase, pathLength, state.shipAnimating, state.shipPathIndex, dispatch]);

  useEffect(() => {
    if (!state.shipAnimating || pathLength < 2) return;

    const interval = setInterval(() => {
      dispatch({ type: 'ADVANCE_SHIP' });
    }, SHIP_ROUTE_STEP_MS);

    return () => clearInterval(interval);
  }, [state.shipAnimating, pathLength, dispatch]);
}
