import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';

const PHASE_LABELS = {
  [GAME_PHASES.IDLE]: 'Clique para definir o navio (início)',
  [GAME_PHASES.SELECTING_END]: 'Clique para definir o tesouro (destino)',
  [GAME_PHASES.SEARCHING]: 'Busca em andamento...',
  [GAME_PHASES.FOUND]: 'Tesouro encontrado!',
  [GAME_PHASES.NO_PATH]: 'Sem caminho até o tesouro',
};

export function StatsPanel() {
  const { state } = useGame();
  const frontierLabel = state.algorithm === 'bfs' ? 'Tamanho da fila' : 'Tamanho da pilha';

  return (
    <div className="item control-panel stats-panel">
      <span className="panel-title">Estatísticas</span>
      <p className="phase-label">{PHASE_LABELS[state.phase]}</p>
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
