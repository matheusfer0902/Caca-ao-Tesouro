import {
  cellKey,
  getNeighbors,
  buildPathFromParents,
} from './graph.js';

export function* dfs(start, end, grid) {
  const visited = new Set();
  const parents = new Map();
  const stack = [{ ...start, depth: 0 }];
  const frontierKeys = new Set([cellKey(start.i, start.j)]);

  yield {
    type: 'init',
    start,
    end,
    frontier: [start],
    visited: [],
    nodesExplored: 0,
    frontierSize: 1,
  };

  while (stack.length > 0) {
    const current = stack.pop();
    const currentKey = cellKey(current.i, current.j);
    frontierKeys.delete(currentKey);

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);

    yield {
      type: 'step',
      current: { i: current.i, j: current.j },
      depth: current.depth,
      frontier: Array.from(frontierKeys).map((key) => {
        const [i, j] = key.split(',').map(Number);
        return { i, j };
      }),
      visited: Array.from(visited).map((key) => {
        const [i, j] = key.split(',').map(Number);
        return { i, j };
      }),
      nodesExplored: visited.size,
      frontierSize: frontierKeys.size,
    };

    if (current.i === end.i && current.j === end.j) {
      const path = buildPathFromParents(end, parents, start);
      yield {
        type: 'found',
        path,
        visited: Array.from(visited).map((key) => {
          const [i, j] = key.split(',').map(Number);
          return { i, j };
        }),
        nodesExplored: visited.size,
        stepsInPath: Math.max(0, path.length - 1),
      };
      return;
    }

    const neighbors = getNeighbors(current.i, current.j, grid);
    for (let idx = neighbors.length - 1; idx >= 0; idx--) {
      const neighbor = neighbors[idx];
      const neighborKey = cellKey(neighbor.i, neighbor.j);
      if (!visited.has(neighborKey) && !frontierKeys.has(neighborKey)) {
        parents.set(neighborKey, { i: current.i, j: current.j });
        stack.push({ ...neighbor, depth: current.depth + 1 });
        frontierKeys.add(neighborKey);
      }
    }
  }

  yield {
    type: 'no_path',
    visited: Array.from(visited).map((key) => {
      const [i, j] = key.split(',').map(Number);
      return { i, j };
    }),
    nodesExplored: visited.size,
  };
}
