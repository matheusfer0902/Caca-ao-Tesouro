import {
  COLORS,
  CELL_TYPES,
  SEARCH_STATUS,
  DEPTH_ZONES,
  ELEVATION_UNIT,
  PLATFORM_THICKNESS,
  WATER_LEVEL,
} from '@/utils/constants.js';

export function getDepthZone(elevation = 0) {
  return DEPTH_ZONES[Math.min(elevation, DEPTH_ZONES.length - 1)] || DEPTH_ZONES[0];
}

export function getWorldY(elevation = 0) {
  return WATER_LEVEL + elevation * ELEVATION_UNIT + PLATFORM_THICKNESS / 2;
}

export function getPlatformY(elevation = 0) {
  return WATER_LEVEL + elevation * ELEVATION_UNIT;
}

export function getTerrainCenterY(maxElevation) {
  return getWorldY(maxElevation / 2);
}

export function getTileAppearance(cell) {
  const zone = getDepthZone(cell.elevation ?? 0);
  let platform = zone.platform;
  let glow = zone.glow;
  let emissiveIntensity = 0.08;
  let opacity = 1;

  if (cell.type === CELL_TYPES.OBSTACLE) {
    return { platform: COLORS.obstacle, glow: '#906821', emissiveIntensity: 0.1, opacity: 1, zone };
  }

  if (cell.searchStatus === SEARCH_STATUS.PATH || cell.searchStatus === 'path') {
    return {
      platform: COLORS.tilePath,
      glow: '#fce22a',
      emissiveIntensity: 0.35,
      opacity: 1,
      zone,
    };
  }

  if (cell.searchStatus === SEARCH_STATUS.CURRENT || cell.searchStatus === 'current') {
    return {
      platform: COLORS.tileCurrent,
      glow: '#fce22a',
      emissiveIntensity: 0.5,
      opacity: 1,
      zone,
    };
  }

  if (cell.searchStatus === SEARCH_STATUS.FRONTIER || cell.searchStatus === 'frontier') {
    return {
      platform: COLORS.tileFrontier,
      glow: '#00ffca',
      emissiveIntensity: 0.4,
      opacity: 1,
      zone,
    };
  }

  if (cell.searchStatus === SEARCH_STATUS.VISITED || cell.searchStatus === 'visited') {
    return {
      platform: COLORS.tileVisited,
      glow: zone.glow,
      emissiveIntensity: 0.05,
      opacity: 0.7,
      zone,
    };
  }

  if (cell.type === CELL_TYPES.START || cell.type === CELL_TYPES.END) {
    return {
      platform: COLORS.start,
      glow: '#22c55e',
      emissiveIntensity: 0.25,
      opacity: 1,
      zone,
    };
  }

  return { platform, glow, emissiveIntensity, opacity, zone };
}

export function gridToWorld(i, j, gridWidth, gridHeight, elevation = 0) {
  return {
    x: j - gridWidth / 2 + 0.5,
    y: getWorldY(elevation),
    z: i - gridHeight / 2 + 0.5,
  };
}

export function cellToWorld(cell, gridWidth, gridHeight) {
  return gridToWorld(cell.i, cell.j, gridWidth, gridHeight, cell.elevation ?? 0);
}

export function pointToWorld(point, grid, gridWidth, gridHeight) {
  const cell = grid[point.i][point.j];
  return gridToWorld(point.i, point.j, gridWidth, gridHeight, cell.elevation ?? 0);
}

/** Posição do navio entre duas células do caminho (t 0–1). Mudança de nível em dois segmentos. */
export function interpolateShipWorld(fromPoint, toPoint, grid, gridWidth, gridHeight, t) {
  const fromCell = grid[fromPoint.i][fromPoint.j];
  const toCell = grid[toPoint.i][toPoint.j];
  const fromW = pointToWorld(fromPoint, grid, gridWidth, gridHeight);
  const toW = pointToWorld(toPoint, grid, gridWidth, gridHeight);
  const clamped = Math.max(0, Math.min(1, t));

  const fromElev = fromCell.elevation ?? 0;
  const toElev = toCell.elevation ?? 0;

  if (fromElev === toElev) {
    return {
      x: fromW.x + (toW.x - fromW.x) * clamped,
      y: fromW.y + (toW.y - fromW.y) * clamped,
      z: fromW.z + (toW.z - fromW.z) * clamped,
    };
  }

  const mid = { x: toW.x, y: fromW.y, z: toW.z };

  if (clamped <= 0.5) {
    const u = clamped * 2;
    return {
      x: fromW.x + (mid.x - fromW.x) * u,
      y: fromW.y,
      z: fromW.z + (mid.z - fromW.z) * u,
    };
  }

  const u = (clamped - 0.5) * 2;
  return {
    x: mid.x,
    y: fromW.y + (toW.y - fromW.y) * u,
    z: mid.z,
  };
}

export function getActiveDepthLevels(grid) {
  const levels = new Set();
  for (const row of grid) {
    for (const cell of row) {
      levels.add(cell.elevation ?? 0);
    }
  }
  return Array.from(levels).sort((a, b) => a - b);
}
