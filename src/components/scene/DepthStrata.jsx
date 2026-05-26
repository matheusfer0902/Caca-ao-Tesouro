import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/context/GameContext.jsx';
import { DEPTH_ZONES } from '@/utils/constants.js';
import { getActiveDepthLevels, getPlatformY } from '@/utils/tileVisuals.js';

function DepthStratum({ level, gridWidth, gridHeight }) {
  const meshRef = useRef();
  const zone = DEPTH_ZONES[Math.min(level, DEPTH_ZONES.length - 1)];
  const baseY = getPlatformY(level) - 0.08;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = baseY + Math.sin(clock.elapsedTime * 0.8 + level) * 0.03;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, baseY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[gridWidth * 1.05, gridHeight * 1.05]} />
      <meshBasicMaterial
        color={zone.glow}
        transparent
        opacity={0.07 + level * 0.02}
        depthWrite={false}
      />
    </mesh>
  );
}

export function DepthStrata({ gridWidth, gridHeight }) {
  const { state } = useGame();
  const levels = getActiveDepthLevels(state.grid);

  if (state.maxElevation === 0) return null;

  return (
    <>
      {levels.map((level) => (
        <DepthStratum
          key={`stratum-${level}`}
          level={level}
          gridWidth={gridWidth}
          gridHeight={gridHeight}
        />
      ))}
    </>
  );
}
