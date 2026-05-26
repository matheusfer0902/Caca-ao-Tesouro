import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { bfs } from '@/algorithms/bfs.js';
import { dfs } from '@/algorithms/dfs.js';
import { GAME_PHASES } from '@/utils/constants.js';

export function useSearchAnimation() {
  const { state, dispatch, playSound } = useGame();
  const timerRef = useRef(null);
  const generatorRef = useRef(null);
  const speedRef = useRef(state.animation.speed);
  const searchSessionRef = useRef(null);

  speedRef.current = state.animation.speed;
  const isCompare = state.algorithm === 'compare';

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runStep = useCallback(() => {
    if (isCompare || !generatorRef.current) return;

    const { value, done } = generatorRef.current.next();

    if (done || !value) {
      generatorRef.current = null;
      return;
    }

    if (value.type === 'init' || value.type === 'step') {
      dispatch({ type: 'SEARCH_STEP', payload: value });
    }

    if (value.type === 'found' || value.type === 'no_path') {
      dispatch({ type: 'SEARCH_COMPLETE', payload: value });
      if (value.type === 'found') {
        playSound('chest');
      }
      generatorRef.current = null;
      searchSessionRef.current = null;
      return;
    }

    timerRef.current = setTimeout(runStep, speedRef.current);
  }, [dispatch, playSound, isCompare]);

  const stepForward = useCallback(() => {
    if (isCompare || !generatorRef.current) return;
    clearTimer();
    runStep();
  }, [clearTimer, runStep, isCompare]);

  const togglePlay = useCallback(() => {
    if (isCompare || state.phase !== GAME_PHASES.SEARCHING) return;
    if (state.animation.isPlaying) {
      dispatch({ type: 'PAUSE' });
      clearTimer();
    } else {
      dispatch({ type: 'PLAY' });
      if (generatorRef.current) {
        timerRef.current = setTimeout(runStep, speedRef.current);
      }
    }
  }, [clearTimer, dispatch, runStep, state.animation.isPlaying, state.phase, isCompare]);

  useEffect(() => {
    if (isCompare) {
      generatorRef.current = null;
      searchSessionRef.current = null;
      clearTimer();
      return;
    }

    if (state.phase !== GAME_PHASES.SEARCHING || !state.start || !state.end) {
      generatorRef.current = null;
      searchSessionRef.current = null;
      clearTimer();
      return;
    }

    const sessionKey = `${state.start.i},${state.start.j}-${state.end.i},${state.end.j}-${state.algorithm}`;

    if (searchSessionRef.current !== sessionKey) {
      searchSessionRef.current = sessionKey;
      const algo = state.algorithm === 'bfs' ? bfs : dfs;
      generatorRef.current = algo(state.start, state.end, state.grid);
      clearTimer();
      if (state.animation.isPlaying) {
        timerRef.current = setTimeout(runStep, speedRef.current);
      }
    }
  }, [
    state.phase,
    state.start,
    state.end,
    state.algorithm,
    state.grid,
    state.animation.isPlaying,
    runStep,
    clearTimer,
    isCompare,
  ]);

  useEffect(() => {
    if (isCompare) return;

    if (
      state.phase === GAME_PHASES.SEARCHING &&
      state.animation.isPlaying &&
      generatorRef.current &&
      !timerRef.current
    ) {
      timerRef.current = setTimeout(runStep, speedRef.current);
    }
  }, [state.animation.isPlaying, state.animation.speed, state.phase, runStep, isCompare]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    stepForward,
    togglePlay,
    isSearching: !isCompare && state.phase === GAME_PHASES.SEARCHING,
  };
}
