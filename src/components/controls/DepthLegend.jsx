import { useGame } from '@/context/GameContext.jsx';
import { CORE_MARINE_DEPTH_LEVELS, DEPTH_ZONES } from '@/utils/constants.js';

export function DepthLegend() {
  const { state } = useGame();
  const levels =
    state.maxElevation === 0
      ? [0]
      : Array.from(
          { length: Math.min(CORE_MARINE_DEPTH_LEVELS, state.maxElevation + 1) },
          (_, i) => i
        );

  if (state.maxElevation === 0) {
    return (
      <div className="item control-panel depth-legend">
        <span className="panel-title">Profundidades</span>
        <p className="depth-legend-note">Mar plano — um único fundo oceânico.</p>
      </div>
    );
  }

  return (
    <div className="item control-panel depth-legend">
      <span className="panel-title">Camadas do mar</span>
      <p className="depth-legend-note">
        Abismo (fundo), Mar (meio) e Recife (raso). Bolhas ligam profundidades vizinhas no grafo.
      </p>
      <ul className="depth-legend-list">
        {levels.map((level) => {
          const zone = DEPTH_ZONES[Math.min(level, DEPTH_ZONES.length - 1)];
          return (
            <li key={level} className="depth-legend-item">
              <span
                className="depth-swatch"
                style={{ background: zone.platform, boxShadow: `0 0 8px ${zone.glow}` }}
              />
              <span>
                {zone.icon} {zone.name}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
