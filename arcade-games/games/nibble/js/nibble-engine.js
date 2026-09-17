// ==========================================
// Nibbles — Game Engine
// Pure game state and physics: snake movement, walls, food, level
// progression. No DOM access here - talks to the outside world only
// through the `ui` callbacks passed into the constructor, and exposes
// plain state (snake, food, gameMode, ...) for the renderer to read.
// ==========================================

import { NIBBLES_LEVELS } from './nibble-levels.js';

const NOOP_UI = {
  updateScore: () => {},
  setOverlay: () => {},
  setLevelHeaderText: () => {},
  setMainActionText: () => {},
  setStopButtonEnabled: () => {},
  setGameModeButtonText: () => {},
  setDropdownEnabled: () => {},
  setSelectedLevelDisplay: () => {},
};

const FOODS_TO_WIN = 10;

export class NibbleGame {
  constructor(canvasWidth, canvasHeight, ui = {}) {
    this.ui = { ...NOOP_UI, ...ui };

    this.WIDTH = canvasWidth;
    this.HEIGHT = canvasHeight;
    this.grid = 14;

    this.gameMode = 'levels'; // 'levels' | 'endless'
    this.selectedLevelKey = 'level1';
    this.levelFoodCount = 0;
    this.score = 0;

    this.snake = [{ x: 70, y: 70 }, { x: 56, y: 70 }, { x: 42, y: 70 }];
    this.dx = this.grid;
    this.dy = 0;
    this.food = { x: 140, y: 70 };

    this.isActive = false;
    this.isPaused = false;
    this.changingDirection = false;
    this.waitingForInput = false;

    this.generateFood();
  }

  getCurrentLevelData() {
    return NIBBLES_LEVELS.find(l => l.id === this.selectedLevelKey) || NIBBLES_LEVELS[0];
  }

  getWalls() {
    if (this.gameMode !== 'levels') return [];
    const lvl = this.getCurrentLevelData();
    return lvl && lvl.walls ? lvl.walls : [];
  }

  updateLEDDisplay() {
    if (this.isActive) {
      if (this.gameMode === 'endless') {
        this.ui.setLevelHeaderText('ENDLESS MODE');
      } else {
        const currentLevel = this.getCurrentLevelData();
        const levelIndex = NIBBLES_LEVELS.findIndex(l => l.id === this.selectedLevelKey) + 1;
        const levelNum = levelIndex > 0 ? levelIndex : 1;
        
        this.ui.setLevelHeaderText(`LEVEL ${levelNum}: ${currentLevel.fullName}`);
      }
    } else {
      this.ui.setLevelHeaderText('');
    }
  }

  setGameMode(mode) {
    if (this.isActive) return;
    this.gameMode = mode;
    this.ui.setGameModeButtonText(mode === 'endless' ? 'Endless' : 'Levels');
    this.ui.setDropdownEnabled(mode !== 'endless');

    if (mode === 'endless') {
      this.selectedLevelKey = 'level1';
      this.ui.setSelectedLevelDisplay('level1');
	  this.ui.setLevelHeaderText('ENDLESS MODE');
    } else {
      this.ui.setLevelHeaderText('');
    }

    this.generateFood();
  }

  setSelectedLevel(levelId) {
    if (this.isActive) return;
    this.selectedLevelKey = levelId;
    
	if (this.gameMode === 'levels') {
      const currentLevel = this.getCurrentLevelData();
      const levelIndex = NIBBLES_LEVELS.findIndex(l => l.id === levelId) + 1;
      const levelNum = levelIndex > 0 ? levelIndex : 1;
      this.ui.setLevelHeaderText(`LEVEL ${levelNum}: ${currentLevel.fullName}`);
    }
	
    this.generateFood();
  }

  isSpotClear(hx, hy, walls) {
    const segs = [
      { x: hx, y: hy },
      { x: hx - this.grid, y: hy },
      { x: hx - 2 * this.grid, y: hy }
    ];
    for (const seg of segs) {
      if (seg.x < 0 || seg.x >= this.WIDTH || seg.y < 0 || seg.y >= this.HEIGHT) return false;
      if (walls.some(w => w.x === seg.x && w.y === seg.y)) return false;
    }
    return true;
  }

