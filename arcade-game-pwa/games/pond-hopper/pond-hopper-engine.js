// ==========================================
// Pond Hopper — Game Engine
// Pure game state and physics: frog, obstacles, insects, home slots,
// collisions. No DOM access here - talks to the outside world only
// through the `ui` callbacks passed into the constructor, and exposes
// plain state (frog, obstacles, insect, ...) for the renderer to read.
// ==========================================

const NOOP_UI = {
  updateScore: () => {},
  updateLives: () => {},
  setOverlay: () => {},
  setMainActionText: () => {},
  setStopButtonEnabled: () => {},
  setColorButtonText: () => {},
};

export const FROG_COLORS = [
  { name: 'Sir Hopper', primary: '#b5be8a', shadow: '#8f9862', highlight: '#c7d09c' },
  { name: 'Dart Blue', primary: '#4a90e2', shadow: '#2c5282', highlight: '#63b3ed' },
  { name: 'Red Killer', primary: '#e53e3e', shadow: '#9b2c2c', highlight: '#fc8181' },
  { name: 'Shy Hopper', primary: '#805ad5', shadow: '#553c9a', highlight: '#b794f4' },
  { name: 'Poisonous', primary: '#ecc94b', shadow: '#b7791f', highlight: '#f6e05e' },
  { name: 'Barbie', primary: '#d53f8c', shadow: '#97266d', highlight: '#fbb6ce' },
  { name: 'Dark Vader', primary: '#1a1a1a', shadow: '#0d0d0d', highlight: '#404040' },
  { name: '404: Frog Not Found', primary: 'transparent', shadow: 'rgba(181, 190, 138, 0.4)', highlight: 'transparent', invisible: true }
];

export class PondHopperGame {
  constructor(canvasWidth, canvasHeight, ui = {}) {
    this.ui = { ...NOOP_UI, ...ui };

    this.WIDTH = canvasWidth;
    this.HEIGHT = canvasHeight;
    this.GRID = 16;
    this.COLS = 17;
    this.ROWS = 15;

    this.colorIndex = 0;
    this.score = 0;
    this.lives = 3;
    this.gameState = 'STOPPED'; // 'STOPPED' | 'RUNNING' | 'PAUSED'
    this.waveOffset = 0;

    this.frog = {
      x: Math.floor(this.COLS / 2) * this.GRID,
      y: (this.ROWS - 1) * this.GRID,
      width: 14,
      height: 14
    };

    this.insect = { active: false, row: 0, x: 0, timer: 0, type: 'fly' };

    this.obstacles = [
      { row: 1, x: 20, width: 48, speed: 1.2, type: 'log' },
      { row: 1, x: 120, width: 64, speed: 1.2, type: 'log' },
      { row: 2, x: 0, width: 32, speed: -1.5, type: 'turtle' },
      { row: 2, x: 90, width: 32, speed: -1.5, type: 'turtle' },
      { row: 3, x: 50, width: 80, speed: 0.9, type: 'log' },
      { row: 4, x: 10, width: 40, speed: -1.8, type: 'log' },
      { row: 5, x: 30, width: 60, speed: 1.3, type: 'log' },
      { row: 7, x: 10, width: 24, speed: -1.5, type: 'car' },
      { row: 7, x: 140, width: 24, speed: -1.5, type: 'car' },
      { row: 8, x: 40, width: 48, speed: 2.0, type: 'truck' },
      { row: 9, x: 80, width: 24, speed: -2.5, type: 'car' },
      { row: 10, x: 20, width: 32, speed: 1.5, type: 'car' },
      { row: 11, x: 100, width: 40, speed: -2.0, type: 'truck' }
    ];

    this.homeSlots = [false, false, false, false, false];
    this.homeSlotXCoords = [24, 76, 128, 180, 232];
  }

  getCurrentColor() {
    return FROG_COLORS[this.colorIndex];
  }

  cycleColor() {
    this.colorIndex = (this.colorIndex + 1) % FROG_COLORS.length;
    const color = this.getCurrentColor();
    this.ui.setColorButtonText(color.name);
    return color;
  }

  resetFrog() {
    this.frog.x = Math.floor(this.COLS / 2) * this.GRID;
    this.frog.y = (this.ROWS - 1) * this.GRID;
  }

  spawnInsect() {
    if (this.insect.active) return;
    const safeRows = [6, 12, 13, 14];
    const types = ['fly', 'butterfly', 'firefly'];

    this.insect.row = safeRows[Math.floor(Math.random() * safeRows.length)];
    this.insect.x = Math.floor(Math.random() * (this.COLS - 2) + 1) * this.GRID;
    this.insect.type = types[Math.floor(Math.random() * types.length)];
    this.insect.active = true;
    this.insect.timer = 150; // ~5 seconds at 30 ticks/sec
  }

