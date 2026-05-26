import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext.jsx';
import { CELL_TYPES } from '@/utils/constants.js';
import { getTileVisual, gridToWorld } from '@/utils/tileVisuals.js';

export function Tile({ cell, gridWidth, gridHeight }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { handleCellClick, state } = useGame();
  const visual = getTileVisual(cell);
  const { x, z } = gridToWorld(cell.i, cell.j, gridWidth, gridHeight);
  const isObstacle = cell.type === CELL_TYPES.OBSTACLE;
  const clickable =
    state.phase !== 'searching' && !isObstacle;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const targetY = visual.height / 2;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      Math.min(delta * 8, 1)
    );

    if (cell.searchStatus === 'current' || cell.searchStatus === 'frontier') {
      meshRef.current.material.emissiveIntensity =
        0.2 + Math.sin(Date.now() * 0.006) * 0.15;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[x, visual.height / 2, z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (clickable) setHovered(true);
        document.body.style.cursor = isObstacle ? 'not-allowed' : clickable ? 'pointer' : 'default';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (clickable) handleCellClick(cell.i, cell.j);
      }}
    >
      <boxGeometry args={[0.92, visual.height, 0.92]} />
      <meshStandardMaterial
        color={hovered && clickable ? '#0aa8be' : visual.color}
        emissive={visual.emissive}
        emissiveIntensity={visual.emissiveIntensity}
        transparent={visual.opacity < 1}
        opacity={visual.opacity}
        roughness={0.65}
        metalness={0.1}
      />
    </mesh>
  );
}
