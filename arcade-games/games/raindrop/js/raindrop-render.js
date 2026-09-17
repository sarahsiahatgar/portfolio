// raindrop-render.js
// Pure canvas drawing for the Raindrop game. Every function here takes the
// canvas context plus plain data and draws — no game rules live in this file,
// so the visuals can change without touching game logic (and vice versa).

import { MAX_WATER } from './raindrop-engine.js';

function fitFontSize(ctx, text, maxWidth, { max = 10, min = 6.5 } = {}) {
  ctx.font = `bold ${max}px Arial`;
  const widthAtMax = ctx.measureText(text).width;
  if (widthAtMax <= maxWidth) return max;
  const scaled = (maxWidth / widthAtMax) * max;
  return Math.max(min, Math.round(scaled * 2) / 2);
}

export function drawBackground(ctx, width, height) {
  const limitY = height - MAX_WATER;

  const sky = ctx.createLinearGradient(0, 0, 0, limitY);
  sky.addColorStop(0, '#8ecae6');
  sky.addColorStop(1, '#dff3fb');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, limitY);

  ctx.fillStyle = '#8bc34a';
  ctx.fillRect(0, limitY - 4, width, 4);

  ctx.fillStyle = '#2c5f7c';
  ctx.fillRect(0, limitY, width, MAX_WATER);
}

export function drawCloud(ctx, cloud) {
  const { x, y, scale = 1 } = cloud;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(0, 4, 9, 0, Math.PI * 2);
  ctx.arc(10, -3, 12, 0, Math.PI * 2);
  ctx.arc(23, 3, 10, 0, Math.PI * 2);
  ctx.arc(-9, 4, 7, 0, Math.PI * 2);
  ctx.arc(14, 9, 11, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(150, 175, 200, 0.25)';
  ctx.beginPath();
  ctx.ellipse(9, 11, 17, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPalmLeaf(ctx, x, y, angle, length) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = '#2ECC71';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.5, -6, length, 0);
  ctx.quadraticCurveTo(length * 0.5, 6, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1E7E34';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(length - 2, 0);
  ctx.stroke();
  ctx.restore();
}

function drawPalmTree(ctx, baseX, baseY, time) {
  const trunkTopX = baseX - 4;
  const trunkTopY = baseY - 34;

  ctx.strokeStyle = '#8B5A2B';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX - 8, baseY);
  ctx.quadraticCurveTo(baseX - 12, baseY - 20, trunkTopX, trunkTopY);
  ctx.stroke();

  ctx.strokeStyle = '#a97a45';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(baseX - 8, baseY - 2);
  ctx.quadraticCurveTo(baseX - 11, baseY - 20, trunkTopX - 1, trunkTopY + 2);
  ctx.stroke();

  const leafConfig = [
    { offset: 0, length: 26 },
    { offset: -40, length: 23 },
    { offset: 40, length: 23 },
    { offset: -80, length: 20 },
    { offset: 80, length: 20 },
    { offset: -120, length: 17 },
    { offset: 120, length: 17 },
  ];
  leafConfig.forEach(({ offset, length }, i) => {
    const sway = Math.sin(time * 1.2 + i) * 4; // degrees
    const angle = ((-90 + offset + sway) * Math.PI) / 180;
    drawPalmLeaf(ctx, trunkTopX, trunkTopY, angle, length);
  });

  // a couple of coconuts for character
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  ctx.arc(trunkTopX - 3, trunkTopY + 6, 2.5, 0, Math.PI * 2);
  ctx.arc(trunkTopX + 3, trunkTopY + 7, 2.5, 0, Math.PI * 2);
  
  ctx.fill();
}

function drawIslandMound(ctx, x, y) {
  const grad = ctx.createRadialGradient(x, y - 2, 4, x, y + 6, 34);
  grad.addColorStop(0, '#EAC98B');
  grad.addColorStop(1, '#C9A063');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 32, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#E5B869';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawStickman(ctx, x, y, time, dangerLevel) {
  const worried = dangerLevel > 0.5;

  // head
  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(x, y - 18, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // body
  ctx.beginPath();
  ctx.moveTo(x, y - 13);
  ctx.lineTo(x, y - 5);
  ctx.stroke();

  // left arm — stays put
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x - 5, y - 6);
  ctx.stroke();

  // right arm — raises and waves once the water gets dangerously high
  ctx.beginPath();
  ctx.moveTo(x, y - 10);
  if (worried) {
    const wave = Math.sin(time * 6);
    ctx.lineTo(x + 5 + wave * 2, y - 16 + Math.abs(wave) * 2);
  } else {
    ctx.lineTo(x + 5, y - 6);
  }
  ctx.stroke();

  // legs
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x - 4, y);
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x + 4, y);
  ctx.stroke();
}

