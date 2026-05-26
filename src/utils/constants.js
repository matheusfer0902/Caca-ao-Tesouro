export const MAX_GRID = 20;
export const DEFAULT_GRID_SIZE = 10;
export const DEFAULT_OBSTACLES = 20;
export const MIN_ANIMATION_SPEED = 50;
export const MAX_ANIMATION_SPEED = 1000;
export const DEFAULT_ANIMATION_SPEED = 200;
/** Intervalo fixo do navio na rota final (independente da velocidade da busca) */
export const SHIP_ROUTE_STEP_MS = 380;

export const ELEVATION_UNIT = 0.95;
export const PLATFORM_THICKNESS = 0.14;
export const WATER_LEVEL = 0;
export const TILE_RADIUS = 0.48;

export const DEFAULT_DIFFICULTY = 'medium';

export const CELL_TYPES = {
  EMPTY: 'empty',
  OBSTACLE: 'obstacle',
  START: 'start',
  END: 'end',
};

export const SEARCH_STATUS = {
  IDLE: 'idle',
  FRONTIER: 'frontier',
  VISITED: 'visited',
  CURRENT: 'current',
  PATH: 'path',
};

export const GAME_PHASES = {
  IDLE: 'idle',
  SELECTING_END: 'selecting_end',
  SEARCHING: 'searching',
  FOUND: 'found',
  NO_PATH: 'no_path',
};

export const APP_SCREENS = {
  SETUP: 'setup',
  SIMULATION: 'simulation',
};

export const COLORS = {
  water: '#041f30',
  waterDeep: '#06283d',
  tileVisited: '#0a4d68',
  tileFrontier: '#00ffca',
  tileCurrent: '#fce22a',
  tilePath: '#ffdb89',
  obstacle: '#cd8f2b',
  start: '#4ade80',
  end: '#4ade80',
};

/** Número de camadas marinhas principais (Abismo → Mar → Recife) */
export const CORE_MARINE_DEPTH_LEVELS = 3;

/** Profundidades do mar — quanto maior elevation, mais raso (mais perto da superfície) */
export const DEPTH_ZONES = [
  {
    level: 0,
    name: 'Abismo',
    icon: '🌑',
    platform: '#0a4d68',
    glow: '#043a44',
    water: '#021a24',
    waterOpacity: 0.55,
  },
  {
    level: 1,
    name: 'Mar',
    icon: '🫧',
    platform: '#088395',
    glow: '#065a6a',
    water: '#06283d',
    waterOpacity: 0.45,
  },
  {
    level: 2,
    name: 'Recife',
    icon: '🪸',
    platform: '#1ab8c4',
    glow: '#0aa8be',
    water: '#0a4d68',
    waterOpacity: 0.35,
  },
  {
    level: 3,
    name: 'Raso',
    icon: '💧',
    platform: '#4dd4e8',
    glow: '#00d4aa',
    water: '#088395',
    waterOpacity: 0.28,
  },
  {
    level: 4,
    name: 'Superfície',
    icon: '🌊',
    platform: '#8ed2f8',
    glow: '#00ffca',
    water: '#0cbec5',
    waterOpacity: 0.2,
  },
];

/** Pesos por profundidade (0=Abismo, 1=Mar, 2=Recife); somam ~1 */
export const DEFAULT_DEPTH_WEIGHTS = { 0: 0.25, 1: 0.5, 2: 0.25 };

export const MAP_PRESETS = {
  easy: {
    id: 'easy',
    label: 'Calmo',
    description: 'Quase todo o mapa no Mar — poucos trechos de Abismo e Recife.',
    gridSize: 8,
    numObstacles: 6,
    maxElevation: 2,
    smoothPasses: 0,
    depthWeights: { 0: 0.04, 1: 0.92, 2: 0.04 },
  },
  medium: {
    id: 'medium',
    label: 'Ondas',
    description: 'Mar predominante, com mais recifes e fossos espalhados.',
    gridSize: 10,
    numObstacles: 16,
    maxElevation: 2,
    smoothPasses: 1,
    depthWeights: { 0: 0.22, 1: 0.56, 2: 0.22 },
  },
  hard: {
    id: 'hard',
    label: 'Tempestade',
    description: 'Abismo, Mar e Recife bem distribuídos — rotas mais complexas.',
    gridSize: 12,
    numObstacles: 28,
    maxElevation: 2,
    smoothPasses: 0,
    depthWeights: { 0: 0.33, 1: 0.34, 2: 0.33 },
  },
  expert: {
    id: 'expert',
    label: 'Abismo',
    description: 'Mapa vasto com as três camadas igualmente presentes.',
    gridSize: 14,
    numObstacles: 42,
    maxElevation: 2,
    smoothPasses: 0,
    depthWeights: { 0: 0.34, 1: 0.33, 2: 0.33 },
  },
};

export const OBSTACLE_TEXTURES = {
  1: 'https://creazilla-store.fra1.digitaloceanspaces.com/emojis/44370/desert-island-emoji-clipart-xl.png',
  2: 'https://images.squarespace-cdn.com/content/v1/5c86919db7c92c1344bc8064/1679642191387-KW94VVQ51MF8VH5BRCNV/goldNuggitX3.gif?format=1500w',
  3: 'https://images.squarespace-cdn.com/content/v1/5c86919db7c92c1344bc8064/1679642329768-R7J9PRUDJUJKW3BYPCDQ/babkyKraken.gif?format=1500w',
  4: 'https://thumbs.gfycat.com/AccomplishedOldfashionedHeron-max-1mb.gif',
};
