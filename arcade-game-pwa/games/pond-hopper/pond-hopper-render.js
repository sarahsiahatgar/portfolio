// ==========================================
// Pond Hopper — Renderer
// Pure drawing: takes a canvas context and state and paints a frame.
// waveOffset is passed in (owned by the engine, advanced once per tick)
// rather than living here as module-level mutable state - the previous
// version incremented its own hidden module variable on every draw call,
// which meant this file wasn't actually a pure function of its inputs,
// and two simultaneous instances on the same page would have shared
// (and fought over) the same animation phase.
// ==========================================

export function drawFrog(ctx, frog, frogColor) {
  const x = frog.x;
  const y = frog.y;
  const w = frog.width;
  const h = frog.height;

  const primary = frogColor?.primary || '#b5be8a';
  const shadow = frogColor?.shadow || '#8f9862';
  const highlight = frogColor?.highlight || '#c7d09c';

  // Frog Legs
  ctx.fillStyle = shadow;
  ctx.fillRect(x - 1, y + 3, 2, 3);
  ctx.fillRect(x - 1, y + h - 5, 2, 3);
  ctx.fillRect(x + w - 1, y + 3, 2, 3);
  ctx.fillRect(x + w - 1, y + h - 5, 2, 3);

  if (!frogColor?.invisible) {
    // Main Torso / Body
    ctx.fillStyle = primary;
    ctx.fillRect(x + 1, y + 2, w - 2, h - 3);

    // Back Highlight Stripe
    ctx.fillStyle = highlight;
    ctx.fillRect(x + 3, y + 4, w - 6, h - 5);
  } else {
    // Invisible
    ctx.strokeStyle = 'rgba(181, 190, 138, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 1, y + 2, w - 2, h - 3);
  }

  // Buggy Eyes
  ctx.fillStyle = frogColor?.invisible ? 'rgba(181, 190, 138, 0.6)' : primary;
  ctx.fillRect(x - 1, y - 1, 4, 4);
  ctx.fillRect(x + w - 3, y - 1, 4, 4);

  // Dark Pupils
  ctx.fillStyle = '#1e2319';
  ctx.fillRect(x, y, 2, 2);
  ctx.fillRect(x + w - 2, y, 2, 2);
}

const FLOWER_PALETTES = [
  { petalEdge: '#e0559e', petal: '#ff9ecf', center: '#9d4edd', stamen: '#ffeb3b' }, // pink/purple
  { petalEdge: '#5fa8d3', petal: '#a8d8f0', center: '#fb8500', stamen: '#ffffff' }, // sky blue/orange
  { petalEdge: '#dda15e', petal: '#fefae0', center: '#bc6c25', stamen: '#ffd166' }, // cream/brown
];