  start() {
    const walls = this.getWalls();

    let startX = Math.round((this.WIDTH / 2) / this.grid) * this.grid;
    let startY = Math.round((this.HEIGHT / 2) / this.grid) * this.grid;

    if (!this.isSpotClear(startX, startY, walls)) {
      let found = false;
      for (let y = this.grid * 2; y < this.HEIGHT - this.grid * 2; y += this.grid) {
        for (let x = this.grid * 3; x < this.WIDTH - this.grid * 3; x += this.grid) {
          if (this.isSpotClear(x, y, walls)) {
            startX = x;
            startY = y;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    this.snake = [
      { x: startX, y: startY },
      { x: startX - this.grid, y: startY },
      { x: startX - 2 * this.grid, y: startY }
    ];
    this.dx = this.grid;
    this.dy = 0;
    this.waitingForInput = true;

    this.generateFood();
    this.score = 0;
    this.levelFoodCount = 0;
    this.isActive = true;
    this.isPaused = false;
    this.changingDirection = false;

    this.ui.setStopButtonEnabled(true);
    this.updateLEDDisplay();
    this.ui.setOverlay(false);
    this.ui.updateScore(this.score);
    this.ui.setMainActionText('Pause');
  }

  pause() {
    if (!this.isActive) return;
    this.isPaused = true;
    this.ui.setMainActionText('Resume');
    this.ui.setOverlay(true, 'PAUSED');
  }

  resume() {
    if (!this.isActive) return;
    this.isPaused = false;
    this.ui.setMainActionText('Pause');
    this.ui.setOverlay(false);
  }

  stop(message) {
    this.isActive = false;
    this.isPaused = false;
    this.ui.setMainActionText('Start');
    this.ui.setStopButtonEnabled(false);
    this.updateLEDDisplay();
    this.generateFood();
    this.ui.setOverlay(true, message);
  }

  setNextDirection(key) {
    if (!this.isActive || this.isPaused || this.changingDirection) return;
    if (this.waitingForInput) this.waitingForInput = false;

    const goingUp = this.dy === -this.grid;
    const goingDown = this.dy === this.grid;
    const goingRight = this.dx === this.grid;
    const goingLeft = this.dx === -this.grid;

    if (key === 'ArrowLeft' && !goingRight) { this.dx = -this.grid; this.dy = 0; this.changingDirection = true; }
    if (key === 'ArrowUp' && !goingDown) { this.dx = 0; this.dy = -this.grid; this.changingDirection = true; }
    if (key === 'ArrowRight' && !goingLeft) { this.dx = this.grid; this.dy = 0; this.changingDirection = true; }
    if (key === 'ArrowDown' && !goingUp) { this.dx = 0; this.dy = this.grid; this.changingDirection = true; }
  }

  generateFood() {
    const walls = this.getWalls();
    let validPosition = false;

    while (!validPosition) {
      this.food.x = Math.floor(Math.random() * (this.WIDTH / this.grid)) * this.grid;
      this.food.y = Math.floor(Math.random() * (this.HEIGHT / this.grid)) * this.grid;
      validPosition = true;

      for (const wall of walls) {
        if (this.food.x === wall.x && this.food.y === wall.y) {
          validPosition = false;
          break;
        }
      }
      if (validPosition) {
        for (const segment of this.snake) {
          if (this.food.x === segment.x && this.food.y === segment.y) {
            validPosition = false;
            break;
          }
        }
      }
    }
  }

  tick() {
    if (!this.isActive || this.isPaused || this.waitingForInput) return;
    this.changingDirection = false;

    const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };

    if (head.x < 0 || head.x >= this.WIDTH || head.y < 0 || head.y >= this.HEIGHT) {
      this.stop('Game Over!<br>Play Again?');
      return;
    }

    const walls = this.getWalls();
    for (const wall of walls) {
      if (head.x === wall.x && head.y === wall.y) {
        this.stop('Game Over! Hit a Wall!');
        return;
      }
    }

    for (const segment of this.snake) {
      if (head.x === segment.x && head.y === segment.y) {
        this.stop('Game Over! Play Again?');
        return;
      }
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.levelFoodCount++;
      this.ui.updateScore(this.score);

      if (this.gameMode === 'levels' && this.levelFoodCount >= FOODS_TO_WIN) {
        const currentIndex = NIBBLES_LEVELS.findIndex(l => l.id === this.selectedLevelKey);

        if (currentIndex < NIBBLES_LEVELS.length - 1) {
          const nextLevel = NIBBLES_LEVELS[currentIndex + 1];
          this.selectedLevelKey = nextLevel.id;
          this.levelFoodCount = 0;
          this.ui.setSelectedLevelDisplay(nextLevel.id);
          this.stop(`Level Cleared! Next: ${nextLevel.fullName}`);
          return;
        } else {
          this.stop('Victory! All levels complete!');
          return;
        }
      }

      this.generateFood();
    } else {
      this.snake.pop();
    }
  }
}