import {
  DEFAULT_ANIMATION_SPEED,
  DEFAULT_DIFFICULTY,
  GAME_PHASES,
  APP_SCREENS,
  CELL_TYPES,
} from '@/utils/constants.js';
import {
  clearSearchState,
  cloneGrid,
  rebuildGridWithMarkers,
  applySearchSnapshot,
  cellKey,
  isReachable,
} from '@/algorithms/graph.js';
import {
  generateMapFromPreset,
  generateCustomMap,
  shuffleMap,
} from '@/utils/terrainGenerator.js';

const COMPARE_SIDES = ['bfs', 'dfs'];

const initialMap = generateMapFromPreset(DEFAULT_DIFFICULTY);

export const initialState = {
  appScreen: APP_SCREENS.SETUP,
  phase: GAME_PHASES.IDLE,
  grid: initialMap.grid,
  gridSize: initialMap.gridSize,
  numObstacles: initialMap.numObstacles,
  mapDifficulty: initialMap.mapDifficulty,
  maxElevation: initialMap.maxElevation,
  presetLabel: initialMap.presetLabel,
  algorithm: 'bfs',
  start: null,
  end: null,
  searchSnapshot: {
    current: null,
    frontier: [],
    visited: [],
    path: [],
    depth: null,
  },
  animation: {
    isPlaying: false,
    speed: DEFAULT_ANIMATION_SPEED,
    currentStep: 0,
    totalSteps: 0,
  },
  stats: {
    stepsInPath: 0,
    nodesExplored: 0,
    frontierSize: 0,
  },
  shipPathIndex: 0,
  shipAnimating: false,
  noPathReason: null,
  compare: null,
};

function resetSelection(grid) {
  const next = cloneGrid(grid);
  clearSearchState(next);
  return next;
}

function snapshotFromEvent(event) {
  return {
    current: event.current || null,
    frontier: (event.frontier || []).map((p) => cellKey(p.i, p.j)),
    visited: (event.visited || []).map((p) => cellKey(p.i, p.j)),
    path: event.path || [],
    depth: event.depth ?? null,
  };
}

function createCompareSide(grid) {
  return {
    phase: GAME_PHASES.IDLE,
    grid: cloneGrid(grid),
    searchSnapshot: { ...initialState.searchSnapshot },
    stats: { ...initialState.stats },
    animation: { currentStep: 0, totalSteps: 0 },
    shipPathIndex: 0,
    shipAnimating: false,
    noPathReason: null,
  };
}

function initialCompareTimer(running = false) {
  return { elapsedMs: 0, isRunning: running, completed: false };
}

function createCompareState(grid) {
  return {
    bfs: createCompareSide(grid),
    dfs: createCompareSide(grid),
    timers: {
      bfs: initialCompareTimer(),
      dfs: initialCompareTimer(),
    },
  };
}

function isCompareMode(state) {
  return state.algorithm === 'compare' && state.compare != null;
}

function deriveCompareGlobalPhase(bfsPhase, dfsPhase) {
  if (bfsPhase === GAME_PHASES.SEARCHING || dfsPhase === GAME_PHASES.SEARCHING) {
    return GAME_PHASES.SEARCHING;
  }
  if (bfsPhase === GAME_PHASES.IDLE && dfsPhase === GAME_PHASES.IDLE) {
    return GAME_PHASES.IDLE;
  }
  if (bfsPhase === GAME_PHASES.SELECTING_END || dfsPhase === GAME_PHASES.SELECTING_END) {
    return GAME_PHASES.SELECTING_END;
  }
  const anyFound = bfsPhase === GAME_PHASES.FOUND || dfsPhase === GAME_PHASES.FOUND;
  return anyFound ? GAME_PHASES.FOUND : GAME_PHASES.NO_PATH;
}

