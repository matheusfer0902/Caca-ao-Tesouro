import { useGame } from '@/context/GameContext.jsx';
import { formatElapsed } from '@/utils/formatElapsed.js';

export function ComparisonTimer({ side }) {
  const { state } = useGame();
  const timer = state.compare?.timers?.[side];

  if (!timer) return null;

  const running = timer.isRunning && !timer.completed && state.animation.isPlaying;

  return (
    <div className={`comparison-timer ${running ? 'comparison-timer--running' : ''}`}>
      <span className="comparison-timer-label">Tempo</span>
      <span className="comparison-timer-value">{formatElapsed(timer.elapsedMs)}</span>
    </div>
  );
}
