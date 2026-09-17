// ==========================================
// Breakout — Game Engine
// Pure game state and physics: paddle, balls, bricks, power-ups, level
// progression. No DOM access here - talks to the outside world only
// through the `ui` callbacks passed into the constructor, and exposes
// plain state (paddle, balls, bricks, powerups, ...) for the renderer
// to read.
// ==========================================

import { GAME_CONFIG, POWERUP_TYPES } from './breakout-config.js';
import { BREAKOUT_LEVELS, BREAKOUT_LEVEL_NAMES } from './breakout-layouts.js';

const NOOP_UI = {
  updateScore: () => {},
  updateLives: () => {},
  setOverlay: () => {},
  setGameState: () => {},
  setStatusText: () => {},
  setLevelHeaderText: () => {},
  setSelectedLevel: () => {},
};

function getRandomPowerupType() {
  const types = Object.values(POWERUP_TYPES);
  const totalWeight = types.reduce((acc, p) => acc + p.weight, 0);
  let random = Math.random() * totalWeight;
  for (const type of types) {
    if (random < type.weight) return type;
    random -= type.weight;
  }
  return types[0];
}

export function getLevelDisplayName(lvlIndex) {
  const name = BREAKOUT_LEVEL_NAMES[lvlIndex];
  return name ? `LEVEL ${lvlIndex + 1}: ${name}` : `LEVEL ${lvlIndex + 1}`;
}

export class BreakoutGame {
  constructor(canvasWidth, canvasHeight, ui = {}) {
    this.ui = { ...NOOP_UI, ...ui };

    this.WIDTH = canvasWidth;
    this.HEIGHT = canvasHeight;

    this.score = 0;
    this.lives = GAME_CONFIG.initialLives;
    this.currentLevel = 0;
    this.gameState = 'stopped'; // 'stopped' | 'playing' | 'paused'

    this.paddle = {
      x: canvasWidth / 2 - GAME_CONFIG.paddle.width / 2,
      y: canvasHeight - 20,
      width: GAME_CONFIG.paddle.width,
      height: GAME_CONFIG.paddle.height,
      isSticky: false,
      stickyTimer: null,
      widthTimer: null
    };

    this.balls = [];
    this.bricks = [];
    this.powerups = [];
  }

  activateSticky() {
    this.paddle.isSticky = true;
    clearTimeout(this.paddle.stickyTimer);
    this.paddle.stickyTimer = setTimeout(() => {
      this.paddle.isSticky = false;
    }, GAME_CONFIG.powerups.duration);
  }

  setPaddleWidth(newWidth, duration) {
    this.paddle.width = newWidth;
    this.clampPaddlePosition();
    this.balls.forEach(b => {
      if (b.isStuck) b.stuckOffsetX = Math.min(b.stuckOffsetX, newWidth);
    });

    clearTimeout(this.paddle.widthTimer);
    this.paddle.widthTimer = setTimeout(() => {
      this.paddle.width = GAME_CONFIG.paddle.width;
      this.clampPaddlePosition();
    }, duration);
  }