function handleCompareStart(state, i, j) {
  let grid = resetSelection(state.grid);
  grid[i][j].type = CELL_TYPES.START;

  const compare = {
    ...state.compare,
    bfs: {
      ...resetCompareSideSelection(state.compare.bfs, grid),
      phase: GAME_PHASES.SELECTING_END,
      grid: (() => {
        const g = resetSelection(grid);
        g[i][j].type = CELL_TYPES.START;
        return g;
      })(),
    },
    dfs: {
      ...resetCompareSideSelection(state.compare.dfs, grid),
      phase: GAME_PHASES.SELECTING_END,
      grid: (() => {
        const g = resetSelection(grid);
        g[i][j].type = CELL_TYPES.START;
        return g;
      })(),
    },
    timers: {
      bfs: initialCompareTimer(),
      dfs: initialCompareTimer(),
    },
  };

  return {
    ...state,
    phase: GAME_PHASES.SELECTING_END,
    start: { i, j },
    end: null,
    grid,
    compare,
    searchSnapshot: initialState.searchSnapshot,
    stats: initialState.stats,
    animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
    shipPathIndex: 0,
    shipAnimating: false,
    noPathReason: null,
  };
}

function applySearchStepToSide(sideState, event, start, end) {
  const snapshot = snapshotFromEvent(event);
  const grid = applySearchSnapshot(
    rebuildGridWithMarkers(sideState.grid, start, end),
    { ...snapshot, path: [] }
  );

  return {
    ...sideState,
    grid,
    searchSnapshot: snapshot,
    stats: {
      stepsInPath: sideState.stats.stepsInPath,
      nodesExplored: event.nodesExplored ?? sideState.stats.nodesExplored,
      frontierSize: event.frontierSize ?? sideState.stats.frontierSize,
    },
    animation: {
      ...sideState.animation,
      currentStep: sideState.animation.currentStep + 1,
    },
  };
}

function applySearchCompleteToSide(sideState, event, start, end) {
  const path = event.path || [];
  const snapshot = snapshotFromEvent(event);
  const grid = applySearchSnapshot(
    rebuildGridWithMarkers(sideState.grid, start, end),
    { ...snapshot, path }
  );

  if (event.type === 'found') {
    for (const point of path) {
      if (grid[point.i][point.j].type === CELL_TYPES.EMPTY) {
        grid[point.i][point.j].searchStatus = 'path';
      }
    }
  }

  return {
    ...sideState,
    phase: event.type === 'found' ? GAME_PHASES.FOUND : GAME_PHASES.NO_PATH,
    grid,
    searchSnapshot: { ...snapshot, path },
    stats: {
      stepsInPath:
        event.type === 'found' ? (event.stepsInPath ?? Math.max(0, path.length - 1)) : 0,
      nodesExplored: event.nodesExplored ?? sideState.stats.nodesExplored,
      frontierSize: 0,
    },
    shipPathIndex: 0,
    shipAnimating: event.type === 'found',
    noPathReason: event.type === 'no_path' ? (event.noPathReason ?? 'exhausted') : null,
  };
}

function resetCompareSideSelection(sideState, grid) {
  return {
    ...sideState,
    phase: GAME_PHASES.IDLE,
    grid: resetSelection(grid),
    searchSnapshot: { ...initialState.searchSnapshot },
    stats: { ...initialState.stats },
    animation: { currentStep: 0, totalSteps: 0 },
    shipPathIndex: 0,
    shipAnimating: false,
    noPathReason: null,
  };
}

function resetGameFields(state, mapData) {
  const base = {
    ...initialState,
    appScreen: state.appScreen,
    grid: mapData.grid,
    gridSize: mapData.gridSize,
    numObstacles: mapData.numObstacles,
    mapDifficulty: mapData.mapDifficulty,
    maxElevation: mapData.maxElevation,
    presetLabel: mapData.presetLabel,
    algorithm: state.algorithm,
    animation: { ...initialState.animation, speed: state.animation.speed },
  };

  if (state.algorithm === 'compare') {
    return { ...base, compare: createCompareState(mapData.grid) };
  }
  return base;
}

