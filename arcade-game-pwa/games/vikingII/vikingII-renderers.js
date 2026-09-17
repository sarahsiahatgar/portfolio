/**
 * vikingII-renderers.js
 * Handles visual canvas drawing operations.
 */

export function drawMinecraftHuman(ctx, x, y, w, h, isHeavy, isPlayer = false, hp = 1, maxHp = 1) {
  let headSize = w * 0.75;
  let headX = x + (w - headSize) / 2;
  let headY = y;

  let torsoW = w * 0.8;
  let torsoH = h * 0.45;
  let torsoX = x + (w - torsoW) / 2;
  let torsoY = headY + headSize;

  let limbW = w * 0.28;
  let limbH = h * 0.35;
  let legY = torsoY + torsoH;

  if (isPlayer) {
    ctx.fillStyle = "#2c3e50";
    ctx.fillRect(torsoX + 2, legY, limbW - 1, limbH);
    ctx.fillRect(torsoX + torsoW - limbW - 1, legY, limbW - 1, limbH);

    ctx.fillStyle = "#c0392b";
    ctx.fillRect(torsoX, torsoY, torsoW, torsoH);
    ctx.fillStyle = "#f39c12";
    ctx.fillRect(torsoX, torsoY + torsoH - 4, torsoW, 4);

    ctx.fillStyle = "#c0392b";
    ctx.fillRect(torsoX - limbW + 2, torsoY, limbW - 2, torsoH - 4);
    ctx.fillRect(torsoX + torsoW - 2, torsoY, limbW - 2, torsoH - 4);

    ctx.fillStyle = "#f5cba7";
    ctx.fillRect(headX, headY, headSize, headSize);
    ctx.fillStyle = "#4a3525";
    ctx.fillRect(headX, headY + headSize * 0.5, headSize, headSize * 0.5);

    ctx.fillStyle = "#34495e";
    ctx.fillRect(headX - 2, headY - 4, headSize + 4, headSize * 0.5);
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(headX - 6, headY - 8, 5, 5);
    ctx.fillRect(headX + headSize + 1, headY - 8, 5, 5);
  } else if (isHeavy) {
    ctx.fillStyle = "#222";
    ctx.fillRect(x - 4, y - 14, w + 8, 5);
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(x - 3, y - 13, (w + 6) * (hp / maxHp), 3);

    ctx.fillStyle = "#273746";
    ctx.fillRect(torsoX + 2, legY, limbW - 1, limbH);
    ctx.fillRect(torsoX + torsoW - limbW - 1, legY, limbW - 1, limbH);

    ctx.fillStyle = "#78281f";
    ctx.fillRect(torsoX, torsoY, torsoW, torsoH);
    ctx.fillStyle = "#d4ac0d";
    ctx.fillRect(torsoX + 3, torsoY + 4, torsoW - 6, 4);

    ctx.fillStyle = "#78281f";
    ctx.fillRect(torsoX - limbW + 2, torsoY, limbW - 2, torsoH - 4);
    ctx.fillRect(torsoX + torsoW - 2, torsoY, limbW - 2, torsoH - 4);

    ctx.fillStyle = "#f5cba7";
    ctx.fillRect(headX, headY, headSize, headSize);
    ctx.fillStyle = "#17202a";
    ctx.fillRect(headX + 4, headY + 5, 3, 3);
    ctx.fillRect(headX + headSize - 7, headY + 5, 3, 3);

    ctx.fillStyle = "#b7950b";
    ctx.fillRect(headX - 3, headY - 5, headSize + 6, headSize * 0.55);
    ctx.fillStyle = "#f1c40f";
    ctx.fillRect(headX - 8, headY - 10, 6, 7);
    ctx.fillRect(headX + headSize + 2, headY - 10, 6, 7);
  } else {
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(torsoX + 2, legY, limbW - 1, limbH);
    ctx.fillRect(torsoX + torsoW - limbW - 1, legY, limbW - 1, limbH);

    ctx.fillStyle = "#795548";
    ctx.fillRect(torsoX, torsoY, torsoW, torsoH);
    ctx.fillStyle = "#4e342e";
    ctx.fillRect(torsoX, torsoY + torsoH - 4, torsoW, 3);

    ctx.fillStyle = "#795548";
    ctx.fillRect(torsoX - limbW + 2, torsoY, limbW - 2, torsoH - 4);
    ctx.fillRect(torsoX + torsoW - 2, torsoY, limbW - 2, torsoH - 4);

    ctx.fillStyle = "#f5cba7";
    ctx.fillRect(headX, headY, headSize, headSize);
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(headX + 2, headY + headSize * 0.6, headSize - 4, headSize * 0.4);

    ctx.fillStyle = "#5d4037";
    ctx.fillRect(headX - 2, headY - 4, headSize + 4, headSize * 0.5);
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(headX - 5, headY - 7, 4, 4);
    ctx.fillRect(headX + headSize + 1, headY - 7, 4, 4);
  }
}

