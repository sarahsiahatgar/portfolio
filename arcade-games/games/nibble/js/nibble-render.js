// ==========================================
// Nibbles — Renderer
// ==========================================

export function renderGame(ctx, game) {
  ctx.fillStyle = '#1e2319';
  ctx.fillRect(0, 0, game.WIDTH, game.HEIGHT);

  if (game.gameMode === 'levels') {
    const walls = game.getWalls();
    ctx.fillStyle = '#556044';
    walls.forEach(wall => {
      ctx.fillRect(wall.x, wall.y, game.grid - 2, game.grid - 2);
    });
  }

  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(game.food.x, game.food.y, game.grid - 2, game.grid - 2);

  ctx.fillStyle = '#b5be8a';
  game.snake.forEach(segment => ctx.fillRect(segment.x, segment.y, game.grid - 2, game.grid - 2));
}