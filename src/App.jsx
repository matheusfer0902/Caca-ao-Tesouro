import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameProvider } from '@/context/GameContext.jsx';
import { Header } from '@/components/layout/Header.jsx';
import { Guide } from '@/components/layout/Guide.jsx';
import { Footer } from '@/components/layout/Footer.jsx';
import { GridScene } from '@/components/scene/GridScene.jsx';
import { GridControls } from '@/components/controls/GridControls.jsx';
import { AlgorithmSelector } from '@/components/controls/AlgorithmSelector.jsx';
import { AnimationControls } from '@/components/controls/AnimationControls.jsx';
import { StatsPanel } from '@/components/controls/StatsPanel.jsx';
import { useShipAnimation } from '@/hooks/useShipAnimation.js';
import { useGame } from '@/context/GameContext.jsx';
import '@/styles/global.css';

function SceneViewport() {
  const { state } = useGame();
  const cameraDistance = Math.max(state.gridSize.x, state.gridSize.y) * 1.4 + 4;

  return (
    <div className="scene-viewport">
      <Canvas
        camera={{ position: [cameraDistance * 0.6, cameraDistance * 0.85, cameraDistance], fov: 45 }}
        shadows
      >
        <Suspense fallback={null}>
          <GridScene />
        </Suspense>
      </Canvas>
    </div>
  );
}

function AppContent() {
  useShipAnimation();

  return (
    <>
      <Header />
      <main className="box main">
        <Guide />
        <SceneViewport />
        <div className="controls-wrapper">
          <GridControls />
          <AlgorithmSelector />
          <AnimationControls />
          <StatsPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
