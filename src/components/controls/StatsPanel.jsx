import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';

export function StatsPanel() {
  const { state } = useGame();
  const frontierLabel = state.algorithm === 'bfs' ? 'Tamanho da fila' : 'Tamanho da pilha';

  const phaseLabels = {
    [GAME_PHASES.IDLE]: 'Aguardando navio...',
    [GAME_PHASES.SELECTING_END]: 'Aguardando tesouro...',
    [GAME_PHASES.SEARCHING]: 'Explorando...',
    [GAME_PHASES.FOUND]: 'Rota encontrada!',
    [GAME_PHASES.NO_PATH]: 'Sem rota',
  };

  return (
    <div className="item control-panel stats-panel">
      <span className="panel-title">Estatísticas</span>
      <p className="phase-label">{phaseLabels[state.phase]}</p>
      <p>
        <strong>Passos no caminho:</strong> {state.stats.stepsInPath}
      </p>
      <p>
        <strong>Nós explorados:</strong> {state.stats.nodesExplored}
      </p>
      <p>
        <strong>{frontierLabel}:</strong> {state.stats.frontierSize}
      </p>
    </div>
  );
}
