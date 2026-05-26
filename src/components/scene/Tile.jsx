import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/context/GameContext.jsx';
import { CELL_TYPES, TILE_RADIUS, PLATFORM_THICKNESS } from '@/utils/constants.js';
import { getPlatformY, getTileAppearance, gridToWorld } from '@/utils/tileVisuals.js';

export function Tile({ cell, gridWidth, gridHeight }) {
  const platformRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { handleCellClick, state } = useGame();

  const elevation = cell.elevation ?? 0;
  const platformY = getPlatformY(elevation);
  const { x, z } = gridToWorld(cell.i, cell.j, gridWidth, gridHeight);
  const appearance = getTileAppearance(cell);
  const isObstacle = cell.type === CELL_TYPES.OBSTACLE;
  const clickable = state.phase !== 'searching' && !isObstacle;

  const platformColor = hovered && clickable ? '#5eead4' : appearance.platform;
  const pulse =
    cell.searchStatus === 'current' || cell.searchStatus === 'frontier';

  useFrame((state3d) => {
    const t = state3d.clock.elapsedTime;
    if (glowRef.current) {
      const scale = pulse ? 1 + Math.sin(t * 4) * 0.06 : 1;
      glowRef.current.scale.setScalar(scale);
      if (glowRef.current.material) {
        glowRef.current.material.opacity = pulse
          ? 0.35 + Math.sin(t * 4) * 0.15
          : hovered && clickable
            ? 0.45
            : 0.22;
      }
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Coluna d'água — profundidade até o recife */}
      {elevation > 0 && !isObstacle && (
        <mesh position={[0, platformY / 2, 0]}>
          <cylinderGeometry args={[TILE_RADIUS * 0.35, TILE_RADIUS * 0.5, platformY, 8]} />
          <meshStandardMaterial
            color={appearance.zone.water}
            transparent
            opacity={0.5}
            roughness={0.2}
            metalness={0.05}
          />
        </mesh>
      )}

      {/* Halo bioluminescente sob o recife */}
      {!isObstacle && (
        <mesh ref={glowRef} position={[0, platformY + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[TILE_RADIUS * 1.05, 24]} />
          <meshBasicMaterial
            color={appearance.glow}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Plataforma de recife — disco arredondado */}
      <mesh
        ref={platformRef}
        position={[0, platformY + PLATFORM_THICKNESS / 2, 0]}
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
        <cylinderGeometry args={[TILE_RADIUS, TILE_RADIUS * 0.92, PLATFORM_THICKNESS, 20]} />
        <meshStandardMaterial
          color={platformColor}
          emissive={appearance.glow}
          emissiveIntensity={appearance.emissiveIntensity}
          roughness={0.35}
          metalness={0.15}
          transparent={appearance.opacity < 1}
          opacity={appearance.opacity}
        />
      </mesh>

      {/* Borda de espuma nas águas rasas */}
      {elevation >= 2 && !isObstacle && (
        <mesh position={[0, platformY + PLATFORM_THICKNESS + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[TILE_RADIUS * 0.7, TILE_RADIUS * 0.95, 24]} />
          <meshBasicMaterial color="#e0f7fa" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
