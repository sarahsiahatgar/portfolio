// Screen animations for the arcade "insert coin" CRT.

export const SHOWTIME_MS = 8000;

let ctx = null;
let W = 0;
let H = 0;
let scale = 1;
let rafId = null;

function clearScreen(color) {
  ctx.fillStyle = color || '#000';
  ctx.fillRect(0, 0, W, H);
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/* ---------- Block Stacker (falling pieces) ---------- */
function blockStacker(startTime, done) {
  const showTime = typeof SHOWTIME_MS !== 'undefined' ? SHOWTIME_MS : 8000;
  const canvasW = typeof W !== 'undefined' && W ? W : 240;
  const canvasH = typeof H !== 'undefined' && H ? H : 320;
  const cols = 14;
  const cellSize = canvasW / cols;
  const rows = Math.floor(canvasH / cellSize);
  const colors = ['#23f6ff', '#ff2bd6', '#ffe94a', '#39ff7a', '#ff8a23'];

  const shapes = [
    { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], w: 2, h: 2 },
    { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], w: 4, h: 1 },
    { cells: [[0, 0], [0, 1], [0, 2], [0, 3]], w: 1, h: 4 },
    { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], w: 3, h: 2 },
    { cells: [[0, 0], [0, 1], [1, 1], [1, 2]], w: 2, h: 3 },
    { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], w: 3, h: 2 },
  ];

  const playLeft = 2;
  const playRight = 12;
  const playWidth = playRight - playLeft;

  const baseDropMs = 110;
  const minDropMs = 45;

  function makeEmptyGrid() {
    return Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  let grid = makeEmptyGrid();

  const wellCol = playLeft + Math.floor(playWidth / 2);
  const prefillRows = Math.min(4, Math.max(0, rows - 3));
  for (let y = rows - prefillRows; y < rows; y++) {
    for (let x = playLeft; x < playRight; x++) {
      if (x !== wellCol) {
        grid[y][x] = colors[(x * 3 + y * 7) % colors.length];
      }
    }
  }

  function pieceCellsAt(shape, originX, originY) {
    return shape.cells.map(([dx, dy]) => [originX + dx, originY + dy]);
  }

  function collides(cells) {
    return cells.some(([x, y]) => {
      if (x < playLeft || x >= playRight || y >= rows) return true;
      if (y >= 0 && grid[y] && grid[y][x]) return true;
      return false;
    });
  }

  function spawnPiece(forceVerticalIAtWell) {
    let shape, originX;
    if (forceVerticalIAtWell) {
      shape = shapes[2];
      originX = wellCol;
    } else {
      shape = shapes[Math.floor(Math.random() * shapes.length)];
      const maxX = playRight - shape.w;
      originX = playLeft + Math.floor(Math.random() * (maxX - playLeft + 1));
    }
    const originY = -shape.h;
    const color = colors[Math.floor(Math.random() * colors.length)];
    return { cells: pieceCellsAt(shape, originX, originY), color };
  }

  let piece = spawnPiece(prefillRows > 0);
  let lastDrop = startTime;
  let lastT = startTime;
  let clearingRows = null;
  let clearTimer = 0;
  const clearDuration = 260;
  let rafId = null;

  function findFullRows() {
    const full = [];
    for (let y = 0; y < rows; y++) {
      let isFull = true;
      for (let x = playLeft; x < playRight; x++) {
        if (!grid[y][x]) { isFull = false; break; }
      }
      if (isFull) full.push(y);
    }
    return full;
  }

  function lockPiece() {
    piece.cells.forEach(([x, y]) => {
      if (y >= 0 && y < rows && x >= playLeft && x < playRight) grid[y][x] = piece.color;
    });
    const fullRows = findFullRows();
    if (fullRows.length > 0) {
      clearingRows = fullRows;
      clearTimer = clearDuration;
    } else {
      piece = spawnPiece(false);
      if (collides(piece.cells)) {
        grid = makeEmptyGrid();
        piece = spawnPiece(false);
      }
    }
  }

  function resolveClear() {
    const set = new Set(clearingRows);
    const kept = grid.filter((_, idx) => !set.has(idx));
    while (kept.length < rows) kept.unshift(Array(cols).fill(null));
    grid.length = 0;
    grid.push(...kept);
    clearingRows = null;
    piece = spawnPiece(false);
    if (collides(piece.cells)) {
      grid = makeEmptyGrid();
      piece = spawnPiece(false);
    }
  }

  function currentDropInterval(elapsed) {
    const t = Math.min(1, elapsed / showTime);
    return baseDropMs - (baseDropMs - minDropMs) * t;
  }

  function frame(t) {
    const elapsed = t - startTime;
    if (elapsed >= showTime) { if (typeof done === 'function') done(); return; }
    const dt = Math.min(t - lastT, 32);
    lastT = t;

    if (clearingRows) {
      clearTimer -= dt;
      if (clearTimer <= 0) resolveClear();
    } else {
      const dropInterval = currentDropInterval(elapsed);
      if (t - lastDrop > dropInterval) {
        lastDrop = t;
        const moved = piece.cells.map(([x, y]) => [x, y + 1]);
        if (collides(moved)) lockPiece();
        else piece.cells = moved;
      }
    }

    if (typeof clearScreen === 'function') {
      try { clearScreen('#0a0a0a'); } catch (e) {
        if (typeof ctx !== 'undefined') { ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, canvasW, canvasH); }
      }
    } else if (typeof ctx !== 'undefined') {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    if (typeof ctx !== 'undefined') {
      ctx.strokeStyle = '#ffe94a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playLeft * cellSize, 0);
      ctx.lineTo(playLeft * cellSize, canvasH);
      ctx.moveTo(playRight * cellSize, 0);
      ctx.lineTo(playRight * cellSize, canvasH);
      ctx.stroke();

      for (let y = 0; y < rows; y++) {
        const isClearing = clearingRows && clearingRows.includes(y);
        for (let x = playLeft; x < playRight; x++) {
          if (grid[y] && grid[y][x]) {
            const flash = isClearing && Math.floor(clearTimer / 40) % 2 === 0;
            ctx.fillStyle = flash ? '#ffffff' : grid[y][x];
            ctx.fillRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 1, cellSize - 1);
          }
        }
      }
      if (!clearingRows) {
        ctx.fillStyle = piece.color;
        piece.cells.forEach(([x, y]) => {
          if (y >= 0) {
            ctx.fillRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 1, cellSize - 1);
          }
        });
      }
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- Side-scrolling Runner ---------- */
function runnerScene(startTime, done) {
  const groundY = H - H * 0.15;
  const runner = { x: W * 0.18, y: groundY - H * 0.11, vy: 0, w: W * 0.07, h: H * 0.11, onGround: true, frame: 0 };
  const clouds = Array.from({ length: 4 }, () => ({ x: Math.random() * W, y: H * 0.09 + Math.random() * H * 0.14, s: 0.6 + Math.random() * 0.6 }));
  const coins = Array.from({ length: 5 }, (_, i) => ({ x: W + i * W * 0.4, y: groundY - H * 0.27, spin: 0 }));
  const bumps = Array.from({ length: 6 }, (_, i) => ({ x: W * 1.2 + i * W * 0.6, w: W * 0.14 }));
  let scrollX = 0;
  let nextJump = 900 + Math.random() * 700;
  let lastT = startTime;

  function frame(t) {
    const elapsed = t - startTime;
    if (elapsed >= SHOWTIME_MS) { done(); return; }
    const dt = t - lastT; lastT = t;

    scrollX += dt * 0.045 * scale;

    nextJump -= dt;
    if (nextJump <= 0 && runner.onGround) {
      runner.vy = -3.4 * scale;
      runner.onGround = false;
      nextJump = 1000 + Math.random() * 900;
    }
    runner.vy += 0.16 * scale;
    runner.y += runner.vy;
    if (runner.y > groundY - runner.h) { runner.y = groundY - runner.h; runner.vy = 0; runner.onGround = true; }
    runner.frame += dt * 0.012;

    clearScreen();
    ctx.fillStyle = '#0a0030';
    ctx.fillRect(0, 0, W, groundY);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    clouds.forEach((c) => {
      c.x -= dt * 0.02 * c.s;
      if (c.x < -W * 0.14) c.x = W + W * 0.14;
      ctx.fillRect(c.x, c.y, W * 0.08 * c.s, H * 0.03 * c.s);
      ctx.fillRect(c.x + W * 0.03 * c.s, c.y - H * 0.02 * c.s, W * 0.045 * c.s, H * 0.03 * c.s);
    });

    ctx.fillStyle = '#39ff7a';
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#1a8c3f';
    const tick = W * 0.09;
    for (let x = -(scrollX % tick); x < W; x += tick) ctx.fillRect(x, groundY, tick * 0.45, H * 0.018);

    ctx.fillStyle = '#8a5a2a';
    bumps.forEach((b) => {
      const bx = b.x - scrollX;
      if (bx > -b.w - 10 && bx < W + b.w + 10) ctx.fillRect(bx, groundY - H * 0.06, b.w, H * 0.06);
    });

    ctx.fillStyle = '#ffe94a';
    coins.forEach((c) => {
      const cx = c.x - scrollX;
      c.spin += dt * 0.01;
      const width = Math.abs(Math.cos(c.spin)) * W * 0.035 + 1;
      if (cx > -W * 0.1 && cx < W + W * 0.1) ctx.fillRect(cx - width / 2, c.y, width, H * 0.035);
    });

    const bob = Math.sin(runner.frame * 10) * (runner.onGround ? H * 0.009 : 0);
    ctx.fillStyle = '#ff2bd6';
    ctx.fillRect(runner.x, runner.y - bob, runner.w, runner.h);
    ctx.fillStyle = '#ffe94a';
    ctx.fillRect(runner.x + runner.w * 0.2, runner.y - bob + runner.h * 0.18, runner.w * 0.6, runner.h * 0.25);

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- Plasma Visualizer ---------- */
function plasmaVisualizer(startTime, done) {
  const bars = 24;
  let heights = Array(bars).fill(0);
  let targets = heights.map(() => Math.random());
  let lastSwap = startTime;

  function frame(t) {
    const elapsed = t - startTime;
    if (elapsed >= SHOWTIME_MS) { done(); return; }
    const time = elapsed / 1000;

    if (t - lastSwap > 260) {
      lastSwap = t;
      targets = targets.map(() => Math.random());
    }

    const imgData = ctx.createImageData(W, H);
    const step = 3;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const v = Math.sin(x * 0.12 + time) + Math.sin(y * 0.12 + time * 1.3) + Math.sin((x + y) * 0.08 + time * 0.7);
        const hue = (v * 40 + time * 30) % 360;
        const [r, g, b] = hslToRgb(hue / 360, 0.65, 0.22);
        for (let dy = 0; dy < step; dy++) {
          for (let dx = 0; dx < step; dx++) {
            const px = x + dx, py = y + dy;
            if (px < W && py < H) {
              const idx = (py * W + px) * 4;
              imgData.data[idx] = r; imgData.data[idx + 1] = g; imgData.data[idx + 2] = b; imgData.data[idx + 3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const barW = W / bars;
    for (let i = 0; i < bars; i++) {
      heights[i] += (targets[i] - heights[i]) * 0.25;
      const h = heights[i] * H * 0.7;
      const hue = (i / bars * 360 + time * 60) % 360;
      const [r, g, b] = hslToRgb(hue / 360, 0.9, 0.6);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(i * barW + 1, H - h, barW - 2, h);
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- Brick Breaker ---------- */
function brickBreaker(startTime, done) {
  const paddleW = W * 0.35, paddleH = H * 0.03;
  let paddleX = W / 2 - paddleW / 2;
  const paddleY = H - H * 0.08;
  const ball = { x: W / 2, y: H / 2, vx: 1.6 * scale, vy: -1.8 * scale, r: Math.max(2, W * 0.03) };
  const cols = 6, rows = 4;
  const brickW = W / cols, brickH = H * 0.06;
  const colors = ['#ff2bd6', '#ffe94a', '#39ff7a', '#23f6ff'];
  let bricks = [];

  function buildBricks() {
    bricks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({ x: c * brickW, y: H * 0.1 + r * brickH, w: brickW, h: brickH, color: colors[r % colors.length], alive: true });
      }
    }
  }
  buildBricks();

  function resetBall() {
    ball.x = W / 2; ball.y = H / 2;
    ball.vx = (Math.random() < 0.5 ? -1 : 1) * 1.6 * scale;
    ball.vy = -1.8 * scale;
  }

  let lastT = startTime;
  function frame(t) {
    const elapsed = t - startTime;
    if (elapsed >= SHOWTIME_MS) { done(); return; }
    const dt = Math.min(t - lastT, 32); lastT = t;

    const targetX = ball.x - paddleW / 2;
    paddleX += (targetX - paddleX) * 0.12;
    paddleX = Math.max(0, Math.min(W - paddleW, paddleX));

    ball.x += ball.vx * (dt * 0.12);
    ball.y += ball.vy * (dt * 0.12);

    if (ball.x < ball.r || ball.x > W - ball.r) ball.vx *= -1;
    if (ball.y < ball.r) ball.vy *= -1;

    if (ball.y > paddleY - ball.r && ball.y < paddleY + paddleH && ball.x > paddleX && ball.x < paddleX + paddleW && ball.vy > 0) {
      ball.vy *= -1;
      const hitPos = (ball.x - (paddleX + paddleW / 2)) / (paddleW / 2);
      ball.vx = hitPos * 2.2 * scale;
    }

    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
        b.alive = false;
        ball.vy *= -1;
        break;
      }
    }
    if (bricks.every((b) => !b.alive)) buildBricks();
    if (ball.y > H + 10) resetBall();

    clearScreen();
    bricks.forEach((b) => {
      if (b.alive) { ctx.fillStyle = b.color; ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2); }
    });
    ctx.fillStyle = '#23f6ff';
    ctx.fillRect(paddleX, paddleY, paddleW, paddleH);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- Dot Eater ---------- */
function dotEater(startTime, done) {
  const cell = W / 6;
  const cols = Math.max(3, Math.floor(W / cell));
  const rows = Math.max(3, Math.floor(H / cell));
  const dots = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) dots.push({ x, y, alive: true });
  }
  const muncher = { x: Math.floor(cols / 2), y: Math.floor(rows / 2), dir: { x: 1, y: 0 }, mouth: 0 };
  const chasers = [
    { x: 1, y: 1, color: '#ff2bd6' },
    { x: cols - 2, y: rows - 2, color: '#39ff7a' },
  ];

  function pickNewDir() {
    const dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    return dirs[Math.floor(Math.random() * dirs.length)];
  }
  let dirTimer = 0;
  let lastStep = startTime;
  let lastChaserStep = startTime;

  function frame(t) {
    const elapsed = t - startTime;
    if (elapsed >= SHOWTIME_MS) { done(); return; }

    muncher.mouth = (Math.sin(elapsed * 0.02) + 1) / 2;

    dirTimer -= (t - lastStep);
    if (t - lastStep > 160) {
      lastStep = t;
      if (dirTimer <= 0 || Math.random() < 0.12) {
        muncher.dir = pickNewDir();
        dirTimer = 500;
      }
      muncher.x = (muncher.x + muncher.dir.x + cols) % cols;
      muncher.y = (muncher.y + muncher.dir.y + rows) % rows;
      const d = dots.find((d) => d.x === muncher.x && d.y === muncher.y && d.alive);
      if (d) d.alive = false;
      if (dots.every((d) => !d.alive)) dots.forEach((d) => { d.alive = true; });
    }

    if (t - lastChaserStep > 220) {
      lastChaserStep = t;
      chasers.forEach((c) => {
        if (Math.random() < 0.5) c.x += Math.sign(muncher.x - c.x) || (Math.random() < 0.5 ? 1 : -1);
        else c.y += Math.sign(muncher.y - c.y) || (Math.random() < 0.5 ? 1 : -1);
        c.x = (c.x + cols) % cols;
        c.y = (c.y + rows) % rows;
      });
    }

    clearScreen();
    ctx.fillStyle = '#ffe94a';
    dots.forEach((d) => {
      if (d.alive) {
        ctx.beginPath();
        ctx.arc(d.x * cell + cell / 2, d.y * cell + cell / 2, Math.max(1, cell * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    });

    chasers.forEach((c) => {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x * cell + cell / 2, c.y * cell + cell / 2, cell * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    const mx = muncher.x * cell + cell / 2, my = muncher.y * cell + cell / 2;
    const angle = Math.atan2(muncher.dir.y, muncher.dir.x);
    const mouthAngle = 0.15 + muncher.mouth * 0.55;
    ctx.fillStyle = '#ffe94a';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.arc(mx, my, cell * 0.42, angle + mouthAngle * Math.PI, angle - mouthAngle * Math.PI + Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}


/* ---------- SNAKE ANIMATIO ---------- */
function snakeScene(startTime, done){
  const cell = 20;
  const cols = Math.floor(W/cell), rows = Math.floor(H/cell);

  let snake, dir, food;

  function init(){
    snake = [{x:Math.floor(cols/2), y:Math.floor(rows/2)}, {x:Math.floor(cols/2)-1, y:Math.floor(rows/2)}, {x:Math.floor(cols/2)-2, y:Math.floor(rows/2)}];
    dir = {x:1,y:0};
    placeFood();
  }
  function placeFood(){
    let fx, fy;
    do{
      fx = Math.floor(Math.random()*cols);
      fy = Math.floor(Math.random()*rows);
    } while(snake.some(s=>s.x===fx && s.y===fy));
    food = {x:fx, y:fy};
  }
  init();

  function isOutOfBounds(nx, ny) {
    return nx < 0 || nx >= cols || ny < 0 || ny >= rows;
  }

  function chooseDir(){
    const head = snake[0];
    const options = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]
      .filter(d => !(d.x === -dir.x && d.y === -dir.y));

    const scored = options.map(d=>{
      const nx = head.x + d.x, ny = head.y + d.y;
      const out = isOutOfBounds(nx, ny);
      const occupied = out || snake.some((s,i)=> i<snake.length-1 && s.x===nx && s.y===ny);
      const dist = Math.abs(nx-food.x)+Math.abs(ny-food.y);
      return { d, out, occupied, dist };
    });
    const safe = scored.filter(s=>!s.out && !s.occupied);
    const valid = scored.filter(s=>!s.out);
    const pool = safe.length ? safe : (valid.length ? valid : scored);
    
    pool.sort((a,b)=> a.dist-b.dist);
    if(Math.random()<0.15 && pool.length>1){
      return pool[Math.floor(Math.random()*pool.length)].d;
    }
    return pool[0].d;
  }

  let lastStep = startTime;
  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    if(t - lastStep > 150){
      lastStep = t;
      dir = chooseDir();
      const head = snake[0];
      const nx = head.x + dir.x, ny = head.y + dir.y;
      
      const hitsWall = isOutOfBounds(nx, ny);
      const hitsSelf = snake.some(s=>s.x===nx && s.y===ny);
      
      if(hitsWall || hitsSelf){ 
        init(); 
      } else {
        snake.unshift({x:nx,y:ny});
        if(nx===food.x && ny===food.y){ placeFood(); }
        else{ snake.pop(); }
      }
    }

    clearScreen();
    ctx.fillStyle = '#ff2bd6';
    ctx.fillRect(food.x*cell+5, food.y*cell+5, cell-10, cell-10);

    snake.forEach((s,i)=>{
      const shade = i===0 ? '#39ff7a' : '#1fa858';
      ctx.fillStyle = shade;
      ctx.fillRect(s.x*cell+1, s.y*cell+1, cell-2, cell-2);
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- SPACE INVADER ---------- */
function invadersScene(startTime, done){
  const cols = 6, rows = 3;
  const cellW = 26, cellH = 16;
  const gridW = cols*cellW;
  let originX = (W-gridW)/2;
  let originY = 20;
  let dir = 1;
  let speed = 10;
  const rowColors = ['#ff2bd6','#ffe94a','#39ff7a'];

  function buildWave(){
    const arr = [];
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        arr.push({ r, c, alive:true });
      }
    }
    return arr;
  }
  let aliens = buildWave();
  let bullets = [];
  let cannonX = W/2;
  let lastMove = startTime;
  let lastShot = startTime;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    if(t - lastMove > 260){
      lastMove = t;
      const alive = aliens.filter(a=>a.alive);
      const minC = Math.min(...alive.map(a=>a.c), cols-1);
      const maxC = Math.max(...alive.map(a=>a.c), 0);
      const leftEdge = originX + minC*cellW;
      const rightEdge = originX + (maxC+1)*cellW;
      if(rightEdge + dir*speed > W-4 || leftEdge + dir*speed < 4){
        dir *= -1;
        originY += 8;
        if(originY > H-40){ originY = 20; aliens = buildWave(); }
      } else {
        originX += dir*speed;
      }
    }

    const alive = aliens.filter(a=>a.alive);
    if(alive.length){
      const target = originX + alive[Math.floor(alive.length/2)].c*cellW + cellW/2;
      cannonX += (target - cannonX) * 0.03;
    }
    cannonX = Math.max(10, Math.min(W-10, cannonX));

    if(t - lastShot > 500){
      lastShot = t;
      bullets.push({ x: cannonX, y: H-24, vy:-3 });
    }
    bullets.forEach(b=> b.y += b.vy);
    bullets = bullets.filter(b=>b.y > 0);

    bullets.forEach(b=>{
      aliens.forEach(a=>{
        if(!a.alive) return;
        const ax = originX + a.c*cellW, ay = originY + a.r*cellH;
        if(b.x > ax && b.x < ax+cellW-4 && b.y > ay && b.y < ay+cellH-2){
          a.alive = false;
          b.y = -100;
        }
      });
    });

    if(aliens.every(a=>!a.alive)){
      aliens = buildWave();
      originY = 20;
      speed = Math.min(speed+2, 22);
    }

    clearScreen();
    aliens.forEach(a=>{
      if(!a.alive) return;
      const ax = originX + a.c*cellW, ay = originY + a.r*cellH;
      ctx.fillStyle = rowColors[a.r % rowColors.length];
      ctx.fillRect(ax+2, ay+2, cellW-8, cellH-6);
      ctx.fillRect(ax-1, ay+6, 4, 4);
      ctx.fillRect(ax+cellW-9, ay+6, 4, 4);
    });

    ctx.fillStyle = '#23f6ff';
    ctx.fillRect(cannonX-8, H-16, 16, 6);
    ctx.fillRect(cannonX-2, H-20, 4, 6);

    ctx.fillStyle = '#fff';
    bullets.forEach(b=> ctx.fillRect(b.x-1, b.y, 2, 6));

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- ASTEROIDS FIGHT ---------- */
function asteroidsScene(startTime, done){
  function makeAsteroid(x,y,r){
    const n = 8;
    const points = Array.from({length:n},(_,i)=>({
      a: (i/n)*Math.PI*2,
      rad: r*(0.7+Math.random()*0.5)
    }));
    return {
      x, y, r,
      vx:(Math.random()-0.5)*0.5,
      vy:(Math.random()-0.5)*0.5,
      rot:Math.random()*Math.PI*2,
      vr:(Math.random()-0.5)*0.02,
      points
    };
  }
  function spawnWave(){
    const arr = [];
    for(let i=0;i<5;i++){
      const edge = Math.floor(Math.random()*4);
      let x,y;
      if(edge===0){x=Math.random()*W; y=-10;}
      else if(edge===1){x=W+10; y=Math.random()*H;}
      else if(edge===2){x=Math.random()*W; y=H+10;}
      else {x=-10; y=Math.random()*H;}
      arr.push(makeAsteroid(x,y, 14+Math.random()*10));
    }
    return arr;
  }

  let asteroids = spawnWave();
  let ship = { x: W/2, y: H/2, vx:0, vy:0, rot:0 };
  let bullets = [];
  let lastShot = startTime;
  let lastThrust = startTime;
  let thrustFlame = false;

  function wrap(o){
    if(o.x < -20) o.x = W+20; if(o.x > W+20) o.x = -20;
    if(o.y < -20) o.y = H+20; if(o.y > H+20) o.y = -20;
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    ship.rot += 0.012;
    if(t - lastThrust > 1100){
      lastThrust = t;
      ship.vx += Math.cos(ship.rot)*0.35;
      ship.vy += Math.sin(ship.rot)*0.35;
      thrustFlame = true;
      setTimeout(()=>thrustFlame=false, 150);
    }
    ship.vx *= 0.995; ship.vy *= 0.995;
    ship.x += ship.vx; ship.y += ship.vy;
    wrap(ship);

    if(t - lastShot > 650){
      lastShot = t;
      bullets.push({
        x: ship.x+Math.cos(ship.rot)*10,
        y: ship.y+Math.sin(ship.rot)*10,
        vx: Math.cos(ship.rot)*3.2,
        vy: Math.sin(ship.rot)*3.2,
        life: 700
      });
    }
    bullets.forEach(b=>{ b.x+=b.vx; b.y+=b.vy; b.life-=16; });
    bullets = bullets.filter(b=>b.life>0);

    asteroids.forEach(a=>{
      a.x += a.vx; a.y += a.vy; a.rot += a.vr;
      wrap(a);
    });

    const newAsteroids = [];
    asteroids.forEach(a=>{
      let hit = false;
      bullets.forEach(b=>{
        if(!hit){
          const dx=b.x-a.x, dy=b.y-a.y;
          if(Math.sqrt(dx*dx+dy*dy) < a.r){
            hit = true;
            b.life = -1;
            if(a.r > 15){
              newAsteroids.push(makeAsteroid(a.x,a.y,a.r*0.6));
              newAsteroids.push(makeAsteroid(a.x,a.y,a.r*0.6));
            }
          }
        }
      });
      if(!hit) newAsteroids.push(a);
    });
    asteroids = newAsteroids;
    bullets = bullets.filter(b=>b.life>0);
    if(asteroids.length===0) asteroids = spawnWave();

    clearScreen();
    ctx.strokeStyle = '#a68fd4';
    ctx.lineWidth = 1.5;
    asteroids.forEach(a=>{
      ctx.save();
      ctx.translate(a.x,a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      a.points.forEach((p,i)=>{
        const px = Math.cos(p.a)*p.rad, py = Math.sin(p.a)*p.rad;
        if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      });
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });

    ctx.fillStyle = '#fff';
    bullets.forEach(b=> ctx.fillRect(b.x-1,b.y-1,2,2));

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rot);
    ctx.strokeStyle = '#23f6ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(10,0);
    ctx.lineTo(-7,6);
    ctx.lineTo(-4,0);
    ctx.lineTo(-7,-6);
    ctx.closePath();
    ctx.stroke();
    if(thrustFlame){
      ctx.strokeStyle = '#ffe94a';
      ctx.beginPath();
      ctx.moveTo(-4,0);
      ctx.lineTo(-13,0);
      ctx.stroke();
    }
    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- FILE TRANSFER WINDOWS ---------- */
function fileTransferScene(startTime, done){
  const files = [
    {name: 'DATA1.ZIP', size: 142310},
    {name: 'IMAGE.PCX', size: 85200},
    {name: 'SETUP.EXE', size: 310500},
    {name: 'README.TXT', size: 4210},
    {name: 'SONG.MOD', size: 524000}
  ];
  const cycle = 4000;

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + 'B';
    return (bytes / 1024).toFixed(1) + 'KB';
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    const cycleIndex = Math.floor(elapsed/cycle);
    const localT = elapsed % cycle;
    const currentFile = files[cycleIndex % files.length];

    clearScreen('#000');

    const lightColors = ['#39ff7a','#ffe94a','#ff2bd6'];
    const labels = ['RX', 'TX', 'OK'];
    ctx.font = '10px monospace';
    ctx.textBaseline = 'top';
    for(let i=0;i<3;i++){
      const on = Math.sin(elapsed*0.01 + i*2) > 0;
      ctx.fillStyle = on ? lightColors[i] : '#222';
      ctx.fillRect(Math.round(14 + i*44), 12, 10, 10);
      ctx.fillStyle = '#aaa';
      ctx.fillText(labels[i], Math.round(27 + i*44), 12);
    }

    if(localT < 500){
      const dots = '.'.repeat(1+Math.floor(localT/150)%4);
      ctx.fillStyle = '#ffe94a';
      ctx.fillText('HANDSHAKE / CONNECTING' + dots, 14, 34);
    } else {
      const sendT = localT - 500;
      let pct = Math.min(100, (sendT/2700)*100);
      const currentBytes = Math.floor((pct/100)*currentFile.size);

      ctx.fillStyle = '#39ff7a';
      ctx.fillText(`SEND: ${currentFile.name}`, 14, 30);
      ctx.fillStyle = '#aaa';
      ctx.fillText(`SIZE: ${formatBytes(currentFile.size)} | BAUD: 19.2K`, 14, 44);

      const barX = 14, barY = 64, barW = Math.max(120, Math.round(W - 28)), barH = 14;
      ctx.strokeStyle = '#39ff7a';
      ctx.strokeRect(barX, barY, barW, barH);

      const segCount = 20;
      const filledSegs = Math.floor((pct/100)*segCount);
      const segW = (barW - 4) / segCount;
      for(let i=0; i<filledSegs; i++){
        ctx.fillStyle = i/segCount > 0.8 ? '#ffe94a' : '#39ff7a';
        ctx.fillRect(Math.round(barX + 2 + i*segW), barY + 2, Math.max(1, Math.round(segW - 1)), barH - 4);
      }

      ctx.fillStyle = '#39ff7a';
      ctx.fillText(`${Math.floor(pct)}%  [${formatBytes(currentBytes)}]`, barX, barY + 18);

      if(localT >= 3200){
        ctx.fillStyle = '#ffe94a';
        if(Math.floor(localT/180)%2 === 0){
          ctx.fillText('TRANSFER COMPLETE', 14, barY + 38);
        }
      }
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- firework ---------- */
function fireworksScene(startTime, done){
  let rockets = [];
  let particles = [];
  let lastLaunch = startTime - 900;
  const palette = ['#ff2bd6','#ffe94a','#39ff7a','#23f6ff','#ff8a23','#ffffff'];

  function launch(){
    rockets.push({
      x: 30 + Math.random() * (W - 60),
      y: H,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(3.2 + Math.random() * 1.5),
      targetY: 40 + Math.random() * (H * 0.45),
      color: palette[Math.floor(Math.random() * palette.length)],
      trail: []
    });
  }

  function explode(r){
    const n = 65;
    const baseColor = r.color;
    for(let i = 0; i < n; i++){
      const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.15;
      const speed = 0.8 + Math.random() * 3.2;
      particles.push({
        x: r.x, y: r.y,
        vx: Math.cos(a) * speed + r.vx * 0.4,
        vy: Math.sin(a) * speed + r.vy * 0.2,
        life: 0,
        maxLife: 700 + Math.random() * 500,
        size: 1.5 + Math.random() * 2,
        color: Math.random() < 0.22 ? '#ffffff' : baseColor,
        decay: 0.965
      });
    }
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    if(t - lastLaunch > 450 + Math.random() * 500){
      lastLaunch = t;
      launch();
    }

    ctx.fillStyle = 'rgba(5, 0, 15, 0.22)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    rockets.forEach(r => {
      r.trail.push({x: r.x, y: r.y});
      if(r.trail.length > 6) r.trail.shift();
      r.x += r.vx;
      r.y += r.vy;
    });

    rockets.forEach(r => {
      if(r.y <= r.targetY){ explode(r); r.dead = true; }
    });
    rockets = rockets.filter(r => !r.dead);

    rockets.forEach(r => {
      if(r.trail.length > 1){
        ctx.beginPath();
        ctx.moveTo(r.trail[0].x, r.trail[0].y);
        for(let i = 1; i < r.trail.length; i++){
          ctx.lineTo(r.trail[i].x, r.trail[i].y);
        }
        ctx.lineTo(r.x, r.y);
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    particles.forEach(p => {
      p.vx *= p.decay;
      p.vy *= p.decay;
      p.vy += 0.045;
      p.x += p.vx;
      p.y += p.vy;
      p.life += 16;
    });
    particles = particles.filter(p => p.life < p.maxLife);

    particles.forEach(p => {
      const progress = p.life / p.maxLife;
      const alpha = Math.max(0, 1 - progress);
      const radius = Math.max(0.4, p.size * (1 - progress * 0.45));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  clearScreen('#05000f');
  rafId = requestAnimationFrame(frame);
}

/* ---------- Lavalamp ---------- */
function lavaLampScene(startTime, done){
  const blobs = Array.from({length: 11}, (_,i)=>({
    x: 40 + Math.random() * (W - 80),
    y: 30 + Math.random() * (H - 60),
    r: 25 + Math.random() * 25,
    vx: (Math.random() < 0.5 ? 1 : -1) * (0.18 + Math.random() * 0.22),
    vy: (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.18),
    phase: Math.random() * Math.PI * 2,
    phaseX: Math.random() * Math.PI * 2,
    hue: 12 + Math.random() * 30
  }));

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }
    const time = elapsed/1000;

    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, '#1a0326');
    grad.addColorStop(1, '#2b0410');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);

    ctx.globalCompositeOperation = 'lighter';
    blobs.forEach(b=>{
      b.x += b.vx;
      b.y += b.vy;
      if(b.x < b.r+10 && b.vx<0) b.vx *= -1;
      if(b.x > W-b.r-10 && b.vx>0) b.vx *= -1;
      if(b.y < b.r+10 && b.vy<0) b.vy *= -1;
      if(b.y > H-b.r-10 && b.vy>0) b.vy *= -1;

      const wobbleX = b.x + Math.sin(time*0.5 + b.phaseX)*15;
      const wobbleY = b.y + Math.cos(time*0.4 + b.phase)*10;

      const rg = ctx.createRadialGradient(wobbleX, wobbleY, 0, wobbleX, wobbleY, b.r);
      const hue = (b.hue + time*4) % 360;
      rg.addColorStop(0, `hsla(${hue},95%,60%,0.55)`);
      rg.addColorStop(1, `hsla(${hue},95%,50%,0)`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(wobbleX, wobbleY, b.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- Mystify ---------- */
function mystifyScene(startTime, done){
  function makeShape(hue){
    return {
      hue,
      pts: Array.from({length:4},()=>({
        x: Math.random()*W, y: Math.random()*H,
        vx:(Math.random()-0.5)*2.4, vy:(Math.random()-0.5)*2.4
      }))
    };
  }
  const shapes = [makeShape(180), makeShape(320)];

  function frame(t){
    const elapsed=t-startTime;
    if(elapsed>=SHOWTIME_MS){ done(); return; }
    ctx.fillStyle='rgba(5,0,15,0.15)';
    ctx.fillRect(0,0,W,H);

    shapes.forEach(s=>{
      s.pts.forEach(p=>{
        p.x+=p.vx; p.y+=p.vy;
        if(p.x<0||p.x>W) p.vx*=-1;
        if(p.y<0||p.y>H) p.vy*=-1;
      });
      s.hue=(s.hue+0.6)%360;
      ctx.strokeStyle=`hsl(${s.hue},90%,60%)`;
      ctx.lineWidth=1.2;
      ctx.beginPath();
      s.pts.forEach((p,i)=> i? ctx.lineTo(p.x,p.y): ctx.moveTo(p.x,p.y));
      ctx.closePath();
      ctx.stroke();
    });

    rafId = requestAnimationFrame(frame);
  }
  clearScreen('#05000f');
  rafId = requestAnimationFrame(frame);
}

/* ---------- PINBALL ---------- */
function pinballScene(startTime, done){
  let ball = {x: W/2, y: 50, vx: 2, vy: 1, r: 4, trail: []};
  
  const bumpers = [
    {x: 70, y: 70, r: 12, color: '#ff2bd6', points: 100},
    {x: 150, y: 70, r: 12, color: '#ff2bd6', points: 100},
    {x: 110, y: 105, r: 15, color: '#ffe94a', points: 250},
    {x: 80, y: 150, r: 10, color: '#23f6ff', points: 50},
    {x: 140, y: 150, r: 10, color: '#23f6ff', points: 50}
  ];

  let flipperL = { angle: 0, targetAngle: 0, x: W/2 - 28, y: H - 28 };
  let flipperR = { angle: 0, targetAngle: 0, x: W/2 + 28, y: H - 28 };
  
  let lastFlipL = startTime;
  let lastFlipR = startTime + 400;
  let flashes = [];
  let score = 0;
  let popups = [];

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    ball.vy += 0.14;
    ball.x += ball.vx; 
    ball.y += ball.vy;

    ball.trail.push({x: ball.x, y: ball.y});
    if(ball.trail.length > 6) ball.trail.shift();

    if(ball.x < 24) { ball.x = 24; ball.vx *= -1.1; }
    if(ball.x > W - 24) { ball.x = W - 24; ball.vx *= -1.1; }
    if(ball.y < 15) { ball.y = 15; ball.vy *= -1.1; }

    bumpers.forEach(b => {
      const dx = ball.x - b.x, dy = ball.y - b.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if(dist < b.r + ball.r){
        const nx = dx / dist, ny = dy / dist;
        const speed = Math.sqrt(ball.vx*ball.vx + ball.vy*ball.vy);
        const bounceSpeed = Math.max(speed * 1.2, 3.8);
        ball.vx = nx * bounceSpeed + (Math.random() - 0.5) * 1;
        ball.vy = ny * bounceSpeed + (Math.random() - 0.5) * 1;
        
        ball.x = b.x + nx * (b.r + ball.r + 1);
        ball.y = b.y + ny * (b.r + ball.r + 1);

        flashes.push({x: b.x, y: b.y, r: b.r, color: b.color, life: 250, maxLife: 250});
        score += b.points;
        popups.push({text: '+' + b.points, x: b.x, y: b.y - 10, life: 300});
      }
    });

    if(t - lastFlipL > 800){
      lastFlipL = t + Math.random() * 300;
      flipperL.targetAngle = -0.7;
      setTimeout(() => { flipperL.targetAngle = 0; }, 150);
    }
    if(t - lastFlipR > 700){
      lastFlipR = t + Math.random() * 300;
      flipperR.targetAngle = 0.7;
      setTimeout(() => { flipperR.targetAngle = 0; }, 150);
    }

    flipperL.angle += (flipperL.targetAngle - flipperL.angle) * 0.4;
    flipperR.angle += (flipperR.targetAngle - flipperR.angle) * 0.4;

    const tipLX = flipperL.x - Math.cos(0.2 + flipperL.angle) * 24;
    const tipLY = flipperL.y + Math.sin(0.2 + flipperL.angle) * 24;
    const lDist = distToSegment({x: ball.x, y: ball.y}, {x: flipperL.x, y: flipperL.y}, {x: tipLX, y: tipLY});
    if(lDist < ball.r + 3 && flipperL.targetAngle !== 0){
      ball.vy = -5.2;
      ball.vx += 2.2;
    }

    const tipRX = flipperR.x + Math.cos(0.2 - flipperR.angle) * 24;
    const tipRY = flipperR.y + Math.sin(0.2 - flipperR.angle) * 24;
    const rDist = distToSegment({x: ball.x, y: ball.y}, {x: flipperR.x, y: flipperR.y}, {x: tipRX, y: tipRY});
    if(rDist < ball.r + 3 && flipperR.targetAngle !== 0){
      ball.vy = -5.2;
      ball.vx -= 2.2;
    }

    if(ball.y > H + 10){
      ball.x = W / 2; ball.y = 40; ball.vx = (Math.random() - 0.5) * 2; ball.vy = 1;
    }

    flashes.forEach(f => f.life -= 16);
    flashes = flashes.filter(f => f.life > 0);

    popups.forEach(p => { p.y -= 0.4; p.life -= 16; });
    popups = popups.filter(p => p.life > 0);

    clearScreen('#050014');

    ctx.strokeStyle = '#3a1a5c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, 10); ctx.lineTo(15, H - 35); ctx.lineTo(W / 2 - 35, H - 10);
    ctx.moveTo(W - 15, 10); ctx.lineTo(W - 15, H - 35); ctx.lineTo(W / 2 + 35, H - 10);
    ctx.stroke();

    bumpers.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(b.x - 3, b.y - 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    });

    flashes.forEach(f => {
      ctx.strokeStyle = f.color;
      ctx.globalAlpha = f.life / f.maxLife;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r + (1 - f.life / f.maxLife) * 10, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    });

    ctx.save();
    ctx.translate(flipperL.x, flipperL.y);
    ctx.rotate(flipperL.angle);
    ctx.fillStyle = '#39ff7a';
    ctx.shadowColor = '#39ff7a';
    ctx.shadowBlur = 6;
    ctx.fillRect(0, -3, 26, 6);
    ctx.restore();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.translate(flipperR.x, flipperR.y);
    ctx.rotate(-flipperR.angle);
    ctx.fillStyle = '#39ff7a';
    ctx.shadowColor = '#39ff7a';
    ctx.shadowBlur = 6;
    ctx.fillRect(-26, -3, 26, 6);
    ctx.restore();
    ctx.shadowBlur = 0;

    ball.trail.forEach((pt, index) => {
      ctx.fillStyle = `rgba(35, 246, 255, ${(index + 1) / ball.trail.length * 0.4})`;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, ball.r * ((index + 1) / ball.trail.length), 0, Math.PI * 2); ctx.fill();
    });

    ctx.fillStyle = '#23f6ff';
    ctx.shadowColor = '#23f6ff';
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    ctx.font = '7px monospace';
    popups.forEach(p => {
      ctx.fillStyle = `rgba(255, 233, 74, ${Math.max(0, p.life / 300)})`;
      ctx.fillText(p.text, p.x - 8, p.y);
    });

    ctx.fillStyle = '#ff2bd6';
    ctx.fillText('SCORE: ' + score, 22, 16);

    rafId = requestAnimationFrame(frame);
  }

  function distToSegment(p, a, b) {
    const l2 = (b.x - a.x)*(b.x - a.x) + (b.y - a.y)*(b.y - a.y);
    if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x)*(b.x - a.x) + (p.y - a.y)*(b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t*(b.x - a.x)), p.y - (a.y + t*(b.y - a.y)));
  }

  rafId = requestAnimationFrame(frame);
}

/* ---------- SOLITAIRE ---------- */
function solitaireScene(startTime, done){
  const suits = [
    {sym: '♥', color: '#ff2bd6'},
    {sym: '♦', color: '#ff2bd6'},
    {sym: '♠', color: '#23f6ff'},
    {sym: '♣', color: '#39ff7a'}
  ];
  const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  let cascade = [];
  let lastSpawn = startTime;
  const cols = 7;
  const dealt = Array.from({length:cols},(_,i)=>({
    x: 8 + i * ((W - 16) / cols), 
    y: 18, 
    n: i + 1,
    cards: Array.from({length: i + 1}, () => ({
      rank: ranks[Math.floor(Math.random() * ranks.length)],
      suit: suits[Math.floor(Math.random() * suits.length)]
    }))
  }));

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    clearScreen('#0a3d1a');

    ctx.strokeStyle = '#052611';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    if(elapsed < 2600){
      const dealProgress = elapsed / 2600;
      dealt.forEach(col => {
        const shown = Math.floor(dealProgress * col.n * 1.4);
        for(let k = 0; k < Math.min(shown, col.n); k++){
          const cx = col.x;
          const cy = col.y + k * 8;
          const card = col.cards[k];

          ctx.fillStyle = '#f4f4f4';
          ctx.fillRect(cx, cy, 20, 28);
          ctx.strokeStyle = '#ccc';
          ctx.strokeRect(cx, cy, 20, 28);

          ctx.fillStyle = card.suit.color;
          ctx.font = '6px monospace';
          ctx.textBaseline = 'top';
          ctx.fillText(card.rank, cx + 2, cy + 2);
          ctx.font = '8px monospace';
          ctx.fillText(card.suit.sym, cx + 6, cy + 12);
        }
      });
    } else {
      if(t - lastSpawn > 110){
        lastSpawn = t;
        cascade.push({
          x: 20 + Math.random() * (W - 40), 
          y: -30,
          vx: (Math.random() - 0.5) * 2.2, 
          vy: 1 + Math.random() * 1.5,
          rank: ranks[Math.floor(Math.random() * ranks.length)],
          suit: suits[Math.floor(Math.random() * suits.length)],
          bounces: 0
        });
      }

      cascade.forEach(c => {
        c.vy += 0.16;
        c.x += c.vx; 
        c.y += c.vy;
        if(c.y > H - 34 && c.vy > 0){ 
          c.vy *= -0.68; 
          c.bounces++; 
        }
        if(c.x < 10 || c.x > W - 26) c.vx *= -1;
      });
      cascade = cascade.filter(c => c.bounces < 4);

      cascade.forEach(c => {
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(c.x, c.y, 16, 24);
        ctx.strokeStyle = '#333';
        ctx.strokeRect(c.x, c.y, 16, 24);

        ctx.fillStyle = c.suit.color;
        ctx.font = '5px monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(c.rank, c.x + 2, c.y + 2);
        ctx.font = '7px monospace';
        ctx.fillText(c.suit.sym, c.x + 5, c.y + 10);
      });
    }

    rafId = requestAnimationFrame(frame);
  }
  
  rafId = requestAnimationFrame(frame);
}

/* ---------- POOL ---------- */
function poolScene(startTime, done){
  const ballData = [
    {color: '#ffe94a', label: '1'}, 
    {color: '#23f6ff', label: '2'}, 
    {color: '#ff2bd6', label: '3'}, 
    {color: '#a020f0', label: '4'}, 
    {color: '#ff8a23', label: '5'}, 
    {color: '#39ff7a', label: '6'}, 
    {color: '#8a5a2a', label: '7'}, 
    {color: '#111111', label: '8'}, 
    {color: '#ffe94a', label: '9'}, 
    {color: '#23f6ff', label: '10'},
    {color: '#ff2bd6', label: '11'},
    {color: '#a020f0', label: '12'},
    {color: '#ff8a23', label: '13'},
    {color: '#39ff7a', label: '14'}
  ];

  let balls;
  let cueBall;
  let shootTimer = startTime;
  let cueState = 'idle';
  let cueAngle = 0;
  let cuePullback = 0;
  let targetBall = null;

  function rack(){
    balls = [];
    let id = 0;
    const startX = W * 0.62, startY = H / 2;
    const spacing = 8.2;

    for(let row = 0; row < 5; row++){
      for(let k = 0; k <= row; k++){
        const bx = startX + row * (spacing * 0.866);
        const by = startY - (row * spacing / 2) + (k * spacing);
        const data = ballData[id % ballData.length];
        balls.push({
          x: bx, y: by, 
          vx: 0, vy: 0, 
          r: 4, 
          color: data.color, 
          label: data.label,
          isCue: false
        });
        id++;
      }
    }

    cueBall = {
      x: W * 0.25, 
      y: H / 2, 
      vx: 0, 
      vy: 0, 
      r: 4, 
      color: '#ffffff', 
      label: '', 
      isCue: true
    };
    balls.push(cueBall);
    cueState = 'idle';
  }

  rack();
  let settleTimer = 0;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    const moving = balls.some(b => Math.abs(b.vx) > 0.06 || Math.abs(b.vy) > 0.06);

    if(!moving){
      settleTimer += 16;
      if(settleTimer > 600 && cueState === 'idle'){
        const activeBalls = balls.filter(b => !b.isCue);
        targetBall = activeBalls[Math.floor(Math.random() * activeBalls.length)];
        
        const dx = targetBall.x - cueBall.x;
        const dy = targetBall.y - cueBall.y;
        cueAngle = Math.atan2(dy, dx);
        cueState = 'aiming';
        cuePullback = 0;
      }

      if(cueState === 'aiming'){
        cuePullback += 0.8;
        if(cuePullback > 18){
          cueState = 'strike';
          const strikeSpeed = 7.5;
          cueBall.vx = Math.cos(cueAngle) * strikeSpeed;
          cueBall.vy = Math.sin(cueAngle) * strikeSpeed;
        }
      }
    } else {
      settleTimer = 0;
      if(cueState !== 'idle' && cuePullback > 0){
        cuePullback -= 2;
        if(cuePullback <= 0) cueState = 'idle';
      }
    }

    balls.forEach(b => {
      b.x += b.vx; 
      b.y += b.vy;
      b.vx *= 0.988; 
      b.vy *= 0.988;

      const margin = 14;
      if(b.x < margin + b.r) { b.x = margin + b.r; b.vx *= -1.05; }
      if(b.x > W - margin - b.r) { b.x = W - margin - b.r; b.vx *= -1.05; }
      if(b.y < margin + b.r) { b.y = margin + b.r; b.vy *= -1.05; }
      if(b.y > H - margin - b.r) { b.y = H - margin - b.r; b.vy *= -1.05; }
    });

    for(let i = 0; i < balls.length; i++){
      for(let j = i + 1; j < balls.length; j++){
        const a = balls[i], b = balls[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const minDist = a.r + b.r;

        if(dist < minDist && dist > 0){
          const nx = dx / dist, ny = dy / dist;
          const overlap = (minDist - dist) / 2;
          
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;

          const kx = a.vx - b.vx, ky = a.vy - b.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;

          a.vx -= p * nx * 1.05;
          a.vy -= p * ny * 1.05;
          b.vx += p * nx * 1.05;
          b.vy += p * ny * 1.05;
        }
      }
    }

    if(!moving && settleTimer > 2500){
      rack();
      settleTimer = 0;
    }

    clearScreen('#052b11');

    ctx.strokeStyle = '#3d1a04'; 
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    
    ctx.strokeStyle = '#073b18'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    if(cueState !== 'idle' && !moving){
      ctx.save();
      ctx.translate(cueBall.x, cueBall.y);
      ctx.rotate(cueAngle);
      ctx.fillStyle = '#c88a44';
      ctx.fillRect(-cueBall.r - 55 - cuePullback, -1.5, 50, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-cueBall.r - 6 - cuePullback, -1.5, 5, 3);
      ctx.restore();
    }

    balls.forEach(b => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.arc(b.x + 1, b.y + 2, b.r, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.arc(b.x - 1.2, b.y - 1.2, 1.2, 0, Math.PI * 2); ctx.fill();

      if(!b.isCue && b.label){
        ctx.fillStyle = b.color === '#fff' ? '#000' : '#ffffff';
        ctx.font = '5px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.label, b.x, b.y);
      }
    });

    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);
}

/* ---------- STARWARS WARP ---------- */
function starfieldWarpScene(startTime, done){
  const maxDist = Math.hypot(W, H) * 0.75;
  const stars = Array.from({length: 180}, () => ({
    a: Math.random() * Math.PI * 2,
    d: Math.random() * maxDist,
    speed: 1.0 + Math.random() * 2.5,
    color: ['#ffffff', '#e0f7fa', '#b2ebf2', '#c5cae9'][Math.floor(Math.random() * 4)]
  }));
  const cx = W / 2, cy = H / 2;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    ctx.fillStyle = 'rgba(0, 0, 15, 0.28)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    stars.forEach(s => {
      const oldD = s.d;
      s.d += s.speed * (1.2 + s.d * 0.02);
      s.speed = Math.min(15, s.speed * 1.012);

      if(s.d > maxDist){
        s.d = 2;
        s.speed = 1.0 + Math.random() * 2.0;
        s.a = Math.random() * Math.PI * 2;
      }

      const x1 = cx + Math.cos(s.a) * oldD;
      const y1 = cy + Math.sin(s.a) * oldD;
      const x2 = cx + Math.cos(s.a) * s.d;
      const y2 = cy + Math.sin(s.a) * s.d;

      const progress = s.d / maxDist;
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = Math.min(1, progress * 1.6);
      ctx.lineWidth = Math.max(0.6, progress * 2.6);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  clearScreen('#00000a');
  rafId = requestAnimationFrame(frame);
}

/* ---------- REWIND VHS ---------- */
function vhsRewindScene(startTime, done){
  const bands = Array.from({length: 14}, () => ({ 
    y: Math.random() * H, 
    h: 6 + Math.random() * 24, 
    speed: 6 + Math.random() * 12,
    alpha: 0.03 + Math.random() * 0.12,
    distortion: (Math.random() - 0.5) * 30
  }));

  const CREDITS = [
    { role: 'DIRECTED BY', name: 'SAROOVSKI' },
    { role: 'PRODUCED BY', name: 'DESMOND OKAFOR-LYNCH' },
    { role: 'WRITTEN BY', name: 'ILSE KRANTZ' },
    { role: 'STARRING', name: 'RONAN ASHGROVE' },
    { role: '', name: 'CELESTE MARLOWE' },
    { role: '', name: 'THEO BRANNIGAN' },
    { role: 'DIRECTOR OF PHOTOGRAPHY', name: 'YUKI SANDOVAL' },
    { role: 'ORIGINAL SCORE BY', name: 'AUGUSTINE FERRO' },
    { role: 'CASTING BY', name: 'NADIA VONNEGUT-HALE' },
    { role: '© COPYRIGHT', name: 'SAROOVSKI 2026' },
  ];
  const LINE_H = 20;
  const BLOCK_GAP = 34;

  let cursor = 0;
  const layout = CREDITS.map(c => {
    const y = cursor;
    cursor += (c.role ? LINE_H : 0) + LINE_H + BLOCK_GAP;
    return { ...c, blockY: y };
  });
  const totalHeight = cursor;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    ctx.fillStyle = 'rgba(5, 5, 5, 0.4)';
    ctx.fillRect(0, 0, W, H);

    const staticCount = Math.floor(H * 0.4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for(let i = 0; i < staticCount; i++){
      const ny = Math.random() * H;
      const nw = Math.random() * W * 0.8;
      const nx = Math.random() * (W - nw);
      ctx.fillRect(nx, ny, nw, Math.random() * 2);
    }

    bands.forEach(b => {
      b.y -= b.speed;
      if(b.y < -b.h) b.y = H + b.h;
      ctx.fillStyle = `rgba(200, 230, 255, ${b.alpha})`;
      ctx.fillRect(0, b.y, W, b.h);
      ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(0, 255, 255, 0.6)' : 'rgba(255, 0, 128, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, b.y);
      ctx.lineTo(W, b.y);
      ctx.stroke();
    });

    const progress = elapsed / SHOWTIME_MS;
    const reverseProgress = 1 - progress;
    const scrollY = (H + 40) - reverseProgress * (totalHeight + H + 80);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(235, 235, 235, 0.85)';
    ctx.font = '12px monospace';
    layout.forEach(c => {
      const jitterX = (Math.random() - 0.5) * 2;
      const roleY = scrollY + c.blockY;
      const nameY = roleY + (c.role ? LINE_H : 0);
      if(roleY > -20 && roleY < H + 20){
        if(c.role){
          ctx.font = '11px monospace';
          ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
          ctx.fillText(c.role, W/2 + jitterX, roleY);
        }
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
        ctx.fillText(c.name, W/2 + jitterX, nameY);
      }
    });
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for(let y = 0; y < H; y += 2){
      ctx.fillRect(0, y, W, 1);
    }

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 14px monospace';
    ctx.shadowColor = '#00FF00';
    ctx.shadowBlur = 6;

    if(Math.floor(elapsed / 250) % 2 === 0){ 
      const jitterX = (Math.random() - 0.5) * 2;
      const jitterY = (Math.random() - 0.5) * 2;
      ctx.fillText('◄◄ REW', 16 + jitterX, 28 + jitterY); 
    }

    const startSeconds = 2 * 3600 + 19 * 60 + 40;
	const fakeSeconds = Math.max(0, startSeconds - Math.floor(elapsed / 80));
	const hrs = Math.floor(fakeSeconds / 3600);
	const mins = Math.floor((fakeSeconds % 3600) / 60);
	const secs = fakeSeconds % 60;
	const timeCode = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    ctx.fillText(timeCode, W - 90, 28);

    ctx.shadowBlur = 0;

    rafId = requestAnimationFrame(frame);
  }
  
  rafId = requestAnimationFrame(frame);
}

/* ---------- DIGITAL PET ---------- */
function digitalPetScene(startTime, done){
  let bob=0, blinkTimer=0, blinking=false, hearts=[];
  let lastHeart = startTime;
  
  const thoughtItems = [
    { text: '♥' },
    { text: '🛁' },
    { text: '🍕' }
  ];
  let thoughtIndex = 0;
  let currentThought = thoughtItems[thoughtIndex];
  let thoughtSwitchTimer = 0;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    bob = Math.sin(elapsed * 0.005) * 4;
    blinkTimer -= 16;
    if(blinkTimer <= 0){ blinking = !blinking; blinkTimer = blinking ? 120 : 1800 + Math.random() * 1500; }

    thoughtSwitchTimer += 16;
    if(thoughtSwitchTimer > 500){
      thoughtSwitchTimer = 0;
      thoughtIndex = (thoughtIndex + 1) % thoughtItems.length;
      currentThought = thoughtItems[thoughtIndex];
    }

    if(t-lastHeart > 1600){
      lastHeart=t;
      hearts.push({x:W/2+(Math.random()-0.5)*20, y:H/2-10, life:900});
    }
    hearts.forEach(h=>{ h.y -= 0.4; h.life -= 16; });
    hearts = hearts.filter(h=>h.life>0);

    clearScreen('#2a1420');
    ctx.strokeStyle='#5a2a42'; ctx.lineWidth=6;
    ctx.strokeRect(6,6,W-12,H-12);

    const cx=W/2, cy=H/2+bob;

    const bodyColor = '#ffb3d1';
    const innerEar = '#ffe0ec';
    const outline = '#5a2a42';

    ctx.fillStyle=bodyColor;
    ctx.beginPath();
    ctx.moveTo(cx-16, cy-18);
    ctx.lineTo(cx-26, cy-34);
    ctx.lineTo(cx-8, cy-22);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx+16, cy-18);
    ctx.lineTo(cx+26, cy-34);
    ctx.lineTo(cx+8, cy-22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle=innerEar;
    ctx.beginPath();
    ctx.moveTo(cx-18, cy-21);
    ctx.lineTo(cx-23, cy-30);
    ctx.lineTo(cx-11, cy-22);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx+18, cy-21);
    ctx.lineTo(cx+23, cy-30);
    ctx.lineTo(cx+11, cy-22);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle=bodyColor;
    ctx.strokeStyle=outline;
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(cx,cy,26,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx-14,cy+20,10,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx+14,cy+20,10,0,Math.PI*2); ctx.fill(); ctx.stroke();

    ctx.fillStyle='rgba(255, 255, 255, 0.55)';
    ctx.beginPath(); ctx.arc(cx-15, cy+3, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+15, cy+3, 4.5, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle='#5a2a42';
    if(blinking){
      ctx.fillRect(cx-12,cy-2,8,2);
      ctx.fillRect(cx+4,cy-2,8,2);
    } else {
      ctx.beginPath(); ctx.arc(cx-8,cy-2,3.5,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+8,cy-2,3.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#ffffff';
      ctx.beginPath(); ctx.arc(cx-7,cy-3.5,1.2,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx+9,cy-3.5,1.2,0,Math.PI*2); ctx.fill();
    }

    ctx.strokeStyle='#5a2a42'; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.moveTo(cx-4, cy+7);
    ctx.quadraticCurveTo(cx-2, cy+10, cx, cy+7);
    ctx.quadraticCurveTo(cx+2, cy+10, cx+4, cy+7);
    ctx.stroke();

    const cloudX = cx + 40;
    const cloudY = cy - 58;
    ctx.save();

    ctx.fillStyle = 'rgba(20, 10, 18, 0.65)';
    ctx.beginPath();
    ctx.arc(cloudX, cloudY - 4, 14, 0, Math.PI*2);
    ctx.fill();

    ctx.strokeStyle = outline;
    ctx.lineWidth = 1.4;

    ctx.beginPath(); ctx.arc(cloudX - 14, cloudY + 20, 2, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cloudX - 6, cloudY + 10, 3.2, 0, Math.PI*2); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cloudX - 16, cloudY + 4);
    ctx.bezierCurveTo(cloudX - 22, cloudY + 2, cloudX - 22, cloudY - 9, cloudX - 13, cloudY - 10);
    ctx.bezierCurveTo(cloudX - 13, cloudY - 19, cloudX - 1, cloudY - 20, cloudX + 2, cloudY - 12);
    ctx.bezierCurveTo(cloudX + 10, cloudY - 17, cloudX + 20, cloudY - 10, cloudX + 15, cloudY - 3);
    ctx.bezierCurveTo(cloudX + 22, cloudY - 1, cloudX + 20, cloudY + 8, cloudX + 12, cloudY + 7);
    ctx.bezierCurveTo(cloudX + 8, cloudY + 11, cloudX - 8, cloudY + 11, cloudX - 16, cloudY + 4);
    ctx.closePath();
    ctx.stroke();

    ctx.font = '16px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(currentThought.text, cloudX, cloudY - 4);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.fillStyle='#ff6a9a';
    ctx.font='10px monospace';
    ctx.textAlign='left';
    ctx.textBaseline='alphabetic';
    hearts.forEach(h=>{
      ctx.globalAlpha = h.life/900;
      ctx.fillText('♥', h.x, h.y);
      ctx.globalAlpha = 1;
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- BUTTERFLIES ---------- */
function flyingButterflies(startTime, done){
  const palettes = [
    ['#ff6b9d','#ffc93c'],
    ['#a29bfe','#74b9ff'],
    ['#ff9f43','#ffeaa7'],
    ['#55efc4','#00cec9'],
    ['#e84393','#fd79a8'],
    ['#00b894','#55efc4'],
    ['#e17055','#fab1a0'],
    ['#d63031','#ffeaa7'],
    ['#6c5ce7','#a29bfe']
  ];

  const objs = Array.from({length:18},()=>{
    const [c1,c2] = palettes[Math.floor(Math.random()*palettes.length)];
    const angle = Math.random()*Math.PI*2;
    const speed = 0.4 + Math.random()*1.2;
    return {
      x: Math.random()*W,
      y: Math.random()*H,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle: angle,
      targetAngle: angle,
      turnTimer: Math.random()*150,
      wingPhase: Math.random()*Math.PI*2,
      wingSpeed: 0.15 + Math.random()*0.15,
      size: 7 + Math.random()*9,
      colorA: c1,
      colorB: c2
    };
  });

  function drawWing(o, side, flap, rot){
    const s = o.size;
    const dir = side;

    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(rot);
    ctx.scale(dir * (1 - flap*0.85), 1);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s*0.3, -s*1.3, s*1.6, -s*1.1, s*1.5, -s*0.1);
    ctx.bezierCurveTo(s*1.4, s*0.3, s*0.5, s*0.15, 0, 0);
    ctx.closePath();
    ctx.fillStyle = o.colorA;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s*0.2, s*0.6, s*1.1, s*1.0, s*0.9, s*0.3);
    ctx.bezierCurveTo(s*0.8, 0, s*0.4, s*0.05, 0, 0);
    ctx.closePath();
    ctx.fillStyle = o.colorB;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(s*0.85, -s*0.35, s*0.18, s*0.14, 0, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    ctx.restore();
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    clearScreen('#0a1030');

    objs.forEach(o => {
      o.turnTimer--;
      if(o.turnTimer <= 0) {
        o.targetAngle = Math.random() * Math.PI * 2;
        o.turnTimer = 80 + Math.random() * 200;
      }
      
      const diff = ((o.targetAngle - o.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      o.angle += diff * 0.03;
      
      const speed = Math.hypot(o.vx, o.vy) || 0.8;
      o.vx = Math.cos(o.angle) * speed;
      o.vy = Math.sin(o.angle) * speed;

      o.x += o.vx;
      o.y += o.vy;

      if(o.x < -30) o.x = W + 30;
      if(o.x > W + 30) o.x = -30;
      if(o.y < -30) o.y = H + 30;
      if(o.y > H + 30) o.y = -30;

      o.wingPhase += o.wingSpeed;
      const flap = (Math.sin(o.wingPhase) + 1) / 2;

      const moveRot = Math.atan2(o.vy, o.vx) + Math.PI / 2;
      drawWing(o, -1, flap, moveRot);
      drawWing(o, 1, flap, moveRot);

      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(moveRot);

      ctx.strokeStyle = '#3a2e2e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -o.size*0.7);
      ctx.lineTo(0, o.size*0.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, -o.size*0.65);
      ctx.quadraticCurveTo(-4, -o.size*1.1, -6, -o.size*1.3);
      ctx.moveTo(0, -o.size*0.65);
      ctx.quadraticCurveTo(4, -o.size*1.1, 6, -o.size*1.3);
      ctx.strokeStyle = '#3a2e2e';
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.restore();
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- PRISMA ---------- */
function prismSweepScene(startTime, done){
  function frame(t){
    const elapsed=t-startTime;
    if(elapsed>=SHOWTIME_MS){ done(); return; }
    const time = elapsed/1000;

    clearScreen('#050505');
    ctx.save();
    ctx.beginPath();
    ctx.arc(W/2,H/2,90,0,Math.PI*2);
    ctx.clip();

    ctx.fillStyle='#111';
    ctx.fillRect(0,0,W,H);
    for(let r=90;r>10;r-=3){
      ctx.strokeStyle='rgba(255,255,255,0.04)';
      ctx.beginPath(); ctx.arc(W/2,H/2,r,0,Math.PI*2); ctx.stroke();
    }

    const grad = ctx.createLinearGradient(0,0,W,H);
    const hueBase = (time*60)%360;
    for(let i=0;i<=6;i++){
      grad.addColorStop(i/6, `hsla(${(hueBase+i*60)%360},90%,60%,0.5)`);
    }
    ctx.translate(W/2,H/2);
    ctx.rotate(time*0.6);
    ctx.translate(-W/2,-H/2);
    ctx.fillStyle = grad;
    ctx.fillRect(-50,-50,W+100,H+100);

    ctx.fillStyle='#050505';
    ctx.beginPath(); ctx.arc(W/2,H/2,12,0,Math.PI*2); ctx.fill();
    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- GROWING TREE ---------- */
function plantGrowthScene(startTime, done){
  function drawBranch(x, y, len, angle, depth, progress){
    if(depth <= 0) return;

    const level = 6 - depth;
    const startThreshold = level * 0.12;
    const branchProgress = Math.max(0, Math.min(1, (progress - startThreshold) / 0.3));

    if (branchProgress <= 0) return;

    const currentLen = len * branchProgress;
    const endX = x + Math.cos(angle) * currentLen;
    const endY = y - Math.sin(angle) * currentLen;

    ctx.strokeStyle = depth <= 2 ? '#39ff7a' : '#1fa858';
    ctx.lineWidth = Math.max(1, depth);
    ctx.beginPath(); 
    ctx.moveTo(x, y); 
    ctx.lineTo(endX, endY); 
    ctx.stroke();

    if(depth === 1 && branchProgress >= 0.8){
      ctx.fillStyle = '#ffe94a';
      ctx.beginPath(); 
      ctx.arc(endX, endY, 2, 0, Math.PI * 2); 
      ctx.fill();
    }

    drawBranch(endX, endY, len * 0.76, angle + 0.52, depth - 1, progress);
    drawBranch(endX, endY, len * 0.64, angle - 0.38, depth - 1, progress);
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    const growth = Math.min(1, elapsed / SHOWTIME_MS);

    clearScreen('#0a0620');
    drawBranch(W/2, H-10, 38, Math.PI/2, 6, growth);

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- BALLPIT ---------- */
function ballPitScene(startTime, done){
  const colors = ['#ff2bd6','#23f6ff','#ffe94a','#39ff7a','#ff8a23'];
  let balls = [];
  let lastDrop = startTime;

  function frame(t){
    const elapsed=t-startTime;
    if(elapsed>=SHOWTIME_MS){ done(); return; }

    if(t-lastDrop > 220 && balls.length<40){
      lastDrop=t;
      balls.push({ x:20+Math.random()*(W-40), y:-10, vx:(Math.random()-0.5)*1.5, vy:0, r:7, color: colors[Math.floor(Math.random()*colors.length)] });
    }

    balls.forEach(b=>{
      b.vy += 0.25;
      b.x+=b.vx; b.y+=b.vy;
      if(b.x<b.r){ b.x=b.r; b.vx*=-0.85; }
      if(b.x>W-b.r){ b.x=W-b.r; b.vx*=-0.85; }
      if(b.y>H-b.r){ b.y=H-b.r; b.vy*=-0.78; b.vx*=0.97; }
    });
    for(let i=0;i<balls.length;i++){
      for(let j=i+1;j<balls.length;j++){
        const a=balls[i], b=balls[j];
        const dx=b.x-a.x, dy=b.y-a.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const minD=a.r+b.r;
        if(dist<minD && dist>0){
          const nx=dx/dist, ny=dy/dist;
          const overlap=(minD-dist)/2;
          a.x-=nx*overlap; a.y-=ny*overlap;
          b.x+=nx*overlap; b.y+=ny*overlap;
          const kx = a.vx - b.vx;
          const ky = a.vy - b.vy;
          const p = nx * kx + ny * ky;
          if(p < 0){
            a.vx -= p * nx * 0.75;
            a.vy -= p * ny * 0.75;
            b.vx += p * nx * 0.75;
            b.vy += p * ny * 0.75;
          }
        }
      }
    }

    clearScreen('#050014');
    balls.forEach(b=>{
      ctx.fillStyle=b.color;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}
/* ---------- STARWARS LIGHTSABER ---------- */
function starWarsLightsaberScene(startTime, done){
  const stars = Array.from({length:50},()=>({x:Math.random()*W, y:Math.random()*H, s:Math.random()}));
  let sparks = [];
  let lastSparkBurst = startTime;
  let shake = 0;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    clearScreen('#000');
    ctx.fillStyle='#fff';
    stars.forEach(s=>{ ctx.globalAlpha = 0.5 + s.s*0.5; ctx.fillRect(s.x,s.y,1,1); });
    ctx.globalAlpha = 1;

    const centerX = W/2, centerY = H/2;

    const ignite = Math.min(1, elapsed/400);
    const swing = Math.sin(elapsed*0.0035) * 22;
    const clash = Math.sin(elapsed*0.02) * 4;
    const contactX = centerX + Math.sin(elapsed*0.0017)*10;
    const contactY = centerY - 10 + Math.cos(elapsed*0.0021)*6;

    shake *= 0.85;

    ctx.save();
    ctx.translate((Math.random()-0.5)*shake, (Math.random()-0.5)*shake);

    function drawBlade(hiltX, hiltY, tipX, tipY, coreColor, glowColor){
      const flicker = 0.85 + Math.random()*0.15;
      ctx.save();
      ctx.shadowBlur = 14*ignite*flicker;
      ctx.shadowColor = glowColor;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 6*ignite;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(hiltX,hiltY);
      ctx.lineTo(hiltX+(tipX-hiltX)*ignite, hiltY+(tipY-hiltY)*ignite);
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 6*ignite;
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 2.2*ignite*flicker;
      ctx.beginPath();
      ctx.moveTo(hiltX,hiltY);
      ctx.lineTo(hiltX+(tipX-hiltX)*ignite, hiltY+(tipY-hiltY)*ignite);
      ctx.stroke();
      ctx.restore();
    }

    function drawHilt(x,y,angle){
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(angle);
      ctx.fillStyle = '#555';
      ctx.fillRect(-3, 0, 6, 16);
      ctx.fillStyle = '#888';
      ctx.fillRect(-3, 4, 6, 2);
      ctx.restore();
    }

    const blueHiltX = centerX - 42 - swing*0.4;
    const blueHiltY = centerY + 32;
    const blueAngle = Math.atan2(contactY-blueHiltY, contactX-blueHiltX);
    drawHilt(blueHiltX, blueHiltY, blueAngle+Math.PI/2);
    drawBlade(blueHiltX, blueHiltY, contactX-clash, contactY-clash, '#bfeeff', '#2aa0ff');

    const redHiltX = centerX + 42 + swing*0.4;
    const redHiltY = centerY + 32;
    const redAngle = Math.atan2(contactY-redHiltY, contactX-redHiltX);
    drawHilt(redHiltX, redHiltY, redAngle+Math.PI/2);
    drawBlade(redHiltX, redHiltY, contactX+clash, contactY+clash, '#ffc9c9', '#ff2a2a');

    if(t - lastSparkBurst > 90 && ignite>0.9){
      lastSparkBurst = t;
      shake = 2.5;
      for(let i=0;i<7;i++){
        const a = Math.random()*Math.PI*2;
        const speed = 0.6+Math.random()*2.2;
        sparks.push({
          x: contactX, y: contactY,
          vx: Math.cos(a)*speed, vy: Math.sin(a)*speed - 0.4,
          life: 200+Math.random()*180
        });
      }
    }
    sparks.forEach(s=>{
      s.vy += 0.05;
      s.x += s.vx; s.y += s.vy;
      s.life -= 16;
    });
    sparks = sparks.filter(s=>s.life>0);
    sparks.forEach(s=>{
      ctx.globalAlpha = Math.max(0, s.life/300);
      ctx.fillStyle = Math.random()<0.5 ? '#fffaaa' : '#fff';
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- CAT ---------- */
function catScene(startTime, done){
  let x = -20;
  let blinkTimer=0, blinking=false, tailPhase=0;

  function frame(t){
    const elapsed=t-startTime;
    if(elapsed>=SHOWTIME_MS){ done(); return; }

    x += 0.6;
    if(x>W+20){ x=-20; }
    tailPhase += 0.12;
    blinkTimer -= 16;
    if(blinkTimer<=0){ blinking=!blinking; blinkTimer = blinking?100:1500+Math.random()*1500; }

    clearScreen('#0a0a1a');

    const moonX = W * 0.78;
    const moonY = H * 0.25;
    const moonR = 28;

    ctx.save();
    const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.5);
    glow.addColorStop(0, 'rgba(255, 255, 220, 0.25)');
    glow.addColorStop(1, 'rgba(255, 255, 220, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff9d6';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle='#1a1a2e';
    ctx.fillRect(0,H-20,W,20);

    const groundY = H-20;
    const bob = Math.abs(Math.sin(elapsed*0.01))*2;
    const catY = groundY - 18 - bob;

    ctx.fillStyle='#3a3a3a';
    ctx.fillRect(x, catY, 26, 12);
    ctx.fillRect(x+22, catY-8, 12, 10);
    ctx.beginPath();
    ctx.moveTo(x+22,catY-8); ctx.lineTo(x+25,catY-14); ctx.lineTo(x+27,catY-8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x+29,catY-8); ctx.lineTo(x+32,catY-14); ctx.lineTo(x+33,catY-8);
    ctx.fill();
    ctx.fillRect(x+2, catY+10, 3, 6);
    ctx.fillRect(x+10, catY+10, 3, 6);
    ctx.fillRect(x+16, catY+10, 3, 6);
    ctx.fillRect(x+22, catY+10, 3, 6);

    const tailY = catY+2+Math.sin(tailPhase)*6;
    ctx.strokeStyle='#3a3a3a'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath();
    ctx.moveTo(x, catY+4);
    ctx.quadraticCurveTo(x-10, catY, x-12, tailY);
    ctx.stroke();

    if(!blinking){
      ctx.fillStyle='#8dffb0';
      ctx.fillRect(x+25,catY-5,2,2);
      ctx.fillRect(x+30,catY-5,2,2);
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- UFO ---------- */
function ufoScene(startTime, done){
  const ufos = Array.from({length:4},(_,i)=>({
    x: Math.random()*W,
    baseY: 25 + i*38 + Math.random()*15,
    y: 0,
    speedX: 0.5 + Math.random()*1,
    freqY: 0.0015 + Math.random()*0.0015,
    phaseY: Math.random() * Math.PI * 2,
    ampY: 10 + Math.random()*15,
    beamOn: false,
    beamTimer: Math.random()*1000
  }));
  const stars = Array.from({length:40},()=>({x:Math.random()*W,y:Math.random()*H}));

  function frame(t){
    const elapsed=t-startTime;
    if(elapsed>=SHOWTIME_MS){ done(); return; }

    clearScreen('#000010');
    ctx.fillStyle='#fff';
    stars.forEach(s=> ctx.fillRect(s.x,s.y,1,1));

    ufos.forEach(u=>{
      u.x += u.speedX;
      if(u.x > W + 40) u.x = -40;

      u.y = u.baseY + Math.sin(t * u.freqY + u.phaseY) * u.ampY;

      u.beamTimer -= 16;
      if(u.beamTimer<=0){
        u.beamOn = !u.beamOn;
        u.beamTimer = u.beamOn ? 1500 + Math.random()*1000 : 500 + Math.random()*500;
      }

      if(u.beamOn){
        ctx.save();
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 24;
        ctx.fillStyle = 'rgba(57,255,20,0.35)';
        ctx.beginPath();
        ctx.moveTo(u.x-10, u.y+6);
        ctx.lineTo(u.x+10, u.y+6);
        ctx.lineTo(u.x+24, u.y+65);
        ctx.lineTo(u.x-24, u.y+65);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle='#7a8aa0';
      ctx.beginPath(); ctx.ellipse(u.x,u.y,18,6,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#c0e8ff';
      ctx.beginPath(); ctx.arc(u.x,u.y-4,8,Math.PI,0); ctx.fill();

      const blink = Math.floor(elapsed/150)%2===0;
      const blinkColor = blink ? '#39ff14' : '#ffe94a';
      
      ctx.save();
      ctx.shadowColor = blinkColor;
      ctx.shadowBlur = blink ? 14 : 6;
      ctx.fillStyle = blinkColor;
      for(let i=-1;i<=1;i++){
        ctx.beginPath();
        ctx.arc(u.x+i*10, u.y+4, 1.5, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- STARWARDS INTRO CRAWL ---------- */
function starWarsCrawlScene(startTime, done){
  const lines = [
    'THE OUTER RIM DRIFTS',
    'IN UNEASY QUIET.',
    '',
    'A LONE STAR CRUISER',
    'CARRIES SECRET PLANS',
    'ACROSS THE VOID...',
    '',
    'BOUNDLESS COURAGE',
    'PROVES SHE CAN DO',
    'ANYTHING...' 
  ];
  const stars = Array.from({length:50},()=>({x:Math.random()*W,y:Math.random()*H,s:Math.random()}));
  let shipX = -30;

  function frame(t){
    const elapsed=t-startTime;
    if(elapsed>=SHOWTIME_MS){ done(); return; }

    clearScreen('#000');
    ctx.fillStyle='#fff';
    stars.forEach(s=>{ ctx.globalAlpha=0.5+s.s*0.5; ctx.fillRect(s.x,s.y,1,1); });
    ctx.globalAlpha=1;

    if(elapsed < 2500){
      shipX = -30 + (elapsed/2500)*(W+60);
      ctx.fillStyle='#888';
      ctx.beginPath();
      ctx.moveTo(shipX,H*0.25);
      ctx.lineTo(shipX-22,H*0.25+8);
      ctx.lineTo(shipX-22,H*0.25-8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    ctx.translate(W/2, H);
    ctx.font='15px monospace';
    ctx.textAlign='center';
    ctx.fillStyle='#ffe94a';
    const scrollSpeed = 0.018;
    lines.forEach((line,i)=>{
      const baseY = -((elapsed*scrollSpeed) - i*14);
      if(baseY > -160 && baseY < 10){
        const scale = Math.max(0.15, 1 + baseY/160);
        ctx.save();
        ctx.translate(0, baseY);
        ctx.scale(scale, scale);
        ctx.fillText(line, 0, 0);
        ctx.restore();
      }
    });
    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- SOLAR SYSTEM ---------- */
function solarSystemScene(startTime, done){
  const stars = Array.from({length:60},()=>({
    x: Math.random()*W, y: Math.random()*H, s: Math.random()
  }));

  const cx = W/2, cy = H/2;

  const planets = [
    { name:'mercury', r: 18, size: 2,   color:'#b5b0a8', speed: 0.0032, angle: Math.random()*Math.PI*2 },
    { name:'venus',   r: 26, size: 3,   color:'#e0c07a', speed: 0.0024, angle: Math.random()*Math.PI*2 },
    { name:'earth',   r: 36, size: 3.2, color:'#4a9dff', speed: 0.0018, angle: Math.random()*Math.PI*2, moon:true },
    { name:'mars',    r: 46, size: 2.6, color:'#ff6a3c', speed: 0.0014, angle: Math.random()*Math.PI*2 },
    { name:'jupiter', r: 62, size: 6,   color:'#e0a878', speed: 0.0009, angle: Math.random()*Math.PI*2 },
    { name:'saturn',  r: 80, size: 5.2, color:'#e8d29a', speed: 0.0007, angle: Math.random()*Math.PI*2, ring:true },
    { name:'uranus',  r: 96, size: 4,   color:'#8fe0e0', speed: 0.0005, angle: Math.random()*Math.PI*2 },
    { name:'neptune', r: 108,size: 4,   color:'#4a6aff', speed: 0.0004, angle: Math.random()*Math.PI*2 }
  ];

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    clearScreen('#050014');

    ctx.fillStyle = '#fff';
    stars.forEach(s=>{
      ctx.globalAlpha = 0.35 + Math.sin(elapsed*0.002 + s.s*10)*0.25 + 0.25;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    planets.forEach(p=>{
      ctx.beginPath();
      ctx.arc(cx, cy, p.r, 0, Math.PI*2);
      ctx.stroke();
    });

    const pulse = 1 + Math.sin(elapsed*0.004)*0.06;
    const sunR = 9*pulse;
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffd23f';
    const sunGrad = ctx.createRadialGradient(cx,cy,0,cx,cy,sunR);
    sunGrad.addColorStop(0,'#fff6c8');
    sunGrad.addColorStop(0.5,'#ffd23f');
    sunGrad.addColorStop(1,'#ff9a1f');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, sunR, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();

    planets.forEach(p=>{
      p.angle += p.speed * 16;
      const px = cx + Math.cos(p.angle)*p.r;
      const py = cy + Math.sin(p.angle)*p.r*0.55;

      if(p.ring){
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(0.5);
        ctx.strokeStyle = 'rgba(232,210,154,0.8)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size*2.1, p.size*0.7, 0, 0, Math.PI*2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI*2);
      ctx.fill();

      if(p.moon){
        const moonAngle = elapsed*0.006;
        const mx = px + Math.cos(moonAngle)*6;
        const my = py + Math.sin(moonAngle)*3;
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.arc(mx, my, 1, 0, Math.PI*2);
        ctx.fill();
      }
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- CANNON ---------- */
function cannonScene(startTime, done){
  let cannonBall = null;
  let particles = [];
  let smokeClouds = [];
  let lastShot = startTime - 1200;
  
  let bgExplosions = [];
  let nextBgExplosion = startTime + 300;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    if(t > nextBgExplosion){
      nextBgExplosion = t + 250 + Math.random() * 600;
      bgExplosions.push({
        x: W * 0.3 + Math.random() * (W * 0.65),
        y: H * 0.1 + Math.random() * (H * 0.55),
        radius: 4,
        maxRadius: 18 + Math.random() * 28,
        life: 500 + Math.random() * 400,
        maxLife: 900,
        flash: 160
      });
    }

    if(t - lastShot > 1500){
      lastShot = t;
      cannonBall = { x: 58, y: H - 46, vx: 3.5, vy: -2.2, active: true };

      for(let i = 0; i < 18; i++){
        const angle = (Math.random() - 0.5) * 1.2;
        const speed = 1 + Math.random() * 3;
        particles.push({
          x: 55, y: H - 45,
          vx: Math.cos(angle) * speed + 1,
          vy: Math.sin(angle) * speed,
          life: 300 + Math.random() * 200,
          maxLife: 500,
          color: Math.random() < 0.4 ? '#ffe94a' : '#ff8a23'
        });
      }

      for(let i = 0; i < 4; i++){
        smokeClouds.push({
          x: 50 + Math.random() * 10,
          y: H - 45 - Math.random() * 10,
          vx: 0.4 + Math.random() * 0.6,
          vy: -0.2 - Math.random() * 0.4,
          r: 6 + Math.random() * 6,
          life: 600 + Math.random() * 400,
          maxLife: 1000
        });
      }
    }

    if(cannonBall && cannonBall.active){
      cannonBall.vy += 0.08;
      cannonBall.x += cannonBall.vx;
      cannonBall.y += cannonBall.vy;

      if(cannonBall.y > H - 25 || cannonBall.x > W + 10){
        cannonBall.active = false;
        for(let i = 0; i < 10; i++){
          particles.push({
            x: cannonBall.x, y: Math.min(cannonBall.y, H - 25),
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 2,
            life: 200, maxLife: 200,
            color: '#ffe94a'
          });
        }
      }
    }

    bgExplosions.forEach(b => {
      b.radius += (b.maxRadius - b.radius) * 0.12;
      b.life -= 16;
      b.flash = Math.max(0, b.flash - 16);
    });
    bgExplosions = bgExplosions.filter(b => b.life > 0);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 16;
    });
    particles = particles.filter(p => p.life > 0);

    smokeClouds.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.r += 0.15;
      s.life -= 16;
    });
    smokeClouds = smokeClouds.filter(s => s.life > 0);

    clearScreen('#050814');

    bgExplosions.forEach(b => {
      const alpha = Math.max(0, b.life / b.maxLife);
      ctx.save();
      const grad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.radius * 1.8);
      grad.addColorStop(0, `rgba(255, 230, 130, ${alpha * 0.9})`);
      grad.addColorStop(0.35, `rgba(255, 95, 25, ${alpha * 0.55})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      if(b.flash > 0){
        ctx.fillStyle = `rgba(255, 255, 240, ${(b.flash / 160) * alpha})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    ctx.fillStyle = '#1c2616';
    ctx.fillRect(0, H - 24, W, 24);
    ctx.strokeStyle = '#39ff7a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 24);
    ctx.lineTo(W, H - 24);
    ctx.stroke();

    ctx.save();
    ctx.translate(35, H - 24);
    ctx.fillStyle = '#4a2e18';
    ctx.beginPath(); ctx.arc(-8, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(-8, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 0, 3, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.rotate(-0.35);
    ctx.fillStyle = '#555659';
    ctx.fillRect(-4, -18, 32, 14);
    ctx.fillStyle = '#222';
    ctx.fillRect(24, -20, 6, 18);
    ctx.restore();
    ctx.restore();

    smokeClouds.forEach(s => {
      ctx.fillStyle = `rgba(160, 160, 180, ${Math.max(0, s.life / s.maxLife * 0.4)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if(cannonBall && cannonBall.active){
      ctx.fillStyle = 'rgba(255,200,80,0.35)';
      ctx.beginPath();
      ctx.arc(cannonBall.x, cannonBall.y, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#3A0603';
      ctx.beginPath();
      ctx.arc(cannonBall.x, cannonBall.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(cannonBall.x - 1.5, cannonBall.y - 1.5, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- UNDERWATER ---------- */
function underwaterScene(startTime, done){
  const bubbles = Array.from({length: 25}, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1 + Math.random() * 2.5,
    speed: 0.3 + Math.random() * 0.8,
    wobbleSpeed: 0.03 + Math.random() * 0.05,
    phase: Math.random() * Math.PI * 2
  }));

  const fishColors = ['#ff8a23', '#ffe94a', '#ff2bd6', '#23f6ff', '#39ff7a'];
  const fishList = Array.from({length: 16}, () => ({
    x: Math.random() * W,
    y: 20 + Math.random() * (H - 50),
    speed: 0.3 + Math.random() * 1.1,
    size: 3.5 + Math.random() * 13,
    color: fishColors[Math.floor(Math.random() * fishColors.length)],
    dir: Math.random() < 0.5 ? 1 : -1,
    phase: Math.random() * Math.PI * 2
  }));

  const plants = Array.from({length: 8}, (_, i) => ({
    x: 15 + i * (W / 8) + (Math.random() - 0.5) * 10,
    height: 30 + Math.random() * 40,
    segments: 5,
    phase: Math.random() * Math.PI * 2
  }));

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    const time = elapsed / 1000;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a3d5c');
    grad.addColorStop(1, '#021019');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1c2414';
    ctx.fillRect(0, H - 12, W, 12);
    ctx.fillStyle = '#39ff7a';
    ctx.fillRect(0, H - 14, W, 2);

    plants.forEach(p => {
      ctx.strokeStyle = '#239045';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x, H - 14);
      
      let px = p.x;
      let py = H - 14;
      const segH = p.height / p.segments;
      
      for(let s = 1; s <= p.segments; s++){
        const wave = Math.sin(time * 2 + p.phase + s * 0.5) * (s * 1.8);
        const nextX = p.x + wave;
        const nextY = (H - 14) - (segH * s);
        ctx.quadraticCurveTo(px, py - segH / 2, nextX, nextY);
        px = nextX;
        py = nextY;
      }
      ctx.stroke();
    });

    ctx.fillStyle = 'rgba(35, 246, 255, 0.4)';
    bubbles.forEach(b => {
      b.y -= b.speed;
      b.x += Math.sin(time * 3 + b.phase) * 0.3;
      if(b.y < -5){
        b.y = H + 5;
        b.x = Math.random() * W;
      }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    });

    fishList.forEach(f => {
      f.x += f.speed * f.dir;
      if(f.dir === 1 && f.x > W + 30) f.x = -30;
      if(f.dir === -1 && f.x < -30) f.x = W + 30;
      
      const bobY = f.y + Math.sin(time * 4 + f.phase) * 4;
      const tailWag = Math.sin(time * 14 + f.phase) * (f.size * 0.4);

      ctx.save();
      ctx.translate(f.x, bobY);
      ctx.scale(f.dir, 1);

      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, f.size, f.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-f.size, 0);
      ctx.lineTo(-f.size - f.size * 0.7, -f.size * 0.5 + tailWag);
      ctx.lineTo(-f.size - f.size * 0.7, f.size * 0.5 + tailWag);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000';
      const eyeSize = Math.max(1, f.size * 0.15);
      ctx.fillRect(f.size * 0.35, -eyeSize * 1.5, eyeSize, eyeSize);

      ctx.restore();
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- UNICYCLE ---------- */
function unicycleScene(startTime, done){
  let x = W / 2;
  let dir = 1;
  let wheelRot = 0;
  const trail = [];

  let stiltX = W * 0.2;
  const stiltDir = 0.5;
  let walkPhase = 0;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    x += dir * 0.8;
    wheelRot += dir * 0.15;

    if(x > W - 30) dir = -1;
    if(x < 30) dir = 1;

    stiltX += stiltDir;
    if(stiltX > W - 20 || stiltX < 20) {
    }
    walkPhase += 0.08;

    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#151530');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    for(let i = 0; i < 25; i++){
      const sx = (i * 137.5) % W;
      const sy = (i * 71.3) % (H - 40);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.002 + i));
      ctx.fillStyle = `rgba(200,220,255,${tw * 0.6})`;
      ctx.fillRect(sx, sy, 1, 1);
    }

    const groundY = H - 20;
    
    const stiltHipY = groundY - 55;
    const legOffset1 = Math.sin(walkPhase) * 18;
    const legOffset2 = Math.sin(walkPhase + Math.PI) * 18;

    ctx.save();
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#ffe94a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(stiltX - 4, stiltHipY + 15);
    ctx.lineTo(stiltX - 10 + legOffset1, groundY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(stiltX + 4, stiltHipY + 15);
    ctx.lineTo(stiltX + 10 + legOffset2, groundY);
    ctx.stroke();

    ctx.fillStyle = '#ff2bd6';
    ctx.fillRect(stiltX - 5, stiltHipY, 10, 18);
    ctx.strokeStyle = '#39ff7a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(stiltX - 12, stiltHipY + 5);
    ctx.lineTo(stiltX + 12, stiltHipY + 5);
    ctx.stroke();

    ctx.fillStyle = '#ffe94a';
    ctx.beginPath();
    ctx.arc(stiltX, stiltHipY - 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const unicycleY = groundY;
    const wheelR = 12;
    const wheelY = unicycleY - wheelR;

    trail.push({x, wheelY});
    if(trail.length > 10) trail.shift();
    trail.forEach((p, i) => {
      const a = (i / trail.length) * 0.25;
      ctx.strokeStyle = `rgba(35,246,255,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.x, p.wheelY, wheelR, 0, Math.PI * 2);
      ctx.stroke();
    });

    const groundGrad = ctx.createLinearGradient(0, H - 20, 0, H);
    groundGrad.addColorStop(0, '#20203a');
    groundGrad.addColorStop(1, '#12122a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 20, W, 20);

    ctx.shadowColor = '#39ff7a';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#39ff7a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, H - 20);
    ctx.lineTo(W, H - 20);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(57,255,122,0.25)';
    ctx.lineWidth = 1;
    for(let gx = 0; gx < W; gx += 15){
      ctx.beginPath();
      ctx.moveTo(gx, H - 20);
      ctx.lineTo(gx, H - 14);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(x, unicycleY + 2, wheelR * 0.9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = '#23f6ff';
    ctx.shadowBlur = 8;
    const wheelGrad = ctx.createRadialGradient(x, wheelY, 2, x, wheelY, wheelR);
    wheelGrad.addColorStop(0, 'rgba(35,246,255,0.15)');
    wheelGrad.addColorStop(1, 'rgba(35,246,255,0.02)');
    ctx.fillStyle = wheelGrad;
    ctx.beginPath();
    ctx.arc(x, wheelY, wheelR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#23f6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, wheelY, wheelR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, wheelY, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(35,246,255,0.8)';
    ctx.lineWidth = 1;
    for(let s = 0; s < 4; s++){
      const ang = wheelRot + s * (Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(x, wheelY);
      ctx.lineTo(x + Math.cos(ang) * wheelR, wheelY + Math.sin(ang) * wheelR);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f4a52';
    for(let s = 0; s < 8; s++){
      const ang = wheelRot + s * (Math.PI / 4);
      const tx = x + Math.cos(ang) * wheelR;
      const ty = wheelY + Math.sin(ang) * wheelR;
      ctx.fillRect(tx - 0.5, ty - 0.5, 1, 1);
    }

    ctx.strokeStyle = '#ffe94a';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#ffe94a';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x, wheelY);
    ctx.lineTo(x, wheelY - 18);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff2bd6';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 5, wheelY - 23, 10, 4, 2) : ctx.rect(x - 5, wheelY - 23, 10, 4);
    ctx.fill();

    const pedalX = x + Math.sin(wheelRot) * 5;
    const pedalY = wheelY + Math.cos(wheelRot) * 5;
    const pedalX2 = x - Math.sin(wheelRot) * 5;
    const pedalY2 = wheelY - Math.cos(wheelRot) * 5;

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pedalX2, pedalY2);
    ctx.lineTo(pedalX, pedalY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pedalX - 1.5, pedalY - 1.5, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(pedalX2 - 1.5, pedalY2 - 1.5, 3, 3);

    const riderX = x;
    const riderY = wheelY - 32;
    const lean = dir * 3;

    const torsoGrad = ctx.createLinearGradient(riderX - 4, riderY, riderX + 4, riderY + 12);
    torsoGrad.addColorStop(0, '#5dffa0');
    torsoGrad.addColorStop(1, '#22c95e');
    ctx.fillStyle = torsoGrad;
    ctx.beginPath();
    ctx.moveTo(riderX - 4 + lean * 0.3, riderY);
    ctx.lineTo(riderX + 4 + lean * 0.3, riderY);
    ctx.lineTo(riderX + 3, riderY + 12);
    ctx.lineTo(riderX - 3, riderY + 12);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#22c95e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(riderX + lean * 0.3, riderY + 3);
    ctx.lineTo(riderX - dir * 6, riderY - 1);
    ctx.stroke();

    ctx.shadowColor = '#ff8a23';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#ff8a23';
    ctx.beginPath();
    ctx.arc(riderX + dir * 3, riderY - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#3a1a00';
    ctx.fillRect(riderX + dir * 3 + (dir > 0 ? 1 : -2), riderY - 5, 1, 1);

    ctx.strokeStyle = '#39ff7a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(riderX - 2, riderY + 12);
    ctx.lineTo(pedalX, pedalY);
    ctx.moveTo(riderX + 2, riderY + 12);
    ctx.lineTo(pedalX2, pedalY2);
    ctx.stroke();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- RACING CARS ---------- */
function racingCarsScene(startTime, done){
  let scroll = 0;
  const horizonY = H * 0.42;
  const roadWidthHorizon = W * 0.04;
  const roadWidthBottom = W * 1.3;
  const centerX = W / 2;

  let cars = [
    { z: 0.10, lane: -0.6, color: '#ff2bd6', speed: 0.006 },
    { z: 0.45, lane:  0.5, color: '#23f6ff', speed: 0.009 },
    { z: 0.80, lane: -0.15, color: '#ffe94a', speed: 0.005 }
  ];

  function lerp(a,b,t){ return a+(b-a)*t; }
  function clamp01(v){ return Math.max(0, Math.min(1, v)); }

  function roadInfoAt(t){
    const ease = Math.pow(t, 1.7);
    const y = horizonY + (H - horizonY) * ease;
    const width = lerp(roadWidthHorizon, roadWidthBottom, ease);
    return { y, width, ease };
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    scroll += 3.2;

    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#1a1440');
    skyGrad.addColorStop(0.6, '#5b2a6b');
    skyGrad.addColorStop(1, '#ff8c42');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY);

    const sunY = horizonY - horizonY * 0.35;
    const sunR = horizonY * 0.5;
    const sunGrad = ctx.createRadialGradient(centerX, sunY, 2, centerX, sunY, sunR);
    sunGrad.addColorStop(0, '#fff3b0');
    sunGrad.addColorStop(0.5, '#ffcf4a');
    sunGrad.addColorStop(1, 'rgba(255,140,66,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(centerX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1440';
    for(let i=0;i<4;i++){
      const sy = sunY - sunR*0.15 + i*sunR*0.22;
      if (sy > sunY - sunR && sy < sunY + sunR){
        ctx.fillRect(centerX - sunR, sy, sunR*2, 2);
      }
    }

    ctx.fillStyle = '#2a1b45';
    const mParallax = (scroll * 0.05) % W;
    for(let i=-1;i<=1;i++){
      const baseX = i*W - mParallax;
      ctx.beginPath();
      ctx.moveTo(baseX, horizonY);
      ctx.lineTo(baseX + W*0.15, horizonY - H*0.12);
      ctx.lineTo(baseX + W*0.32, horizonY);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(baseX + W*0.25, horizonY);
      ctx.lineTo(baseX + W*0.42, horizonY - H*0.08);
      ctx.lineTo(baseX + W*0.6, horizonY);
      ctx.closePath();
      ctx.fill();
    }

    const rows = H - horizonY;
    for(let y = horizonY; y < H; y++){
      const tRow = (y - horizonY) / rows;
      const info = roadInfoAt(tRow);
      const half = info.width / 2;
      const left = centerX - half;
      const right = centerX + half;

      const segH = lerp(2, 18, info.ease);
      const bandIndex = Math.floor((y + scroll * (0.5 + info.ease*1.5)) / segH);
      const bandOn = bandIndex % 2 === 0;

      ctx.fillStyle = bandOn ? '#2f5d34' : '#264d2a';
      ctx.fillRect(0, y, left, 1);
      ctx.fillRect(right, y, W - right, 1);

      ctx.fillStyle = bandOn ? '#4a4a52' : '#45454c';
      ctx.fillRect(left, y, info.width, 1);

      const rumbleW = Math.max(1, info.width * 0.03);
      ctx.fillStyle = bandOn ? '#d94848' : '#e8e8e8';
      ctx.fillRect(left, y, rumbleW, 1);
      ctx.fillRect(right - rumbleW, y, rumbleW, 1);

      if (bandOn){
        ctx.fillStyle = '#f0e6c8';
        const laneLineW = Math.max(1, info.width * 0.015);
        ctx.fillRect(centerX - laneLineW/2, y, laneLineW, 1);
      }
    }

    cars.forEach(c => {
      c.z += c.speed;
      if (c.z > 1.08){ c.z = -0.05; c.lane = (Math.random()*1.2 - 0.6); }
    });

    [...cars].sort((a,b) => a.z - b.z).forEach(c => {
      if (c.z < 0) return;
      const info = roadInfoAt(clamp01(c.z));
      const laneX = centerX + c.lane * (info.width * 0.32);
      const scale = lerp(0.12, 1.1, info.ease);
      const carW = 22 * scale, carH = 13 * scale;
      const cx = laneX, cy = info.y;

      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + carH*0.5, carW*0.5, carH*0.18, 0, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = c.color;
      ctx.fillRect(cx - carW/2, cy - carH*0.5, carW, carH*0.65);
      ctx.fillStyle = 'rgba(20,20,30,0.85)';
      ctx.fillRect(cx - carW*0.28, cy - carH*0.85, carW*0.56, carH*0.4);
      ctx.fillStyle = '#ff3b3b';
      ctx.fillRect(cx - carW*0.42, cy - carH*0.15, carW*0.14, carH*0.16);
      ctx.fillRect(cx + carW*0.28, cy - carH*0.15, carW*0.14, carH*0.16);
    });

    const pW = W*0.22, pH = pW*0.6;
    const pX = centerX, pY = H - pH*0.55;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(pX, pY + pH*0.42, pW*0.55, pH*0.18, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#e8433f';
    ctx.fillRect(pX - pW/2, pY - pH*0.3, pW, pH*0.55);
    ctx.fillStyle = 'rgba(20,20,30,0.9)';
    ctx.fillRect(pX - pW*0.32, pY - pH*0.62, pW*0.64, pH*0.4);
    ctx.fillStyle = '#ffdca0';
    ctx.fillRect(pX - pW*0.4, pY - pH*0.05, pW*0.14, pH*0.14);
    ctx.fillRect(pX + pW*0.26, pY - pH*0.05, pW*0.14, pH*0.14);

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- VINYL RECORD ---------- */
function vinylRecordScene(startTime, done){
  let angle = 0;
  let tonearmAngle = 0.35;
  const notes = [];
  let noteSpawnTimer = 0;
  const noteSymbols = ['♪', '♫', '♬', '♩'];

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    angle += 0.04;

    clearScreen('#1a0802');

    const cx = W / 2 - 15, cy = H / 2;
    const recordR = 75;

    ctx.fillStyle = '#2b1408';
    ctx.fillRect(15, 15, W - 30, H - 30);
    ctx.strokeStyle = '#ff8a23';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(15, 15, W - 30, H - 30);

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(cx, cy, recordR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for(let r = 25; r < recordR - 5; r += 8){
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = '#ff2bd6';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffe94a';
    ctx.fillRect(-12, -2, 24, 4);
    ctx.restore();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    const pivotX = W - 28, pivotY = 35;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(tonearmAngle);

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-45, 75);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.fillRect(-48, 70, 6, 10);
    ctx.restore();

    noteSpawnTimer += 16;
    if(noteSpawnTimer > 400){
      noteSpawnTimer = 0;
      notes.push({
        x: W - 55 + (Math.random() * 20 - 10),
        y: H / 2 + 10,
        vx: -0.2 - Math.random() * 0.3,
        vy: -0.6 - Math.random() * 0.4,
        alpha: 1,
        symbol: noteSymbols[Math.floor(Math.random() * noteSymbols.length)],
        size: 9 + Math.floor(Math.random() * 3)
      });
    }

    for(let i = notes.length - 1; i >= 0; i--){
      const n = notes[i];
      n.x += n.vx;
      n.y += n.vy;
      n.alpha -= 0.008;

      if(n.alpha <= 0){
        notes.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.font = `${n.size}px monospace`;
      ctx.fillStyle = `rgba(57, 255, 122, ${Math.max(0, n.alpha)})`;
      ctx.shadowColor = '#39ff7a';
      ctx.shadowBlur = 8;
      ctx.fillText(n.symbol, n.x, n.y);
      ctx.restore();
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- GAME BOY ---------- */
function gameBoyScene(startTime, done){
  let score = 2400;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    const time = elapsed / 1000;

    clearScreen('#0b0e14');

    const gbX = W / 2 - 42;
    const gbY = 28;
    const gbW = 84;
    const gbH = 150;

    ctx.fillStyle = '#b0b5ba';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(gbX, gbY, gbW, gbH, 8) : ctx.rect(gbX, gbY, gbW, gbH);
    ctx.fill();

    ctx.strokeStyle = '#8c9298';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#262a30';
    ctx.fillRect(gbX + 9, gbY + 12, 66, 58);
    ctx.strokeStyle = '#15171b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(gbX + 9, gbY + 12, 66, 58);

    ctx.fillStyle = '#39424c';
    ctx.font = '3px sans-serif';
    ctx.fillText('• DOT MATRIX WITH STEREO SOUND', gbX + 13, gbY + 75);

    const lcdX = gbX + 14;
    const lcdY = gbY + 16;
    const lcdW = 56;
    const lcdH = 48;

    ctx.fillStyle = '#8bac0f';
    ctx.fillRect(lcdX, lcdY, lcdW, lcdH);

    ctx.save();
    ctx.beginPath();
    ctx.rect(lcdX, lcdY, lcdW, lcdH);
    ctx.clip();

    ctx.fillStyle = 'rgba(15, 56, 15, 0.08)';
    for(let gx = lcdX; gx < lcdX + lcdW; gx += 2) {
      ctx.fillRect(gx, lcdY, 1, lcdH);
    }
    for(let gy = lcdY; gy < lcdY + lcdH; gy += 2) {
      ctx.fillRect(lcdX, gy, lcdW, 1);
    }

    ctx.fillStyle = '#306230';
    ctx.fillRect(lcdX + 4, lcdY + 38, 48, 10);
    ctx.fillRect(lcdX + 12, lcdY + 28, 12, 10);
    ctx.fillRect(lcdX + 38, lcdY + 20, 14, 18);

    const bob = Math.floor(time * 5) % 2 === 0 ? 0 : 2;
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(lcdX + 42, lcdY + 13 - bob, 4, 4);

    const cycle = (time * 1.5) % 4;
    let charX = lcdX + 8;
    let charY = lcdY + 30;

    if(cycle < 1){
      charX += cycle * 18;
      charY = lcdY + 30;
    } else if(cycle < 2){
      charX = lcdX + 26;
      charY = lcdY + 30 - Math.sin((cycle - 1) * Math.PI) * 12;
    } else if(cycle < 3){
      charX = lcdX + 26 - (cycle - 2) * 18;
      charY = lcdY + 30;
    } else {
      charX = lcdX + 8;
      charY = lcdY + 30;
    }

    ctx.fillStyle = '#0f380f';
    ctx.fillRect(charX, charY, 4, 6);
    ctx.fillRect(charX + 1, charY - 2, 2, 2);

    ctx.fillStyle = '#0f380f';
    ctx.font = '5px monospace';
    ctx.fillText(`TOP ${score}`, lcdX + 2, lcdY + 8);

    ctx.restore();

    const ledOn = Math.floor(elapsed / 100) % 2 === 0 || true;
    ctx.fillStyle = ledOn ? '#ff2bd6' : '#552233';
    ctx.save();
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(gbX + 24, gbY + 40, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const dpadX = gbX + 20;
    const dpadY = gbY + 95;
    ctx.fillStyle = '#22252a';
    ctx.fillRect(dpadX + 5, dpadY, 6, 18);
    ctx.fillRect(dpadX, dpadY + 6, 16, 6);
    ctx.fillStyle = '#17191d';
    ctx.fillRect(dpadX + 6, dpadY + 6, 4, 6);

    ctx.save();
    ctx.translate(gbX + 63, gbY + 98);
    ctx.rotate(-0.35);
    ctx.fillStyle = '#7c2559';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(14, 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(-1.5, -1.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12.5, 3.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    
    ctx.fillStyle = '#39424c';
    ctx.font = 'italic 5px sans-serif';
    ctx.fillText('B', gbX + 52, gbY + 112);
    ctx.fillText('A', gbX + 68, gbY + 104);

    ctx.save();
    ctx.translate(gbX + 34, gbY + 128);
    ctx.rotate(-0.2);
    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, 9, 3);
    ctx.translate(13, 2);
    ctx.fillRect(0, 0, 9, 3);
    ctx.restore();

    ctx.fillStyle = '#a2a7ac';
    for(let i = 0; i < 6; i++) {
      ctx.fillRect(gbX + 58 + i * 3, gbY + 122 + (i % 2) * 1, 1.5, 10);
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- COLOR SPLASH ---------- */
function colorSplashScene(startTime, done){
  let splashes = [];
  let lastSpawn = 0;
  let initialized = false;

  const palette = ['#ff3b30', '#ffcc00', '#34c759', '#007aff', '#af52de', '#ff9500'];

  function makeBlobShape(){
    const pointCount = 10 + Math.floor(Math.random() * 4);
    const pts = [];
    for(let i = 0; i < pointCount; i++){
      pts.push({
        angle: (i / pointCount) * Math.PI * 2,
        wobble: 0.55 + Math.random() * 0.65
      });
    }
    return pts;
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    if(!initialized){
      clearScreen('#0b0e14');
      initialized = true;
    }

    if(t - lastSpawn > 350 + Math.random() * 250){
      lastSpawn = t;
      const x = 40 + Math.random() * (W - 80);
      const y = 40 + Math.random() * (H - 80);
      const color = palette[Math.floor(Math.random() * palette.length)];
      const maxR = 30 + Math.random() * 40;

      let droplets = [];
      const dropletCount = 10 + Math.floor(Math.random() * 10);
      for(let i = 0; i < dropletCount; i++){
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4.5;
        droplets.push({
          x, y, px: x, py: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: 1 + Math.random() * 2.5,
          life: 1
        });
      }

      splashes.push({
        x, y, color,
        r: 2,
        maxR,
        blob: makeBlobShape(),
        rotation: Math.random() * Math.PI * 2,
        droplets
      });
    }


    ctx.save();

    splashes.forEach(s => {
      s.r += (s.maxR - s.r) * 0.15;

      s.droplets.forEach(d => {
        d.px = d.x; d.py = d.y;
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.95;
        d.vy = d.vy * 0.95 + 0.06;
        d.life -= 0.02;
      });
      s.droplets = s.droplets.filter(d => d.life > 0);
    });

    splashes.forEach(s => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = s.color;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.85;

      ctx.beginPath();
      s.blob.forEach((p, i) => {
        const rad = s.r * p.wobble;
        const ang = p.angle + s.rotation;
        const px = s.x + Math.cos(ang) * rad;
        const py = s.y + Math.sin(ang) * rad;
        if(i === 0){
          ctx.moveTo(px, py);
        } else {
          const prev = s.blob[i - 1];
          const prevRad = s.r * prev.wobble;
          const prevAng = prev.angle + s.rotation;
          const cx = s.x + Math.cos((prevAng + ang) / 2) * rad * 1.05;
          const cy = s.y + Math.sin((prevAng + ang) / 2) * rad * 1.05;
          ctx.quadraticCurveTo(cx, cy, px, py);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      s.droplets.forEach(d => {
        ctx.globalAlpha = Math.max(0, d.life) * 0.85;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = d.r;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(d.px, d.py);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();

        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- ALARM CLOCK ---------- */
function alarmClockScene(startTime, done){
  let soundWaves = [];
  let lastWave = 0;

  const RADIUS = 35;
  const BELL_R = 13;
  const BELL_OFFSET_X = 21;

  const EXPLOSION_DURATION = 900;
  const EXPLODE_AT = Math.max(0, SHOWTIME_MS - EXPLOSION_DURATION);
  const GRAVITY = 0.15;
  const DRAG = 0.97;

  let exploded = false;
  let explosionStartT = 0;
  let particles = [];

  function withTransform(x, y, rot, alpha, fn){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    fn();
    ctx.restore();
  }

  function roundedRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawRim(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      const grad = ctx.createLinearGradient(-RADIUS, -RADIUS, RADIUS, RADIUS);
      grad.addColorStop(0, '#ff6bd8');
      grad.addColorStop(0.5, '#ff2bd6');
      grad.addColorStop(1, '#c0189e');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#fff0fb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 3;
      ctx.arc(0, 0, RADIUS - 2, Math.PI * 1.1, Math.PI * 1.7);
      ctx.stroke();
    });
  }

  function drawFace(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      const r = RADIUS - 6;
      const grad = ctx.createRadialGradient(-4, -4, 2, 0, 0, r);
      grad.addColorStop(0, '#fffdf3');
      grad.addColorStop(1, '#ffe94a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#7a5b00';
      for (let i = 0; i < 12; i++){
        const a = (i / 12) * Math.PI * 2;
        const major = i % 3 === 0;
        const rOuter = r - 3;
        const rInner = major ? r - 8 : r - 6;
        ctx.lineWidth = major ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
        ctx.lineTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
        ctx.stroke();
      }
    });
  }

  function drawCenterDot(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.arc(-0.6, -0.6, 0.8, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawMinuteHand(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -10);
      ctx.stroke();
    });
  }

  function drawHourHand(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14, -4);
      ctx.stroke();
    });
  }

  function drawBell(side){
    return function(x, y, rot, alpha){
      withTransform(x, y, rot, alpha, () => {
        const grad = ctx.createRadialGradient(-side * 4, -5, 2, 0, 0, BELL_R);
        grad.addColorStop(0, '#f2f4f6');
        grad.addColorStop(0.6, '#c4c8cb');
        grad.addColorStop(1, '#8b9096');
        ctx.fillStyle = grad;
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, BELL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-side * 3, -3, BELL_R * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.arc(0, BELL_R * 0.35, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
    };
  }

  function drawTopArc(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      const grad = ctx.createLinearGradient(-BELL_OFFSET_X, 0, BELL_OFFSET_X, 0);
      grad.addColorStop(0, '#b9beC4');
      grad.addColorStop(0.5, '#e8ebee');
      grad.addColorStop(1, '#b9beC4');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-BELL_OFFSET_X, 2);
      ctx.quadraticCurveTo(0, -5, BELL_OFFSET_X, 2);
      ctx.stroke();
    });
  }

  function drawFoot(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      const grad = ctx.createLinearGradient(-4, -3, 4, 3);
      grad.addColorStop(0, '#8b9096');
      grad.addColorStop(1, '#4b5563');
      ctx.fillStyle = grad;
      roundedRect(-4, -3, 8, 6, 2);
      ctx.fill();
    });
  }

  function drawHammer(x, y, rot, alpha){
    withTransform(x, y, rot, alpha, () => {
      ctx.fillStyle = '#4b5563';
      roundedRect(-1.5, 0, 3, 14, 1.5);
      ctx.fill();

      const grad = ctx.createRadialGradient(-1.2, 13.8, 1, 0, 15, 4);
      grad.addColorStop(0, '#6b7280');
      grad.addColorStop(1, '#2d333b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 15, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(-1, 14, 1.5, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function drawDebris(i){
    const colors = ['#4b5563', '#9ca3af', '#6b7280'];
    return function(x, y, rot, alpha){
      withTransform(x, y, rot, alpha, () => {
        ctx.fillStyle = colors[i % colors.length];
        roundedRect(-3, -1, 6, 2, 1);
        ctx.fill();
      });
    };
  }

  function spawnParticle(cx0, cy0, dx, dy, drawFn, opts = {}){
    const hasOffset = dx !== 0 || dy !== 0;
    const baseAngle = hasOffset ? Math.atan2(dy, dx) : Math.random() * Math.PI * 2;
    const angle = baseAngle + (Math.random() - 0.5) * 0.6;
    const speed = (opts.speed || 3) + Math.random() * 2;

    particles.push({
      x: cx0 + dx,
      y: cy0 + dy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (opts.upBias !== undefined ? opts.upBias : 1.5),
      rot: 0,
      vrot: (Math.random() - 0.5) * (opts.spin || 0.3),
      alpha: 1,
      draw: drawFn
    });
  }

  function initExplosion(cx0, cy0){
    particles = [];
    const bellY0 = cy0 - RADIUS + 4;
    const bellTopY0 = bellY0 - BELL_R;

    spawnParticle(cx0, cy0, 0, 0, drawRim, { speed: 3, spin: 0.15 });
    spawnParticle(cx0, cy0, 0, 0, drawFace, { speed: 3.5, spin: 0.2 });
    spawnParticle(cx0, cy0, 0, 0, drawCenterDot, { speed: 6, spin: 0.5 });
    spawnParticle(cx0, cy0, 0, 0, drawMinuteHand, { speed: 5, spin: 0.4 });
    spawnParticle(cx0, cy0, 0, 0, drawHourHand, { speed: 5, spin: 0.4 });

    spawnParticle(cx0, cy0, -BELL_OFFSET_X, bellY0 - cy0, drawBell(-1), { speed: 5, spin: 0.3 });
    spawnParticle(cx0, cy0, BELL_OFFSET_X, bellY0 - cy0, drawBell(1), { speed: 5, spin: 0.3 });
    spawnParticle(cx0, cy0, 0, bellTopY0 - cy0, drawTopArc, { speed: 4, spin: 0.25 });
    spawnParticle(cx0, cy0, 0, bellTopY0 - 2 - cy0, drawHammer, { speed: 5.5, spin: 0.5 });

    spawnParticle(cx0, cy0, -18, RADIUS + 1, drawFoot, { speed: 4, spin: 0.3 });
    spawnParticle(cx0, cy0, 18, RADIUS + 1, drawFoot, { speed: 4, spin: 0.3 });

    for (let i = 0; i < 6; i++){
      spawnParticle(cx0, cy0, 0, 0, drawDebris(i), { speed: 2 + Math.random() * 4, spin: 0.6, upBias: 1 });
    }
  }

  function updateAndDrawExplosion(t, cx0, cy0){
    const progress = (t - explosionStartT) / EXPLOSION_DURATION;

    clearScreen('#0b0e14');

    if (progress < 0.15){
      const flashAlpha = 1 - progress / 0.15;
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.9})`;
      ctx.fillRect(0, 0, W, H);
    }

    const ringR = progress * 140;
    const ringAlpha = Math.max(0, 1 - progress * 1.3);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx0, cy0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const fadeStart = 0.6;
    particles.forEach(p => {
      p.vx *= DRAG;
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vrot;
      if (progress > fadeStart){
        p.alpha = Math.max(0, 1 - (progress - fadeStart) / (1 - fadeStart));
      }
    });

    particles.forEach(p => p.draw(p.x, p.y, p.rot, p.alpha));
  }

  function drawClockBody(cx, cy, bellTopY, bellY, radius, bellR, bellOffsetX, time){
    const glow = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius * 2.2);
    glow.addColorStop(0, 'rgba(255,43,214,0.15)');
    glow.addColorStop(1, 'rgba(255,43,214,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius + 10, radius * 0.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const footGrad = ctx.createLinearGradient(0, cy + radius - 2, 0, cy + radius + 4);
    footGrad.addColorStop(0, '#8b9096');
    footGrad.addColorStop(1, '#4b5563');
    ctx.fillStyle = footGrad;
    roundedRect(cx - 22, cy + radius - 2, 8, 6, 2);
    ctx.fill();
    roundedRect(cx + 14, cy + radius - 2, 8, 6, 2);
    ctx.fill();
    ctx.restore();

    [-1, 1].forEach(side => {
      const bx = cx + side * bellOffsetX;
      const grad = ctx.createRadialGradient(bx - side * 4, bellY - 5, 2, bx, bellY, bellR);
      grad.addColorStop(0, '#f2f4f6');
      grad.addColorStop(0.6, '#c4c8cb');
      grad.addColorStop(1, '#8b9096');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, bellY, bellR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx - side * 3, bellY - 3, bellR * 0.4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.arc(bx, bellY + bellR * 0.35, 1.6, 0, Math.PI * 2);
      ctx.fill();
    });

    const wireGrad = ctx.createLinearGradient(cx - bellOffsetX, 0, cx + bellOffsetX, 0);
    wireGrad.addColorStop(0, '#b9beC4');
    wireGrad.addColorStop(0.5, '#e8ebee');
    wireGrad.addColorStop(1, '#b9beC4');
    ctx.strokeStyle = wireGrad;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - bellOffsetX, bellTopY + 2);
    ctx.quadraticCurveTo(cx, bellTopY - 5, cx + bellOffsetX, bellTopY + 2);
    ctx.stroke();

    const rimGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    rimGrad.addColorStop(0, '#ff6bd8');
    rimGrad.addColorStop(0.5, '#ff2bd6');
    rimGrad.addColorStop(1, '#c0189e');
    ctx.fillStyle = rimGrad;
    ctx.strokeStyle = '#fff0fb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 3;
    ctx.arc(cx, cy, radius - 2, Math.PI * 1.1, Math.PI * 1.7);
    ctx.stroke();

    const faceR = radius - 6;
    const faceGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, faceR);
    faceGrad.addColorStop(0, '#fffdf3');
    faceGrad.addColorStop(1, '#ffe94a');
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#7a5b00';
    for (let i = 0; i < 12; i++){
      const a = (i / 12) * Math.PI * 2;
      const major = i % 3 === 0;
      const rOuter = faceR - 3;
      const rInner = major ? faceR - 8 : faceR - 6;
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * rOuter, cy + Math.sin(a) * rOuter);
      ctx.lineTo(cx + Math.cos(a) * rInner, cy + Math.sin(a) * rInner);
      ctx.stroke();
    }

    ctx.strokeStyle = '#111111';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - 7, cy - 7);
    ctx.stroke();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + 11, cy - 3);
    ctx.stroke();

    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(cx - 0.6, cy - 0.6, 0.8, 0, Math.PI * 2);
    ctx.fill();

    const swing = Math.sin(time * 35);
    const hammerAngle = swing * 0.65;

    ctx.save();
    ctx.translate(cx, bellTopY - 2);
    ctx.rotate(hammerAngle);
    ctx.fillStyle = '#4b5563';
    roundedRect(-1.5, 0, 3, 14, 1.5);
    ctx.fill();
    const headGrad = ctx.createRadialGradient(-1.2, 13.8, 1, 0, 15, 4);
    headGrad.addColorStop(0, '#6b7280');
    headGrad.addColorStop(1, '#2d333b');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.arc(0, 15, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-1, 14, 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const impactThreshold = 0.92;
    if (Math.abs(swing) > impactThreshold) {
      const side = swing > 0 ? 1 : -1;
      const flashAlpha = (Math.abs(swing) - impactThreshold) / (1 - impactThreshold);
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(cx + side * bellOffsetX, bellY, bellR + 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(t){
    const elapsed = t - startTime;
    if (elapsed >= SHOWTIME_MS){ done(); return; }

    const cx0 = W / 2, cy0 = H / 2 + 8;

    if (elapsed >= EXPLODE_AT){
      if (!exploded){
        exploded = true;
        explosionStartT = t;
        initExplosion(cx0, cy0);
      }
      updateAndDrawExplosion(t, cx0, cy0);
      rafId = requestAnimationFrame(frame);
      return;
    }

    const time = elapsed / 1000;
    const radius = RADIUS;
    const bellR = BELL_R;
    const bellOffsetX = BELL_OFFSET_X;
    const bellY0 = cy0 - radius + 4;

    if (t - lastWave > 300){
      lastWave = t;
      soundWaves.push({ r: 12, alpha: 1.0 });
    }

    soundWaves.forEach(w => {
      w.r += 1.8;
      w.alpha -= 0.05;
    });
    soundWaves = soundWaves.filter(w => w.alpha > 0);

    clearScreen('#0b0e14');

    const preShakeWindow = 500;
    const timeToExplode = EXPLODE_AT - elapsed;
    const shakeBoost = timeToExplode < preShakeWindow
      ? 1 + (1 - timeToExplode / preShakeWindow) * 3
      : 1;

    const shakeX = (Math.random() - 0.5) * 4 * shakeBoost;
    const shakeY = (Math.random() - 0.5) * 4 * shakeBoost;

    const cx = cx0 + shakeX;
    const cy = cy0 + shakeY;
    const bellY = bellY0 + shakeY;
    const bellTopY = bellY - bellR;

    ctx.save();
    soundWaves.forEach(w => {
      ctx.strokeStyle = `rgba(35, 246, 255, ${w.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx - bellOffsetX, bellTopY, w.r, Math.PI * 0.75, Math.PI * 1.25);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + bellOffsetX, bellTopY, w.r, Math.PI * 1.75, Math.PI * 2.25);
      ctx.stroke();
    });
    ctx.restore();

    drawClockBody(cx, cy, bellTopY, bellY, radius, bellR, bellOffsetX, time);

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- BOWLING ---------- */
function bowlingScene(startTime, done){
  const LANE_TOP_Y = 40;
  const LANE_BOTTOM_Y = H - 8;
  const LANE_TOP_HALF = 13;
  const LANE_BOTTOM_HALF = 48;
  const FAR_SCALE = 0.85;
  const NEAR_SCALE = 2.35;

  function laneHalfWidthAt(y){
    let t = (y - LANE_TOP_Y) / (LANE_BOTTOM_Y - LANE_TOP_Y);
    t = Math.max(0, Math.min(1, t));
    return LANE_TOP_HALF + (LANE_BOTTOM_HALF - LANE_TOP_HALF) * t;
  }

  function scaleAt(y){
    let t = (y - LANE_TOP_Y) / (LANE_BOTTOM_Y - LANE_TOP_Y);
    t = Math.max(0, Math.min(1, t));
    return FAR_SCALE + (NEAR_SCALE - FAR_SCALE) * t;
  }

  function freshPins(){
    return [
      { x: W / 2,      y: 45, baseX: 0    },
      { x: W / 2 - 7,  y: 37, baseX: -7   },
      { x: W / 2 + 7,  y: 37, baseX: 7    },
      { x: W / 2 - 14, y: 29, baseX: -14  },
      { x: W / 2,      y: 29, baseX: 0    },
      { x: W / 2 + 14, y: 29, baseX: 14   }
    ].map(p => ({ ...p, vx: 0, vy: 0, angle: 0, angularVel: 0, alpha: 1, falling: false, willFall: false, hitDelay: 0 }));
  }

  let ball, pins, hitTriggered, frameSinceHit, resetTimer, trail;

  function resetPlay(){
    ball = { x: W / 2, y: H - 5, active: true };
    pins = freshPins();
    hitTriggered = false;
    frameSinceHit = 0;
    resetTimer = 0;
    trail = [];
  }
  resetPlay();

  function drawPinShape(s){
    ctx.beginPath();
    ctx.moveTo(-2.2 * s, 0);
    ctx.lineTo(2.2 * s, 0);
    ctx.quadraticCurveTo(3.8 * s, -3.5 * s, 2.2 * s, -6.5 * s);
    ctx.quadraticCurveTo(1.3 * s, -8.5 * s, 1.8 * s, -9.8 * s);
    ctx.quadraticCurveTo(2.4 * s, -11 * s, 0, -11.5 * s);
    ctx.quadraticCurveTo(-2.4 * s, -11 * s, -1.8 * s, -9.8 * s);
    ctx.quadraticCurveTo(-1.3 * s, -8.5 * s, -2.2 * s, -6.5 * s);
    ctx.quadraticCurveTo(-3.8 * s, -3.5 * s, -2.2 * s, 0);
    ctx.closePath();
    ctx.fillStyle = '#fdfcf7';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 0.45 * s;
    ctx.stroke();

    ctx.fillStyle = '#d91430';
    ctx.beginPath();
    ctx.ellipse(0, -9.6 * s, 1.45 * s, 0.35 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -8.5 * s, 1.65 * s, 0.35 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }

    clearScreen('#0b0e14');

    const topHalf = laneHalfWidthAt(LANE_TOP_Y);
    const botHalf = laneHalfWidthAt(LANE_BOTTOM_Y);
    ctx.beginPath();
    ctx.moveTo(W / 2 - topHalf, LANE_TOP_Y);
    ctx.lineTo(W / 2 + topHalf, LANE_TOP_Y);
    ctx.lineTo(W / 2 + botHalf, LANE_BOTTOM_Y);
    ctx.lineTo(W / 2 - botHalf, LANE_BOTTOM_Y);
    ctx.closePath();
    const laneGrad = ctx.createLinearGradient(0, LANE_TOP_Y, 0, LANE_BOTTOM_Y);
    laneGrad.addColorStop(0, '#3a2010');
    laneGrad.addColorStop(1, '#5c3216');
    ctx.fillStyle = laneGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    for(let i = -2; i <= 2; i++){
      ctx.beginPath();
      ctx.moveTo(W / 2 + i * (topHalf / 2.5), LANE_TOP_Y);
      ctx.lineTo(W / 2 + i * (botHalf / 2.5), LANE_BOTTOM_Y);
      ctx.stroke();
    }

    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(W / 2 - topHalf - 6, LANE_TOP_Y);
    ctx.lineTo(W / 2 - topHalf, LANE_TOP_Y);
    ctx.lineTo(W / 2 - botHalf, LANE_BOTTOM_Y);
    ctx.lineTo(W / 2 - botHalf - 10, LANE_BOTTOM_Y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W / 2 + topHalf, LANE_TOP_Y);
    ctx.lineTo(W / 2 + topHalf + 6, LANE_TOP_Y);
    ctx.lineTo(W / 2 + botHalf + 10, LANE_BOTTOM_Y);
    ctx.lineTo(W / 2 + botHalf, LANE_BOTTOM_Y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#151515';
    ctx.fillRect(W / 2 - topHalf, LANE_TOP_Y - 10, topHalf * 2, 10);

    ctx.fillStyle = '#ff8a23';
    for(let i = 0; i < 4; i++){
      const y = 70 + i * 26;
      const s = scaleAt(y);
      ctx.fillRect(W / 2 - 1.2 * s, y, 2.4 * s, 3 * s);
    }

    if(ball.active){
      trail.push({ x: ball.x, y: ball.y });
      if(trail.length > 6) trail.shift();
      ball.y -= 2.6;
      if(!hitTriggered && ball.y <= pins[0].y + 6){
        hitTriggered = true;
        frameSinceHit = 0;
        pins.forEach(p => {
          p.willFall = true;
          p.hitDelay = Math.round(Math.abs(p.baseX) * 1.2 + Math.random() * 3);
        });
      }
      if(ball.y < LANE_TOP_Y - 4) ball.active = false;
    }

    if(hitTriggered){
      frameSinceHit++;
      pins.forEach(p => {
        if(p.willFall && !p.falling && frameSinceHit >= p.hitDelay){
          p.falling = true;
          const dir = p.baseX === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(p.baseX);
          p.vx = dir * (0.3 + Math.random() * 0.5);
          p.vy = -(0.2 + Math.random() * 0.3);
          p.angularVel = dir * (0.09 + Math.random() * 0.08);
        }
        if(p.falling){
          p.angle += p.angularVel;
          if(Math.abs(p.angle) > Math.PI / 2) p.angle = (Math.PI / 2) * Math.sign(p.angle);
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05;
          p.vx *= 0.97;
          if(Math.abs(p.angle) >= Math.PI / 2 - 0.02){
            p.alpha -= 0.025;
          }
        }
      });
      resetTimer++;
      if(resetTimer > 110) resetPlay();
    }

    pins.forEach(p => {
      if(p.alpha <= 0) return;
      const s = scaleAt(p.y);
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      drawPinShape(s);
      ctx.restore();
    });

    trail.forEach((pt, i) => {
      const a = ((i + 1) / trail.length) * 0.15;
      const s = scaleAt(pt.y) * 6.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(35,246,255,${a})`;
      ctx.fill();
    });

    if(ball.active || ball.y >= LANE_TOP_Y - 4){
      const s = scaleAt(ball.y);
      const r = 6.5 * s;

      ctx.beginPath();
      ctx.ellipse(ball.x, ball.y + r * 0.7, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();

      const grad = ctx.createRadialGradient(
        ball.x - r * 0.35, ball.y - r * 0.35, r * 0.1,
        ball.x, ball.y, r
      );
      grad.addColorStop(0, '#8ffcff');
      grad.addColorStop(0.5, '#23f6ff');
      grad.addColorStop(1, '#0b7d85');
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.fillStyle = '#042224';
      ctx.beginPath();
      ctx.arc(ball.x - r * 0.3, ball.y - r * 0.25, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ball.x + r * 0.15, ball.y - r * 0.3, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- PRISMA TRIANGLE ---------- */
function prismTriangleScene(startTime, done){
  const stars = Array.from({length: 40}, () => ({
    x: Math.random() * W, y: Math.random() * H, s: Math.random()
  }));

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }
    const time = elapsed / 1000;

    clearScreen('#050014');

    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = 0.3 + Math.sin(time * 3 + s.s * 10) * 0.3;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    const pTop = { x: W / 2, y: H / 2 - 28 };
    const pLeft = { x: W / 2 - 32, y: H / 2 + 24 };
    const pRight = { x: W / 2 + 32, y: H / 2 + 24 };

    const beamPulse = 0.7 + Math.sin(time * 6) * 0.3;
    ctx.strokeStyle = `rgba(255, 255, 255, ${beamPulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, H / 2 + 4);
    ctx.lineTo(pLeft.x - 2, pLeft.y - 4);
    ctx.stroke();

    const colors = ['#ff2a2a', '#ff8a23', '#ffe94a', '#39ff7a', '#23f6ff', '#a020f0'];
    colors.forEach((col, i) => {
      const spreadY = (i - 2.5) * 6;
      const alpha = 0.6 + Math.sin(time * 4 + i) * 0.4;
      ctx.strokeStyle = col;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pRight.x + 2, pRight.y - 8);
      ctx.lineTo(W, pRight.y - 8 + spreadY * 1.8);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.shadowColor = '#23f6ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(35, 246, 255, 0.12)';
    ctx.strokeStyle = '#23f6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y);
    ctx.lineTo(pLeft.x, pLeft.y);
    ctx.lineTo(pRight.x, pRight.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pLeft.x + 6, pLeft.y - 4);
    ctx.lineTo(pTop.x, pTop.y + 10);
    ctx.lineTo(pRight.x - 6, pRight.y - 4);
    ctx.stroke();
    ctx.restore();

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- NEWTON CRADLE ---------- */
function newtonsCradleScene(startTime, done){
  const numBalls = 5;
  const ballR = 8;
  const stringLen = 70;
  const originY = 50;
  const spacing = ballR * 2;
  const startX = W / 2 - ((numBalls - 1) * spacing) / 2;

  function frame(t){
    const elapsed = t - startTime;
    if(elapsed >= SHOWTIME_MS){ done(); return; }
    const time = elapsed / 1000;

    clearScreen('#0a001a');

    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX - 20, originY);
    ctx.lineTo(startX + (numBalls - 1) * spacing + 20, originY);
    ctx.stroke();

    const cycleTime = time * 3.5;
    const maxAngle = Math.PI / 4;
    let angles = new Array(numBalls).fill(0);
    
    const phase = cycleTime % (Math.PI * 2);
    if(phase < Math.PI){
      const swing = Math.sin(phase);
      if(swing > 0){
        angles[0] = -maxAngle * swing;
      }
    } else {
      const swing = Math.sin(phase);
      if(swing < 0){
        angles[4] = maxAngle * (-swing);
      }
    }

    for(let i = 0; i < numBalls; i++){
      const anchorX = startX + i * spacing;
      const anchorY = originY;
      const angle = angles[i];

      const ballX = anchorX + Math.sin(angle) * stringLen;
      const ballY = anchorY + Math.cos(angle) * stringLen;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(anchorX, anchorY);
      ctx.lineTo(ballX, ballY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(ballX + 1, ballY + 2, ballR, 0, Math.PI * 2);
      ctx.fill();

      const grad = ctx.createRadialGradient(ballX - 2, ballY - 2, 1, ballX, ballY, ballR);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#23f6ff');
      grad.addColorStop(1, '#0b3c5d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ballX - 3, ballY - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- Boxing ---------- */
function boxingScene(startTime, done) {
  const duration = typeof SHOWTIME_MS !== 'undefined' ? SHOWTIME_MS : 8000;
  const ringTop = 40, ringBottom = 180, ringLeft = 30, ringRight = 190;
  const centerX = (ringLeft + ringRight) / 2;
  const centerY = (ringTop + ringBottom) / 2;
  const fighters = [
    {
      x: ringLeft + 45, y: centerY + 15, baseX: ringLeft + 45, baseY: centerY + 15,
      color: '#ff4d4d', shorts: '#991111', glove: '#ffe94a', facing: 1,
      punching: 0, punchType: 0, cooldown: 500 + Math.random() * 400,
      hitFlash: 0, bobPhase: 0, lean: 0, recoilX: 0
    },
    {
      x: ringRight - 45, y: centerY + 15, baseX: ringRight - 45, baseY: centerY + 15,
      color: '#4d9bff', shorts: '#114499', glove: '#ffe94a', facing: -1,
      punching: 0, punchType: 0, cooldown: 700 + Math.random() * 500,
      hitFlash: 0, bobPhase: Math.PI, lean: 0, recoilX: 0
    },
  ];
  let lastT = startTime;
  let screenShake = 0;
  let rafId = null;

  function drawRing() {
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(ringLeft - 4, ringTop - 4, (ringRight - ringLeft) + 8, (ringBottom - ringTop) + 8);
    ctx.fillStyle = '#262626';
    ctx.fillRect(ringLeft, ringTop, ringRight - ringLeft, ringBottom - ringTop);
    ctx.strokeStyle = '#8a5a2a';
    ctx.lineWidth = 3;
    ctx.strokeRect(ringLeft, ringTop, ringRight - ringLeft, ringBottom - ringTop);
    ctx.strokeStyle = '#c98f1a';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const offset = i * 4;
      ctx.strokeRect(ringLeft + offset, ringTop + offset, (ringRight - ringLeft) - offset * 2, (ringBottom - ringTop) - offset * 2);
    }
  }

  function drawArm(x1, y1, x2, y2, gloveColor, gloveSize) {
    const midX = (x1 + x2) * 0.5 - (y2 - y1) * 0.15;
    const midY = (y1 + y2) * 0.5 + (x2 - x1) * 0.15;
    ctx.strokeStyle = '#e0ac69';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX, midY, x2, y2);
    ctx.stroke();
    ctx.fillStyle = gloveColor;
    ctx.beginPath();
    ctx.arc(x2, y2, gloveSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x2 - 1, y2 - 1, gloveSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFighter(f) {
    ctx.save();
    const drawX = f.x + f.recoilX;
    const bounceY = Math.sin(f.bobPhase) * 2.5;
    const drawY = f.y + bounceY;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(drawX, ringBottom - 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    let punchProgress = 0;
    let extendDist = 0;
    let liftY = 0;
    if (f.punching > 0) {
      punchProgress = 1 - (f.punching / 200);
      if (punchProgress < 0.35) {
        extendDist = (punchProgress / 0.35) * 28;
      } else {
        extendDist = (1 - (punchProgress - 0.35) / 0.65) * 28;
      }
      if (f.punchType === 1) liftY = -6;
    }
    const dir = f.facing;
    ctx.save();
    ctx.translate(drawX, drawY);
    ctx.rotate(f.lean * 0.15);
    ctx.fillStyle = f.shorts;
    ctx.fillRect(-7, 2, 14, 8);
    ctx.fillStyle = f.hitFlash > 0 ? '#ffffff' : f.color;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(-8, -8, 16, 12, 3);
    } else {
      ctx.fillRect(-8, -8, 16, 12);
    }
    ctx.fill();
    ctx.fillStyle = f.hitFlash > 0 ? '#ffffff' : '#e0ac69';
    ctx.beginPath();
    ctx.arc(dir * 2, -14, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(dir > 0 ? 3 : -3, -15, 3, 2);
    const backGloveX = -dir * 10;
    const backGloveY = -6;
    drawArm(-dir * 5, -8, backGloveX, backGloveY, f.glove, 3.5);
    if (f.punching > 0) {
      const targetGloveX = dir * (10 + extendDist);
      const targetGloveY = -10 + liftY;
      drawArm(dir * 6, -10, targetGloveX, targetGloveY, f.glove, 4.5);
    } else {
      drawArm(dir * 7, -10, dir * 11, -8, f.glove, 4.5);
    }
    ctx.restore();
    ctx.restore();
  }

  function frame(t) {
    const elapsed = t - startTime;
    if (elapsed >= duration) { if (typeof done === 'function') done(); return; }
    const dt = Math.min(t - lastT, 32);
    lastT = t;
    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 0.02);
    fighters.forEach((f, i) => {
      const opponent = fighters[1 - i];
      f.bobPhase += dt * 0.008;
      const distToOpp = opponent.x - f.x;
      const targetSpacing = 38;
      const spacingError = Math.abs(distToOpp) - targetSpacing;
      if (f.punching <= 0) {
        if (Math.abs(spacingError) > 4) {
          f.baseX += Math.sign(distToOpp * Math.abs(spacingError)) * 0.03 * dt * f.facing;
        }
        f.baseX += Math.sin(elapsed * 0.002 + i * 3) * 0.04 * dt;
        f.baseX = Math.max(ringLeft + 25, Math.min(ringRight - 25, f.baseX));
      }
      f.recoilX += (0 - f.recoilX) * 0.15;
      f.x += (f.baseX - f.x) * 0.1;
      f.cooldown -= dt;
      if (f.cooldown <= 0 && f.punching <= 0) {
        f.punching = 200;
        f.punchType = Math.random() > 0.4 ? 1 : 0;
        f.cooldown = 450 + Math.random() * 550;
        f.lean = f.facing * 1.2;
      }
      if (f.punching > 0) {
        const prevPunch = f.punching;
        f.punching -= dt;
        if (prevPunch > 130 && f.punching <= 130) {
          const punchReachX = f.baseX + f.facing * 34;
          const distToOpponentX = Math.abs(punchReachX - opponent.baseX);
          if (distToOpponentX < 28) {
            opponent.hitFlash = 160;
            opponent.recoilX = f.facing * 7;
            opponent.bobPhase += 0.5;
            screenShake = 4;
          }
        }
      } else {
        f.lean += (0 - f.lean) * 0.15;
      }
      if (opponent.hitFlash > 0) {
        opponent.hitFlash -= dt;
      }
    });
    ctx.save();
    if (screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * screenShake * 2;
      const shakeY = (Math.random() - 0.5) * screenShake * 2;
      ctx.translate(shakeX, shakeY);
    }
    if (typeof clearScreen === 'function') {
      clearScreen('#0a0a0a');
    } else {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, ctx.canvas ? ctx.canvas.width : 300, ctx.canvas ? ctx.canvas.height : 300);
    }
    drawRing();
    fighters.forEach((f) => drawFighter(f));
    ctx.restore();
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}

/* ---------- Confetti ---------- */
function confettiScene(startTime, done) {
  const colors = ['#ff2bd6', '#ffe94a', '#39ff7a', '#23f6ff', '#ff8a23', '#ffffff'];
  const count = 60;

  const pieces = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * -H,
    w: 4 + Math.random() * 3,
    h: 6 + Math.random() * 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    speed: 0.05 + Math.random() * 0.07,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 0.002 + Math.random() * 0.003,
    swayAmp: 10 + Math.random() * 15,
    angle: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.01,
  }));

  function frame(t) {
    const elapsed = t - startTime;
    if (elapsed >= SHOWTIME_MS) { done(); return; }
    const dt = t - startTime === elapsed ? 16 : 16;

    clearScreen('#101018');

    pieces.forEach((p) => {
      p.y += p.speed * dt;
      p.sway += p.swaySpeed * dt;
      p.angle += p.spin * dt;
      const drawX = p.x + Math.sin(p.sway) * p.swayAmp;

      if (p.y > H + 10) {
        p.y = -10;
        p.x = Math.random() * W;
      }

      ctx.save();
      ctx.translate(drawX, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);
}


/* ---------- GAME LOGIC ---------- */
const VIRTUAL_SIZE = 220;

const GAMES = [
  starWarsCrawlScene, confettiScene, alarmClockScene, digitalPetScene, cannonScene, flyingButterflies, unicycleScene, gameBoyScene, vinylRecordScene, ufoScene, bowlingScene, fireworksScene, underwaterScene, catScene, ballPitScene, lavaLampScene, fileTransferScene, snakeScene, blockStacker, boxingScene, runnerScene, plasmaVisualizer, brickBreaker, dotEater, invadersScene, asteroidsScene, mystifyScene, pinballScene, solitaireScene, poolScene,
  prismSweepScene, plantGrowthScene, starWarsLightsaberScene, solarSystemScene, racingCarsScene, colorSplashScene, prismTriangleScene, newtonsCradleScene, starfieldWarpScene, vhsRewindScene,
];

let currentIndex = 0;

export function playRandomAnimation(canvas, done) {
  stopAnimation();

  const realCtx = canvas.getContext('2d');
  const realW = canvas.width;
  const realH = canvas.height;

  const idx = currentIndex;
  currentIndex = (currentIndex + 1) % GAMES.length;
  const game = GAMES[idx];

  ctx = realCtx;


  const s = Math.min(realW / VIRTUAL_SIZE, realH / VIRTUAL_SIZE);
  const offsetX = (realW - VIRTUAL_SIZE * s) / 2;
  const offsetY = (realH - VIRTUAL_SIZE * s) / 2;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, realW, realH);

  ctx.setTransform(s, 0, 0, s, offsetX, offsetY);
  W = VIRTUAL_SIZE;
  H = VIRTUAL_SIZE;
  scale = 1;

  game(performance.now(), () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    done();
  });
}

export function stopAnimation() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    clearScreen();
  }
}