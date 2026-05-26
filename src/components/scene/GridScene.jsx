import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Tile } from './Tile.jsx';
import { ShipMarker, TreasureMarker, ObstacleDecor } from './ShipMarker.jsx';
import { SceneLighting } from './SceneLighting.jsx';
import { useGame } from '@/context/GameContext.jsx';

function WaterPlane({ gridWidth, gridHeight }) {
  const size = Math.max(gridWidth, gridHeight) + 8;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color="#06283d" transparent opacity={0.85} roughness={0.2} metalness={0.4} />
    </mesh>
  );
}

function CameraControls({ distance }) {
  const controlsRef = useRef();

  useEffect(() => {
    const handler = () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
      }
    };
    window.addEventListener('reset-camera', handler);
    return () => window.removeEventListener('reset-camera', handler);
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      minDistance={6}
      maxDistance={35}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={Math.PI / 6}
      target={[0, 0, 0]}
    />
  );
}

export function GridScene() {
  const { state } = useGame();
  const { grid, gridSize } = state;
  const gridWidth = gridSize.x;
  const gridHeight = gridSize.y;

  return (
    <>
      <SceneLighting />
      <color attach="background" args={['#041f30']} />

      <CameraControls distance={Math.max(gridWidth, gridHeight)} />

      <WaterPlane gridWidth={gridWidth} gridHeight={gridHeight} />

      {grid.map((row) =>
        row.map((cell) => (
          <group key={`${cell.i}-${cell.j}`}>
            <Tile cell={cell} gridWidth={gridWidth} gridHeight={gridHeight} />
            <ObstacleDecor cell={cell} gridWidth={gridWidth} gridHeight={gridHeight} />
          </group>
        ))
      )}

      <ShipMarker gridWidth={gridWidth} gridHeight={gridHeight} />
      <TreasureMarker gridWidth={gridWidth} gridHeight={gridHeight} />
    </>
  );
}
