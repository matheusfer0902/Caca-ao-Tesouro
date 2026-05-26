import {
  DEFAULT_ANIMATION_SPEED,
  DEFAULT_GRID_SIZE,
  DEFAULT_OBSTACLES,
  GAME_PHASES,
  CELL_TYPES,
} from '@/utils/constants.js';
import {
  createGrid,
  placeObstacles,
  clearSearchState,
  cloneGrid,
  rebuildGridWithMarkers,
  applySearchSnapshot,
  cellKey,
} from '@/algorithms/graph.js';

export const initialState = {
  phase: GAME_PHASES.IDLE,
  grid: placeObstacles(createGrid(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE), DEFAULT_OBSTACLES),
  gridSize: { x: DEFAULT_GRID_SIZE, y: DEFAULT_GRID_SIZE },
  numObstacles: DEFAULT_OBSTACLES,
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
        {
          ...snapshot,
          path: [],
        }
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
        {
          ...snapshot,
          path,
        }
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
        animation: {
          ...state.animation,
          isPlaying: false,
        },
        shipPathIndex: 0,
        shipAnimating: event.type === 'found',
      };
    }

    case 'RESET_SELECTION': {
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

    case 'SHUFFLE': {
      let grid = createGrid(state.gridSize.x, state.gridSize.y);
      grid = placeObstacles(grid, state.numObstacles);
      return {
        ...initialState,
        grid,
        gridSize: state.gridSize,
        numObstacles: state.numObstacles,
        algorithm: state.algorithm,
        animation: { ...initialState.animation, speed: state.animation.speed },
      };
    }

    case 'RESIZE_GRID': {
      const { x, y } = action.payload;
      let grid = createGrid(x, y);
      grid = placeObstacles(grid, state.numObstacles);
      return {
        ...initialState,
        grid,
        gridSize: { x, y },
        numObstacles: state.numObstacles,
        algorithm: state.algorithm,
        animation: { ...initialState.animation, speed: state.animation.speed },
      };
    }

    case 'SET_OBSTACLES': {
      const count = action.payload;
      let grid = createGrid(state.gridSize.x, state.gridSize.y);
      grid = placeObstacles(grid, count);
      return {
        ...initialState,
        grid,
        gridSize: state.gridSize,
        numObstacles: count,
        algorithm: state.algorithm,
        animation: { ...initialState.animation, speed: state.animation.speed },
      };
    }

    case 'SET_ALGORITHM':
      return { ...state, algorithm: action.payload };

    case 'PLAY':
      return {
        ...state,
        animation: { ...state.animation, isPlaying: true },
      };

    case 'PAUSE':
      return {
        ...state,
        animation: { ...state.animation, isPlaying: false },
      };

    case 'SET_SPEED':
      return {
        ...state,
        animation: { ...state.animation, speed: action.payload },
      };

    case 'ADVANCE_SHIP': {
      const path = state.searchSnapshot.path || [];
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
