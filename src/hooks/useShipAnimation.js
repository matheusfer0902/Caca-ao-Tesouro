import { useEffect } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';

export function useShipAnimation() {
  const { state, dispatch } = useGame();

  useEffect(() => {
    if (!state.shipAnimating || !state.searchSnapshot.path?.length) return;

    const interval = setInterval(() => {
      dispatch({ type: 'ADVANCE_SHIP' });
    }, 350);

    return () => clearInterval(interval);
  }, [state.shipAnimating, state.searchSnapshot.path, dispatch]);
}
