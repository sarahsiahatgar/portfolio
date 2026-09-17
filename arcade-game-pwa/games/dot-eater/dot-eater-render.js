// ==========================================
// Dot Eater — Renderer
// Pure drawing: takes a canvas context and the game engine's state and
// paints a frame. Doesn't own or mutate any state itself.
// ==========================================

export function drawMaze(ctx, game) {
  ctx.fillStyle = '#1e2319';
  ctx.fillRect(0, 0, game.cols * game.tileSize, game.rows * game.tileSize);
  ctx.fillStyle = '#3b4432';
  for (let r = 0; r < game.rows; r++) {
    for (let c = 0; c < game.cols; c++) {
      if (game.map[r][c] === 1) {
        ctx.fillRect(c * game.tileSize, r * game.tileSize, game.tileSize, game.tileSize);
      }
    }
  }
}

export function drawDots(ctx, game) {
  ctx.fillStyle = '#d2daab';
  game.pacDots.forEach(dot => {
    if (dot.active) {
      ctx.beginPath();
      ctx.arc(dot.c * game.tileSize + game.tileSize / 2, dot.r * game.tileSize + game.tileSize / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function drawItems(ctx, game) {
  if (game.currentFruit) {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.currentFruit.type, game.currentFruit.c * game.tileSize + game.tileSize / 2, game.currentFruit.r * game.tileSize + game.tileSize / 2);
  }
  if (game.currentHeart) {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(game.currentHeart.type, game.currentHeart.c * game.tileSize + game.tileSize / 2, game.currentHeart.r * game.tileSize + game.tileSize / 2);
  }
}

export function drawPacman(ctx, x, y, dx, dy, frame) {
  ctx.fillStyle = '#f1c40f';
  ctx.beginPath();
  let angle = 0;
  if (dy > 0) angle = 0;
  else if (dy < 0) angle = Math.PI;
  else if (dx > 0) angle = Math.PI / 2;
  else if (dx < 0) angle = Math.PI * 1.5;

  let isMoving = (dx !== 0 || dy !== 0);
  let mouthOpen = isMoving ? (Math.floor(frame / 2) % 2 === 0) : true;

  if (mouthOpen) {
    ctx.arc(x, y, 8, angle + 0.2 * Math.PI, angle + 1.8 * Math.PI);
    ctx.lineTo(x, y);
  } else {
    ctx.arc(x, y, 8, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.fillStyle = '#1e2319';
  let eyeX = x, eyeY = y - 3;
  if (dy > 0) { eyeX = x + 1; eyeY = y - 3; }
  else if (dy < 0) { eyeX = x - 1; eyeY = y - 3; }
  else if (dx > 0) { eyeX = x + 3; eyeY = y; }
  else if (dx < 0) { eyeX = x - 3; eyeY = y - 2; }

  ctx.beginPath();
  ctx.arc(eyeX, eyeY, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawGhost(ctx, x, y, color, isEaten) {
  if (isEaten) return;
  let r = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 1, r, Math.PI, 0, false);
  ctx.lineTo(x + r, y + r);
  ctx.lineTo(x + r - 2, y + r - 2);
  ctx.lineTo(x + r - 4, y + r);
  ctx.lineTo(x, y + r - 2);
  ctx.lineTo(x - r + 4, y + r);
  ctx.lineTo(x - r + 2, y + r - 2);
  ctx.lineTo(x - r, y + r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = color === '#ffffff' ? '#e74c3c' : '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 3, y - 2, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 3, y - 2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color === '#ffffff' ? '#c0392b' : '#2980b9';
  ctx.beginPath();
  ctx.arc(x - 3, y - 2, 1, 0, Math.PI * 2);
  ctx.arc(x + 3, y - 2, 1, 0, Math.PI * 2);
  ctx.fill();
}

export function renderGame(ctx, game) {
  drawMaze(ctx, game);
  drawDots(ctx, game);
  drawItems(ctx, game);
  drawPacman(ctx, game.pac.x, game.pac.y, game.pac.dx, game.pac.dy, game.frame);
  game.ghosts.forEach(g => drawGhost(ctx, g.x, g.y, g.color, g.eaten));
}

export function renderPreview(ctx, game) {
  drawMaze(ctx, game);
  drawDots(ctx, game);
  drawPacman(ctx, 30, 30, 0, 1, 0);
  drawGhost(ctx, game.cols * game.tileSize - 30, game.rows * game.tileSize - 30, '#e74c3c', false);
}