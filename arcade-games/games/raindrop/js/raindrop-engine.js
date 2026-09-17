// raindrop-engine.js
// Pure game-state logic for the Raindrop math game. Nothing in this file
// touches the DOM or canvas — it only knows about numbers — so it can be
// unit tested or reused with a different renderer.

export const MAX_WATER = 80;

const WATER_RISE_ON_MISS = 8;
const WATER_RISE_ON_HIT_BOTTOM = 12;
const WATER_DROP_ON_GOLDEN = 25;

function applyOp(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '*': return a * b;
    default: return NaN;
  }
}

export class Drop {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = 0;
    this.y = -40;
    this.speed = 0;
    this.isGolden = false;
    this.num1 = 0;
    this.num2 = 0;
    this.num3 = null;
    this.text = '';
    this.answer = 0;
  }

  reset(state) {
    const { difficulty, waterLevel, otherDrops } = state;
    let normalDropsSinceGolden = state.normalDropsSinceGolden;

    this.x = Math.random() * (this.width - 100) + 50;
    this.y = -40;

    let isUnique = false;
    let safetyCounter = 0;

    while (!isUnique && safetyCounter < 20) {
      safetyCounter++;

      if (waterLevel >= 25 && normalDropsSinceGolden >= 6 && Math.random() < 0.25) {
        this.isGolden = true;
        normalDropsSinceGolden = 0;
      } else {
        this.isGolden = false;
        normalDropsSinceGolden++;
      }

      if (difficulty === 'Easy') {
        this.speed = this.isGolden ? 0.4 : Math.random() * 0.3 + 0.4;
      } else if (difficulty === 'Normal') {
        this.speed = this.isGolden ? 0.6 : Math.random() * 0.5 + 0.6;
      } else {
        this.speed = this.isGolden ? 0.9 : Math.random() * 0.9 + 1.1;
      }

      if (this.isGolden) {
        this._generateGolden(difficulty);
      } else {
        this._generateNormal(difficulty);
      }

      const duplicate = otherDrops.some((d) => d && d !== this && d.answer === this.answer);
      if (!duplicate) isUnique = true;
    }

    return normalDropsSinceGolden;
  }

  _generateGolden(difficulty) {
    const goldOps = difficulty === 'Easy' ? ['+', '-'] : ['+', '-', '*'];
    const op1 = goldOps[Math.floor(Math.random() * goldOps.length)];
    const op2 = goldOps[Math.floor(Math.random() * goldOps.length)];

    this.num1 = Math.floor(Math.random() * 5) + 1;
    this.num2 = Math.floor(Math.random() * 5) + 1;
    this.num3 = Math.floor(Math.random() * 5) + 1;

    const part1 = applyOp(this.num1, op1, this.num2);
    this.answer = applyOp(part1, op2, this.num3);

    if (!Number.isInteger(this.answer) || this.answer < 0 || this.answer > 50) {

      this.num1 = Math.floor(Math.random() * 4) + 1;
      this.num2 = Math.floor(Math.random() * 4) + 1;
      this.num3 = Math.floor(Math.random() * 4) + 1;
      this.answer = this.num1 + this.num2 + this.num3;
      this.text = `${this.num1} + ${this.num2} + ${this.num3}`;
    } else {
      this.text = `${this.num1} ${op1} ${this.num2} ${op2} ${this.num3}`;
    }
  }

  _generateNormal(difficulty) {
    const ops = difficulty === 'Easy' ? ['+', '-'] : ['+', '-', '*', '/'];
    const op = ops[Math.floor(Math.random() * ops.length)];

    if (op === '+') {
      this.num1 = Math.floor(Math.random() * 10) + 1;
      this.num2 = Math.floor(Math.random() * 10) + 1;
      this.answer = this.num1 + this.num2;
    } else if (op === '-') {
      this.num1 = Math.floor(Math.random() * 12) + 4;
      this.num2 = Math.floor(Math.random() * this.num1);
      this.answer = this.num1 - this.num2;
    } else if (op === '*') {
      this.num1 = Math.floor(Math.random() * 6) + 1;
      this.num2 = Math.floor(Math.random() * 6) + 1;
      this.answer = this.num1 * this.num2;
    } else {
      this.num2 = Math.floor(Math.random() * 5) + 1;
      this.answer = Math.floor(Math.random() * 6) + 1;
      this.num1 = this.num2 * this.answer;
    }
    this.num3 = null;
    this.text = `${this.num1} ${op} ${this.num2}`;
  }
}

export class RaindropEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.score = 0;
    this.waterLevel = 0;
    this.drops = [];
    this.difficulty = 'Easy';
    this.normalDropsSinceGolden = 0;
    this.clouds = [];
    this._spawnClouds();
  }

  start() {
    this.score = 0;
    this.waterLevel = 0;
    this.normalDropsSinceGolden = 0;
    this.drops = [];

    for (let i = 0; i < 2; i++) {
      const drop = new Drop(this.width, this.height);
      this._resetDrop(drop);
      this.drops.push(drop);
    }

    this._spawnClouds();
  }

  _spawnClouds() {
    this.clouds = [];
    const cloudCount = 3 + Math.floor(Math.random() * 2); // 3-4 clouds
    const bandWidth = this.width / cloudCount;
    for (let i = 0; i < cloudCount; i++) {
      const bandStart = i * bandWidth;
      this.clouds.push({
        x: bandStart + bandWidth * 0.2 + Math.random() * bandWidth * 0.6,
        y: 15 + Math.random() * 55,
        scale: 0.8 + Math.random() * 0.35,
        speed: 0.05 + Math.random() * 0.06,
      });
    }
  }

  updateClouds() {
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed;
      const cloudSpan = 40 * cloud.scale;
      if (cloud.x - cloudSpan > this.width) {
        cloud.x = -cloudSpan;
        cloud.y = 15 + Math.random() * 55;
      }
    }
  }

  cycleDifficulty() {
    this.difficulty =
      this.difficulty === 'Easy' ? 'Normal' : this.difficulty === 'Normal' ? 'Hard' : 'Easy';
    return this.difficulty;
  }

  _resetDrop(drop) {
    this.normalDropsSinceGolden = drop.reset({
      difficulty: this.difficulty,
      waterLevel: this.waterLevel,
      normalDropsSinceGolden: this.normalDropsSinceGolden,
      otherDrops: this.drops,
    });
  }

  update() {
    for (const drop of this.drops) {
      drop.y += drop.speed;
      if (drop.y >= this.height - 15 - this.waterLevel) {
        this.waterLevel += WATER_RISE_ON_HIT_BOTTOM;
        this._resetDrop(drop);
      }
    }
  }

  isFlooded() {
    return this.waterLevel >= MAX_WATER;
  }

  submitAnswer(rawInput) {
    const val = parseInt(rawInput, 10);
    if (Number.isNaN(val)) return { matched: false, golden: false };

    for (const drop of this.drops) {
      if (drop.answer === val) {
        const golden = drop.isGolden;
        if (golden) {
          this.score += 30;
          this.waterLevel = Math.max(0, this.waterLevel - WATER_DROP_ON_GOLDEN);
        } else {
          this.score += 10;
        }
        this._resetDrop(drop);
        return { matched: true, golden };
      }
    }

    this.waterLevel += WATER_RISE_ON_MISS;
    return { matched: false, golden: false };
  }
}