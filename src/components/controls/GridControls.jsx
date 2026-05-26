import { useState } from 'react';
import { useGame } from '@/context/GameContext.jsx';
import { MAX_GRID } from '@/utils/constants.js';

export function GridControls() {
  const { state, dispatch, playSound } = useGame();
  const [obstacles, setObstacles] = useState(state.numObstacles);
  const [sizeX, setSizeX] = useState(state.gridSize.x);
  const [sizeY, setSizeY] = useState(state.gridSize.y);

  const maxObstacles = state.gridSize.x * state.gridSize.y;

  return (
    <div className="controls-group">
      <div className="item control-panel">
        <label htmlFor="num-obstacles">Número de obstáculos:</label>
        <input
          id="num-obstacles"
          type="number"
          min="0"
          max={maxObstacles}
          value={obstacles}
          onChange={(e) => setObstacles(Math.min(Number(e.target.value), maxObstacles))}
        />
        <button
          className="custom-btn btn-search"
          onClick={() => {
            dispatch({ type: 'SET_OBSTACLES', payload: obstacles });
            playSound('restart');
          }}
        >
          Confirmar
        </button>
        <button
          className="custom-btn btn-search"
          onClick={() => {
            dispatch({ type: 'SHUFFLE' });
            playSound('restart');
          }}
        >
          Embaralhar Obstáculos
        </button>
      </div>

      <div className="item control-panel">
        <div>
          <label htmlFor="grid-size-x">Tamanho X:</label>
          <input
            id="grid-size-x"
            type="number"
            min="1"
            max={MAX_GRID}
            value={sizeX}
            onChange={(e) => setSizeX(Math.min(Number(e.target.value), MAX_GRID))}
          />
        </div>
        <div>
          <label htmlFor="grid-size-y">Tamanho Y:</label>
          <input
            id="grid-size-y"
            type="number"
            min="1"
            max={MAX_GRID}
            value={sizeY}
            onChange={(e) => setSizeY(Math.min(Number(e.target.value), MAX_GRID))}
          />
        </div>
        <button
          className="custom-btn btn-search"
          onClick={() => {
            dispatch({ type: 'RESIZE_GRID', payload: { x: sizeX, y: sizeY } });
            playSound('change_grid');
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