  spawnExtraBalls(count) {
    const baseBall = this.balls[0] || { x: this.paddle.x + this.paddle.width / 2, y: this.paddle.y - GAME_CONFIG.ball.radius };
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) / 3 + Math.PI / 3;
      this.balls.push({
        x: baseBall.x,
        y: baseBall.y,
        radius: GAME_CONFIG.ball.radius,
        speedX: Math.cos(angle) * 4 * (i % 2 === 0 ? 1 : -1),
        speedY: -Math.abs(Math.sin(angle) * 4),
        isStuck: false,
        stuckOffsetX: 0
      });
    }
  }

  addLife(amount) {
    this.lives += amount;
    this.ui.updateLives(this.lives);
  }

  clampPaddlePosition() {
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x > this.WIDTH - this.paddle.width) this.paddle.x = this.WIDTH - this.paddle.width;
  }

  resetPaddlePowerups() {
    clearTimeout(this.paddle.stickyTimer);
    clearTimeout(this.paddle.widthTimer);
    this.paddle.isSticky = false;
    this.paddle.width = GAME_CONFIG.paddle.width;
  }

  loadLevel(levelIndex) {
    this.currentLevel = levelIndex;
    this.ui.setSelectedLevel(levelIndex);
    this.bricks = [];
    this.powerups = [];
    this.resetPaddlePowerups();

    const layout = BREAKOUT_LEVELS[levelIndex] || BREAKOUT_LEVELS[0];
    const rows = layout.length;
    const cols = layout[0].length;
    const padding = GAME_CONFIG.bricks.padding;
    const totalWidth = this.WIDTH - (GAME_CONFIG.bricks.sidePadding * 2);
    const brickWidth = (totalWidth - (padding * (cols - 1))) / cols;
    const brickHeight = GAME_CONFIG.bricks.height;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const type = layout[r][c];
        if (type > 0) {
          this.bricks.push({
            x: GAME_CONFIG.bricks.sidePadding + c * (brickWidth + padding),
            y: GAME_CONFIG.bricks.topOffset + r * (brickHeight + padding),
            width: brickWidth,
            height: brickHeight,
            status: 1,
            type
          });
        }
      }
    }
    this.resetBallAndPaddle();
  }

  resetBallAndPaddle() {
    this.paddle.x = this.WIDTH / 2 - this.paddle.width / 2;
    this.balls = [{
      x: this.paddle.x + this.paddle.width / 2,
      y: this.paddle.y - GAME_CONFIG.ball.radius,
      radius: GAME_CONFIG.ball.radius,
      speedX: 0,
      speedY: 0,
      isStuck: true,
      stuckOffsetX: this.paddle.width / 2
    }];
  }

  launchBall() {
    if (this.gameState !== 'playing') return;
    this.balls.forEach(b => {
      if (b.isStuck) {
        b.isStuck = false;
        b.speedX = GAME_CONFIG.ball.baseSpeedX * (Math.random() > 0.5 ? 1 : -1);
        b.speedY = GAME_CONFIG.ball.baseSpeedY;
      }
    });
  }

  movePaddle(amount) {
    if (this.gameState !== 'playing') return;
    this.paddle.x += amount;
    this.clampPaddlePosition();
  }

  movePaddleTo(x) {
    if (this.gameState !== 'playing') return;
    this.paddle.x = x - this.paddle.width / 2;
    this.clampPaddlePosition();
  }

  start(levelIndex) {
    this.score = 0;
    this.lives = GAME_CONFIG.initialLives;
    this.ui.updateScore(this.score);
    this.ui.updateLives(this.lives);

    this.loadLevel(levelIndex);

    this.gameState = 'playing';
    this.ui.setGameState('playing');
    this.ui.setOverlay(false);
    this.ui.setLevelHeaderText(getLevelDisplayName(this.currentLevel));
  }

  pause() {
    if (this.gameState !== 'playing') return;
    this.gameState = 'paused';
    this.ui.setGameState('paused');
    this.ui.setOverlay(true, 'PAUSED', false);
  }

  resume() {
    if (this.gameState !== 'paused') return;
    this.gameState = 'playing';
    this.ui.setGameState('playing');
    this.ui.setOverlay(false);
  }

  stop(levelIndexToShow) {
    this.gameState = 'stopped';
    this.resetPaddlePowerups();
    this.ui.setGameState('stopped');
    this.ui.setStatusText('');
    this.ui.setLevelHeaderText('');
    this.loadLevel(levelIndexToShow);
    this.ui.setOverlay(true, 'PRESS START TO PLAY!', true);
  }

  tick() {
    if (this.gameState !== 'playing') return;

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];

      if (b.isStuck) {
        b.x = this.paddle.x + b.stuckOffsetX;
        b.y = this.paddle.y - b.radius;
        continue;
      }

      b.x += b.speedX;
      b.y += b.speedY;

      if (b.x - b.radius < 0) {
        b.x = b.radius;
        b.speedX *= -1;
      } else if (b.x + b.radius > this.WIDTH) {
        b.x = this.WIDTH - b.radius;
        b.speedX *= -1;
      }

      if (b.y - b.radius < 0) {
        b.y = b.radius;
        b.speedY *= -1;
      }

      if (
        b.y + b.radius >= this.paddle.y &&
        b.x >= this.paddle.x &&
        b.x <= this.paddle.x + this.paddle.width
      ) {
        if (this.paddle.isSticky) {
          b.isStuck = true;
          b.stuckOffsetX = b.x - this.paddle.x;
          b.speedX = 0;
          b.speedY = 0;
        } else {
          let hitPoint = b.x - (this.paddle.x + this.paddle.width / 2);
          b.speedX = hitPoint * 0.15;
          b.speedY = -Math.abs(b.speedY);
          b.y = this.paddle.y - b.radius;
        }
      }

      if (b.y + b.radius > this.HEIGHT) {
        this.balls.splice(i, 1);
      }
    }

    if (this.balls.length === 0) {
      this.lives--;
      this.ui.updateLives(this.lives);
      if (this.lives <= 0) {
        this.gameState = 'stopped';
        this.resetPaddlePowerups();
        this.ui.setGameState('stopped');
        this.ui.setStatusText('');
        
        this.ui.setLevelHeaderText(`SCORE: ${this.score}`);
        
        this.ui.setOverlay(true, 'GAME OVER', false);
        return;
      } else {
        this.resetBallAndPaddle();
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += GAME_CONFIG.powerups.fallSpeed;

      if (
        p.y + p.height >= this.paddle.y &&
        p.x + p.width >= this.paddle.x &&
        p.x <= this.paddle.x + this.paddle.width
      ) {
        p.type.onCollect(this);
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.y > this.HEIGHT) {
        this.powerups.splice(i, 1);
      }
    }

    let activeBricksCount = 0;
    this.bricks.forEach(b => {
      if (b.status === 1) {
        activeBricksCount++;
        this.balls.forEach(ball => {
          if (
            ball.x > b.x &&
            ball.x < b.x + b.width &&
            ball.y > b.y &&
            ball.y < b.y + b.height
          ) {
            ball.speedY *= -1;
            b.status = 0;
            this.score += b.type * GAME_CONFIG.pointsPerTypeMultiplier;
            this.ui.updateScore(this.score);

            if (Math.random() < GAME_CONFIG.powerups.dropChance) {
              this.powerups.push({
                x: b.x + b.width / 2 - GAME_CONFIG.powerups.width / 2,
                y: b.y,
                width: GAME_CONFIG.powerups.width,
                height: GAME_CONFIG.powerups.height,
                type: getRandomPowerupType()
              });
            }
          }
        });
      }
    });

    if (activeBricksCount === 0) {
      if (this.currentLevel + 1 < BREAKOUT_LEVELS.length) {
        this.currentLevel++;
        this.ui.setSelectedLevel(this.currentLevel);
        this.ui.setLevelHeaderText(getLevelDisplayName(this.currentLevel));
        this.loadLevel(this.currentLevel);
      } else {
        this.gameState = 'stopped';
        this.resetPaddlePowerups();
        this.ui.setGameState('stopped');
        this.ui.setStatusText('');
        
        this.ui.setLevelHeaderText(`WINNER - SCORE: ${this.score}`);
        
        this.ui.setOverlay(true, 'VICTORY!', true);
      }
    }
  }
}