function drawDrowningStickman(ctx, x, y, time) {
  const bob = Math.sin(time * 3) * 2;
  const cx = x;
  const cy = y + 2 + bob;

  // 1. Head (center position: cx, cy - 8)
  const headX = cx;
  const headY = cy - 8;

  ctx.fillStyle = '#2b2b2b';
  ctx.beginPath();
  ctx.arc(headX, headY, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 2. Rising bubbles originating right at the head
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.8 + i * 0.9) % 2.5; // Bubble lifetime loop
    const bx = headX + Math.sin(time * 3 + i) * 3; // Slight wobble around head center
    const by = headY - t * 8; // Starts right at headY and floats upward
    const alpha = Math.max(0, 1 - t / 2.5);

    ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.8).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(bx, by, Math.max(0.4, 1.4 - t * 0.3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // 3. Two arms waving in the air above water
  const leftWave = Math.sin(time * 8) * 4;
  const rightWave = Math.cos(time * 8) * 4;

  // Left arm
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx - 6 + leftWave, cy - 16);
  ctx.stroke();

  // Right arm
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 6 + rightWave, cy - 16);
  ctx.stroke();

  // 4. Torso and legs trailing down into the water
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx, cy + 12);
  ctx.stroke();
}

export function drawIsland(ctx, width, height, time = 0, dangerLevel = 0, isFlooded = false) {
  const islandX = width - 45;
  const islandY = height - MAX_WATER;

  drawIslandMound(ctx, islandX, islandY);
  drawPalmTree(ctx, islandX, islandY, time);
  
  drawSeashell(ctx, islandX - 20, islandY + 7,  2.5, -0.4);
  drawSeashell(ctx, islandX - 10, islandY + 11, 1.8,  0.3);
  drawSeashell(ctx, islandX - 2,  islandY + 5, 1.9, -0.2);
  drawSeashell(ctx, islandX - 14, islandY + 5,  2.0,  0.4);
  

  if (isFlooded) {
    drawDrowningStickman(ctx, islandX + 12, islandY, time);
  } else {
    drawStickman(ctx, islandX + 12, islandY + 6, time, dangerLevel);
  }
}

function drawSeashell(ctx, x, y, size = 4, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#FFF8D1';
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-size, -size * 1.2, 0, -size * 1.5);
  ctx.quadraticCurveTo(size, -size * 1.2, 0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size * 0.4, -size * 1.2);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -size * 1.4);
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.4, -size * 1.2);
  ctx.stroke();

  ctx.restore();
}

export function drawDrop(ctx, drop, time = 0) {
  if (drop.isGolden) {
    const radius = 22;

    const grad = ctx.createRadialGradient(drop.x - 6, drop.y - 6, 3, drop.x, drop.y, radius);
    grad.addColorStop(0, '#FFF6B0');
    grad.addColorStop(1, '#FFC400');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = '#FFC000';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) {
      const angle = (i * Math.PI) / 15;
      const isLong = i % 2 === 0;
      const baseOuter = isLong ? radius + 8 : radius + 6;
      const pulse = isLong ? Math.sin(time * 3) * 3 : Math.sin(time * 3 + Math.PI) * 3;
      const rInner = radius + 2;
      const rOuter = baseOuter + pulse;
      const x1 = drop.x + Math.cos(angle) * rInner;
      const y1 = drop.y + Math.sin(angle) * rInner;
      const x2 = drop.x + Math.cos(angle) * rOuter;
      const y2 = drop.y + Math.sin(angle) * rOuter;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const maxWidth = radius * 2 - 8;
    const fontSize = fitFontSize(ctx, drop.text, maxWidth, { max: 10, min: 7 });
    ctx.fillStyle = '#5a3a00';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(drop.text, drop.x, drop.y);
  } else {
    const wFactor = 20;
    const hFactor = 26;

    ctx.fillStyle = '#1E90FF';
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y - hFactor);
    ctx.bezierCurveTo(
      drop.x + wFactor, drop.y + 2,
      drop.x + wFactor * 0.9, drop.y + 18,
      drop.x, drop.y + 18
    );
    ctx.bezierCurveTo(
      drop.x - wFactor * 0.9, drop.y + 18,
      drop.x - wFactor, drop.y + 2,
      drop.x, drop.y - hFactor
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const maxWidth = wFactor * 2 - 8;
    const fontSize = fitFontSize(ctx, drop.text, maxWidth, { max: 10, min: 7 });
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(drop.text, drop.x, drop.y);
  }
}

export function drawWater(ctx, width, height, waterHeight, time) {
  if (waterHeight <= 0) return;

  const surfaceY = height - waterHeight;
  const waveAmplitude = 2.5;
  const waveLength = 40;

  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, surfaceY);
  for (let x = 0; x <= width; x += 4) {
    const y = surfaceY + Math.sin(x / waveLength + time) * waveAmplitude;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = '#1E90FF';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(0, surfaceY + 3);
  for (let x = 0; x <= width; x += 4) {
    const y = surfaceY + 3 + Math.sin(x / (waveLength * 0.7) + time * 1.6) * (waveAmplitude * 0.6);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();
}