import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const server = await createServer({
  configFile: path.join(root, 'vite.config.js'),
  logLevel: 'error',
});

const graph = await server.ssrLoadModule('/src/algorithms/graph.js');
const { bfs } = await server.ssrLoadModule('/src/algorithms/bfs.js');
const { dfs } = await server.ssrLoadModule('/src/algorithms/dfs.js');

const {
  createGrid,
  validatePath,
  getDepthLinks,
  canTraverse,
  hasDepthLink,
  isReachable,
} = graph;

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${msg}`);
  }
}

// Abismo isolado: centro em 0 cercado por recifes com elevation 2 (|Δ|>1)
function buildIsolatedDepthMap() {
  const grid = createGrid(5, 5);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      grid[i][j].elevation = 2;
    }
  }
  grid[2][2].elevation = 0;
  return grid;
}

function runAlgo(algo, start, end, grid) {
  let last;
  for (const ev of algo(start, end, grid)) {
    last = ev;
  }
  return last;
}

console.log('=== Validação graph / BFS / DFS ===\n');

// Links só com diff 1
const g1 = createGrid(3, 3);
g1[0][0].elevation = 0;
g1[0][1].elevation = 1;
const links = getDepthLinks(g1);
assert(links.length >= 1, 'getDepthLinks encontra corrente');
assert(
  hasDepthLink(g1[0][0], g1[0][1]) && canTraverse(g1[0][0], g1[0][1]),
  'canTraverse segue hasDepthLink'
);

// Salto diff 2 bloqueado
g1[1][0].elevation = 2;
assert(!canTraverse(g1[0][0], g1[1][0]), 'bloqueia diff 2');

// Ilha isolada: do centro 0 para canto 4,4 deve ser no_path
const island = buildIsolatedDepthMap();
const start = { i: 2, j: 2 };
const end = { i: 4, j: 4 };
const bfsResult = runAlgo(bfs, start, end, island);
assert(bfsResult?.type === 'no_path', 'ilha isolada BFS retorna no_path');
const dfsResult = runAlgo(dfs, start, end, island);
assert(dfsResult?.type === 'no_path', 'ilha isolada DFS retorna no_path');

// Caminho válido em linha mesmo nível
const flat = createGrid(6, 1);
for (let j = 0; j < 6; j++) flat[0][j].elevation = 1;
const found = runAlgo(bfs, { i: 0, j: 0 }, { i: 0, j: 5 }, flat);
assert(found?.type === 'found', 'linha plana encontra caminho');
assert(validatePath(found.path, flat).valid, 'caminho encontrado é válido');

// Mapas aleatórios
for (let t = 0; t < 40; t++) {
  const grid = createGrid(8, 8);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      grid[i][j].elevation = Math.floor(Math.random() * 3);
    }
  }
  const s = { i: 0, j: 0 };
  const e = { i: 7, j: 7 };
  for (const algo of [bfs, dfs]) {
    const res = runAlgo(algo, s, e, grid);
    if (res?.type === 'found') {
      assert(validatePath(res.path, grid).valid, `path válido trial ${t}`);
    }
  }
}

// Paridade links vs canTraverse (diff 1)
const g2 = createGrid(4, 4);
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    g2[i][j].elevation = (i + j) % 3;
  }
}
const rendered = getDepthLinks(g2).length;
let logical = 0;
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 4; j++) {
    for (const [di, dj] of [[-1, 0], [0, 1], [1, 0], [0, -1]]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || ni >= 4 || nj < 0 || nj >= 4) continue;
      if (hasDepthLink(g2[i][j], g2[ni][nj])) logical++;
    }
  }
}
assert(rendered === logical / 2, 'cada par de corrente renderizado uma vez');
assert(rendered > 0, 'mapa tem arestas de profundidade');

assert(isReachable({ i: 0, j: 0 }, { i: 0, j: 0 }, flat), 'reachability mesmo ponto');

console.log(`\n${passed} asserções OK, ${failed} falhas`);
await server.close();
process.exit(failed > 0 ? 1 : 0);