export function drawInitialScreen(ctx, canvas, defender, leftHandedMode) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#7ec8e3";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  defender.x = leftHandedMode ? canvas.width - 35 : 35;

  if (leftHandedMode) {
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
    ctx.fillStyle = "#a06b38";
    ctx.fillRect(canvas.width - 50, 0, 10, canvas.height);
  } else {
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(0, 0, 50, canvas.height);
    ctx.fillStyle = "#a06b38";
    ctx.fillRect(40, 0, 10, canvas.height);
  }

  drawMinecraftHuman(ctx, defender.x - 12, defender.y - 24, 24, 48, false, true);
}

export function drawFortification(ctx, canvas, leftHandedMode, shieldActive) {
  if (leftHandedMode) {
    if (shieldActive) {
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(canvas.width - 56, 0, 16, canvas.height);

      let time = Date.now() / 80;
      ctx.fillStyle = "#fbbf24";
      for (let fy = 0; fy < canvas.height; fy += 20) {
        let flameHeight = 12 + Math.sin(time + fy) * 6;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 50, fy);
        ctx.lineTo(canvas.width - 50 - flameHeight, fy + 10);
        ctx.lineTo(canvas.width - 50, fy + 20);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(canvas.width - 50, 0, 50, canvas.height);
      ctx.fillStyle = "#a06b38";
      ctx.fillRect(canvas.width - 50, 0, 10, canvas.height);
    }
  } else {
    if (shieldActive) {
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(0, 0, 50, canvas.height);
      ctx.fillStyle = "#f97316";
      ctx.fillRect(40, 0, 16, canvas.height);

      let time = Date.now() / 80;
      ctx.fillStyle = "#fbbf24";
      for (let fy = 0; fy < canvas.height; fy += 20) {
        let flameHeight = 12 + Math.sin(time + fy) * 6;
        ctx.beginPath();
        ctx.moveTo(50, fy);
        ctx.lineTo(50 + flameHeight, fy + 10);
        ctx.lineTo(50, fy + 20);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#6b4423";
      ctx.fillRect(0, 0, 50, canvas.height);
      ctx.fillStyle = "#a06b38";
      ctx.fillRect(40, 0, 10, canvas.height);
    }
  }
}

export function drawProjectiles(ctx, projectiles, canvas) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.dx;
    p.y += p.dy;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(-p.length / 2, -p.width / 2, p.length, p.width);

    ctx.fillStyle = "#bdc3c7";
    ctx.beginPath();
    ctx.moveTo(p.length / 2, -p.width * 1.5);
    ctx.lineTo(p.length / 2 + 8, 0);
    ctx.lineTo(p.length / 2, p.width * 1.5);
    ctx.fill();

    ctx.fillStyle = "#e74c3c";
    ctx.beginPath();
    ctx.moveTo(-p.length / 2, 0);
    ctx.lineTo(-p.length / 2 - 6, -6);
    ctx.lineTo(-p.length / 2 - 3, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-p.length / 2, 0);
    ctx.lineTo(-p.length / 2 - 6, 6);
    ctx.lineTo(-p.length / 2 - 3, 0);
    ctx.fill();

    ctx.restore();

    if (p.x > canvas.width || p.x < 0 || p.y > canvas.height || p.y < 0) {
      projectiles.splice(i, 1);
    }
  }
}

export function drawWaveBanner(ctx, canvas, waveBannerText) {
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(0, canvas.height / 2 - 45, canvas.width, 90);

  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2 - 45);
  ctx.lineTo(canvas.width, canvas.height / 2 - 45);
  ctx.moveTo(0, canvas.height / 2 + 45);
  ctx.lineTo(canvas.width, canvas.height / 2 + 45);
  ctx.stroke();

  ctx.fillStyle = "#facc15";
  ctx.font = "bold 32px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
  ctx.shadowBlur = 12;
  ctx.fillText(waveBannerText, canvas.width / 2, canvas.height / 2);
  ctx.restore();
}

export function drawPauseOverlay(ctx, canvas) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "24px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GAME PAUSED", canvas.width / 2, canvas.height / 2);
  ctx.textBaseline = "alphabetic";
}

export function drawGameOverOverlay(ctx, canvas, score, cloudHighScore) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ef4444";
  ctx.font = "24px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let endMessage = "FALLEN!";
  if (score > cloudHighScore && cloudHighScore > 0) {
    endMessage = "NEW HIGH SCORE!";
  }
  ctx.fillText(endMessage, canvas.width / 2, canvas.height / 2);
  ctx.textBaseline = "alphabetic";
}