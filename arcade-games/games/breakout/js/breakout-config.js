export const GAME_CONFIG = {
  // Initial Game Rules
  initialLives: 3,
  pointsPerTypeMultiplier: 10,

  // Paddle Defaults
  paddle: {
    width: 50,
    height: 6,
    speed: 25,
    color: '#b5be8a',
    stickyColor: '#4ecdc4',
    expandedWidth: 85,
    shrunkWidth: 35
  },

  // Ball Defaults
  ball: {
    radius: 6,
    baseSpeedX: 3,
    baseSpeedY: -3,
    color: '#ffffff'
  },

  // Brick Layout & Physics
  bricks: {
    padding: 6,
    height: 14,
    sidePadding: 10,
    topOffset: 25
  },

  // Power-Up Drops Settings
  powerups: {
    dropChance: 0.35,
    fallSpeed: 1.8,
    width: 14,
    height: 14,
    duration: 8000
  }
};

export const POWERUP_TYPES = {
  STICKY: {
    id: 'STICKY',
    label: 'C',
    color: '#4ecdc4',
    weight: 25,
    onCollect: (game) => game.activateSticky()
  },
  GROW: {
    id: 'GROW',
    label: 'W',
    color: '#2ecc71',
    weight: 25,
    onCollect: (game) => game.setPaddleWidth(GAME_CONFIG.paddle.expandedWidth, GAME_CONFIG.powerups.duration)
  },
  SHRINK: {
    id: 'SHRINK',
    label: 'S-',
    color: '#e74c3c',
    weight: 20,
    onCollect: (game) => game.setPaddleWidth(GAME_CONFIG.paddle.shrunkWidth, GAME_CONFIG.powerups.duration)
  },
  MULTIBALL: {
    id: 'MULTIBALL',
    label: '3x',
    color: '#f1c40f',
    weight: 15,
    onCollect: (game) => game.spawnExtraBalls(2)
  },
  EXTRA_LIFE: {
    id: 'EXTRA_LIFE',
    label: 'L',
    color: '#e84393',
    weight: 15,
    onCollect: (game) => game.addLife(1)
  }
};