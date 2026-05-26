import { useCallback, useEffect, useRef } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { bfs } from '@/algorithms/bfs.js';
import { dfs } from '@/algorithms/dfs.js';
import { GAME_PHASES } from '@/utils/constants.js';
import { isCompareMode } from '@/context/SimulationSliceContext.jsx';
import { finalizeCompareSideClock } from '@/hooks/useComparisonWallClock.js';

const SIDES = ['bfs', 'dfs'];

export function useComparisonSearchAnimation() {
  const { state, dispatch, playSound } = useGame();
  const timersRef = useRef({ bfs: null, dfs: null });
  const generatorsRef = useRef({ bfs: null, dfs: null });
  const sessionsRef = useRef({ bfs: null, dfs: null });
  const speedRef = useRef(state.animation.speed);
  const finishedSoundRef = useRef({ bfs: false, dfs: false });

  speedRef.current = state.animation.speed;

  const clearSideTimer = useCallback((side) => {
    if (timersRef.current[side]) {
      clearTimeout(timersRef.current[side]);
      timersRef.current[side] = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    for (const side of SIDES) clearSideTimer(side);
  }, [clearSideTimer]);

  const runSideStep = useCallback(
    (side) => {
      const generator = generatorsRef.current[side];
      if (!generator) return;

      const { value, done } = generator.next();

      if (done || !value) {
        generatorsRef.current[side] = null;
        return;
      }

      if (value.type === 'init' || value.type === 'step') {
        dispatch({ type: 'SEARCH_STEP', payload: { ...value, side } });
      }

      if (value.type === 'found' || value.type === 'no_path') {
        const elapsedMs = finalizeCompareSideClock(side);
        dispatch({ type: 'SEARCH_COMPLETE', payload: { ...value, side, elapsedMs } });
        if (value.type === 'found' && !finishedSoundRef.current[side]) {
          finishedSoundRef.current[side] = true;
          playSound('chest');
        }
        generatorsRef.current[side] = null;
        sessionsRef.current[side] = null;
        return;
      }

      timersRef.current[side] = setTimeout(() => runSideStep(side), speedRef.current);
    },
    [dispatch, playSound]
  );

  const stepForward = useCallback(() => {
    if (!isCompareMode(state)) return;
    clearAllTimers();

    for (const side of SIDES) {
      if (
        generatorsRef.current[side] &&
        state.compare[side].phase === GAME_PHASES.SEARCHING
      ) {
        runSideStep(side);
      }
    }
  }, [clearAllTimers, runSideStep, state]);

  const togglePlay = useCallback(() => {
    if (!isCompareMode(state)) return;
    if (state.animation.isPlaying) {
      dispatch({ type: 'PAUSE' });
      clearAllTimers();
    } else {
      dispatch({ type: 'PLAY' });
      for (const side of SIDES) {
        if (
          generatorsRef.current[side] &&
          state.compare[side].phase === GAME_PHASES.SEARCHING &&
          !timersRef.current[side]
        ) {
          timersRef.current[side] = setTimeout(() => runSideStep(side), speedRef.current);
        }
      }
    }
  }, [clearAllTimers, dispatch, runSideStep, state]);

  useEffect(() => {
    if (!isCompareMode(state) || !state.start || !state.end) {
      generatorsRef.current = { bfs: null, dfs: null };
      sessionsRef.current = { bfs: null, dfs: null };
      finishedSoundRef.current = { bfs: false, dfs: false };
      clearAllTimers();
      return;
    }

    const sessionKey = `${state.start.i},${state.start.j}-${state.end.i},${state.end.j}`;

    for (const side of SIDES) {
      const slicePhase = state.compare[side].phase;
      if (slicePhase !== GAME_PHASES.SEARCHING) {
        clearSideTimer(side);
        generatorsRef.current[side] = null;
        sessionsRef.current[side] = null;
        continue;
      }

      const sideSession = `${sessionKey}-${side}`;
      if (sessionsRef.current[side] !== sideSession) {
        sessionsRef.current[side] = sideSession;
        finishedSoundRef.current[side] = false;
        const algo = side === 'bfs' ? bfs : dfs;
        generatorsRef.current[side] = algo(state.start, state.end, state.compare[side].grid);
        clearSideTimer(side);
        if (state.animation.isPlaying) {
          timersRef.current[side] = setTimeout(() => runSideStep(side), speedRef.current);
        }
      }
    }
  }, [
    state.start,
    state.end,
    state.algorithm,
    state.compare?.bfs?.phase,
    state.compare?.dfs?.phase,
    state.animation.isPlaying,
    runSideStep,
    clearSideTimer,
    clearAllTimers,
  ]);

  useEffect(() => {
    if (!isCompareMode(state)) return;

    for (const side of SIDES) {
      if (
        state.compare[side].phase === GAME_PHASES.SEARCHING &&
        state.animation.isPlaying &&
        generatorsRef.current[side] &&
        !timersRef.current[side]
      ) {
        timersRef.current[side] = setTimeout(() => runSideStep(side), speedRef.current);
      }
    }
  }, [state.animation.isPlaying, state.animation.speed, state.algorithm, state.compare?.bfs?.phase, state.compare?.dfs?.phase, runSideStep]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const isSearching =
    isCompareMode(state) &&
    (state.compare.bfs.phase === GAME_PHASES.SEARCHING ||
      state.compare.dfs.phase === GAME_PHASES.SEARCHING);

  return { stepForward, togglePlay, isSearching };
}
