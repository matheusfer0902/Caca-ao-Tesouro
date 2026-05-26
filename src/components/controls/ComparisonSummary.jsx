import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';
import { isCompareFinished } from '@/context/SimulationSliceContext.jsx';
import { formatElapsed } from '@/utils/formatElapsed.js';

export function ComparisonSummary() {
  const { state } = useGame();

  if (!isCompareFinished(state)) return null;

  const { bfs, dfs } = state.compare;
  const bfsTime = state.compare.timers.bfs.elapsedMs;
  const dfsTime = state.compare.timers.dfs.elapsedMs;

  let faster = null;
  if (bfs.phase === GAME_PHASES.FOUND && dfs.phase === GAME_PHASES.FOUND) {
    if (bfsTime < dfsTime) faster = 'BFS';
    else if (dfsTime < bfsTime) faster = 'DFS';
    else faster = 'empate';
  }

  const nodesDiff = bfs.stats.nodesExplored - dfs.stats.nodesExplored;

  return (
    <div className="item control-panel comparison-summary">
      <span className="panel-title">Resultado da comparação</span>
      {faster && (
        <p>
          <strong>Mais rápido:</strong>{' '}
          {faster === 'empate'
            ? `Empate (${formatElapsed(bfsTime)})`
            : `${faster} (${formatElapsed(faster === 'BFS' ? bfsTime : dfsTime)})`}
        </p>
      )}
      <p>
        <strong>Nós explorados:</strong> BFS {bfs.stats.nodesExplored} · DFS{' '}
        {dfs.stats.nodesExplored}
        {nodesDiff !== 0 && (
          <span className="comparison-summary-diff">
            {' '}
            (BFS {nodesDiff > 0 ? '+' : ''}
            {nodesDiff})
          </span>
        )}
      </p>
      {(bfs.phase === GAME_PHASES.FOUND || dfs.phase === GAME_PHASES.FOUND) && (
        <p>
          <strong>Passos no caminho:</strong> BFS{' '}
          {bfs.phase === GAME_PHASES.FOUND ? bfs.stats.stepsInPath : '—'} · DFS{' '}
          {dfs.phase === GAME_PHASES.FOUND ? dfs.stats.stepsInPath : '—'}
        </p>
      )}
    </div>
  );
}
