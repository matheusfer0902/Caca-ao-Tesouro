import { useState, useMemo } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { Header } from '@/components/layout/Header.jsx';
import {
  MAP_PRESETS,
  DEFAULT_DIFFICULTY,
  MAX_GRID,
  MIN_ANIMATION_SPEED,
  MAX_ANIMATION_SPEED,
  DEFAULT_ANIMATION_SPEED,
} from '@/utils/constants.js';

export function SetupScreen() {
  const { dispatch, playSound, startMusic } = useGame();

  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [algorithm, setAlgorithm] = useState('bfs');
  const [customMode, setCustomMode] = useState(false);
  const [sizeX, setSizeX] = useState(10);
  const [sizeY, setSizeY] = useState(10);
  const [obstacles, setObstacles] = useState(16);
  const [speed, setSpeed] = useState(DEFAULT_ANIMATION_SPEED);

  const preset = MAP_PRESETS[difficulty];
  const maxObstacles = sizeX * sizeY;

  const summary = useMemo(() => {
    if (customMode) {
      return {
        label: 'Personalizado',
        grid: `${sizeX}×${sizeY}`,
        obstacles,
        levels: 3,
        desc: 'Mapa customizado com colinas e obstáculos à sua escolha.',
      };
    }
    return {
      label: preset.label,
      grid: `${preset.gridSize}×${preset.gridSize}`,
      obstacles: preset.numObstacles,
      levels: preset.maxElevation + 1,
      desc: preset.description,
    };
  }, [customMode, difficulty, preset, sizeX, sizeY, obstacles]);

  const handleStart = () => {
    dispatch({
      type: 'START_EXPEDITION',
      payload: customMode
        ? {
            custom: true,
            algorithm,
            x: sizeX,
            y: sizeY,
            obstacles: Math.min(obstacles, maxObstacles),
            maxElevation: 2,
            speed,
          }
        : {
            custom: false,
            algorithm,
            difficulty,
            speed,
          },
    });

    try {
      startMusic();
      playSound('ship');
    } catch {
      /* áudio opcional */
    }
  };

  return (
    <>
      <Header />
      <main className="box setup-screen">
        <div className="setup-scroll">
          <div className="setup-intro">
            <h2 className="setup-heading">Carta de Navegação</h2>
            <p className="setup-subtitle">
              Antes de zarpar, o capitão deve preparar a expedição. Configure o mapa e o algoritmo
              — só então a busca começa no oceano 3D.
            </p>
          </div>

          <div className="setup-steps">
            <span className="setup-step active">① Mapa</span>
            <span className="setup-step active">② Algoritmo</span>
            <span className="setup-step">③ Zarpar</span>
          </div>

          <section className="setup-section">
            <h3 className="section-title">Escolha o nível do mar</h3>
            <div className="difficulty-cards">
              {Object.values(MAP_PRESETS).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`difficulty-card ${!customMode && difficulty === p.id ? 'selected' : ''}`}
                  onClick={() => {
                    setCustomMode(false);
                    setDifficulty(p.id);
                    playSound('change_grid');
                  }}
                >
                  <span className="card-label">{p.label}</span>
                  <span className="card-meta">
                    {p.gridSize}×{p.gridSize} · {p.numObstacles} ilhas
                  </span>
                  <span className="card-meta">
                    {p.maxElevation === 0 ? '1 nível' : 'Abismo · Mar · Recife'}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="setup-section">
            <h3 className="section-title">Algoritmo de busca</h3>
            <div className="algorithm-cards">
              <button
                type="button"
                className={`algorithm-card ${algorithm === 'bfs' ? 'selected' : ''}`}
                onClick={() => setAlgorithm('bfs')}
              >
                <span className="card-label">BFS</span>
                <span className="card-desc">Fila — caminho com menos passos</span>
              </button>
              <button
                type="button"
                className={`algorithm-card ${algorithm === 'dfs' ? 'selected' : ''}`}
                onClick={() => setAlgorithm('dfs')}
              >
                <span className="card-label">DFS</span>
                <span className="card-desc">Pilha — encontra um caminho válido</span>
              </button>
            </div>
          </section>

          <section className="setup-section">
            <button
              type="button"
              className="toggle-advanced"
              onClick={() => setCustomMode((v) => !v)}
            >
              {customMode ? '▾ Usar preset de dificuldade' : '▸ Mapa personalizado (avançado)'}
            </button>

            {customMode && (
              <div className="advanced-panel control-panel">
                <div className="advanced-row">
                  <label htmlFor="setup-size-x">Largura</label>
                  <input
                    id="setup-size-x"
                    type="number"
                    min="1"
                    max={MAX_GRID}
                    value={sizeX}
                    onChange={(e) => setSizeX(Math.min(Number(e.target.value), MAX_GRID))}
                  />
                  <label htmlFor="setup-size-y">Altura</label>
                  <input
                    id="setup-size-y"
                    type="number"
                    min="1"
                    max={MAX_GRID}
                    value={sizeY}
                    onChange={(e) => setSizeY(Math.min(Number(e.target.value), MAX_GRID))}
                  />
                </div>
                <div className="advanced-row">
                  <label htmlFor="setup-obstacles">Obstáculos</label>
                  <input
                    id="setup-obstacles"
                    type="number"
                    min="0"
                    max={maxObstacles}
                    value={obstacles}
                    onChange={(e) =>
                      setObstacles(Math.min(Number(e.target.value), maxObstacles))
                    }
                  />
                </div>
              </div>
            )}
          </section>

          <section className="setup-section">
            <h3 className="section-title">Velocidade da animação</h3>
            <div className="speed-panel control-panel">
              <label htmlFor="setup-speed">{speed} ms por passo</label>
              <input
                id="setup-speed"
                type="range"
                min={MIN_ANIMATION_SPEED}
                max={MAX_ANIMATION_SPEED}
                step={50}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </div>
          </section>

          <section className="setup-summary">
            <h3 className="section-title">Resumo da expedição</h3>
            <div className="summary-card">
              <p>
                <strong>Mapa:</strong> {summary.label}
              </p>
              <p>
                <strong>Grade:</strong> {summary.grid} · <strong>Obstáculos:</strong>{' '}
                {summary.obstacles} · <strong>Alturas:</strong> {summary.levels}{' '}
                {summary.levels === 1 ? 'nível' : 'níveis'}
              </p>
              <p>
                <strong>Algoritmo:</strong> {algorithm.toUpperCase()} · <strong>Velocidade:</strong>{' '}
                {speed}ms
              </p>
              <p className="summary-desc">{summary.desc}</p>
            </div>
          </section>

          <button type="button" className="custom-btn btn-zarpar" onClick={handleStart}>
            ⚓ Zarpar para o mapa!
          </button>
        </div>
      </main>
    </>
  );
}
