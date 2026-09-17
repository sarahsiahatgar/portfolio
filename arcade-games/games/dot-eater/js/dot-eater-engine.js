// ==========================================
// Dot Eater — Game Engine
// Maze generation, movement, collisions, scoring. No DOM access here -
// talks to the outside world only through the `ui` callbacks passed into
// the constructor, and exposes plain state (map, pac, ghosts, dots, ...)
// for the renderer to read.
// ==========================================

const NOOP_UI = {
  setOverlay: () => {},
  updateScore: () => {},
  setDifficultyButtonState: () => {},
  setStopButtonState: () => {},
  setMainActionText: () => {},
};

const DIFFICULTIES = ['Normal', 'Hard', 'Easy'];
const DIRS = [{ r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

function countOpenNeighbors(layout, r, c, rows, cols) {
  let count = 0;
  for (const d of DIRS) {
    const nr = r + d.r, nc = c + d.c;
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && layout[nr][nc] === 0) count++;
  }
  return count;
}

function validateAccessibility(layout, rows, cols) {
  let visited = Array(rows).fill(0).map(() => Array(cols).fill(false));
  let queue = [{ r: 1, c: 1 }];
  visited[1][1] = true;
  let reachableCount = 0;
  let totalOpen = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (layout[r][c] === 0) totalOpen++;
    }
  }

  while (queue.length > 0) {
    let curr = queue.shift();
    reachableCount++;
    for (const d of DIRS) {
      let nr = curr.r + d.r;
      let nc = curr.c + d.c;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && layout[nr][nc] === 0 && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({ r: nr, c: nc });
      }
    }
  }
  return reachableCount === totalOpen;
}

function removeDeadEnds(layout, rows, cols) {
  const isBorder = (r, c) => r <= 0 || r >= rows - 1 || c <= 0 || c >= cols - 1;
  let changed = true;
  let guard = 0;

  while (changed && guard < 400) {
    changed = false;
    guard++;

    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        if (layout[r][c] !== 0) continue;
        if (countOpenNeighbors(layout, r, c, rows, cols) !== 1) continue;

        const candidates = DIRS
          .map(d => ({ r: r + d.r, c: c + d.c }))
          .filter(p => !isBorder(p.r, p.c) && layout[p.r][p.c] === 1);

        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          layout[pick.r][pick.c] = 0;
          changed = true;
        }
      }
    }
  }
}

function generateLayout(rows, cols) {
  let map = null;
  let valid = false;
  let attempts = 0;

  while (!valid && attempts < 100) {
    attempts++;
    let testMap = Array(rows).fill(0).map(() => Array(cols).fill(1));
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        testMap[r][c] = 0;
      }
    }

    for (let i = 0; i < 9; i++) {
      let sr = Math.floor(Math.random() * (rows - 4)) + 2;
      let sc = Math.floor(Math.random() * (cols - 4)) + 2;
      let length = Math.floor(Math.random() * 3) + 2;
      let isVertical = Math.random() < 0.5;
      let isLShape = Math.random() < 0.25;

      let possible = true;
      let coords = [];
      for (let j = 0; j < length; j++) {
        let cr = sr + (isVertical ? j : 0);
        let cc = sc + (isVertical ? 0 : j);
        if (cr <= 0 || cr >= rows - 1 || cc <= 0 || cc >= cols - 1 || (cr <= 2 && cc <= 2) || (cr >= rows - 3 && cc >= cols - 3)) {
          possible = false;
          break;
        }
        coords.push({ r: cr, c: cc });
      }

      let lCoords = [];
      if (possible && isLShape && length >= 3) {
        let branchLen = Math.floor(Math.random() * 2) + 1;
        let pivot = coords[Math.floor(coords.length / 2)];
        let dirOffset = Math.random() < 0.5 ? 1 : -1;
        for (let k = 1; k <= branchLen; k++) {
          let br = pivot.r + (isVertical ? 0 : k * dirOffset);
          let bc = pivot.c + (isVertical ? k * dirOffset : 0);
          if (br <= 0 || br >= rows - 1 || bc <= 0 || bc >= cols - 1) break;
          lCoords.push({ r: br, c: bc });
        }
      }

      if (possible) {
        coords.forEach(pt => testMap[pt.r][pt.c] = 1);
        lCoords.forEach(pt => testMap[pt.r][pt.c] = 1);
      }
    }

    testMap[1][1] = 0;
    testMap[1][2] = 0;
    testMap[2][1] = 0;
    testMap[rows - 2][cols - 2] = 0;
    testMap[rows - 2][cols - 3] = 0;
    testMap[rows - 3][cols - 2] = 0;

    if (validateAccessibility(testMap, rows, cols)) {
      map = testMap;
      valid = true;
    }
  }

  if (!valid) {
    map = Array(rows).fill(0).map(() => Array(cols).fill(1));
    for (let r = 1; r < rows - 1; r++) {
      for (let c = 1; c < cols - 1; c++) {
        map[r][c] = 0;
      }
    }
  }

  removeDeadEnds(map, rows, cols);
  return map;
}

