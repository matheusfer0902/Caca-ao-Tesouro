# Caça ao Tesouro 3D

**Conteúdo da Disciplina**: Grafos 1

## Sobre

Simulador interativo de busca cega em grade 3D. O usuário posiciona um navio (início) e um tesouro (destino) no mapa, e o programa executa **BFS** ou **DFS** com animação passo a passo, mostrando fronteira, nós visitados e caminho final.

- **BFS (Breadth First Search)**: usa fila e encontra o caminho com **menor número de passos**.
- **DFS (Depth First Search)**: usa pilha e encontra **um caminho válido**, não necessariamente o mais curto.

## Stack

- [Vite](https://vitejs.dev/) — build e dev server
- [React 19](https://react.dev/)
- [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) + [Drei](https://github.com/pmndrs/drei)

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

Abra a URL exibida no terminal (geralmente `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

Os arquivos estáticos ficam em `dist/`.

## Deploy (GitHub Pages)

O `vite.config.js` usa `base: './'` para paths relativos. Após o build, publique o conteúdo de `dist/`.

## Uso

1. Clique em uma célula livre para posicionar o **navio** (início).
2. Clique em outra célula livre para posicionar o **tesouro** (destino).
3. A busca inicia automaticamente com animação passo a passo.
4. Use **Play/Pausa**, **+1 Passo** e o slider de velocidade para controlar a animação.
5. Alterne entre **BFS** e **DFS** para comparar fila vs pilha.
6. Ajuste obstáculos, embaralhe o mapa ou redimensione o grid (máx. 20×20).

## Estrutura do projeto

```
src/
├── algorithms/     # BFS, DFS e utilitários de grafo (lógica pura)
├── components/     # UI React e cena 3D (R3F)
├── context/        # GameContext (useReducer)
├── hooks/          # Animação, áudio, navio
├── styles/         # Tema pirata
└── utils/          # Constantes e visuals
legacy/             # Versão original HTML/CSS/JS
public/assets/      # Áudio e imagens
```

## Outros

Projeto acadêmico — FGA-UnB, Projeto de Algoritmos (Grafos 1).  
Versão 2.0: refatoração 3D com visualização pedagógica da execução dos algoritmos.
