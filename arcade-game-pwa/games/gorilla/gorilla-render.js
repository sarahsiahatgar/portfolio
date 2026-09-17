// ==========================================
// Gorilla Banana Fight — Renderer
// Pure drawing: takes a canvas context and the current game state
// and paints a frame. Doesn't own any state itself.
// ==========================================

import { SCREEN_WIDTH, SCREEN_HEIGHT } from './gorilla-engine.js';

function drawSkyAndPlanet(ctx, game) {
    let skyColor = '#111827';
    const planetName = game.planets[game.planetIndex].name;
    if (planetName === 'Moon') {
        skyColor = '#030712';
    } else if (planetName === 'Mars') {
        skyColor = '#2d1512';
    } else if (planetName === 'Jupiter') {
        skyColor = '#432818';
    }

    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    ctx.save();
    ctx.fillStyle = '#ffffff';
    let starCount = (planetName === 'Moon') ? 8 : 25;
    for (let i = 0; i < starCount; i++) {
        let sx = (i * 37) % SCREEN_WIDTH;
        let sy = (i * 23) % (SCREEN_HEIGHT / 2);
        ctx.globalAlpha = (i % 2 === 0) ? 0.8 : 0.4;
        ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.restore();

    ctx.save();
    const objX = SCREEN_WIDTH / 2;
    const objY = 50;

    if (planetName === 'Earth') {
        const sunRadius = 12;
        ctx.fillStyle = game.sunMood === 'sad' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(252, 211, 77, 0.2)';
        ctx.beginPath();
        ctx.arc(objX, objY, sunRadius + 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = game.sunMood === 'sad' ? '#64748b' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(objX, objY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(objX - 3, objY - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(objX + 3, objY - 2, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#78350f';
        ctx.fill();

        ctx.beginPath();
        if (game.sunMood === 'sad') {
            ctx.arc(objX, objY + 5, 3, Math.PI, Math.PI * 2, false);
        } else {
            ctx.arc(objX, objY + 2, 3, 0, Math.PI, false);
        }
        ctx.stroke();

    } else if (planetName === 'Moon') {
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(objX, objY, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(objX - 3, objY - 2, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(objX - 5, objY + 2, 8, 2);

    } else if (planetName === 'Mars') {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.beginPath();
        ctx.arc(objX, objY, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(objX, objY, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(objX - 3, objY - 3, 3, 0, Math.PI * 2);
        ctx.arc(objX + 4, objY + 2, 2, 0, Math.PI * 2);
        ctx.fill();

    } else if (planetName === 'Jupiter') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(objX, objY, 14, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = '#d97706';
        ctx.fillRect(objX - 15, objY - 15, 30, 30);

        ctx.fillStyle = '#b45309';
        ctx.fillRect(objX - 15, objY - 6, 30, 4);
        ctx.fillRect(objX - 15, objY + 4, 30, 3);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(objX - 15, objY - 1, 30, 3);

        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.ellipse(objX + 3, objY + 3, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

function drawParticles(ctx, game) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
        let p = game.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
            game.particles.splice(i, 1);
        } else {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

function drawGorilla(ctx, game, pos, isPlayer) {
    const x = pos[0];
    const y = pos[1];
    const veryDarkYellow = '#6b5500';

    let isCelebratingThis = (game.celebratingGorilla === 1 && isPlayer) || (game.celebratingGorilla === 2 && !isPlayer);
    let rightArmOffset = 0;
    let leftArmOffset = 0;

    if (isCelebratingThis) {
        const cycleProgress = (90 - game.celebrationTimer) / 90;
        const wavePhase = (cycleProgress * 4) % 2;
        if (wavePhase < 1) {
            rightArmOffset = -12;
        } else {
            leftArmOffset = -12;
        }
    }

    ctx.save();
    ctx.translate(x, y);
    if (!isPlayer) ctx.scale(-1, 1);
    ctx.scale(0.6, 0.6);

    ctx.fillStyle = veryDarkYellow;
    ctx.beginPath();
    ctx.moveTo(-15, 0);
    ctx.bezierCurveTo(-20, -15, -15, -30, 0, -30);
    ctx.bezierCurveTo(15, -30, 20, -15, 15, 0);
    ctx.fill();

    ctx.fillStyle = '#b7950b';
    ctx.beginPath();
    ctx.arc(0, -15, 10, Math.PI, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = veryDarkYellow;
    ctx.beginPath();
    ctx.arc(0, -32, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f9e79f';
    ctx.beginPath();
    ctx.ellipse(0, -28, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -34, 3, 0, Math.PI * 2);
    ctx.arc(4, -34, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-3, -34, 1.5, 0, Math.PI * 2);
    ctx.arc(3, -34, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = veryDarkYellow;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-12, -18);
    ctx.lineTo(-18, -25 + leftArmOffset);
    ctx.stroke();

    ctx.fillStyle = veryDarkYellow;
    ctx.beginPath();
    ctx.arc(-18, -25 + leftArmOffset, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(12, -18);
    ctx.lineTo(20, -25 + rightArmOffset);
    ctx.stroke();

    ctx.fillStyle = veryDarkYellow;
    ctx.beginPath();
    ctx.arc(20, -25 + rightArmOffset, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawBanana(ctx, game) {
    if (!game.banana || game.banana === "scored") return;

    const bx = game.banana.pos[0];
    const by = game.banana.pos[1];

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(game.banana.rotation);

    ctx.fillStyle = '#ffe066';
    ctx.strokeStyle = '#9a7b0c';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(-7, -3);
    ctx.bezierCurveTo(-3, -9, 5, -9, 7, -3);
    ctx.bezierCurveTo(3, -5, -3, -5, -7, -3);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

export function renderGame(ctx, game) {
    game.frame++;

    if (game.celebrationTimer > 0) {
        game.celebrationTimer--;
        if (game.celebrationTimer === 0) {
            game.celebratingGorilla = null;
        }
    }

    drawSkyAndPlanet(ctx, game);

    for (let b of game.buildings) {
        b.draw(ctx);
    }

    drawParticles(ctx, game);

    drawGorilla(ctx, game, game.g1_pos, true);
    drawGorilla(ctx, game, game.g2_pos, false);

    drawBanana(ctx, game);
}