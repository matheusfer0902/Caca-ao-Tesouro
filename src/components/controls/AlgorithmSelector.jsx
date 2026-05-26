import { useGame } from '@/context/GameContext.jsx';

export function AlgorithmSelector() {
  const { state, dispatch } = useGame();

  return (
    <div className="item control-panel">
      <label htmlFor="search-mode">Modo de busca:</label>
      <select
        id="search-mode"
        value={state.algorithm}
        onChange={(e) => dispatch({ type: 'SET_ALGORITHM', payload: e.target.value })}
        disabled={state.phase === 'searching'}
      >
        <option value="bfs">BFS (fila — caminho mínimo)</option>
        <option value="dfs">DFS (pilha — qualquer caminho)</option>
      </select>
    </div>
  );
}
