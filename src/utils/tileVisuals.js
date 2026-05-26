import { useMemo } from 'react';
import * as THREE from 'three';
import { COLORS, CELL_TYPES, SEARCH_STATUS } from '@/utils/constants.js';

export function getTileVisual(cell) {
  const base = {
    color: COLORS.tile,
    height: 0.25,
    emissive: '#000000',
    emissiveIntensity: 0,
    opacity: 1,
  };

  if (cell.type === CELL_TYPES.OBSTACLE) {
    return { ...base, color: COLORS.obstacle, height: 0.55 };
  }

  if (cell.searchStatus === SEARCH_STATUS.PATH || cell.searchStatus === 'path') {
    return { ...base, color: COLORS.tilePath, height: 0.35, emissive: COLORS.tilePath, emissiveIntensity: 0.15 };
  }

  if (cell.searchStatus === SEARCH_STATUS.CURRENT || cell.searchStatus === 'current') {
    return { ...base, color: COLORS.tileCurrent, height: 0.4, emissive: COLORS.tileCurrent, emissiveIntensity: 0.35 };
  }

  if (cell.searchStatus === SEARCH_STATUS.FRONTIER || cell.searchStatus === 'frontier') {
    return { ...base, color: COLORS.tileFrontier, height: 0.3, emissive: COLORS.tileFrontier, emissiveIntensity: 0.25 };
  }

  if (cell.searchStatus === SEARCH_STATUS.VISITED || cell.searchStatus === 'visited') {
    return { ...base, color: COLORS.tileVisited, height: 0.25, opacity: 0.85 };
  }

  if (cell.type === CELL_TYPES.START || cell.type === CELL_TYPES.END) {
    return { ...base, color: COLORS.start, height: 0.3 };
  }

  return base;
}

export function gridToWorld(i, j, gridWidth, gridHeight) {
  return {
    x: j - gridWidth / 2 + 0.5,
    z: i - gridHeight / 2 + 0.5,
  };
}

export function useTileColor(cell) {
  return useMemo(() => getTileVisual(cell), [cell]);
}

export function lerpColor(from, to, t) {
  const c1 = new THREE.Color(from);
  const c2 = new THREE.Color(to);
  return c1.lerp(c2, t).getStyle();
}
