import { Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGame } from '@/context/GameContext.jsx';
import { Header } from '@/components/layout/Header.jsx';
import { GridScene } from '@/components/scene/GridScene.jsx';
import { AnimationControls } from '@/components/controls/AnimationControls.jsx';
import { StatsPanel } from '@/components/controls/StatsPanel.jsx';
import { DepthLegend } from '@/components/controls/DepthLegend.jsx';
import { ComparisonSummary } from '@/components/controls/ComparisonSummary.jsx';
import { ComparisonLayout } from '@/components/screens/ComparisonLayout.jsx';
import { useComparisonWallClock } from '@/hooks/useComparisonWallClock.js';
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx';
import { NoPathOutcome } from '@/components/screens/NoPathOutcome.jsx';
import { SimulationSliceProvider } from '@/context/SimulationSliceContext.jsx';
import {
  isCompareFinished,
  isCompareMode,
  isCompareSearching,
} from '@/context/SimulationSliceContext.jsx';
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
        <SimulationSliceProvider>
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
        </SimulationSliceProvider>
      </ErrorBoundary>
    </div>
  );
}

function PhaseGuide() {
  const { state } = useGame();
  const { phase, algorithm, presetLabel } = state;
  const compare = isCompareMode(state);

  const messages = compare
    ? {
        [GAME_PHASES.IDLE]: {
          title: 'Passo 1 — Ancore o navio',
          text: 'Clique em um recife livre nos dois mapas. A posição vale para BFS e DFS ao mesmo tempo.',
        },
        [GAME_PHASES.SELECTING_END]: {
          title: 'Passo 2 — Marque o tesouro',
          text: 'Clique em outro recife. As duas buscas (BFS e DFS) iniciarão juntas com cronômetros individuais.',
        },
        [GAME_PHASES.SEARCHING]: {
          title: 'Comparação em andamento',
          text: 'BFS e DFS exploram o mesmo mapa simultaneamente. Observe fila vs pilha, tempo e estatísticas.',
        },
        [GAME_PHASES.FOUND]: {
          title: 'Comparação concluída',
          text: 'Pelo menos um algoritmo encontrou o tesouro. Compare tempo, nós explorados e caminho.',
        },
        [GAME_PHASES.NO_PATH]: {
          title: 'Comparação concluída — sem rota',
          text: 'Nenhum algoritmo encontrou caminho válido neste mapa.',
        },
      }
    : {
        [GAME_PHASES.IDLE]: {
          title: 'Passo 1 — Ancore o navio',
          text: 'Clique em um recife livre. Águas mais claras = mais rasas; mais escuras = abismo.',
        },
        [GAME_PHASES.SELECTING_END]: {
          title: 'Passo 2 — Marque o tesouro',
          text: 'Clique em outro recife. Mesmo nível: recifes vizinhos. Mudar de profundidade: só pelas correntes de bolhas.',
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
          title: 'Mapa encerrado — rota inexistente!',
          text: 'Não há caminho só por recifes do mesmo nível e pelas correntes de bolhas visíveis.',
        },
      };

  const msg = messages[phase] || messages[GAME_PHASES.IDLE];
  const guideClass =
    phase === GAME_PHASES.NO_PATH ? 'phase-guide phase-guide--no-path' : 'phase-guide';

  return (
    <div className={guideClass}>
      <div className="expedition-badge">
        <span>{presetLabel}</span>
        <span>·</span>
        <span>{compare ? 'BFS vs DFS' : algorithm.toUpperCase()}</span>
        <span>·</span>
        <span>
          {state.gridSize.x}×{state.gridSize.y}
        </span>
      </div>
      <h2 className="phase-title">{msg.title}</h2>
      <p className="phase-text">{msg.text}</p>
      {phase === GAME_PHASES.NO_PATH && !compare && <NoPathOutcome />}
    </div>
  );
}

function SimulationActions() {
  const { state, dispatch, playSound } = useGame();
  const compare = isCompareMode(state);
  const isSearching = compare ? isCompareSearching(state) : state.phase === GAME_PHASES.SEARCHING;
  const isFinished = compare
    ? isCompareFinished(state)
    : state.phase === GAME_PHASES.FOUND || state.phase === GAME_PHASES.NO_PATH;

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

      {state.phase === GAME_PHASES.NO_PATH && (
        <button
          type="button"
          className="custom-btn btn-search"
          onClick={() => {
            dispatch({ type: 'RESELECT_END' });
            playSound('ship');
          }}
        >
          🗺️ Marcar outro tesouro
        </button>
      )}

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

function CompareSimulationContent() {
  useComparisonWallClock();
  const { state } = useGame();

  const showAnimation =
    state.phase !== GAME_PHASES.IDLE && state.phase !== GAME_PHASES.SELECTING_END;

  return (
    <>
      <Header />
      <main className="box simulation-screen simulation-screen--compare">
        <PhaseGuide />
        <div className="simulation-layout simulation-layout--compare">
          <ComparisonLayout />
          <aside className="simulation-sidebar">
            <DepthLegend />
            {showAnimation && <ComparisonSummary />}
            {showAnimation && <AnimationControls />}
            <SimulationActions />
          </aside>
        </div>
      </main>
    </>
  );
}

export function SimulationScreen() {
  useShipAnimation();
  const { state, dispatch, playSound } = useGame();
  const prevPhaseRef = useRef(state.phase);
  const compare = isCompareMode(state);

  useEffect(() => {
    if (
      state.phase === GAME_PHASES.NO_PATH &&
      prevPhaseRef.current !== GAME_PHASES.NO_PATH
    ) {
      playSound('chest_error');
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase, playSound]);

  const showAnimation = compare
    ? state.phase !== GAME_PHASES.IDLE && state.phase !== GAME_PHASES.SELECTING_END
    : state.phase === GAME_PHASES.SEARCHING ||
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

  if (compare) {
    return <CompareSimulationContent />;
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
