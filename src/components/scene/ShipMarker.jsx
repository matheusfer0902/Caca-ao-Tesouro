import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext.jsx';
import {
  pointToWorld,
  gridToWorld,
  getPlatformY,
} from '@/utils/tileVisuals.js';
import {
  CELL_TYPES,
  GAME_PHASES,
  TILE_RADIUS,
  PLATFORM_THICKNESS,
} from '@/utils/constants.js';

function PirateShip() {
  const group = useRef();

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(clock.elapsedTime * 2) * 0.04;
      group.current.position.y = 0.08 + Math.sin(clock.elapsedTime * 2.5) * 0.04;
    }
  });

  return (
    <group ref={group} position={[0, 0.1, 0]}>
      <mesh>
        <boxGeometry args={[0.42, 0.18, 0.22]} />
        <meshStandardMaterial color="#5c3317" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.38, 0.06]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      <mesh position={[0.12, 0.42, 0]} rotation={[0, 0.2, 0.15]}>
        <planeGeometry args={[0.32, 0.38]} />
        <meshStandardMaterial
          color="#dc0000"
          side={THREE.DoubleSide}
          emissive="#aa0000"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0.12, 0.14]}>
        <coneGeometry args={[0.12, 0.2, 4]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

export function ShipMarker({ gridWidth, gridHeight }) {
  const groupRef = useRef();
  const targetRef = useRef(new THREE.Vector3());
  const { state } = useGame();
  const { start, end, phase, searchSnapshot, shipPathIndex, shipAnimating, grid } = state;
  const route = searchSnapshot.path ?? [];

  let targetPos = null;

  if (route.length > 0 && (shipAnimating || phase === GAME_PHASES.FOUND)) {
    const index = shipAnimating
      ? Math.min(shipPathIndex, route.length - 1)
      : route.length - 1;
    targetPos = pointToWorld(route[index], grid, gridWidth, gridHeight);
  } else if (start) {
    const cell = grid[start.i][start.j];
    targetPos = gridToWorld(start.i, start.j, gridWidth, gridHeight, cell.elevation ?? 0);
  } else if (end && phase === GAME_PHASES.FOUND) {
    const cell = grid[end.i][end.j];
    targetPos = gridToWorld(end.i, end.j, gridWidth, gridHeight, cell.elevation ?? 0);
  }

  useFrame((_, delta) => {
    if (!groupRef.current || !targetPos) return;
    targetRef.current.set(targetPos.x, targetPos.y, targetPos.z);
    const lerpFactor = shipAnimating ? 14 : 8;
    groupRef.current.position.lerp(targetRef.current, Math.min(delta * lerpFactor, 1));
  });

  if (!targetPos) return null;

  return (
    <group ref={groupRef} position={[targetPos.x, targetPos.y, targetPos.z]}>
      <pointLight color="#fce22a" intensity={0.4} distance={2} />
      <PirateShip />
    </group>
  );
}

function TreasureChest({ color, glowing }) {
  const lidRef = useRef();

  useFrame(({ clock }) => {
    if (lidRef.current && glowing) {
      lidRef.current.position.y = 0.2 + Math.sin(clock.elapsedTime * 3) * 0.03;
    }
  });

  return (
    <group position={[0, 0.08, 0]}>
      <mesh>
        <boxGeometry args={[0.36, 0.24, 0.28]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glowing ? 0.5 : 0.15}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      <mesh ref={lidRef} position={[0, 0.2, -0.02]}>
        <boxGeometry args={[0.4, 0.1, 0.32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glowing ? 0.6 : 0.2}
          metalness={0.4}
        />
      </mesh>
      {glowing && <pointLight color="#fce22a" intensity={0.6} distance={2.5} />}
    </group>
  );
}

export function TreasureMarker({ gridWidth, gridHeight }) {
  const { state } = useGame();
  const { end, phase, grid } = state;

  if (!end || phase === 'idle' || phase === 'selecting_end') return null;

  const cell = grid[end.i][end.j];
  const pos = gridToWorld(end.i, end.j, gridWidth, gridHeight, cell.elevation ?? 0);
  const color = phase === 'no_path' ? '#dc0000' : '#cd8f2b';

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <TreasureChest color={color} glowing={phase === 'found'} />
    </group>
  );
}

function IslandObstacle({ variant, surfaceY }) {
  const colors = {
    1: { trunk: '#5a8f3a', top: '#2d6a4f' },
    2: { trunk: '#906821', top: '#cd8f2b' },
    3: { trunk: '#4a0080', top: '#6b21a8' },
    4: { trunk: '#5a8f3a', top: '#16a34a' },
  };
  const c = colors[variant] || colors[1];

  return (
    <group position={[0, surfaceY + 0.2, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.25, 6]} />
        <meshStandardMaterial color={c.trunk} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.32, 0.45, 6]} />
        <meshStandardMaterial color={c.top} roughness={0.7} />
      </mesh>
      {variant === 2 && (
        <mesh position={[0, 0.55, 0]}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color="#fce22a" emissive="#fce22a" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  );
}

export function ObstacleDecor({ cell, gridWidth, gridHeight }) {
  if (cell.type !== CELL_TYPES.OBSTACLE) return null;

  const surfaceY = getPlatformY(cell.elevation ?? 0);
  const { x, z } = gridToWorld(cell.i, cell.j, gridWidth, gridHeight);
  const variant = cell.obstacleVariant || 1;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, surfaceY + PLATFORM_THICKNESS / 2, 0]}>
        <cylinderGeometry args={[TILE_RADIUS * 0.85, TILE_RADIUS * 1.1, PLATFORM_THICKNESS + 0.08, 16]} />
        <meshStandardMaterial color="#906821" roughness={0.8} />
      </mesh>
      <IslandObstacle variant={variant} surfaceY={surfaceY} />
    </group>
  );
}