export class PacmanGame {
  constructor(canvasWidth, canvasHeight, ui = {}) {
    this.ui = { ...NOOP_UI, ...ui };

    this.tileSize = 20;
    this.cols = canvasWidth / this.tileSize;
    this.rows = canvasHeight / this.tileSize;

    this.map = [];
    this.pac = { r: 1, c: 1, x: 30, y: 30, dx: 0, dy: 0 };
    this.nextDir = { r: 0, c: 0 };
    this.pacDots = [];
    this.currentFruit = null;
    this.currentHeart = null;
    this.ghosts = [];

    this.score = 0;
    this.isActive = false;
    this.isPaused = false;
    this.ghostsVulnerable = false;
    this.heartVulnerableStartTime = 0;
    this.vulnerabilityDuration = 6000;
    this.currentDifficulty = 'Normal';
    this.frame = 0;

    this.fruitTimer = null;
    this.heartTimer = null;
    this.heartExpireTimer = null;
    this.ghostVulnerableTimer = null;
  }

  cycleDifficulty() {
    const idx = DIFFICULTIES.indexOf(this.currentDifficulty);
    this.currentDifficulty = DIFFICULTIES[(idx + 1) % DIFFICULTIES.length];
    return this.currentDifficulty;
  }

  getSpeedInterval() {
    switch (this.currentDifficulty) {
      case 'Easy': return 280;
      case 'Hard': return 160;
      case 'Normal':
      default: return 220;
    }
  }

  generateLayout() {
    this.map = generateLayout(this.rows, this.cols);
  }

