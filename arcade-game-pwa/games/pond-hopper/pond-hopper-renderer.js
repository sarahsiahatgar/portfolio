// ==========================================
// Pond Hopper Renderer & Appearance
// ==========================================

let waveOffset = 0;

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

export function drawStaticFlowers(ctx, GRID) {
  const decorativeFlowers = [
    { row: 6, x: 32 }, { row: 6, x: 160 }, { row: 6, x: 220 },
    { row: 12, x: 80 }, { row: 12, x: 190 },
    { row: 13, x: 20 }, { row: 13, x: 244 },
    { row: 14, x: 112 }, { row: 14, x: 176 }
  ];

  decorativeFlowers.forEach(f => {
    let fx = f.x;
    let fy = f.row * GRID + 2;
    let centerX = fx + 6;
    let centerY = fy + 6;

    // 1. Green stem at the base
    ctx.fillStyle = '#558b2f';
    ctx.fillRect(fx + 5, fy + 10, 2, 4);

    // 2. Outer pink petals fanning outward
    ctx.fillStyle = '#ff80bf';
    let numPetals = 6;
    for (let i = 0; i < numPetals; i++) {
      let angle = (i * Math.PI * 2) / numPetals;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -3, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. Inner lighter pink soft center
    ctx.fillStyle = '#ffb3d9';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // 4. Bright yellow center stamen dot
    ctx.fillStyle = '#ffeb3b';
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

export function drawObstacle(ctx, obs, GRID) {
  const rx = obs.x;
  const ry = obs.row * GRID + 2;
  const rw = obs.width;
  const rh = GRID - 4;

  if (obs.row >= 1 && obs.row <= 5) {
    if (obs.type === 'log') {
      // Base log body with softly rounded corners
      ctx.fillStyle = '#8B5A2B';
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 4);
      ctx.fill();

      // Darker wood grain outline
      ctx.strokeStyle = '#5c3a21';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Horizontal oval grain / knot swirls running along the log length
      if (rw > 30) {
        let centerX = rx + rw / 2;
        let centerY = ry + rh / 2;
        
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Inner horizontal oval knot
        ctx.ellipse(centerX, centerY, 8, 2, 0, 0, Math.PI * 2);
        // Outer elongated horizontal oval grain wave
        ctx.ellipse(centerX, centerY, rw / 3, 4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (obs.type === 'turtle') {
      // More rounded shape and balanced size
      const turtleWidth = 22;
      const gap = 8;
      let numTurtles = Math.floor(rw / (turtleWidth + gap)) || 1;

      for (let i = 0; i < numTurtles; i++) {
        let tx = rx + (i * (turtleWidth + gap));
        let ty = ry;
        let centerX = tx + turtleWidth / 2;
        let centerY = ty + rh / 2;
        let radiusX = turtleWidth / 2;
        let radiusY = rh / 2;

        // Outer Dark Green Shell
        ctx.fillStyle = '#2e6f40';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner Lighter Green Shell
        ctx.fillStyle = '#3cb371';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX - 2, radiusY - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Shell scute center pattern detail
        ctx.fillStyle = '#235330';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX - 6, radiusY - 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // lines on the shell
        ctx.strokeStyle = '#235330';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radiusY + 2);
        ctx.lineTo(centerX, centerY + radiusY - 2);
        ctx.moveTo(centerX - radiusX + 3, centerY);
        ctx.lineTo(centerX + radiusX - 3, centerY);
        ctx.stroke();

        // Rounder, darker head poking out in swim direction
        ctx.fillStyle = '#385823'; 
        if (obs.speed > 0) {
          // Facing right
          ctx.beginPath();
          ctx.arc(tx + turtleWidth + 1, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Facing left
          ctx.beginPath();
          ctx.arc(tx - 1, centerY, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  } else if (obs.row >= 7 && obs.row <= 11) {
    if (obs.type === 'truck') {
      ctx.fillStyle = '#d9534f';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = '#1e2319';
      let windowX = obs.speed > 0 ? rx + rw - 10 : rx + 4;
      ctx.fillRect(windowX, ry + 2, 6, rh - 4);
    } else {
      ctx.fillStyle = '#f0ad4e';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.fillStyle = '#1e2319';
      ctx.fillRect(rx + 5, ry + 3, rw - 10, rh - 6);

      ctx.fillStyle = '#ffff66';
      if (obs.speed > 0) {
        ctx.fillRect(rx + rw - 2, ry + 2, 2, 3);
        ctx.fillRect(rx + rw - 2, ry + rh - 5, 2, 3);
      } else {
        ctx.fillRect(rx, ry + 2, 2, 3);
        ctx.fillRect(rx, ry + rh - 5, 2, 3);
      }
    }
  }
}

export function drawGameScene(ctx, canvas, GRID, homeSlots, homeSlotXCoords, obstacles, frog, insect, frogColor) {
  // 1. Clear the canvas first thing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Water zone (Rows 1-5)
  ctx.fillStyle = '#2a9d8f';
  ctx.fillRect(0, GRID * 1, canvas.width, GRID * 5);

  // Draw scattered, staggered moving wave dashes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 1;

  // Increment wave animation speed
  waveOffset = waveOffset + 0.4;

  for (let r = 1; r <= 5; r++) {
    let waveY = r * GRID + GRID / 2;
    
    // Alternate direction per row and vary speed slightly
    let direction = (r % 2 === 0) ? 1 : -1;
    let rowBaseOffset = waveOffset * direction * (0.8 + (r * 0.15));
    
    // 3 sparse dash clusters per row, spaced across the canvas width
    let dashWidth = 16;
    let waveXPositions = [
      (40 + rowBaseOffset),
      (130 + rowBaseOffset),
      (220 + rowBaseOffset)
    ];

    waveXPositions.forEach(xPos => {
      let x = ((xPos % canvas.width) + canvas.width) % canvas.width;
      
      // Draw main dash
      ctx.beginPath();
      ctx.moveTo(x, waveY);
      ctx.lineTo(x + dashWidth, waveY);
      ctx.stroke();
      
      // Duplicate drawing near edges to make the wrap seamless
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

  // Decorative Flowers
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
    let hx = homeSlotXCoords[index];
    let hy = 2;
    let radius = 9;
    let centerY = hy + 8;

    // 1. green lily pad base
    ctx.fillStyle = '#386641';
    ctx.strokeStyle = '#283618';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(hx, centerY);
    ctx.arc(hx, centerY, radius, 0.65 * Math.PI, 0.35 * Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!filled) {
      // 2. Detailed Star/Petal Flower Shape
      ctx.fillStyle = '#dee2e6';
      let numPetals = 6;
      for (let i = 0; i < numPetals; i++) {
        let angle = (i * Math.PI * 2) / numPetals;
        ctx.save();
        ctx.translate(hx, centerY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -3.5, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Inner purple petals ring
      ctx.fillStyle = '#9d4edd';
      ctx.beginPath();
      ctx.arc(hx, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Center golden stamen dot
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.arc(hx, centerY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      let fx = hx - 6;
      let fy = centerY - 5;

      // Mini body
      ctx.fillStyle = '#b5be8a';
      ctx.fillRect(fx + 1, fy + 1, 10, 8);

      // Mini back stripe
      ctx.fillStyle = '#c7d09c';
      ctx.fillRect(fx + 3, fy + 2, 6, 6);

      // Mini eyes
      ctx.fillStyle = '#b5be8a';
      ctx.fillRect(fx, fy, 3, 3);
      ctx.fillRect(fx + 9, fy, 3, 3);

      // Mini pupils
      ctx.fillStyle = '#1e2319';
      ctx.fillRect(fx, fy + 1, 1, 1);
      ctx.fillRect(fx + 11, fy + 1, 1, 1);
    }
  });

  // Draw Obstacles
  obstacles.forEach(obs => {
    drawObstacle(ctx, obs, GRID);
  });

  // Draw Single Active Insect
  drawInsect(ctx, insect, GRID);

  // 2. Draw Frog at the very end with the custom color!
  drawFrog(ctx, frog, frogColor);
}