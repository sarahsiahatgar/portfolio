// ==========================================
// Breakout — Renderer
// Pure drawing: takes a canvas context and the game engine's state and
// paints a frame. Doesn't own or mutate any state itself.
// ==========================================

import { GAME_CONFIG } from './breakout-config.js';
import { BLOCK_COLORS } from './breakout-layouts.js';

export function renderGame(ctx, game) {
  ctx.clearRect(0, 0, game.WIDTH, game.HEIGHT);

  // Paddle
  ctx.fillStyle = game.paddle.isSticky ? GAME_CONFIG.paddle.stickyColor : GAME_CONFIG.paddle.color;
  ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);

  // Balls
  ctx.fillStyle = GAME_CONFIG.ball.color;
  game.balls.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  });

  // Bricks
  game.bricks.forEach(b => {
    if (b.status === 1) {
      ctx.fillStyle = BLOCK_COLORS[b.type] || '#3498db';
      ctx.fillRect(b.x, b.y, b.width, b.height);
      ctx.strokeStyle = '#1e2319';
      ctx.lineWidth = 1;
      ctx.strokeRect(b.x, b.y, b.width, b.height);
    }
  });

  // Falling power-ups
  game.powerups.forEach(p => {
    ctx.fillStyle = p.type.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.type.label, p.x + p.width / 2, p.y + p.height / 2);
  });
}