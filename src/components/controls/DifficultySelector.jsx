import { useGame } from '@/context/GameContext.jsx';
import { MAP_PRESETS } from '@/utils/constants.js';

export function DifficultySelector() {
  const { state, dispatch, playSound } = useGame();
  const current = MAP_PRESETS[state.mapDifficulty];

  return (
    <div className="item control-panel difficulty-panel">
      <span className="panel-title">Nível do mapa</span>
      <div className="difficulty-buttons">
        {Object.values(MAP_PRESETS).map((preset) => (
          <button
            key={preset.id}
            className={`custom-btn btn-search difficulty-btn ${state.mapDifficulty === preset.id ? 'active' : ''}`}
            onClick={() => {
              dispatch({ type: 'SET_DIFFICULTY', payload: preset.id });
              playSound('change_grid');
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className="difficulty-desc">
        {current?.description || 'Mapa personalizado com alturas variadas.'}
      </p>
      <p className="difficulty-meta">
        {state.gridSize.x}×{state.gridSize.y} · {state.numObstacles} obstáculos ·{' '}
        {state.maxElevation === 0
          ? '1 camada (mar plano)'
          : '3 camadas — Abismo, Mar e Recife'}
      </p>
    </div>
  );
}
