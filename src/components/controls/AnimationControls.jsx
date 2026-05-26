import { useSearchAnimation } from '@/hooks/useSearchAnimation.js';
import { useGame } from '@/context/GameContext.jsx';
import { MIN_ANIMATION_SPEED, MAX_ANIMATION_SPEED, GAME_PHASES } from '@/utils/constants.js';

export function AnimationControls() {
  const { state, dispatch } = useGame();
  const { togglePlay, stepForward, isSearching } = useSearchAnimation();

  const resetCamera = () => {
    window.dispatchEvent(new CustomEvent('reset-camera'));
  };

  const locked = state.phase === GAME_PHASES.FOUND || state.phase === GAME_PHASES.NO_PATH;

  return (
    <div className="item control-panel animation-controls">
      <span className="panel-title">Controle da busca</span>
      <div className="anim-buttons">
        <button
          className="custom-btn btn-search"
          onClick={togglePlay}
          disabled={!isSearching || locked}
        >
          {state.animation.isPlaying ? 'Pausar' : 'Play'}
        </button>
        <button
          className="custom-btn btn-search"
          onClick={stepForward}
          disabled={!isSearching || locked}
        >
          +1 Passo
        </button>
      </div>
      <button className="custom-btn btn-search" onClick={resetCamera}>
        Reset Câmera
      </button>
      <label htmlFor="speed-slider">Velocidade: {state.animation.speed}ms/passo</label>
      <input
        id="speed-slider"
        type="range"
        min={MIN_ANIMATION_SPEED}
        max={MAX_ANIMATION_SPEED}
        step={50}
        value={state.animation.speed}
        disabled={locked}
        onChange={(e) => dispatch({ type: 'SET_SPEED', payload: Number(e.target.value) })}
      />
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: state.animation.totalSteps
              ? `${(state.animation.currentStep / state.animation.totalSteps) * 100}%`
              : `${Math.min(state.animation.currentStep * 2, 100)}%`,
          }}
        />
      </div>
      <span className="step-label">Passos executados: {state.animation.currentStep}</span>
    </div>
  );
}
