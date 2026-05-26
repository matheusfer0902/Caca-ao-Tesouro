import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGame } from '@/context/GameContext.jsx';
import { Header } from '@/components/layout/Header.jsx';
import { GridScene } from '@/components/scene/GridScene.jsx';
import { AnimationControls } from '@/components/controls/AnimationControls.jsx';
import { StatsPanel } from '@/components/controls/StatsPanel.jsx';
import { DepthLegend } from '@/components/controls/DepthLegend.jsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx';
import { useShipAnimation } from '@/hooks/useShipAnimation.js';
import { GAME_PHASES } from '@/utils/constants.js';

function SceneLoading() {
  return (
    <mesh>
      <boxGeometry args={[0.1, 0.1, 0.1]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  );
}

function SceneViewport() {
  const { state } = useGame();
  const gridW = state.gridSize.x;
  const gridH = state.gridSize.y;
  const span = Math.max(gridW, gridH);
  const camDist = span * 1.35 + 6;
  const targetY = 0.5 + (state.maxElevation ?? 0) * 0.45;

  return (
    <div className="scene-viewport">
      <ErrorBoundary
        fallback={
          <div className="scene-error">
            <p>Não foi possível iniciar o mapa 3D.</p>
            <p>Tente recarregar a página ou use outro navegador com WebGL.</p>
          </div>
        }
      >
        <Canvas
          key={`ocean-${state.gridSize.x}-${state.gridSize.y}-${state.mapDifficulty}`}
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
          dpr={[1, 2]}
        >
          <Suspense fallback={<SceneLoading />}>
            <GridScene />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}

function PhaseGuide() {
  const { state } = useGame();
  const { phase, algorithm, presetLabel } = state;

  const messages = {
    [GAME_PHASES.IDLE]: {
      title: 'Passo 1 — Ancore o navio',
      text: 'Clique em um recife livre. Águas mais claras = mais rasas; mais escuras = abismo.',
    },
    [GAME_PHASES.SELECTING_END]: {
      title: 'Passo 2 — Marque o tesouro',
      text: 'Clique em outro recife. O navio só navega entre profundidades vizinhas (correntes de bolhas).',
    },
    [GAME_PHASES.SEARCHING]: {
      title: 'Busca em andamento',
      text: `O ${algorithm.toUpperCase()} está explorando o mapa. Use os controles abaixo para pausar ou avançar passo a passo.`,
    },
    [GAME_PHASES.FOUND]: {
      title: 'Tesouro encontrado!',
      text: 'O caminho foi descoberto. Observe a rota amarela e o navio percorrendo o trajeto.',
    },
    [GAME_PHASES.NO_PATH]: {
      title: 'Sem rota possível',
      text: 'Não há caminho válido entre navio e tesouro com as profundidades e obstáculos atuais.',
    },
  };

  const msg = messages[phase] || messages[GAME_PHASES.IDLE];

  return (
    <div className="phase-guide">
      <div className="expedition-badge">
        <span>{presetLabel}</span>
        <span>·</span>
        <span>{algorithm.toUpperCase()}</span>
        <span>·</span>
        <span>
          {state.gridSize.x}×{state.gridSize.y}
        </span>
      </div>
      <h2 className="phase-title">{msg.title}</h2>
      <p className="phase-text">{msg.text}</p>
    </div>
  );
}

function SimulationActions() {
  const { state, dispatch, playSound } = useGame();
  const isSearching = state.phase === GAME_PHASES.SEARCHING;
  const isFinished =
    state.phase === GAME_PHASES.FOUND || state.phase === GAME_PHASES.NO_PATH;

  return (
    <div className="simulation-actions">
      <button
        type="button"
        className="custom-btn btn-search"
        disabled={isSearching}
        onClick={() => {
          dispatch({ type: 'GO_TO_SETUP' });
          playSound('restart');
        }}
      >
        ⚓ Voltar ao porto
      </button>

      {isFinished && (
        <button
          type="button"
          className="custom-btn btn-search"
          onClick={() => {
            dispatch({ type: 'NEW_EXPEDITION' });
            playSound('ship');
          }}
        >
          🔄 Nova busca no mapa
        </button>
      )}
    </div>
  );
}

export function SimulationScreen() {
  useShipAnimation();
  const { state, dispatch } = useGame();
  const showAnimation =
    state.phase === GAME_PHASES.SEARCHING ||
    state.phase === GAME_PHASES.FOUND ||
    state.phase === GAME_PHASES.NO_PATH;

  if (!state.grid?.length || !state.grid[0]?.length) {
    return (
      <>
        <Header />
        <main className="box simulation-screen">
          <p className="phase-text">Erro ao gerar o mapa. Volte ao porto e tente novamente.</p>
          <button
            type="button"
            className="custom-btn btn-search"
            onClick={() => dispatch({ type: 'GO_TO_SETUP' })}
          >
            Voltar ao porto
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="box simulation-screen">
        <PhaseGuide />
        <div className="simulation-layout">
          <SceneViewport />
          <aside className="simulation-sidebar">
            <DepthLegend />
            <StatsPanel />
            {showAnimation && <AnimationControls />}
            <SimulationActions />
          </aside>
        </div>
      </main>
    </>
  );
}