export function drawStaticFlowers(ctx, GRID) {
  const decorativeFlowers = [
    { row: 6, x: 32, palette: 0 }, { row: 6, x: 160, palette: 1 }, { row: 6, x: 220, palette: 2 },
    { row: 12, x: 80, palette: 1 }, { row: 12, x: 190, palette: 2 },
    { row: 13, x: 20, palette: 0 }, { row: 13, x: 244, palette: 1 },
    { row: 14, x: 112, palette: 2 }, { row: 14, x: 176, palette: 0 }
  ];

  decorativeFlowers.forEach(f => {
    let fx = f.x;
    let fy = f.row * GRID + 2;
    let centerX = fx + 6;
    let centerY = fy + 6;
    const c = FLOWER_PALETTES[f.palette % FLOWER_PALETTES.length];

    // Stem
    ctx.fillStyle = '#558b2f';
    ctx.fillRect(fx + 5, fy + 10, 2, 4);

    // A small leaf pair at the base of the stem
    ctx.fillStyle = '#6ba83f';
    ctx.beginPath();
    ctx.ellipse(fx + 3, fy + 12, 2.2, 1.2, 0.6, 0, Math.PI * 2);
    ctx.ellipse(fx + 9, fy + 12, 2.2, 1.2, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Petals
    let numPetals = 6;
    for (let i = 0; i < numPetals; i++) {
      let angle = (i * Math.PI * 2) / numPetals;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);

      ctx.fillStyle = c.petalEdge;
      ctx.beginPath();
      ctx.ellipse(0, -3, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = c.petal;
      ctx.beginPath();
      ctx.ellipse(0, -3.3, 1.2, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Center
    ctx.fillStyle = c.center;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Stamen dot
    ctx.fillStyle = c.stamen;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function drawInsect(ctx, insect, GRID) {
  if (!insect.active) return;
  const ix = insect.x;
  const iy = insect.row * GRID + 3;

  if (insect.type === 'fly') {
    ctx.fillStyle = '#111111';
    ctx.fillRect(ix + 3, iy + 2, 4, 4);
    ctx.fillStyle = '#e0f7fa';
    ctx.fillRect(ix + 1, iy + 1, 2, 2);
    ctx.fillRect(ix + 7, iy + 1, 2, 2);
  } else if (insect.type === 'butterfly') {
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(ix + 4, iy + 1, 2, 6);
    ctx.fillStyle = '#ff5252';
    ctx.fillRect(ix + 1, iy, 3, 4);
    ctx.fillRect(ix + 6, iy, 3, 4);
    ctx.fillStyle = '#ff4081';
    ctx.fillRect(ix + 2, iy + 4, 2, 3);
    ctx.fillRect(ix + 6, iy + 4, 2, 3);
  } else if (insect.type === 'firefly') {
    const isBlinking = Math.floor(insect.timer / 8) % 2 === 0;

    if (isBlinking) {
      ctx.fillStyle = 'rgba(204, 255, 0, 0.5)';
      ctx.fillRect(ix, iy + 1, 10, 7);
      ctx.fillStyle = '#ccff00';
      ctx.fillRect(ix + 2, iy + 2, 6, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix + 3, iy + 3, 2, 2);
    } else {
      ctx.fillStyle = '#829b00';
      ctx.fillRect(ix + 2, iy + 2, 6, 5);
    }

    ctx.fillStyle = '#111111';
    ctx.fillRect(ix + 4, iy, 2, 2);
  }
}

export function drawLog(ctx, rx, ry, rw, rh) {
  // Base log body
  ctx.fillStyle = '#8B5A2B';
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, rh / 2);
  ctx.fill();
  ctx.strokeStyle = '#5c3a21';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 220, 180, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx + 3, ry + 1.5);
  ctx.lineTo(rx + rw - 3, ry + 1.5);
  ctx.stroke();

  const ringRadiusX = Math.min(rh / 2 - 1, 4);
  const ringRadiusY = rh / 2 - 1;
  [rx + ringRadiusX + 1, rx + rw - ringRadiusX - 1].forEach(cx => {
    const cy = ry + rh / 2;
    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, ringRadiusX, ringRadiusY, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy, ringRadiusX * 0.5, ringRadiusY * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#6b4523';
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadiusX * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  if (rw > 26) {
    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 4, rh * 0.18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawTurtle(ctx, tx, ty, turtleWidth, rh, facingRight) {
  const centerX = tx + turtleWidth / 2;
  const centerY = ty + rh / 2;
  const radiusX = turtleWidth / 2;
  const radiusY = rh / 2;

  ctx.fillStyle = '#235330';
  ctx.fillRect(centerX - radiusX * 0.7 - 1, ty + rh - 2, 3, 3);
  ctx.fillRect(centerX + radiusX * 0.7 - 2, ty + rh - 2, 3, 3);

  // Shell
  ctx.fillStyle = '#2e6f40';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3cb371';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX - 2, radiusY - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scute pattern
  ctx.fillStyle = '#235330';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX * 0.28, radiusY * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(centerX - radiusX * 0.45, centerY, radiusX * 0.2, radiusY * 0.4, 0, 0, Math.PI * 2);
  ctx.ellipse(centerX + radiusX * 0.45, centerY, radiusX * 0.2, radiusY * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#385823';
  const headX = facingRight ? tx + turtleWidth + 1 : tx - 1;
  ctx.beginPath();
  ctx.arc(headX, centerY, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(headX + (facingRight ? 1 : -1), centerY - 0.5, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

export function drawVehicle(ctx, rx, ry, rw, rh, bodyColor, isTruck, facingRight) {
  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(rx, ry, rw, rh, 3);
  ctx.fill();

  // Roof highlight for a bit of dimension
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(rx + 2, ry + 1, rw - 4, rh * 0.3);

  // Cabin / windshield
  const cabinW = isTruck ? rw * 0.26 : rw * 0.4;
  const cabinX = facingRight ? rx + rw - cabinW - 3 : rx + 3;
  ctx.fillStyle = '#1e2319';
  ctx.fillRect(cabinX, ry + 2, cabinW, rh - 4);
  ctx.fillStyle = 'rgba(180, 220, 255, 0.35)';
  ctx.fillRect(cabinX + 1, ry + 3, Math.max(1, cabinW - 2), (rh - 4) * 0.4);

  // Corrugated cargo section on trucks
  if (isTruck) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 0.6;
    const cargoStart = facingRight ? rx + 2 : cabinX + cabinW + 2;
    const cargoEnd = facingRight ? cabinX - 2 : rx + rw - 2;
    for (let lx = cargoStart; lx < cargoEnd; lx += 4) {
      ctx.beginPath();
      ctx.moveTo(lx, ry + 2);
      ctx.lineTo(lx, ry + rh - 2);
      ctx.stroke();
    }
  }

  // Headlights (front) and taillights (rear)
  const lightY1 = ry + 1.5;
  const lightY2 = ry + rh - 4;
  const frontX = facingRight ? rx + rw - 2 : rx;
  const rearX = facingRight ? rx : rx + rw - 2;
  ctx.fillStyle = '#ffff66';
  ctx.fillRect(frontX, lightY1, 2, 2.5);
  ctx.fillRect(frontX, lightY2, 2, 2.5);
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(rearX, lightY1, 2, 2.5);
  ctx.fillRect(rearX, lightY2, 2, 2.5);

  // Wheels
  const wheelRadius = 2;
  const wheelY = ry + rh - 0.5;
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(rx + wheelRadius + 2, wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.arc(rx + rw - wheelRadius - 2, wheelY, wheelRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#666666';
  ctx.beginPath();
  ctx.arc(rx + wheelRadius + 2, wheelY, wheelRadius * 0.4, 0, Math.PI * 2);
  ctx.arc(rx + rw - wheelRadius - 2, wheelY, wheelRadius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawObstacle(ctx, obs, GRID) {
  const rx = obs.x;
  const ry = obs.row * GRID + 2;
  const rw = obs.width;
  const rh = GRID - 4;

  if (obs.row >= 1 && obs.row <= 5) {
    if (obs.type === 'log') {
      drawLog(ctx, rx, ry, rw, rh);
    } else if (obs.type === 'turtle') {
      const turtleWidth = 22;
      const gap = 8;
      const numTurtles = Math.floor(rw / (turtleWidth + gap)) || 1;
      for (let i = 0; i < numTurtles; i++) {
        drawTurtle(ctx, rx + (i * (turtleWidth + gap)), ry, turtleWidth, rh, obs.speed > 0);
      }
    }
  } else if (obs.row >= 7 && obs.row <= 11) {
    const bodyColor = obs.type === 'truck' ? '#d9534f' : '#f0ad4e';
    drawVehicle(ctx, rx, ry, rw, rh, bodyColor, obs.type === 'truck', obs.speed > 0);
  }
}

export function drawLilyPad(ctx, hx, centerY, radius, filled) {
  ctx.fillStyle = '#386641';
  ctx.strokeStyle = '#283618';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(hx, centerY);
  ctx.arc(hx, centerY, radius, 0.65 * Math.PI, 0.35 * Math.PI, false);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(40, 54, 24, 0.6)';
  ctx.lineWidth = 0.6;
  [0.75, 1.0, 1.25, 1.5, 1.75].forEach(mult => {
    const angle = mult * Math.PI;
    ctx.beginPath();
    ctx.moveTo(hx, centerY);
    ctx.lineTo(hx + Math.cos(angle) * radius * 0.85, centerY + Math.sin(angle) * radius * 0.85);
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(140, 200, 120, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(hx, centerY, radius - 1, 0.7 * Math.PI, 1.75 * Math.PI, false);
  ctx.stroke();

  if (!filled) {

    ctx.fillStyle = '#f4e8ff';
    const outerPetals = 8;
    for (let i = 0; i < outerPetals; i++) {
      const angle = (i * Math.PI * 2) / outerPetals;
      ctx.save();
      ctx.translate(hx, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(1.5, -3, 0, -5);
      ctx.quadraticCurveTo(-1.5, -3, 0, 0);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#d8a7f0';
    ctx.beginPath();
    ctx.arc(hx, centerY, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(hx, centerY, 1.1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    let fx = hx - 6;
    let fy = centerY - 5;

    ctx.fillStyle = '#b5be8a';
    ctx.fillRect(fx + 1, fy + 1, 10, 8);

    ctx.fillStyle = '#c7d09c';
    ctx.fillRect(fx + 3, fy + 2, 6, 6);

    ctx.fillStyle = '#b5be8a';
    ctx.fillRect(fx, fy, 3, 3);
    ctx.fillRect(fx + 9, fy, 3, 3);

    ctx.fillStyle = '#1e2319';
    ctx.fillRect(fx, fy + 1, 1, 1);
    ctx.fillRect(fx + 11, fy + 1, 1, 1);
  }
}

export function drawGameScene(ctx, canvas, GRID, homeSlots, homeSlotXCoords, obstacles, frog, insect, frogColor, waveOffset = 0) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Water zone (rows 1-5)
  ctx.fillStyle = '#2a9d8f';
  ctx.fillRect(0, GRID * 1, canvas.width, GRID * 5);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;

  for (let r = 1; r <= 5; r++) {
    let waveY = r * GRID + GRID / 2;
    let direction = (r % 2 === 0) ? 1 : -1;
    let rowBaseOffset = waveOffset * direction * (0.8 + (r * 0.15));

    let dashWidth = 16;
    let waveXPositions = [
      (40 + rowBaseOffset),
      (130 + rowBaseOffset),
      (220 + rowBaseOffset)
    ];

    waveXPositions.forEach(xPos => {
      let x = ((xPos % canvas.width) + canvas.width) % canvas.width;

      ctx.beginPath();
      ctx.moveTo(x, waveY);
      ctx.lineTo(x + dashWidth, waveY);
      ctx.stroke();

      if (x < dashWidth) {
        ctx.beginPath();
        ctx.moveTo(x + canvas.width, waveY);
        ctx.lineTo(x + canvas.width + dashWidth, waveY);
        ctx.stroke();
      } else if (x > canvas.width - dashWidth) {
        ctx.beginPath();
        ctx.moveTo(x - canvas.width, waveY);
        ctx.lineTo(x - canvas.width + dashWidth, waveY);
        ctx.stroke();
      }
    });
  }

  // Safe Banks & Medians
  ctx.fillStyle = '#425438';
  ctx.fillRect(0, 0, canvas.width, GRID * 1);
  ctx.fillRect(0, GRID * 6, canvas.width, GRID * 1);
  ctx.fillRect(0, GRID * 12, canvas.width, GRID * 1);
  ctx.fillRect(0, GRID * 13, canvas.width, GRID * 2);

  drawStaticFlowers(ctx, GRID);

  // Road Background & Lanes
  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, GRID * 7, canvas.width, GRID * 5);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  for (let r = 8; r <= 11; r++) {
    ctx.beginPath();
    ctx.moveTo(0, GRID * r);
    ctx.lineTo(canvas.width, GRID * r);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Home Slots
  homeSlots.forEach((filled, index) => {
    drawLilyPad(ctx, homeSlotXCoords[index], 10, 9, filled);
  });

  obstacles.forEach(obs => {
    drawObstacle(ctx, obs, GRID);
  });

  drawInsect(ctx, insect, GRID);

  drawFrog(ctx, frog, frogColor);
}