function buildExpeditionState(state, mapData, algorithm, speed) {
  const base = {
    ...initialState,
    appScreen: APP_SCREENS.SIMULATION,
    grid: mapData.grid,
    gridSize: mapData.gridSize,
    numObstacles: mapData.numObstacles,
    mapDifficulty: mapData.mapDifficulty,
    maxElevation: mapData.maxElevation,
    presetLabel: mapData.presetLabel,
    algorithm,
    animation: {
      ...initialState.animation,
      speed: speed ?? state.animation?.speed ?? DEFAULT_ANIMATION_SPEED,
    },
  };

  if (algorithm === 'compare') {
    return { ...base, compare: createCompareState(mapData.grid) };
  }
  return base;
}

function handleCompareSetEnd(state, i, j) {
  let grid = resetSelection(state.grid);
  if (state.start) {
    grid[state.start.i][state.start.j].type = CELL_TYPES.START;
  }
  grid[i][j].type = CELL_TYPES.END;
  const end = { i, j };

  const makeSideGrid = () => {
    const g = resetSelection(grid);
    if (state.start) g[state.start.i][state.start.j].type = CELL_TYPES.START;
    g[i][j].type = CELL_TYPES.END;
    return g;
  };

  if (state.start && !isReachable(state.start, end, grid)) {
    const sideGrid = makeSideGrid();
    const noPathSide = {
      phase: GAME_PHASES.NO_PATH,
      grid: sideGrid,
      searchSnapshot: { ...initialState.searchSnapshot },
      stats: { stepsInPath: 0, nodesExplored: 0, frontierSize: 0 },
      animation: { currentStep: 0, totalSteps: 0 },
      shipPathIndex: 0,
      shipAnimating: false,
      noPathReason: 'disconnected',
    };

    return {
      ...state,
      phase: GAME_PHASES.NO_PATH,
      end,
      grid,
      compare: {
        ...state.compare,
        bfs: { ...state.compare.bfs, ...noPathSide },
        dfs: { ...state.compare.dfs, ...noPathSide },
        timers: {
          bfs: initialCompareTimer(),
          dfs: initialCompareTimer(),
        },
      },
      animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
      noPathReason: 'disconnected',
    };
  }

  const makeSearchingSide = () => ({
    phase: GAME_PHASES.SEARCHING,
    grid: makeSideGrid(),
    searchSnapshot: { ...initialState.searchSnapshot },
    stats: { ...initialState.stats },
    animation: { currentStep: 0, totalSteps: 0 },
    shipPathIndex: 0,
    shipAnimating: false,
    noPathReason: null,
  });

  return {
    ...state,
    phase: GAME_PHASES.SEARCHING,
    end,
    grid,
    compare: {
      ...state.compare,
      bfs: { ...state.compare.bfs, ...makeSearchingSide() },
      dfs: { ...state.compare.dfs, ...makeSearchingSide() },
      timers: {
        bfs: initialCompareTimer(true),
        dfs: initialCompareTimer(true),
      },
    },
    animation: { ...state.animation, isPlaying: true, currentStep: 0, totalSteps: 0 },
    noPathReason: null,
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_START': {
      const { i, j } = action.payload;
      if (isCompareMode(state)) return handleCompareStart(state, i, j);

      let grid = resetSelection(state.grid);
      grid[i][j].type = CELL_TYPES.START;

      return {
        ...state,
        phase: GAME_PHASES.SELECTING_END,
        start: { i, j },
        end: null,
        grid,
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
        noPathReason: null,
      };
    }

    case 'SET_START': {
      const { i, j } = action.payload;
      if (isCompareMode(state)) return handleCompareStart(state, i, j);

      let grid = resetSelection(state.grid);
      grid[i][j].type = CELL_TYPES.START;

      return {
        ...state,
        phase: GAME_PHASES.SELECTING_END,
        start: { i, j },
        end: null,
        grid,
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
        noPathReason: null,
      };
    }

    case 'SET_END': {
      const { i, j } = action.payload;
      if (isCompareMode(state)) return handleCompareSetEnd(state, i, j);

      let grid = resetSelection(state.grid);
      if (state.start) {
        grid[state.start.i][state.start.j].type = CELL_TYPES.START;
      }
      grid[i][j].type = CELL_TYPES.END;
      const end = { i, j };

      if (state.start && !isReachable(state.start, end, grid)) {
        return {
          ...state,
          phase: GAME_PHASES.NO_PATH,
          end,
          grid,
          searchSnapshot: initialState.searchSnapshot,
          stats: {
            stepsInPath: 0,
            nodesExplored: 0,
            frontierSize: 0,
          },
          animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
          shipPathIndex: 0,
          shipAnimating: false,
          noPathReason: 'disconnected',
        };
      }

      return {
        ...state,
        phase: GAME_PHASES.SEARCHING,
        end,
        grid,
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: true, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
        noPathReason: null,
      };
    }

    case 'SEARCH_STEP': {
      const event = action.payload;

      if (isCompareMode(state) && event.side) {
        const side = event.side;
        const { side: _s, ...algoEvent } = event;
        const updatedSide = applySearchStepToSide(
          state.compare[side],
          algoEvent,
          state.start,
          state.end
        );

        return {
          ...state,
          compare: {
            ...state.compare,
            [side]: updatedSide,
          },
        };
      }

      const snapshot = snapshotFromEvent(event);
      const grid = applySearchSnapshot(
        rebuildGridWithMarkers(state.grid, state.start, state.end),
        { ...snapshot, path: [] }
      );

      return {
        ...state,
        grid,
        searchSnapshot: snapshot,
        stats: {
          stepsInPath: state.stats.stepsInPath,
          nodesExplored: event.nodesExplored ?? state.stats.nodesExplored,
          frontierSize: event.frontierSize ?? state.stats.frontierSize,
        },
        animation: {
          ...state.animation,
          currentStep: state.animation.currentStep + 1,
        },
      };
    }

    case 'SEARCH_COMPLETE': {
      const event = action.payload;

      if (isCompareMode(state) && event.side) {
        const side = event.side;
        const { side: _s, ...algoEvent } = event;
        const updatedSide = applySearchCompleteToSide(
          state.compare[side],
          algoEvent,
          state.start,
          state.end
        );

        const nextCompare = {
          ...state.compare,
          [side]: updatedSide,
          timers: {
            ...state.compare.timers,
            [side]: {
              elapsedMs: event.elapsedMs ?? state.compare.timers[side].elapsedMs,
              isRunning: false,
              completed: true,
            },
          },
        };

        const globalPhase = deriveCompareGlobalPhase(
          nextCompare.bfs.phase,
          nextCompare.dfs.phase
        );

        return {
          ...state,
          phase: globalPhase,
          compare: nextCompare,
          animation: {
            ...state.animation,
            isPlaying: globalPhase === GAME_PHASES.SEARCHING ? state.animation.isPlaying : false,
          },
        };
      }

      const path = event.path || [];
      const snapshot = snapshotFromEvent(event);
      const grid = applySearchSnapshot(
        rebuildGridWithMarkers(state.grid, state.start, state.end),
        { ...snapshot, path }
      );

      if (event.type === 'found') {
        for (const point of path) {
          if (grid[point.i][point.j].type === CELL_TYPES.EMPTY) {
            grid[point.i][point.j].searchStatus = 'path';
          }
        }
      }

      return {
        ...state,
        phase: event.type === 'found' ? GAME_PHASES.FOUND : GAME_PHASES.NO_PATH,
        grid,
        searchSnapshot: { ...snapshot, path },
        stats: {
          stepsInPath: event.type === 'found' ? (event.stepsInPath ?? Math.max(0, path.length - 1)) : 0,
          nodesExplored: event.nodesExplored ?? state.stats.nodesExplored,
          frontierSize: 0,
        },
        animation: { ...state.animation, isPlaying: false },
        shipPathIndex: 0,
        shipAnimating: event.type === 'found',
        noPathReason: event.type === 'no_path' ? (event.noPathReason ?? 'exhausted') : null,
      };
    }

    case 'COMPARE_TIMER_UPDATE': {
      if (!isCompareMode(state)) return state;
      const { side, elapsedMs } = action.payload;
      const timer = state.compare.timers[side];
      if (timer.completed) return state;
      return {
        ...state,
        compare: {
          ...state.compare,
          timers: {
            ...state.compare.timers,
            [side]: { ...timer, elapsedMs },
          },
        },
      };
    }

    case 'COMPARE_TIMER_STOP': {
      if (!isCompareMode(state)) return state;
      const { side, elapsedMs } = action.payload;
      return {
        ...state,
        compare: {
          ...state.compare,
          timers: {
            ...state.compare.timers,
            [side]: { elapsedMs, isRunning: false, completed: true },
          },
        },
      };
    }

    case 'COMPARE_TICK': {
      if (!isCompareMode(state)) return state;
      const { side, deltaMs } = action.payload;
      const timer = state.compare.timers[side];
      const slicePhase = state.compare[side].phase;

      if (
        timer.completed ||
        !timer.isRunning ||
        slicePhase !== GAME_PHASES.SEARCHING ||
        !state.animation.isPlaying
      ) {
        return state;
      }

      return {
        ...state,
        compare: {
          ...state.compare,
          timers: {
            ...state.compare.timers,
            [side]: { ...timer, elapsedMs: timer.elapsedMs + deltaMs },
          },
        },
      };
    }

    case 'RESELECT_END': {
      if (isCompareMode(state)) {
        if (
          state.compare.bfs.phase !== GAME_PHASES.NO_PATH &&
          state.compare.bfs.phase !== GAME_PHASES.FOUND &&
          state.compare.dfs.phase !== GAME_PHASES.NO_PATH &&
          state.compare.dfs.phase !== GAME_PHASES.FOUND
        ) {
          return state;
        }

        let grid = resetSelection(state.grid);
        if (state.start) {
          grid[state.start.i][state.start.j].type = CELL_TYPES.START;
        }

        const sideReset = (sideState) => ({
          ...sideState,
          phase: GAME_PHASES.SELECTING_END,
          grid: (() => {
            const g = resetSelection(grid);
            if (state.start) g[state.start.i][state.start.j].type = CELL_TYPES.START;
            return g;
          })(),
          searchSnapshot: { ...initialState.searchSnapshot },
          stats: { ...initialState.stats },
          animation: { currentStep: 0, totalSteps: 0 },
          shipPathIndex: 0,
          shipAnimating: false,
          noPathReason: null,
        });

        return {
          ...state,
          phase: GAME_PHASES.SELECTING_END,
          end: null,
          grid,
          compare: {
            ...state.compare,
            bfs: sideReset(state.compare.bfs),
            dfs: sideReset(state.compare.dfs),
            timers: {
              bfs: initialCompareTimer(),
              dfs: initialCompareTimer(),
            },
          },
          animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        };
      }

      if (state.phase !== GAME_PHASES.NO_PATH && state.phase !== GAME_PHASES.FOUND) {
        return state;
      }
      let grid = resetSelection(state.grid);
      if (state.start) {
        grid[state.start.i][state.start.j].type = CELL_TYPES.START;
      }

      return {
        ...state,
        phase: GAME_PHASES.SELECTING_END,
        end: null,
        grid,
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
        noPathReason: null,
      };
    }

    case 'RESET_SELECTION':
      if (isCompareMode(state)) {
        const grid = resetSelection(state.grid);
        return {
          ...state,
          phase: GAME_PHASES.IDLE,
          start: null,
          end: null,
          grid,
          compare: {
            bfs: resetCompareSideSelection(state.compare.bfs, grid),
            dfs: resetCompareSideSelection(state.compare.dfs, grid),
            timers: {
              bfs: initialCompareTimer(),
              dfs: initialCompareTimer(),
            },
          },
          animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        };
      }

      return {
        ...state,
        phase: GAME_PHASES.IDLE,
        start: null,
        end: null,
        grid: resetSelection(state.grid),
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
      };

    case 'START_EXPEDITION': {
      const { algorithm, difficulty, custom, x, y, obstacles, maxElevation, speed } =
        action.payload;
      let mapData;

      if (custom) {
        mapData = generateCustomMap(x, y, obstacles, maxElevation ?? 2);
      } else {
        mapData = generateMapFromPreset(difficulty);
      }

      return buildExpeditionState(state, mapData, algorithm, speed);
    }

    case 'GO_TO_SETUP': {
      if (isCompareMode(state) && isCompareSearching(state)) return state;
      if (!isCompareMode(state) && state.phase === GAME_PHASES.SEARCHING) return state;

      return {
        ...state,
        appScreen: APP_SCREENS.SETUP,
        phase: GAME_PHASES.IDLE,
        start: null,
        end: null,
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
        noPathReason: null,
        compare: state.compare
          ? {
              ...createCompareState(state.grid),
            }
          : null,
      };
    }

    case 'NEW_EXPEDITION': {
      if (isCompareMode(state) && isCompareSearching(state)) return state;
      if (!isCompareMode(state) && state.phase === GAME_PHASES.SEARCHING) return state;

      if (isCompareMode(state)) {
        const grid = resetSelection(state.grid);
        return {
          ...state,
          phase: GAME_PHASES.IDLE,
          start: null,
          end: null,
          grid,
          compare: {
            bfs: resetCompareSideSelection(state.compare.bfs, grid),
            dfs: resetCompareSideSelection(state.compare.dfs, grid),
            timers: {
              bfs: initialCompareTimer(),
              dfs: initialCompareTimer(),
            },
          },
          animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
          noPathReason: null,
        };
      }

      return {
        ...state,
        phase: GAME_PHASES.IDLE,
        start: null,
        end: null,
        grid: resetSelection(state.grid),
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: false, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
        noPathReason: null,
      };
    }

    case 'SET_DIFFICULTY': {
      const mapData = generateMapFromPreset(action.payload);
      return resetGameFields(state, mapData);
    }

    case 'SHUFFLE': {
      const grid = shuffleMap(
        state.grid,
        state.numObstacles,
        state.maxElevation,
        state.mapDifficulty === 'custom' ? 'medium' : state.mapDifficulty
      );
      return resetGameFields(state, {
        grid,
        gridSize: state.gridSize,
        numObstacles: state.numObstacles,
        mapDifficulty: state.mapDifficulty,
        maxElevation: state.maxElevation,
        presetLabel: state.presetLabel,
      });
    }

    case 'RESIZE_GRID': {
      const { x, y } = action.payload;
      const mapData = generateCustomMap(x, y, state.numObstacles, state.maxElevation);
      return resetGameFields(state, mapData);
    }

    case 'SET_OBSTACLES': {
      const count = action.payload;
      const mapData = generateCustomMap(
        state.gridSize.x,
        state.gridSize.y,
        count,
        state.maxElevation
      );
      return resetGameFields(state, { ...mapData, numObstacles: count });
    }

    case 'SET_ALGORITHM':
      return { ...state, algorithm: action.payload };

    case 'PLAY': {
      if (isCompareMode(state)) {
        const timers = { ...state.compare.timers };
        for (const side of COMPARE_SIDES) {
          if (state.compare[side].phase === GAME_PHASES.SEARCHING) {
            timers[side] = { ...timers[side], isRunning: true };
          }
        }
        return {
          ...state,
          animation: { ...state.animation, isPlaying: true },
          compare: { ...state.compare, timers },
        };
      }
      return { ...state, animation: { ...state.animation, isPlaying: true } };
    }

    case 'PAUSE': {
      if (isCompareMode(state)) {
        const timers = { ...state.compare.timers };
        for (const side of COMPARE_SIDES) {
          timers[side] = { ...timers[side], isRunning: false };
        }
        return {
          ...state,
          animation: { ...state.animation, isPlaying: false },
          compare: { ...state.compare, timers },
        };
      }
      return { ...state, animation: { ...state.animation, isPlaying: false } };
    }

    case 'SET_SPEED':
      return { ...state, animation: { ...state.animation, speed: action.payload } };

    case 'START_SHIP_ROUTE': {
      if (isCompareMode(state)) {
        const side = action.payload?.side;
        if (!side) return state;
        const slice = state.compare[side];
        if (slice.phase !== GAME_PHASES.FOUND) return state;
        const path = slice.searchSnapshot.path || [];
        if (path.length < 2) {
          return {
            ...state,
            compare: {
              ...state.compare,
              [side]: {
                ...slice,
                shipAnimating: false,
                shipPathIndex: Math.max(0, path.length - 1),
              },
            },
          };
        }
        return {
          ...state,
          compare: {
            ...state.compare,
            [side]: { ...slice, shipAnimating: true, shipPathIndex: 0 },
          },
        };
      }

      if (state.phase !== GAME_PHASES.FOUND) return state;
      const path = state.searchSnapshot.path || [];
      if (path.length < 2) {
        return {
          ...state,
          shipAnimating: false,
          shipPathIndex: Math.max(0, path.length - 1),
        };
      }
      return { ...state, shipAnimating: true, shipPathIndex: 0 };
    }

    case 'ADVANCE_SHIP': {
      if (isCompareMode(state)) {
        const side = action.payload?.side;
        if (!side) return state;
        const slice = state.compare[side];
        const path = slice.searchSnapshot.path || [];
        if (path.length < 2) {
          return {
            ...state,
            compare: {
              ...state.compare,
              [side]: {
                ...slice,
                shipAnimating: false,
                shipPathIndex: Math.max(0, path.length - 1),
              },
            },
          };
        }
        const nextIndex = slice.shipPathIndex + 1;
        if (nextIndex >= path.length) {
          return {
            ...state,
            compare: {
              ...state.compare,
              [side]: { ...slice, shipAnimating: false, shipPathIndex: path.length - 1 },
            },
          };
        }
        return {
          ...state,
          compare: {
            ...state.compare,
            [side]: { ...slice, shipPathIndex: nextIndex },
          },
        };
      }

      const path = state.searchSnapshot.path || [];
      if (path.length < 2) {
        return { ...state, shipAnimating: false, shipPathIndex: Math.max(0, path.length - 1) };
      }
      const nextIndex = state.shipPathIndex + 1;
      if (nextIndex >= path.length) {
        return { ...state, shipAnimating: false, shipPathIndex: path.length - 1 };
      }
      return { ...state, shipPathIndex: nextIndex };
    }

    case 'STOP_SHIP_ANIMATION':
      if (isCompareMode(state)) {
        const side = action.payload?.side;
        if (!side) return state;
        return {
          ...state,
          compare: {
            ...state.compare,
            [side]: { ...state.compare[side], shipAnimating: false },
          },
        };
      }
      return { ...state, shipAnimating: false };

    default:
      return state;
  }
}

function isCompareSearching(state) {
  return (
    state.compare.bfs.phase === GAME_PHASES.SEARCHING ||
    state.compare.dfs.phase === GAME_PHASES.SEARCHING
  );
}
