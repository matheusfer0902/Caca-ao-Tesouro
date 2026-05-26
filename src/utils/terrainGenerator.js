import {
  MAP_PRESETS,
  DEFAULT_DEPTH_WEIGHTS,
} from '@/utils/constants.js';
import { createGrid, placeObstacles } from '@/algorithms/graph.js';

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function smoothElevations(elevations, passes) {
  let grid = elevations.map((row) => [...row]);

  for (let p = 0; p < passes; p++) {
    const next = grid.map((row) => [...row]);
    const height = grid.length;
    const width = grid[0].length;

    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        let sum = grid[i][j];
        let count = 1;
        for (const [di, dj] of [
          [-1, 0],
          [0, 1],
          [1, 0],
          [0, -1],
        ]) {
          const ni = i + di;
          const nj = j + dj;
          if (ni >= 0 && ni < height && nj >= 0 && nj < width) {
            sum += grid[ni][nj];
            count++;
          }
        }
        next[i][j] = Math.round(sum / count);
      }
    }
    grid = next;
  }

  return grid;
}

function normalizeDepthWeights(weights, maxElevation) {
  const levels = [];
  let sum = 0;

  for (let level = 0; level <= maxElevation; level++) {
    const w = Math.max(0, weights[level] ?? 0);
    levels.push({ level, w });
    sum += w;
  }

  if (sum <= 0) {
    return levels.map(({ level }) => ({
      level,
      w: 1 / (maxElevation + 1),
    }));
  }

  return levels.map(({ level, w }) => ({ level, w: w / sum }));
}

function buildElevationQuotas(totalCells, maxElevation, weights) {
  const normalized = normalizeDepthWeights(weights, maxElevation);
  const quotas = {};
  let assigned = 0;

  normalized.forEach(({ level, w }, index) => {
    if (index === normalized.length - 1) {
      quotas[level] = totalCells - assigned;
    } else {
      const count = Math.round(totalCells * w);
      quotas[level] = count;
      assigned += count;
    }
  });

  if (maxElevation >= 2) {
    let surplus = 0;
    for (let level = 0; level <= maxElevation; level++) {
      if ((quotas[level] ?? 0) < 1) {
        surplus += 1 - (quotas[level] ?? 0);
        quotas[level] = 1;
      }
    }
    if (surplus > 0) {
      const donor = Object.entries(quotas).sort((a, b) => b[1] - a[1])[0][0];
      quotas[donor] = Math.max(1, quotas[donor] - surplus);
    }
  }

  return quotas;
}

function generateElevationByDistribution(
  width,
  height,
  maxElevation,
  depthWeights,
  smoothPasses
) {
  if (maxElevation === 0) {
    return Array(height)
      .fill(null)
      .map(() => Array(width).fill(0));
  }

  const totalCells = width * height;
  const quotas = buildElevationQuotas(totalCells, maxElevation, depthWeights);
  const levelList = [];

  for (let level = 0; level <= maxElevation; level++) {
    const count = quotas[level] ?? 0;
    for (let n = 0; n < count; n++) {
      levelList.push(level);
    }
  }

  while (levelList.length < totalCells) {
    levelList.push(1);
  }
  while (levelList.length > totalCells) {
    levelList.pop();
  }

  const shuffled = shuffleArray(levelList);
  const elevations = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0));

  let idx = 0;
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      elevations[i][j] = shuffled[idx++];
    }
  }

  if (smoothPasses > 0) {
    const smoothed = smoothElevations(elevations, smoothPasses);
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        smoothed[i][j] = Math.max(0, Math.min(maxElevation, smoothed[i][j]));
      }
    }
    return smoothed;
  }

  return elevations;
}

function resolveDepthWeights(presetId, overrideWeights) {
  if (overrideWeights) return overrideWeights;
  const preset = MAP_PRESETS[presetId];
  return preset?.depthWeights ?? DEFAULT_DEPTH_WEIGHTS;
}

function applyElevations(grid, elevations) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      grid[i][j].elevation = elevations[i][j];
    }
  }
  return grid;
}

export function generateMapFromPreset(presetId) {
  const preset = MAP_PRESETS[presetId] || MAP_PRESETS.medium;
  const size = preset.gridSize;

  let grid = createGrid(size, size);
  const elevations = generateElevationByDistribution(
    size,
    size,
    preset.maxElevation,
    preset.depthWeights,
    preset.smoothPasses
  );

  applyElevations(grid, elevations);
  grid = placeObstacles(grid, preset.numObstacles);

  return {
    grid,
    gridSize: { x: size, y: size },
    numObstacles: preset.numObstacles,
    mapDifficulty: preset.id,
    maxElevation: preset.maxElevation,
    presetLabel: preset.label,
  };
}

export function generateCustomMap(
  width,
  height,
  numObstacles,
  maxElevation = 2,
  presetId = 'medium'
) {
  const preset = MAP_PRESETS[presetId] || MAP_PRESETS.medium;
  let grid = createGrid(width, height);
  const elevations = generateElevationByDistribution(
    width,
    height,
    maxElevation,
    resolveDepthWeights(presetId),
    preset.smoothPasses ?? 1
  );
  applyElevations(grid, elevations);
  grid = placeObstacles(grid, numObstacles);

  return {
    grid,
    gridSize: { x: width, y: height },
    numObstacles,
    mapDifficulty: 'custom',
    maxElevation,
    presetLabel: 'Personalizado',
  };
}

export function shuffleMap(grid, numObstacles, maxElevation, presetId = 'medium') {
  const height = grid.length;
  const width = grid[0].length;
  const preset = MAP_PRESETS[presetId] || MAP_PRESETS.medium;

  let fresh = createGrid(width, height);
  const elevations = generateElevationByDistribution(
    width,
    height,
    maxElevation,
    preset.depthWeights ?? DEFAULT_DEPTH_WEIGHTS,
    preset.smoothPasses ?? 0
  );
  applyElevations(fresh, elevations);
  fresh = placeObstacles(fresh, numObstacles);

  return fresh;
}

export function getPresetMeta(presetId) {
  return MAP_PRESETS[presetId] || null;
}
