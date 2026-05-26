export const MAX_GRID = 20;
export const DEFAULT_GRID_SIZE = 10;
export const DEFAULT_OBSTACLES = 20;
export const MIN_ANIMATION_SPEED = 50;
export const MAX_ANIMATION_SPEED = 1000;
export const DEFAULT_ANIMATION_SPEED = 200;

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

export const COLORS = {
  water: '#06283d',
  tile: '#088395',
  tileVisited: '#0a4d68',
  tileFrontier: '#00ffca',
  tileCurrent: '#fce22a',
  tilePath: '#ffdb89',
  obstacle: '#906821',
  start: '#16ff00',
  end: '#16ff00',
};

export const OBSTACLE_TEXTURES = {
  1: 'https://creazilla-store.fra1.digitaloceanspaces.com/emojis/44370/desert-island-emoji-clipart-xl.png',
  2: 'https://images.squarespace-cdn.com/content/v1/5c86919db7c92c1344bc8064/1679642191387-KW94VVQ51MF8VH5BRCNV/goldNuggitX3.gif?format=1500w',
  3: 'https://images.squarespace-cdn.com/content/v1/5c86919db7c92c1344bc8064/1679642329768-R7J9PRUDJUJKW3BYPCDQ/babkyKraken.gif?format=1500w',
  4: 'https://thumbs.gfycat.com/AccomplishedOldfashionedHeron-max-1mb.gif',
};