function Bubble({ position, phase }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + phase) * 0.08;
      ref.current.material.opacity = 0.4 + Math.sin(clock.elapsedTime * 3 + phase) * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshBasicMaterial color="#00ffca" transparent opacity={0.5} depthWrite={false} />
    </mesh>
  );
}

export function CurrentStream({ fromCell, toCell, gridWidth, gridHeight }) {
  const elevDiff = (toCell.elevation ?? 0) - (fromCell.elevation ?? 0);
  if (elevDiff !== 1) return null;
  if (fromCell.type === CELL_TYPES.OBSTACLE || toCell.type === CELL_TYPES.OBSTACLE) return null;

  const from = gridToWorld(fromCell.i, fromCell.j, gridWidth, gridHeight, fromCell.elevation ?? 0);
  const to = gridToWorld(toCell.i, toCell.j, gridWidth, gridHeight, toCell.elevation ?? 0);

  const bubbles = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const t = (i + 1) / 6;
      return {
        pos: [
          from.x + (to.x - from.x) * t,
          from.y + (to.y - from.y) * t,
          from.z + (to.z - from.z) * t,
        ],
        phase: i * 1.2,
      };
    });
  }, [from.x, from.y, from.z, to.x, to.y, to.z]);

  return (
    <group>
      {bubbles.map((b, i) => (
        <Bubble key={i} position={b.pos} phase={b.phase} />
      ))}
    </group>
  );
}

export function CurrentStreams({ grid, gridWidth, gridHeight }) {
  const streams = [];

  for (const row of grid) {
    for (const cell of row) {
      for (const neighbor of [grid[cell.i]?.[cell.j + 1], grid[cell.i + 1]?.[cell.j]].filter(Boolean)) {
        if ((neighbor.elevation ?? 0) > (cell.elevation ?? 0)) {
          streams.push(
            <CurrentStream
              key={`c-${cell.i}-${cell.j}-${neighbor.i}-${neighbor.j}`}
              fromCell={cell}
              toCell={neighbor}
              gridWidth={gridWidth}
              gridHeight={gridHeight}
            />
          );
        }
      }
    }
  }

  return <>{streams}</>;
}