  moveFrog(dir) {
    if (this.gameState !== 'RUNNING') return;
    if (dir === 'up' && this.frog.y > 0) this.frog.y -= this.GRID;
    if (dir === 'down' && this.frog.y < (this.ROWS - 1) * this.GRID) this.frog.y += this.GRID;
    if (dir === 'left' && this.frog.x > 0) this.frog.x -= this.GRID;
    if (dir === 'right' && this.frog.x < this.WIDTH - this.GRID) this.frog.x += this.GRID;
  }

  loseLife() {
    this.lives--;
    this.ui.updateLives(this.lives);
    this.resetFrog();
    if (this.lives <= 0) {
      this.stop('GAME OVER!', false);
    }
  }

  start() {
    this.gameState = 'RUNNING';
    this.score = 0;
    this.lives = 3;
    this.ui.updateScore(this.score);
    this.ui.updateLives(this.lives);
    this.insect.active = false;
    this.homeSlots = [false, false, false, false, false];
    this.resetFrog();

    this.ui.setMainActionText('Pause');
    this.ui.setStopButtonEnabled(true);
    this.ui.setOverlay(false);
  }

  pause() {
    if (this.gameState !== 'RUNNING') return;
    this.gameState = 'PAUSED';
    this.ui.setMainActionText('Resume');
    this.ui.setOverlay(true, 'PAUSED', false);
  }

  resume() {
    if (this.gameState !== 'PAUSED') return;
    this.gameState = 'RUNNING';
    this.ui.setMainActionText('Pause');
    this.ui.setOverlay(false);
  }

  stop(message = 'PRESS START TO PLAY!', isBlinking = true) {
    this.gameState = 'STOPPED';
    this.ui.setMainActionText('Start');
    this.ui.setStopButtonEnabled(false);
    this.ui.setOverlay(true, message, isBlinking);
  }

  tick() {
    if (this.gameState !== 'RUNNING') return;

    this.waveOffset += 0.4;

    if (this.insect.active) {
      this.insect.timer--;
      if (this.insect.timer <= 0) this.insect.active = false;
    } else if (Math.random() < 0.008) {
      this.spawnInsect();
    }

    this.obstacles.forEach(obs => {
      obs.x += obs.speed;
      if (obs.speed > 0 && obs.x > this.WIDTH) {
        obs.x = -obs.width;
      } else if (obs.speed < 0 && obs.x + obs.width < 0) {
        obs.x = this.WIDTH;
      }
    });

    const frogRow = Math.round(this.frog.y / this.GRID);

    // Insect collision
    if (this.insect.active && frogRow === this.insect.row) {
      if (Math.abs(this.frog.x - this.insect.x) < this.GRID) {
        const bonus = this.insect.type === 'firefly' ? 600 : this.insect.type === 'butterfly' ? 400 : 200;
        this.score += bonus;
        this.ui.updateScore(this.score);

        if (this.lives < 5) {
          this.lives++;
          this.ui.updateLives(this.lives);
        }
        this.insect.active = false;
      }
    }

    // River collision (rows 1-5)
    if (frogRow >= 1 && frogRow <= 5) {
      let onPlatform = false;
      let platformSpeed = 0;

      this.obstacles.forEach(obs => {
        if (obs.row === frogRow && this.frog.x + this.frog.width > obs.x && this.frog.x < obs.x + obs.width) {
          onPlatform = true;
          platformSpeed = obs.speed;
        }
      });

      if (onPlatform) {
        this.frog.x += platformSpeed;
        if (this.frog.x < 0 || this.frog.x > this.WIDTH - this.frog.width) {
          this.loseLife();
        }
      } else {
        this.loseLife();
      }
      if (this.gameState !== 'RUNNING') return;
    }

    // Road collision (rows 7-11)
    if (frogRow >= 7 && frogRow <= 11) {
      for (const obs of this.obstacles) {
        if (obs.row === frogRow && this.frog.x + this.frog.width > obs.x && this.frog.x < obs.x + obs.width) {
          this.loseLife();
          break;
        }
      }
      if (this.gameState !== 'RUNNING') return;
    }

    // Home slot win check (row 0)
    if (frogRow === 0) {
      let reachedSlot = false;
      this.homeSlotXCoords.forEach((hx, index) => {
        if (!this.homeSlots[index] && Math.abs(this.frog.x + this.frog.width / 2 - hx) < 10) {
          this.homeSlots[index] = true;
          reachedSlot = true;
          this.score += 200;
          this.ui.updateScore(this.score);
        }
      });

      if (reachedSlot) {
        this.resetFrog();
        if (this.homeSlots.every(Boolean)) {
          this.score += 1000;
          this.ui.updateScore(this.score);
          this.stop(
            `VICTORY!`,
            false
          );
          return;
        }
      } else {
        this.loseLife();
      }
    }
  }
}