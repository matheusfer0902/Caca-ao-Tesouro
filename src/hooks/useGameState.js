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
} from '@/algorithms/graph.js';
import {
  generateMapFromPreset,
  generateCustomMap,
  shuffleMap,
} from '@/utils/terrainGenerator.js';

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

function resetGameFields(state, mapData) {
  return {
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
}

function buildExpeditionState(state, mapData, algorithm, speed) {
  return {
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
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_START': {
      const { i, j } = action.payload;
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
      };
    }

    case 'SET_START': {
      const { i, j } = action.payload;
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
      };
    }

    case 'SET_END': {
      const { i, j } = action.payload;
      let grid = resetSelection(state.grid);
      if (state.start) {
        grid[state.start.i][state.start.j].type = CELL_TYPES.START;
      }
      grid[i][j].type = CELL_TYPES.END;

      return {
        ...state,
        phase: GAME_PHASES.SEARCHING,
        end: { i, j },
        grid,
        searchSnapshot: initialState.searchSnapshot,
        stats: initialState.stats,
        animation: { ...state.animation, isPlaying: true, currentStep: 0, totalSteps: 0 },
        shipPathIndex: 0,
        shipAnimating: false,
      };
    }

    case 'SEARCH_STEP': {
      const event = action.payload;
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
          stepsInPath: event.stepsInPath ?? Math.max(0, path.length - 1),
          nodesExplored: event.nodesExplored ?? state.stats.nodesExplored,
          frontierSize: 0,
        },
        animation: { ...state.animation, isPlaying: false },
        shipPathIndex: 0,
        shipAnimating: event.type === 'found',
      };
    }

    case 'RESET_SELECTION':
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
      if (state.phase === GAME_PHASES.SEARCHING) return state;

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
      };
    }

    case 'NEW_EXPEDITION': {
      if (state.phase === GAME_PHASES.SEARCHING) return state;

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

    case 'PLAY':
      return { ...state, animation: { ...state.animation, isPlaying: true } };

    case 'PAUSE':
      return { ...state, animation: { ...state.animation, isPlaying: false } };

    case 'SET_SPEED':
      return { ...state, animation: { ...state.animation, speed: action.payload } };

    case 'START_SHIP_ROUTE': {
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
      return { ...state, shipAnimating: false };

    default:
      return state;
  }
}
