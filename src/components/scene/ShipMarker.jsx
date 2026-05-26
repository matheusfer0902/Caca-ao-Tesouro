import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext.jsx';
import { gridToWorld } from '@/utils/tileVisuals.js';
import { CELL_TYPES } from '@/utils/constants.js';

function Marker({ color, geometry }) {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.012;
      ref.current.position.y = 0.55 + Math.sin(Date.now() * 0.003) * 0.05;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0.55, 0]}>
      {geometry}
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

export function ShipMarker({ gridWidth, gridHeight }) {
  const groupRef = useRef();
  const targetRef = useRef(new THREE.Vector3());
  const { state } = useGame();
  const { start, searchSnapshot, shipPathIndex, shipAnimating } = state;

  let targetPos = null;

  if (shipAnimating && searchSnapshot.path?.length > 0) {
    const point = searchSnapshot.path[Math.min(shipPathIndex, searchSnapshot.path.length - 1)];
    targetPos = gridToWorld(point.i, point.j, gridWidth, gridHeight);
  } else if (start) {
    targetPos = gridToWorld(start.i, start.j, gridWidth, gridHeight);
  }

  useFrame((_, delta) => {
    if (!groupRef.current || !targetPos) return;
    targetRef.current.set(targetPos.x, 0, targetPos.z);
    groupRef.current.position.lerp(targetRef.current, Math.min(delta * 6, 1));
  });

  if (!targetPos) return null;

  return (
    <group ref={groupRef} position={[targetPos.x, 0, targetPos.z]}>
      <Marker color="#8B4513" geometry={<coneGeometry args={[0.22, 0.45, 4]} />} />
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.08]} />
        <meshStandardMaterial color="#5c3317" />
      </mesh>
      <mesh position={[0.18, 0.85, 0]} rotation={[0, 0.3, 0]}>
        <planeGeometry args={[0.25, 0.3]} />
        <meshStandardMaterial color="#dc0000" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function TreasureMarker({ gridWidth, gridHeight }) {
  const { state } = useGame();
  const { end, phase } = state;

  if (!end || phase === 'idle' || phase === 'selecting_end') return null;

  const pos = gridToWorld(end.i, end.j, gridWidth, gridHeight);
  const color = phase === 'no_path' ? '#dc0000' : '#cd8f2b';

  return (
    <group position={[pos.x, 0, pos.z]}>
      <Marker color={color} geometry={<boxGeometry args={[0.35, 0.28, 0.28]} />} />
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.38, 0.08, 0.32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={phase === 'found' ? 0.45 : 0.2} />
      </mesh>
    </group>
  );
}

export function ObstacleDecor({ cell, gridWidth, gridHeight }) {
  if (cell.type !== CELL_TYPES.OBSTACLE) return null;

  const { x, z } = gridToWorld(cell.i, cell.j, gridWidth, gridHeight);
  const variant = cell.obstacleVariant || 1;

  return (
    <group position={[x, 0.55, z]}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.22, 0.35, 6]} />
        <meshStandardMaterial color="#5a8f3a" />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <sphereGeometry args={[variant === 3 ? 0.22 : 0.16, 8, 8]} />
        <meshStandardMaterial color={variant === 3 ? '#4a0080' : variant === 2 ? '#cd8f2b' : '#2d6a4f'} />
      </mesh>
    </group>
  );
}
