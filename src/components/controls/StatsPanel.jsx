import { useGame } from '@/context/GameContext.jsx';
import { useSimulationSlice } from '@/context/SimulationSliceContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';

export function StatsPanel({ side, algorithm: algorithmOverride }) {
  const { state } = useGame();
  const slice = useSimulationSlice();

  const isCompare = state.algorithm === 'compare' && side;
  const phase = isCompare ? slice.phase : state.phase;
  const stats = isCompare ? slice.stats : state.stats;
  const algorithm = algorithmOverride ?? (isCompare ? side : state.algorithm);

  const frontierLabel = algorithm === 'bfs' ? 'Tamanho da fila' : 'Tamanho da pilha';
  const isNoPath = phase === GAME_PHASES.NO_PATH;

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
      <p className="phase-label">{phaseLabels[phase]}</p>
      <p>
        <strong>Passos no caminho:</strong>{' '}
        {isNoPath ? '—' : stats.stepsInPath}
      </p>
      <p>
        <strong>Nós explorados:</strong> {stats.nodesExplored}
      </p>
      <p>
        <strong>{frontierLabel}:</strong> {stats.frontierSize}
      </p>
      {isNoPath && (
        <p className="stats-no-path-note">
          Nenhum caminho só por recifes iguais e correntes.
        </p>
      )}
    </div>
  );
}
