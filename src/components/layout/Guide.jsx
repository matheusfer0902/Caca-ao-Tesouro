export function Guide() {
  return (
    <label className="guide" htmlFor="guide">
      Ahoy, companheiro pirata!
      <br />
      <br />
      Escolha um ponto de partida e destino clicando no grid 3D abaixo.
      <br />
      <br />
      O <strong>BFS</strong> encontra o caminho com menor número de passos.
      <br />
      O <strong>DFS</strong> encontra um caminho válido, mas não necessariamente o mais curto.
      <br />
      <br />
      Observe a animação passo a passo: fila (BFS) vs pilha (DFS).
    </label>
  );
}
