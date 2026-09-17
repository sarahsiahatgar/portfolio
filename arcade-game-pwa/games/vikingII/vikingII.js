/**
 * vikingII.js
 * Core game loop and state management.
 */

import {
  drawMinecraftHuman,
  drawInitialScreen,
  drawFortification,
  drawProjectiles,
  drawWaveBanner,
  drawGameOverOverlay
} from './vikingII-render.js';

import {
  fetchLeaderboard,
  submitScore
} from './vikingII-leaderboard.js';

const FRAME_INTERVAL_MS = 1000 / 60;

export function initVikingGame() {
  const canvas = document.getElementById("vikingCanvas");
  if (!canvas) return () => {};
  const ctx = canvas.getContext("2d");

  const statusEl = document.getElementById("vikingStatus");
  const waveDisplayEl = document.getElementById("waveDisplay");
  const hpDisplayEl = document.getElementById("hpDisplay");
  const marqueeScreen = document.getElementById("vikingMarqueeScreen");
  let statusTimer = null;

  const controller = new AbortController();
  const { signal } = controller;

  let rafId = null;
  let lastFrameTime = 0;
  let isRunning = false;

  let score = 0;
  let wave = 1;
  let longhouseHp = 100;
  let isGameOver = false;
  let isPaused = false;
  let cloudHighScore = 0;
  let leftHandedMode = false;
  let currentDifficulty = 'Normal';

  let waveBannerTimer = 0;
  let waveBannerText = "";

  let enemies = [];
  let powerUps = [];
  let projectiles = [];

  let isShooting = false;
  let targetX = 0;
  let targetY = 0;
  let shootTimer = 0;

  let shieldActive = false;
  let shieldTimer = 0;
  let multiShotActive = false;
  let multiShotTimer = 0;

  const defender = {
    x: 35,
    y: canvas.height / 2
  };

  const diffBtn = document.getElementById("vikingDifficultyBtn");
  if (diffBtn) {
    diffBtn.addEventListener('click', () => {
      if (isRunning && !isGameOver) return;
      if (currentDifficulty === 'Normal') {
        currentDifficulty = 'Hard';
      } else if (currentDifficulty === 'Hard') {
        currentDifficulty = 'Easy';
      } else {
        currentDifficulty = 'Normal';
      }
      diffBtn.textContent = currentDifficulty;
    }, { signal });
  }

  document.getElementById("leftHandedBtn")?.addEventListener('click', toggleLeftHanded, { signal });
  document.getElementById("startBtn")?.addEventListener('click', startGame, { signal });
  document.getElementById("pauseBtn")?.addEventListener('click', togglePause, { signal });
  document.getElementById("exitGameBtn")?.addEventListener('click', exitGameOver, { signal });
  document.getElementById("submitScoreBtn")?.addEventListener('click', handleSubmitScore, { signal });
  document.getElementById("skipScoreBtn")?.addEventListener('click', handleSkipScore, { signal });

  function showStatus(text, stateClass = '', duration = 0) {
    if (statusTimer) {
      clearTimeout(statusTimer);
      statusTimer = null;
    }
    if (!statusEl || !marqueeScreen) return;

    statusEl.textContent = text;
    marqueeScreen.className = 'arcade-marquee-screen ' + stateClass;

    if (duration > 0) {
      statusTimer = setTimeout(() => {
        statusEl.textContent = '';
        marqueeScreen.className = 'arcade-marquee-screen';
        statusTimer = null;
      }, duration);
    }
  }

  function triggerWaveBanner(text) {
    waveBannerText = text;
    waveBannerTimer = 90;
  }

  function renderInitial() {
    drawInitialScreen(ctx, canvas, defender, leftHandedMode);
    
    if (waveDisplayEl) waveDisplayEl.classList.add("viking-hidden");
    if (hpDisplayEl) hpDisplayEl.classList.add("viking-hidden");
    showStatus("", "", 0);
  }

  function toggleLeftHanded() {
    if (isRunning && !isGameOver) return;
    leftHandedMode = !leftHandedMode;
    const btn = document.getElementById("leftHandedBtn");
    if (btn) btn.textContent = leftHandedMode ? "Mode: Right" : "Mode: Left";
    renderInitial();
  }

  function startGame() {
    const startOverlay = document.getElementById("startOverlay");
    if (startOverlay) startOverlay.classList.add("viking-hidden");

    const pauseOverlay = document.getElementById("pauseOverlay");
    if (pauseOverlay) pauseOverlay.classList.add("viking-hidden");

    const gameOverOverlay = document.getElementById("gameOverOverlay");
    if (gameOverOverlay) gameOverOverlay.classList.add("viking-hidden");

    if (diffBtn) {
      diffBtn.style.display = "inline-block";
      diffBtn.disabled = true;
    }

    const startBtn = document.getElementById("startBtn");
    if (startBtn) startBtn.style.display = "none";

    const leftHandedBtn = document.getElementById("leftHandedBtn");
    if (leftHandedBtn) leftHandedBtn.style.display = "none";

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) {
      pauseBtn.style.display = "inline-block";
      pauseBtn.textContent = "Pause";
    }

    const exitGameBtn = document.getElementById("exitGameBtn");
    if (exitGameBtn) exitGameBtn.style.display = "inline-block";

    hideScoreEntryUI();
    hideLeaderboard();

    defender.x = leftHandedMode ? canvas.width - 35 : 35;

    score = 0;
    wave = 1;
    longhouseHp = 100;
    isGameOver = false;
    isPaused = false;
    waveBannerTimer = 0;

    enemies = [];
    powerUps = [];
    projectiles = [];
    isShooting = false;
    shootTimer = 0;

    if (waveDisplayEl) waveDisplayEl.classList.remove("viking-hidden");
    if (hpDisplayEl) hpDisplayEl.classList.remove("viking-hidden");

    spawnWave();
    triggerWaveBanner(`WAVE ${wave}`);
    showStatus("", "", 0);

    isRunning = true;
    startLoop();
  }

  function manualRestart() {
    stopLoop();
    isGameOver = true;
    isPaused = false;
    isRunning = false;

    const startOverlay = document.getElementById("startOverlay");
    if (startOverlay) startOverlay.classList.remove("viking-hidden");

    const pauseOverlay = document.getElementById("pauseOverlay");
    if (pauseOverlay) pauseOverlay.classList.add("viking-hidden");

    const gameOverOverlay = document.getElementById("gameOverOverlay");
    if (gameOverOverlay) gameOverOverlay.classList.add("viking-hidden");

    const errorMsgEl = document.getElementById("scoreErrorMsg");
    if (errorMsgEl) errorMsgEl.textContent = "";

    if (diffBtn) {
      diffBtn.style.display = "inline-block";
      diffBtn.disabled = false;
    }

    const startBtn = document.getElementById("startBtn");
    if (startBtn) startBtn.style.display = "inline-block";

    const leftHandedBtn = document.getElementById("leftHandedBtn");
    if (leftHandedBtn) leftHandedBtn.style.display = "inline-block";

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) pauseBtn.style.display = "none";

    const exitGameBtn = document.getElementById("exitGameBtn");
    if (exitGameBtn) exitGameBtn.style.display = "none";

    hideScoreEntryUI();
    hideLeaderboard();

    renderInitial();
  }

  function togglePause() {
    if (isGameOver) return;
    isPaused = !isPaused;

    const pauseBtn = document.getElementById("pauseBtn");
    const pauseOverlay = document.getElementById("pauseOverlay");

    if (isPaused) {
      pauseBtn.textContent = "Resume";
      if (pauseOverlay) pauseOverlay.classList.remove("viking-hidden");
    } else {
      pauseBtn.textContent = "Pause";
      if (pauseOverlay) pauseOverlay.classList.add("viking-hidden");
    }
  }

  function spawnWave() {
    let enemyCount = 3 + wave * 2;
    let speedMultiplier = 1.0;
    if (currentDifficulty === 'Easy') speedMultiplier = 0.65;
    if (currentDifficulty === 'Hard') speedMultiplier = 1.45;

    for (let i = 0; i < enemyCount; i++) {
      let isHeavy = Math.random() < 0.08;

      let startX = leftHandedMode ?
        -300 - Math.random() * 300 - (i * 60) :
        canvas.width + Math.random() * 300 + (i * 60);

      let baseSpeed = isHeavy ? (0.8 + (wave * 0.2)) : (1.2 + (wave * 0.3));

      enemies.push({
        x: startX,
        y: Math.random() * (canvas.height - 110) + 40,
        width: isHeavy ? 36 : 24,
        height: isHeavy ? 56 : 40,
        speed: baseSpeed * speedMultiplier,
        hp: isHeavy ? 4 : 1,
        maxHp: isHeavy ? 4 : 1,
        isHeavy: isHeavy
      });
    }

    let types = [];
    if (longhouseHp < 100) types.push('health');
    types.push('shield', 'multishot');

    if (Math.random() < 0.75 && types.length > 0) {
      let chosenType = types[Math.floor(Math.random() * types.length)];
      let powerUpStartX = leftHandedMode ? -100 : canvas.width + 100;
      powerUps.push({
        x: powerUpStartX,
        y: Math.random() * (canvas.height - 80) + 30,
        width: 36,
        height: 36,
        speed: 1.5,
        type: chosenType
      });
    }
  }

  function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  canvas.addEventListener("mousedown", function(e) {
    if (isGameOver || isPaused) return;
    isShooting = true;
    const coords = getCanvasCoordinates(e);
    targetX = coords.x;
    targetY = coords.y;
  }, { signal });

  window.addEventListener("mousemove", function(e) {
    if (!isShooting || isGameOver || isPaused) return;
    const coords = getCanvasCoordinates(e);
    targetX = coords.x;
    targetY = coords.y;
  }, { signal });

  window.addEventListener("mouseup", function() {
    isShooting = false;
  }, { signal });

  canvas.addEventListener("touchstart", function(e) {
    if (isGameOver || isPaused) return;
    e.preventDefault();
    isShooting = true;
    const coords = getCanvasCoordinates(e);
    targetX = coords.x;
    targetY = coords.y;
  }, { signal, passive: false });

  canvas.addEventListener("touchmove", function(e) {
    if (!isShooting || isGameOver || isPaused) return;
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    targetX = coords.x;
    targetY = coords.y;
  }, { signal, passive: false });

  window.addEventListener("touchend", function() {
    isShooting = false;
  }, { signal });

  function fireArrow(angleOffset = 0) {
    const angle = Math.atan2(targetY - defender.y, targetX - defender.x) + angleOffset;
    const speed = 9;

    projectiles.push({
      x: defender.x,
      y: defender.y,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      angle: angle,
      length: 22,
      width: 4
    });
  }

  function loopTick(timestamp) {
    rafId = requestAnimationFrame(loopTick);
    if (timestamp - lastFrameTime < FRAME_INTERVAL_MS) return;
    lastFrameTime = timestamp;
    updateGame();
  }

  function startLoop() {
    stopLoop();
    lastFrameTime = 0;
    rafId = requestAnimationFrame(loopTick);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function updateShootingTimer() {
    if (!isShooting) return;
    shootTimer++;
    if (shootTimer >= 12) {
      shootTimer = 0;
      if (multiShotActive) {
        fireArrow(-0.35);
        fireArrow(-0.17);
        fireArrow(0);
        fireArrow(0.17);
        fireArrow(0.35);
      } else {
        fireArrow(0);
      }
    }
  }

  function updatePowerupTimers() {
    if (shieldActive) {
      shieldTimer--;
      if (shieldTimer <= 0) shieldActive = false;
    }
    if (multiShotActive) {
      multiShotTimer--;
      if (multiShotTimer <= 0) multiShotActive = false;
    }
  }

  function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      let pu = powerUps[i];
      if (waveBannerTimer <= 0) {
        if (leftHandedMode) {
          pu.x += pu.speed;
        } else {
          pu.x -= pu.speed;
        }
      }

      let cx = pu.x + pu.width / 2;
      let cy = pu.y + pu.height / 2;

      ctx.fillStyle = "#7ec8e3";
      ctx.fillRect(pu.x, pu.y, pu.width, pu.height);

      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let icon = pu.type === 'health' ? "💚" : (pu.type === 'shield' ? "🔥" : "⚔️");
      ctx.fillText(icon, cx, cy);
      ctx.textAlign = "start";
      ctx.textBaseline = "alphabetic";

      if ((leftHandedMode && pu.x >= canvas.width - 50) || (!leftHandedMode && pu.x <= 50)) {
        powerUps.splice(i, 1);
        continue;
      }

      for (let j = projectiles.length - 1; j >= 0; j--) {
        let p = projectiles[j];
        if (
          p.x > pu.x &&
          p.x < pu.x + pu.width &&
          p.y > pu.y &&
          p.y < pu.y + pu.height
        ) {
          if (pu.type === 'health') {
            longhouseHp = Math.min(100, longhouseHp + 20);
          } else if (pu.type === 'shield') {
            shieldActive = true;
            shieldTimer = 600;
          } else if (pu.type === 'multishot') {
            multiShotActive = true;
            multiShotTimer = 300;
          }
          powerUps.splice(i, 1);
          projectiles.splice(j, 1);
          score += 50;
          break;
        }
      }
    }
  }

  function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      let enemy = enemies[i];

      if (waveBannerTimer <= 0) {
        if (leftHandedMode) {
          enemy.x += enemy.speed;
        } else {
          enemy.x -= enemy.speed;
        }
      }

      drawMinecraftHuman(ctx, enemy.x, enemy.y, enemy.width, enemy.height, enemy.isHeavy, false, enemy.hp, enemy.maxHp);

      let hitWall = leftHandedMode ? (enemy.x + enemy.width >= canvas.width - 50) : (enemy.x <= 50);

      if (hitWall) {
        if (shieldActive) {
          score += 15;
        } else {
          let dmgMultiplier = currentDifficulty === 'Hard' ? 1.5 : (currentDifficulty === 'Easy' ? 0.75 : 1.0);
          longhouseHp -= Math.round((enemy.isHeavy ? 25 : 10) * dmgMultiplier);
          if (longhouseHp <= 0) {
            longhouseHp = 0;
            endGame();
          }
        }
        enemies.splice(i, 1);
        continue;
      }

      for (let j = projectiles.length - 1; j >= 0; j--) {
        let p = projectiles[j];
        if (
          p.x > enemy.x &&
          p.x < enemy.x + enemy.width &&
          p.y > enemy.y &&
          p.y < enemy.y + enemy.height
        ) {
          enemy.hp--;
          projectiles.splice(j, 1);

          if (enemy.hp <= 0) {
            enemies.splice(i, 1);
            score += enemy.isHeavy ? 100 : 25;
          }
          break;
        }
      }
    }
  }

  function checkWaveCompletion() {
    if (enemies.length === 0 && !isGameOver && waveBannerTimer <= 0) {
      let oldWave = wave;
      wave++;
      score += 100 * wave;
      spawnWave();
      triggerWaveBanner(`WAVE ${wave}`);
      
      showStatus(`WAVE ${oldWave} CLEARED`, "golden-state", 1800);
    }
  }

  function updateHud() {
    document.getElementById("scoreDisplay").textContent = score;

    if (waveDisplayEl) waveDisplayEl.textContent = `WAVE ${wave}`;
    if (hpDisplayEl) hpDisplayEl.textContent = `HP ${longhouseHp}`;

    if (statusTimer === null && isRunning && !isGameOver) {
      let abilityText = "";
      if (shieldActive) {
        abilityText += `🔥 SHIELD: ${Math.ceil(shieldTimer / 60)}s `;
      }
      if (multiShotActive) {
        abilityText += `⚔️ 5-SHOT: ${Math.ceil(multiShotTimer / 60)}s`;
      }

      if (statusEl) {
        statusEl.textContent = abilityText;
        marqueeScreen.className = 'arcade-marquee-screen';
      }
    }
  }

  function updateGame() {
    if (isPaused || isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#7ec8e3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (waveBannerTimer > 0) {
      waveBannerTimer--;
    }

    updateShootingTimer();
    updatePowerupTimers();

    drawFortification(ctx, canvas, leftHandedMode, shieldActive);
    drawMinecraftHuman(ctx, defender.x - 12, defender.y - 24, 24, 48, false, true);
    drawProjectiles(ctx, projectiles, canvas);

    updatePowerUps();
    updateEnemies();
    checkWaveCompletion();

    if (waveBannerTimer > 0) {
      drawWaveBanner(ctx, canvas, waveBannerText);
    }

    updateHud();
  }

  function endGame() {
    isGameOver = true;
    
    showStatus(`SCORE: ${score}`, "", 0);

    const gameOverOverlay = document.getElementById("gameOverOverlay");
    const gameOverText = document.getElementById("gameOverOverlayText");

    if (gameOverText) {
      if (score > cloudHighScore && cloudHighScore > 0) {
        gameOverText.textContent = "NEW HIGH SCORE!";
      } else {
        gameOverText.textContent = "FALLEN!";
      }
    }

    if (gameOverOverlay) gameOverOverlay.classList.remove("viking-hidden");

    const gameOverInputRow = document.getElementById("gameOverInputRow");
    if (gameOverInputRow) gameOverInputRow.style.display = "flex";

    const pauseBtn = document.getElementById("pauseBtn");
    if (pauseBtn) pauseBtn.style.display = "none";

    const submitScoreBtn = document.getElementById("submitScoreBtn");
    if (submitScoreBtn) submitScoreBtn.style.display = "inline-block";

    const skipScoreBtn = document.getElementById("skipScoreBtn");
    if (skipScoreBtn) skipScoreBtn.style.display = "inline-block";

    const exitGameBtn = document.getElementById("exitGameBtn");
    if (exitGameBtn) exitGameBtn.style.display = "none";
  }

  function hideScoreEntryUI() {
    const gameOverInputRow = document.getElementById("gameOverInputRow");
    if (gameOverInputRow) gameOverInputRow.style.display = "none";

    const submitScoreBtn = document.getElementById("submitScoreBtn");
    if (submitScoreBtn) {
      submitScoreBtn.style.display = "none";
      submitScoreBtn.disabled = false;
      submitScoreBtn.textContent = "Submit Score";
    }

    const skipScoreBtn = document.getElementById("skipScoreBtn");
    if (skipScoreBtn) skipScoreBtn.style.display = "none";
  }

  function hideLeaderboard() {
    const leaderboardContainer = document.getElementById("leaderboardContainer");
    if (leaderboardContainer) leaderboardContainer.style.display = "none";
  }

  async function revealLeaderboard() {
    hideScoreEntryUI();

    const leaderboardContainer = document.getElementById("leaderboardContainer");
    if (leaderboardContainer) leaderboardContainer.style.display = "block";

    const exitGameBtn = document.getElementById("exitGameBtn");
    if (exitGameBtn) exitGameBtn.style.display = "inline-block";

    await fetchLeaderboard((highScore) => {
      cloudHighScore = highScore;
    });
  }

  function exitGameOver() {
    const playerNameInput = document.getElementById("playerName");
    if (playerNameInput) playerNameInput.value = "";
    manualRestart();
  }

  async function handleSkipScore() {
    await revealLeaderboard();
  }

  async function handleSubmitScore() {
    const submitScoreBtn = document.getElementById("submitScoreBtn");
    const errorMsgEl = document.getElementById("scoreErrorMsg");

    if (errorMsgEl) errorMsgEl.textContent = "";

    if (submitScoreBtn) {
      submitScoreBtn.disabled = true;
      submitScoreBtn.textContent = "Submitting...";
    }

    let success = false;

    try {
      await submitScore(score, async () => {
        success = true;
        await revealLeaderboard();
      });
    } catch (error) {
      success = false;
      if (errorMsgEl) {
        errorMsgEl.textContent = "Failed to submit score. Please try again.";
      }
    } finally {
      if (!success && submitScoreBtn) {
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = "Submit Score";
      }
    }
  }

  renderInitial();
  fetchLeaderboard((highScore) => {
    cloudHighScore = highScore;
  });

  return function cleanup() {
    if (statusTimer) clearTimeout(statusTimer);
    controller.abort();
    stopLoop();
  };
}