  initItems() {
    this.pacDots = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.map[r][c] === 0 && !(r === 1 && c === 1)) {
          this.pacDots.push({ r, c, active: true });
        }
      }
    }
    this.currentFruit = null;
    this.currentHeart = null;
  }

  emptyTiles() {
    const tiles = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.map[r][c] === 0 && !(r === 1 && c === 1)) {
          tiles.push({ r, c });
        }
      }
    }
    return tiles;
  }

  spawnRandomFruit() {
    if (!this.isActive || this.isPaused) return;
    const tiles = this.emptyTiles();
    if (tiles.length > 0) {
      const spot = tiles[Math.floor(Math.random() * tiles.length)];
      const fruitTypes = ['🍒', '🍌', '🍎', '🍓'];
      this.currentFruit = { r: spot.r, c: spot.c, type: fruitTypes[Math.floor(Math.random() * fruitTypes.length)] };
    }
  }

  spawnRandomHeart() {
    if (!this.isActive || this.isPaused || this.ghostsVulnerable) return;
    const tiles = this.emptyTiles();
    if (tiles.length > 0) {
      const spot = tiles[Math.floor(Math.random() * tiles.length)];
      this.currentHeart = { r: spot.r, c: spot.c, type: '🤍' };

      if (this.heartExpireTimer) clearTimeout(this.heartExpireTimer);
      this.heartExpireTimer = setTimeout(() => {
        if (this.isActive && !this.isPaused) {
          this.currentHeart = null;
        }
      }, 5000);
    }
  }

  setNextDir(dr, dc) {
    if (!this.isActive || this.isPaused) return;
    this.nextDir = { r: dr, c: dc };
  }

  start() {
    this.stopTimers();

    this.generateLayout();
    this.initItems();

    this.pac = {
      r: 1, c: 1,
      x: 1 * this.tileSize + this.tileSize / 2,
      y: 1 * this.tileSize + this.tileSize / 2,
      dx: 0, dy: 0
    };
    this.nextDir = { r: 0, c: 0 };
    this.score = 0;
    this.isActive = true;
    this.isPaused = false;
    this.ghostsVulnerable = false;
    this.frame = 0;

    this.ghosts = [
      { r: this.rows - 2, c: this.cols - 2, x: (this.cols - 2) * this.tileSize + this.tileSize / 2, y: (this.rows - 2) * this.tileSize + this.tileSize / 2, color: '#e74c3c', origColor: '#e74c3c', eaten: false, respawnTimeout: null },
      { r: this.rows - 2, c: this.cols - 3, x: (this.cols - 3) * this.tileSize + this.tileSize / 2, y: (this.rows - 2) * this.tileSize + this.tileSize / 2, color: '#3498db', origColor: '#3498db', eaten: false, respawnTimeout: null }
    ];

    this.ui.setDifficultyButtonState(true);
    this.ui.setStopButtonState(false);
    this.ui.setMainActionText('Pause');
    this.ui.updateScore(0);
    this.ui.setOverlay(false);

    this.startTimers();
  }

  startTimers() {
    this.fruitTimer = setInterval(() => {
      if (this.isActive && !this.isPaused) {
        if (this.currentFruit) this.currentFruit = null;
        else this.spawnRandomFruit();
      }
    }, 5000);

    this.heartTimer = setInterval(() => {
      if (this.isActive && !this.isPaused) {
        if (this.currentHeart) {
          this.currentHeart = null;
          if (this.heartExpireTimer) clearTimeout(this.heartExpireTimer);
        } else {
          this.spawnRandomHeart();
        }
      }
    }, 10000);
  }

  stopTimers() {
    if (this.fruitTimer) clearInterval(this.fruitTimer);
    if (this.heartTimer) clearInterval(this.heartTimer);
    if (this.heartExpireTimer) clearTimeout(this.heartExpireTimer);
    if (this.ghostVulnerableTimer) clearTimeout(this.ghostVulnerableTimer);
    this.ghosts.forEach(g => { if (g.respawnTimeout) clearTimeout(g.respawnTimeout); });
  }

  togglePause() {
    if (!this.isActive) return;
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.ui.setMainActionText('Resume');
      this.ui.setOverlay(true, 'PAUSED');
      this.stopTimers();
    } else {
      this.ui.setMainActionText('Pause');
      this.ui.setOverlay(false);
      this.startTimers();
    }
  }

  stop(message) {
    this.stopTimers();
    this.isActive = false;
    this.isPaused = false;

    this.ui.setMainActionText('Start');
    this.ui.setDifficultyButtonState(false);
    this.ui.setStopButtonState(true);
    this.ui.setOverlay(true, message);
  }

  resolveGhostCollision(g) {
    if (this.ghostsVulnerable) {
      g.eaten = true;
      this.score += 100;
      this.ui.updateScore(this.score);
      let remainingTime = Math.max(300, this.vulnerabilityDuration - (Date.now() - this.heartVulnerableStartTime));
      g.respawnTimeout = setTimeout(() => {
        if (!this.isActive || this.isPaused) return;
        g.r = this.rows - 2;
        g.c = this.cols - 2;
        g.x = g.c * this.tileSize + this.tileSize / 2;
        g.y = g.r * this.tileSize + this.tileSize / 2;
        g.eaten = false;
        g.color = g.origColor;
      }, remainingTime);
      return false;
    } else {
      this.stop('Caught by a Ghost!<br>Play Again?');
      return true;
    }
  }

  tick() {
    if (!this.isActive || this.isPaused) return;

    this.frame++;

    let targetR = this.pac.r + this.nextDir.r;
    let targetC = this.pac.c + this.nextDir.c;
    if (targetR >= 0 && targetR < this.rows && targetC >= 0 && targetC < this.cols && this.map[targetR][targetC] === 0) {
      this.pac.dx = this.nextDir.r;
      this.pac.dy = this.nextDir.c;
    }

    let nextR = this.pac.r + this.pac.dx;
    let nextC = this.pac.c + this.pac.dy;
    if (nextR >= 0 && nextR < this.rows && nextC >= 0 && nextC < this.cols && this.map[nextR][nextC] === 0) {
      this.pac.r = nextR;
      this.pac.c = nextC;
    } else {
      this.pac.dx = 0;
      this.pac.dy = 0;
    }

    this.pac.x = this.pac.c * this.tileSize + this.tileSize / 2;
    this.pac.y = this.pac.r * this.tileSize + this.tileSize / 2;

    this.pacDots.forEach(dot => {
      if (dot.active && dot.r === this.pac.r && dot.c === this.pac.c) {
        dot.active = false;
        this.score += 10;
        this.ui.updateScore(this.score);
      }
    });

    if (this.currentFruit && this.currentFruit.r === this.pac.r && this.currentFruit.c === this.pac.c) {
      this.score += 50;
      this.ui.updateScore(this.score);
      this.currentFruit = null;
    }

    if (this.currentHeart && this.currentHeart.r === this.pac.r && this.currentHeart.c === this.pac.c) {
      this.score += 30;
      this.ui.updateScore(this.score);
      this.currentHeart = null;
      if (this.heartExpireTimer) clearTimeout(this.heartExpireTimer);

      this.ghostsVulnerable = true;
      this.heartVulnerableStartTime = Date.now();

      this.ghosts.forEach(g => {
        if (!g.eaten) g.color = '#ffffff';
        if (g.respawnTimeout) clearTimeout(g.respawnTimeout);
      });

      if (this.ghostVulnerableTimer) clearTimeout(this.ghostVulnerableTimer);
      this.ghostVulnerableTimer = setTimeout(() => {
        if (!this.isPaused) {
          this.ghostsVulnerable = false;
          this.ghosts.forEach(g => {
            if (!g.eaten) g.color = g.origColor;
          });
        }
      }, this.vulnerabilityDuration);
    }

    for (const g of this.ghosts) {
      if (g.eaten) continue;

      if (g.r === this.pac.r && g.c === this.pac.c) {
        if (this.resolveGhostCollision(g)) return;
      }

      let validMoves = DIRS.filter(d => {
        let nr = g.r + d.r;
        let nc = g.c + d.c;
        return nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.map[nr][nc] === 0;
      });

      if (validMoves.length > 0) {
        let chosen = validMoves[Math.floor(Math.random() * validMoves.length)];
        g.r += chosen.r;
        g.c += chosen.c;
      }

      g.x = g.c * this.tileSize + this.tileSize / 2;
      g.y = g.r * this.tileSize + this.tileSize / 2;

      if (g.r === this.pac.r && g.c === this.pac.c) {
        if (this.resolveGhostCollision(g)) return;
      }
    }

    let remainingDots = this.pacDots.filter(d => d.active).length;
    if (remainingDots === 0) {
      this.stop('You Won!<br>Play Again?');
    }
  }
}