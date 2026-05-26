import { useEffect, useRef, useMemo } from 'react';
import { OrbitControls } from '@react-three/drei';
import { Tile } from './Tile.jsx';
import {
  ShipMarker,
  TreasureMarker,
  ObstacleDecor,
  CurrentStreams,
} from './ShipMarker.jsx';
import { DepthStrata } from './DepthStrata.jsx';
import { OceanFloor } from './OceanEnvironment.jsx';
import { SceneLighting } from './SceneLighting.jsx';
import { useGame } from '@/context/GameContext.jsx';
import { getTerrainCenterY } from '@/utils/tileVisuals.js';

function CameraControls({ targetY }) {
  const controlsRef = useRef();

  useEffect(() => {
    const handler = () => {
      if (controlsRef.current) {
        controlsRef.current.target.set(0, targetY, 0);
        controlsRef.current.update();
      }
    };
    window.addEventListener('reset-camera', handler);
    return () => window.removeEventListener('reset-camera', handler);
  }, [targetY]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      minDistance={8}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2.05}
      minPolarAngle={Math.PI / 12}
      target={[0, targetY, 0]}
    />
  );
}

export function GridScene() {
  const { state } = useGame();
  const { grid, gridSize, maxElevation } = state;
  const gridWidth = gridSize.x;
  const gridHeight = gridSize.y;
  const targetY = getTerrainCenterY(maxElevation);

  const tiles = useMemo(
    () =>
      grid.flatMap((row) =>
        row.map((cell) => (
          <group key={`${cell.i}-${cell.j}`}>
            <Tile cell={cell} gridWidth={gridWidth} gridHeight={gridHeight} />
            <ObstacleDecor cell={cell} gridWidth={gridWidth} gridHeight={gridHeight} />
          </group>
        ))
      ),
    [grid, gridWidth, gridHeight]
  );

  return (
    <>
      <SceneLighting targetY={targetY} />
      <color attach="background" args={['#06283d']} />

      <CameraControls targetY={0.5 + (maxElevation ?? 0) * 0.45} />

      <OceanFloor gridWidth={gridWidth} gridHeight={gridHeight} />
      <DepthStrata gridWidth={gridWidth} gridHeight={gridHeight} />

      {tiles}

      <CurrentStreams grid={grid} gridWidth={gridWidth} gridHeight={gridHeight} />

      <ShipMarker gridWidth={gridWidth} gridHeight={gridHeight} />
      <TreasureMarker gridWidth={gridWidth} gridHeight={gridHeight} />
    </>
  );
}
