import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGame } from '@/context/GameContext.jsx';
import { SimulationSliceProvider } from '@/context/SimulationSliceContext.jsx';
import { GridScene } from '@/components/scene/GridScene.jsx';
import { StatsPanel } from '@/components/controls/StatsPanel.jsx';
import { ComparisonTimer } from '@/components/controls/ComparisonTimer.jsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx';

function SceneLoading() {
  return (
    <mesh>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

function ComparisonSceneViewport({ side, label }) {
  const { state } = useGame();
  const gridW = state.gridSize.x;
  const gridH = state.gridSize.y;
  const span = Math.max(gridW, gridH);
  const camDist = span * 1.35 + 6;
  const targetY = 0.5 + (state.maxElevation ?? 0) * 0.45;

  return (
    <div className="comparison-panel">
      <div className="comparison-panel-header">
        <span className="comparison-panel-label">{label}</span>
        <ComparisonTimer side={side} />
        <SimulationSliceProvider side={side}>
          <StatsPanel side={side} algorithm={side} />
        </SimulationSliceProvider>
      </div>
      <div className="scene-viewport scene-viewport--compare">
        <ErrorBoundary
          fallback={
            <div className="scene-error">
              <p>Não foi possível iniciar o mapa 3D.</p>
            </div>
          }
        >
          <SimulationSliceProvider side={side}>
            <Canvas
              key={`compare-${side}-${state.gridSize.x}-${state.gridSize.y}-${state.mapDifficulty}`}
              camera={{
                position: [camDist * 0.75, camDist * 0.85, camDist * 0.75],
                fov: 50,
                near: 0.1,
                far: 200,
              }}
              onCreated={({ camera }) => {
                camera.lookAt(0, targetY, 0);
              }}
              gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
              dpr={[1, 1.5]}
            >
              <Suspense fallback={<SceneLoading />}>
                <GridScene />
              </Suspense>
            </Canvas>
          </SimulationSliceProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export function ComparisonLayout() {
  return (
    <div className="comparison-layout">
      <ComparisonSceneViewport side="bfs" label="BFS — Fila" />
      <ComparisonSceneViewport side="dfs" label="DFS — Pilha" />
    </div>
  );
}
