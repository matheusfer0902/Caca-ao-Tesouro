import { CELL_TYPES } from '@/utils/constants.js';

const DIRECTIONS = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];

export function cellKey(i, j) {
  return `${i},${j}`;
}

export function parseKey(key) {
  const [i, j] = key.split(',').map(Number);
  return { i, j };
}

export function createCell(i, j, type = CELL_TYPES.EMPTY, obstacleVariant = 1, elevation = 0) {
  return { i, j, type, obstacleVariant, elevation, searchStatus: null, depth: null };
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

export function isTraversableCell(cell) {
  return cell != null && cell.type !== CELL_TYPES.OBSTACLE;
}

export function areAdjacent(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.i - b.i) + Math.abs(a.j - b.j) === 1;
}

/** Ligação de profundidade: vizinhos ortogonais walkable com |Δelevation| === 1 */
export function hasDepthLink(fromCell, toCell) {
  if (!fromCell || !toCell) return false;
  if (!isTraversableCell(fromCell) || !isTraversableCell(toCell)) return false;
  const diff = Math.abs((toCell.elevation ?? 0) - (fromCell.elevation ?? 0));
  return diff === 1;
}

/**
 * Mesmo nível: vizinhos ortogonais walkable.
 * Mudança de nível: somente via hasDepthLink (corrente de bolhas).
 */
export function canTraverse(fromCell, toCell) {
  if (!fromCell || !toCell) return false;
  if (!isTraversableCell(fromCell) || !isTraversableCell(toCell)) return false;

  const diff = Math.abs((toCell.elevation ?? 0) - (fromCell.elevation ?? 0));
  if (diff === 0) return true;
  if (diff === 1) return hasDepthLink(fromCell, toCell);
  return false;
}

function undirectedLinkKey(i1, j1, i2, j2) {
  if (i1 < i2 || (i1 === i2 && j1 < j2)) return `${i1},${j1}|${i2},${j2}`;
  return `${i2},${j2}|${i1},${j1}`;
}

/** Arestas de profundidade para render (CurrentStreams) e debug — uma por par de células */
export function getDepthLinks(grid) {
  const links = [];
  const seen = new Set();
  const height = grid.length;
  const width = grid[0].length;

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const fromCell = grid[i][j];
      for (const [di, dj] of DIRECTIONS) {
        const ni = i + di;
        const nj = j + dj;
        if (!isValidCell(ni, nj, grid)) continue;
        const toCell = grid[ni][nj];
        if (!hasDepthLink(fromCell, toCell)) continue;

        const key = undirectedLinkKey(i, j, ni, nj);
        if (seen.has(key)) continue;
        seen.add(key);

        const fromElev = fromCell.elevation ?? 0;
        const toElev = toCell.elevation ?? 0;
        const fromIsDeeper = fromElev < toElev;

        links.push({
          from: fromIsDeeper ? { i, j } : { i: ni, j: nj },
          to: fromIsDeeper ? { i: ni, j: nj } : { i, j },
          fromCell: fromIsDeeper ? fromCell : toCell,
          toCell: fromIsDeeper ? toCell : fromCell,
        });
      }
    }
  }

  return links;
}

export function getNeighbors(i, j, grid) {
  const current = grid[i][j];
  const neighbors = [];

  for (const [di, dj] of DIRECTIONS) {
    const ni = i + di;
    const nj = j + dj;
    if (!isValidCell(ni, nj, grid)) continue;
    const target = grid[ni][nj];
    if (canTraverse(current, target)) {
      neighbors.push({ i: ni, j: nj });
    }
  }
  return neighbors;
}

export function validatePath(path, grid) {
  if (!path?.length) {
    return { valid: false, reason: 'empty' };
  }

  for (let k = 0; k < path.length; k++) {
    const p = path[k];
    if (!isValidCell(p.i, p.j, grid) || !isWalkable(p.i, p.j, grid)) {
      return { valid: false, invalidIndex: k, reason: 'unwalkable' };
    }
  }

  for (let k = 0; k < path.length - 1; k++) {
    const a = path[k];
    const b = path[k + 1];
    if (!areAdjacent(a, b)) {
      return { valid: false, invalidIndex: k, reason: 'not_adjacent' };
    }
    const fromCell = grid[a.i][a.j];
    const toCell = grid[b.i][b.j];
    if (!canTraverse(fromCell, toCell)) {
      return { valid: false, invalidIndex: k, reason: 'cannot_traverse' };
    }
  }

  return { valid: true };
}

export function isReachable(start, end, grid) {
  if (!start || !end || !grid?.length) return false;
  if (start.i === end.i && start.j === end.j) return true;

  const visited = new Set();
  const queue = [{ i: start.i, j: start.j }];
  visited.add(cellKey(start.i, start.j));

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.i === end.i && cur.j === end.j) return true;

    for (const neighbor of getNeighbors(cur.i, cur.j, grid)) {
      const key = cellKey(neighbor.i, neighbor.j);
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return false;
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

export function buildPathFromParents(end, parents, start, grid) {
  const path = [];
  let current = end;
  let guard = 0;
  const maxSteps = (grid?.length ?? 1) * (grid?.[0]?.length ?? 1) + 1;

  while (current && guard++ < maxSteps) {
    path.unshift(current);
    const parent = parents.get(cellKey(current.i, current.j));
    if (!parent) break;
    current = parent;
  }

  if (start && path.length > 0 && (path[0].i !== start.i || path[0].j !== start.j)) {
    if (
      grid &&
      areAdjacent(start, path[0]) &&
      canTraverse(grid[start.i][start.j], grid[path[0].i][path[0].j])
    ) {
      path.unshift({ i: start.i, j: start.j });
    } else {
      return [];
    }
  }

  if (grid) {
    const check = validatePath(path, grid);
    if (!check.valid) return [];
  }

  return path;
}

export function getMaxElevation(grid) {
  let max = 0;
  for (const row of grid) {
    for (const cell of row) {
      max = Math.max(max, cell.elevation ?? 0);
    }
  }
  return max;
}
