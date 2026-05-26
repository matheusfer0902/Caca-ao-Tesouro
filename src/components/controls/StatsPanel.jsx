import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';

export function StatsPanel() {
  const { state } = useGame();
  const frontierLabel = state.algorithm === 'bfs' ? 'Tamanho da fila' : 'Tamanho da pilha';
  const isNoPath = state.phase === GAME_PHASES.NO_PATH;

  const phaseLabels = {
    [GAME_PHASES.IDLE]: 'Aguardando navio...',
    [GAME_PHASES.SELECTING_END]: 'Aguardando tesouro...',
    [GAME_PHASES.SEARCHING]: 'Explorando...',
    [GAME_PHASES.FOUND]: 'Rota encontrada!',
    [GAME_PHASES.NO_PATH]: 'Expedição sem saída',
  };

  const panelClass = isNoPath
    ? 'item control-panel stats-panel stats-panel--no-path'
    : 'item control-panel stats-panel';

  return (
    <div className={panelClass}>
      <span className="panel-title">Estatísticas</span>
      <p className="phase-label">{phaseLabels[state.phase]}</p>
      <p>
        <strong>Passos no caminho:</strong>{' '}
        {isNoPath ? '—' : state.stats.stepsInPath}
      </p>
      <p>
        <strong>Nós explorados:</strong> {state.stats.nodesExplored}
      </p>
      <p>
        <strong>{frontierLabel}:</strong> {state.stats.frontierSize}
      </p>
      {isNoPath && (
        <p className="stats-no-path-note">
          Nenhum caminho só por recifes iguais e correntes.
        </p>
      )}
    </div>
  );
}
