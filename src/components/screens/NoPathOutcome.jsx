import { useGame } from '@/context/GameContext.jsx';
import { GAME_PHASES } from '@/utils/constants.js';

export function NoPathOutcome() {
  const { state } = useGame();

  if (state.phase !== GAME_PHASES.NO_PATH) return null;

  const { algorithm, noPathReason, stats } = state;
  const nodes = stats.nodesExplored ?? 0;

  const reasonText =
    noPathReason === 'disconnected'
      ? 'O tesouro está em outro arquipélago — não há correntes de bolhas ligando-o ao navio.'
      : `O ${algorithm.toUpperCase()} mapeou ${nodes} recife${nodes === 1 ? '' : 's'} e não chegou ao tesouro.`;

  return (
    <div className="no-path-callout" role="status">
      <p className="no-path-callout-lead">
        Mudar de profundidade só pelas <strong>correntes de bolhas</strong>. No mesmo nível,
        entre recifes vizinhos do mesmo fundo.
      </p>
      <p className="no-path-callout-detail">{reasonText}</p>
      <ul className="no-path-tips">
        <li>Marque outro tesouro em um recife alcançável</li>
        <li>Embaralhe o mapa ou volte ao porto para reconfigurar</li>
      </ul>
    </div>
  );
}
