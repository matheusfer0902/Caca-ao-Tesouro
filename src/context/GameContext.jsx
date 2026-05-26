import { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import { gameReducer, initialState } from '@/hooks/useGameState.js';
import { useAudio } from '@/hooks/useAudio.js';
import { CELL_TYPES, GAME_PHASES } from '@/utils/constants.js';
import { isWalkable } from '@/algorithms/graph.js';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { playSound, startMusic } = useAudio();

  const handleCellClick = useCallback(
    (i, j) => {
      startMusic();

      if (state.phase === GAME_PHASES.SEARCHING) return;

      const cell = state.grid[i][j];
      if (cell.type === CELL_TYPES.OBSTACLE) return;

      if (
        state.phase === GAME_PHASES.IDLE ||
        state.phase === GAME_PHASES.FOUND ||
        state.phase === GAME_PHASES.NO_PATH
      ) {
        playSound('ship');
        dispatch({
          type:
            state.phase === GAME_PHASES.FOUND || state.phase === GAME_PHASES.NO_PATH
              ? 'NEW_START'
              : 'SET_START',
          payload: { i, j },
        });
        return;
      }

      if (state.phase === GAME_PHASES.SELECTING_END) {
        if (state.start && state.start.i === i && state.start.j === j) return;
        if (!isWalkable(i, j, state.grid)) return;
        dispatch({ type: 'SET_END', payload: { i, j } });
      }
    },
    [state.phase, state.grid, state.start, playSound, startMusic]
  );

  const value = useMemo(
    () => ({
      state,
      dispatch,
      playSound,
      startMusic,
      handleCellClick,
    }),
    [state, dispatch, playSound, startMusic, handleCellClick]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
