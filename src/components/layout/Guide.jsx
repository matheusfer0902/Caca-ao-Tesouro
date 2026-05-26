export function Guide() {
  return (
    <label className="guide" htmlFor="guide">
      Ahoy, companheiro pirata!
      <br />
      <br />
      Configure a expedição no porto, depois zarpamos para o oceano 3D.
      <br />
      <br />
      Cada <strong>profundidade</strong> é um recife: do Abismo (escuro) à Superfície (claro). Correntes de
      bolhas ligam camadas vizinhas.
      <br />
      <br />
      O <strong>BFS</strong> encontra o caminho com menos passos. O <strong>DFS</strong> encontra um caminho
      válido, mas não necessariamente o mais curto.
    </label>
  );
}
