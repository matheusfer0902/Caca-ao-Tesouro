export function Guide() {
  return (
    <label className="guide" htmlFor="guide">
      Ahoy, companheiro pirata!
      <br />
      <br />
      Configure a expedição no porto, depois zarpamos para o oceano 3D.
      <br />
      <br />
      Cada <strong>profundidade</strong> é um recife: do Abismo (escuro) à Superfície (claro). Para mudar de
      nível, use só as <strong>correntes de bolhas</strong>; no mesmo fundo, navegue entre vizinhos.
      <br />
      <br />
      O <strong>BFS</strong> encontra o caminho com menos passos. O <strong>DFS</strong> encontra um caminho
      válido, mas não necessariamente o mais curto. Se não houver rota, o mapa avisa com clareza.
    </label>
  );
}
