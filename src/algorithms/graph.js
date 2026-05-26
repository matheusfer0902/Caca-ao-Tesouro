import { CELL_TYPES } from '@/utils/constants.js';

export function cellKey(i, j) {
  return `${i},${j}`;
}

export function parseKey(key) {
  const [i, j] = key.split(',').map(Number);
  return { i, j };
}

export function createCell(i, j, type = CELL_TYPES.EMPTY, obstacleVariant = 1) {
  return { i, j, type, obstacleVariant, searchStatus: null, depth: null };
}

export function createGrid(width, height) {
  const grid = [];
  for (let i = 0; i < height; i++) {
    grid.push([]);
    for (let j = 0; j < width; j++) {
      grid[i].push(createCell(i, j));
    }
  }
  return grid;
}

export function isValidCell(i, j, grid) {
  return i >= 0 && i < grid.length && j >= 0 && j < grid[0].length;
}

export function isWalkable(i, j, grid) {
  if (!isValidCell(i, j, grid)) return false;
  return grid[i][j].type !== CELL_TYPES.OBSTACLE;
}

export function getNeighbors(i, j, grid) {
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  const neighbors = [];
  for (const [di, dj] of directions) {
    const ni = i + di;
    const nj = j + dj;
    if (isWalkable(ni, nj, grid)) {
      neighbors.push({ i: ni, j: nj });
    }
  }
  return neighbors;
}

export function pickObstacleVariant() {
  const random = Math.random();
  if (random < 0.8) return 1;
  if (random < 0.9) return 2;
  if (random < 0.95) return 3;
  return 4;
}

export function placeObstacles(grid, count) {
  const height = grid.length;
  const width = grid[0].length;
  const maxObstacles = height * width;
  const target = Math.min(count, maxObstacles);
  let placed = 0;
  let attempts = 0;
  const maxAttempts = target * 20;

  while (placed < target && attempts < maxAttempts) {
    attempts++;
    const i = Math.floor(Math.random() * height);
    const j = Math.floor(Math.random() * width);
    const cell = grid[i][j];

    if (cell.type === CELL_TYPES.OBSTACLE) continue;

    cell.type = CELL_TYPES.OBSTACLE;
    cell.obstacleVariant = pickObstacleVariant();
    placed++;
  }

  return grid;
}

export function clearSearchState(grid) {
  for (const row of grid) {
    for (const cell of row) {
      cell.searchStatus = null;
      cell.depth = null;
      if (cell.type === CELL_TYPES.START || cell.type === CELL_TYPES.END) {
        cell.type = CELL_TYPES.EMPTY;
      }
    }
  }
  return grid;
}

export function cloneGrid(grid) {
  return grid.map((row) =>
    row.map((cell) => ({
      ...cell,
    }))
  );
}

export function rebuildGridWithMarkers(grid, start, end) {
  const next = cloneGrid(grid);
  clearSearchState(next);

  if (start) {
    next[start.i][start.j].type = CELL_TYPES.START;
  }
  if (end) {
    next[end.i][end.j].type = CELL_TYPES.END;
  }

  return next;
}

export function applySearchSnapshot(grid, snapshot) {
  const next = cloneGrid(grid);

  for (const key of snapshot.visited || []) {
    const { i, j } = parseKey(key);
    if (next[i][j].type === CELL_TYPES.EMPTY) {
      next[i][j].searchStatus = 'visited';
    }
  }

  for (const key of snapshot.frontier || []) {
    const { i, j } = parseKey(key);
    if (next[i][j].type === CELL_TYPES.EMPTY && next[i][j].searchStatus !== 'visited') {
      next[i][j].searchStatus = 'frontier';
    }
  }

  if (snapshot.current) {
    const { i, j } = snapshot.current;
    if (next[i][j].type === CELL_TYPES.EMPTY) {
      next[i][j].searchStatus = 'current';
    }
    if (snapshot.depth != null) {
      next[i][j].depth = snapshot.depth;
    }
  }

  for (const point of snapshot.path || []) {
    const { i, j } = point;
    if (next[i][j].type === CELL_TYPES.EMPTY) {
      next[i][j].searchStatus = 'path';
    }
  }

  return next;
}

export function coordsEqual(a, b) {
  if (!a || !b) return false;
  return a.i === b.i && a.j === b.j;
}

export function buildPathFromParents(end, parents) {
  const path = [];
  let current = end;

  while (current) {
    path.unshift(current);
    const parent = parents.get(cellKey(current.i, current.j));
    if (!parent) break;
    current = parent;
  }

  return path;
}
