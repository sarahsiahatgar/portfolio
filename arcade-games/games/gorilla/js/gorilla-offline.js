// gorilla-offline.js

const OFFLINE_QUIPS = [
  "No signal, no mercy!",
  "Offline mode — still on target.",
  "Running local. Aim's still perfect.",
  "Connection's down, my arm still works.",
  "You get the backup gorilla. Lucky you.",
  "Cloud server disconnected. Local savage activated.",
  "Who needs the internet when you've got raw local power?",
  "Backup AI protocol engaged. Prepare to be pelted.",
];

function pickQuip() {
  return OFFLINE_QUIPS[Math.floor(Math.random() * OFFLINE_QUIPS.length)];
}

export function getOfflineThrow(aiPos, playerPos, wind, difficulty, buildings, gravity = 9.8) {
  const [aiX, aiY] = aiPos;
  const [targetX, targetY] = playerPos;

  let bestAngle = 45;
  let bestVelocity = 50;

  const anglesToTest = [70, 65, 60, 55, 50, 45, 40, 35, 30];

  search:
  for (const angleDeg of anglesToTest) {
    const angleRad = angleDeg * (Math.PI / 180);

    for (let v = 20; v <= 120; v += 3) {
      let vx = -v * Math.cos(angleRad);
      let vy = -v * Math.sin(angleRad);

      let simX = aiX - 8;
      let simY = aiY - 10;

      const substeps = 4;
      const dt = 0.2 / substeps;
      let hitTarget = false;

      for (let step = 0; step < 300; step++) {
        for (let sub = 0; sub < substeps; sub++) {
          vx += (wind * 0.05) / substeps;
          vy += gravity * dt;
          simX += vx * dt;
          simY += vy * dt;
        }

        if (simX < 0 || simX > 280 || simY > 220) break;

        const pRect = { x: targetX - 14, y: targetY - 22, w: 28, h: 28 };
        if (simX >= pRect.x && simX <= pRect.x + pRect.w && simY >= pRect.y && simY <= pRect.y + pRect.h) {
          hitTarget = true;
          break;
        }

        let hitBuilding = false;
        for (const b of buildings) {
          const currentY = 200 - b.currentHeight;
          if (simX >= b.x && simX <= b.x + b.width && simY >= currentY && simY <= 200) {
            hitBuilding = true;
            break;
          }
        }
        if (hitBuilding) break;
      }

      if (hitTarget) {
        bestAngle = angleDeg;
        bestVelocity = v;
        break search;
      }
    }
  }

  let angleError = 0;
  let velocityError = 0;

  if (difficulty === 'Easy') {
    angleError = (Math.random() - 0.5) * 16;
    velocityError = (Math.random() - 0.5) * 15;
  } else if (difficulty === 'Normal') {
    angleError = (Math.random() - 0.5) * 6;
    velocityError = (Math.random() - 0.5) * 5;
  }

  return {
    angle: Math.round(bestAngle + angleError),
    velocity: Math.round(Math.max(10, Math.min(130, bestVelocity + velocityError))),
    message: pickQuip(),
  };
}