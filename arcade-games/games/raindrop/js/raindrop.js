// raindrop.js
// Wires the Raindrop game's DOM (buttons, keypad, status, overlay) to the
// pure game engine (raindrop-engine.js) and the canvas renderer
// (raindrop-render.js), and drives the animation loop.

import { RaindropEngine, MAX_WATER } from './raindrop-engine.js';
import { drawBackground, drawCloud, drawIsland, drawDrop, drawWater } from './raindrop-render.js';

const WATER_EASE = 0.08;

export function initRaindropGame(root) {
  const canvas = root.querySelector('#raindropCanvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const engine = new RaindropEngine(WIDTH, HEIGHT);
  let gameState = 'NOT_PLAYING'; // "NOT_PLAYING" | "PLAYING" | "PAUSED"
  let currentInput = '';
  let statusTimer = null;
  let displayWaterLevel = 0;
  let waveTime = 0;
  let rafId = null;
  let destroyed = false;
  let isCriticalWarningActive = false;

  const scoreEl = root.querySelector('#raindropScore');
  const marqueeScreen = root.querySelector('#raindropMarqueeScreen');
  const statusEl = root.querySelector('#raindropStatus');
  const displayEl = root.querySelector('#raindropDisplay');
  const submitBtn = root.querySelector('#raindropSubmitBtn');
  const difficultyBtn = root.querySelector('#raindropDifficultyBtn');
  const startStopBtn = root.querySelector('#raindropStartStopBtn');
  const pauseBtn = root.querySelector('#raindropPauseBtn');
  const wrapper = root.querySelector('#raindropCanvasWrapper');

  let overlay = wrapper ? wrapper.querySelector('#raindropOverlay') : null;
  if (wrapper && !overlay) {
    overlay = document.createElement('div');
    overlay.id = 'raindropOverlay';
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(20, 24, 18, 0.55);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-family: sans-serif;
      font-size: 18px;
      font-weight: bold;
      z-index: 10;
      box-sizing: border-box;
      padding: 15px;
      pointer-events: none;
    `;
    wrapper.appendChild(overlay);
  }

  function setOverlay(show, htmlContent = '', isBlinking = false) {
    if (!overlay) return;
    if (show) {
      overlay.style.display = 'flex';
      const blinkClass = isBlinking ? 'raindrop-blink-text' : '';
      overlay.innerHTML = `<div class="raindrop-neon-red ${blinkClass}" style="line-height: 1.4;">${htmlContent}</div>`;
    } else {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
  }

  function setBtnDisabled(btn, disabled) {
    if (!btn) return;
    btn.disabled = disabled;
    btn.style.opacity = disabled ? '0.5' : '1';
    btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  function updateUIState(state) {
    gameState = state;
    switch (gameState) {
      case 'NOT_PLAYING':
        setBtnDisabled(difficultyBtn, false);
        setBtnDisabled(startStopBtn, false);
        if (startStopBtn) startStopBtn.textContent = 'Start';
        setBtnDisabled(pauseBtn, true);
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        break;
      case 'PLAYING':
        setBtnDisabled(difficultyBtn, true);
        setBtnDisabled(startStopBtn, true);
        if (startStopBtn) startStopBtn.textContent = 'Stop';
        setBtnDisabled(pauseBtn, false);
        if (pauseBtn) pauseBtn.textContent = 'Pause';
        break;
      case 'PAUSED':
        setBtnDisabled(difficultyBtn, true);
        setBtnDisabled(startStopBtn, false);
        if (startStopBtn) startStopBtn.textContent = 'Stop';
        setBtnDisabled(pauseBtn, false);
        if (pauseBtn) pauseBtn.textContent = 'Resume';
        break;
    }
  }

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
        if (gameState === 'PLAYING') {
          if (isCriticalWarningActive) {
            statusEl.textContent = 'WATER LEVEL CRITICAL!';
            marqueeScreen.className = 'arcade-marquee-screen rise-state';
          } else {
            statusEl.textContent = '';
            marqueeScreen.className = 'arcade-marquee-screen';
          }
        }
        statusTimer = null;
      }, duration);
    }
  }

  function clearInput() {
    currentInput = '';
    if (displayEl) displayEl.textContent = '';
  }

  let isGameOver = false;
  
  function startGame() {
    engine.start();
    isGameOver = false;
    isCriticalWarningActive = false;
    displayWaterLevel = 0;
    if (scoreEl) scoreEl.textContent = engine.score;
    clearInput();
    showStatus('', '', 0);
    setOverlay(false);
  }

  function checkAnswer() {
    if (gameState !== 'PLAYING') return;
    if (currentInput === '') return;

    const result = engine.submitAnswer(currentInput);
    if (result.matched) {
      if (scoreEl) scoreEl.textContent = engine.score;
      showStatus(
        result.golden ? '+30 PTS (WATER LOWERED)' : '+10 PTS',
        result.golden ? 'golden-state' : 'active-state',
        1800
      );
    } else {
      showStatus('WATER LEVEL ROSE!', 'rise-state', 1800);
    }
    clearInput();
  }

  // --- input wiring --------------------------------------------------

  const keypadButtons = root.querySelectorAll('.kp-btn');
  const handleKeypadInput = (e) => {
    e.preventDefault();
    if (gameState !== 'PLAYING') return;
    const val = e.currentTarget.getAttribute('data-val');
    if (val === 'clear') {
      currentInput = '';
    } else if (currentInput.length < 4) {
      currentInput += val;
    }
    if (displayEl) displayEl.textContent = currentInput;
  };
  keypadButtons.forEach((btn) => {
    btn.addEventListener('click', handleKeypadInput);
    btn.addEventListener('touchend', handleKeypadInput);
  });

  const handleSubmitTouch = (e) => {
    e.preventDefault();
    checkAnswer();
  };
  if (submitBtn) {
    submitBtn.addEventListener('click', checkAnswer);
    submitBtn.addEventListener('touchend', handleSubmitTouch);
  }

  const handleKeydown = (e) => {
    if (gameState !== 'PLAYING') return;
    if (e.key >= '0' && e.key <= '9') {
      if (currentInput.length < 4) {
        currentInput += e.key;
        if (displayEl) displayEl.textContent = currentInput;
      }
      e.preventDefault();
    } else if (e.key === 'Enter') {
      checkAnswer();
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      currentInput = currentInput.slice(0, -1);
      if (displayEl) displayEl.textContent = currentInput;
      e.preventDefault();
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      clearInput();
      e.preventDefault();
    }
  };
  document.addEventListener('keydown', handleKeydown);

  function handleDifficultyClick() {
    if (gameState !== 'NOT_PLAYING') return;
    const next = engine.cycleDifficulty();
    if (difficultyBtn) difficultyBtn.textContent = next;
  }
  if (difficultyBtn) difficultyBtn.addEventListener('click', handleDifficultyClick);

  function handleStartStopClick() {
    if (gameState === 'NOT_PLAYING') {
      startGame();
      updateUIState('PLAYING');
    } else if (gameState === 'PAUSED' || gameState === 'PLAYING') {
      clearInput();
      isCriticalWarningActive = false;
      showStatus('', '', 0);
      setOverlay(true, 'PRESS START TO PLAY!', true);
      updateUIState('NOT_PLAYING');
    }
  }
  if (startStopBtn) startStopBtn.addEventListener('click', handleStartStopClick);

  function handlePauseClick() {
    if (gameState === 'PLAYING') {
      updateUIState('PAUSED');
      showStatus(`SCORE: ${engine.score}`, 'active-state', 0);
      setOverlay(true, 'PAUSED', false);
    } else if (gameState === 'PAUSED') {
      updateUIState('PLAYING');
      if (isCriticalWarningActive) {
        showStatus('⚠️ WATER CRITICAL!', 'rise-state', 0);
      } else {
        showStatus('', '', 0);
      }
      setOverlay(false);
    }
  }
  if (pauseBtn) pauseBtn.addEventListener('click', handlePauseClick);

  updateUIState('NOT_PLAYING');
  showStatus('', '', 0);
  setOverlay(true, 'PRESS START TO PLAY!', true);

  // --- render loop -----------------------------------------------------
  
  function gameLoop() {
    if (destroyed) return;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground(ctx, WIDTH, HEIGHT);

    engine.updateClouds();
    for (const cloud of engine.clouds) drawCloud(ctx, cloud);

    displayWaterLevel += (engine.waterLevel - displayWaterLevel) * WATER_EASE;
    waveTime += 0.03;
    const dangerLevel = engine.waterLevel / MAX_WATER;

    // Check stickman distress state (> 0.65 threshold where waving begins)
    if (gameState === 'PLAYING') {
      if (dangerLevel > 0.65 && !isCriticalWarningActive) {
        isCriticalWarningActive = true;
        if (!statusTimer) {
          showStatus('WATER CRITICAL!', 'rise-state', 0);
        }
      } else if (dangerLevel <= 0.65 && isCriticalWarningActive) {
        isCriticalWarningActive = false;
        if (!statusTimer) {
          showStatus('', '', 0);
        }
      }
    }

    if ((engine.isFlooded() && gameState !== 'NOT_PLAYING') || isGameOver) {
      if (!isGameOver) {
        isGameOver = true;
        clearInput();
        isCriticalWarningActive = false;
        showStatus(`FINAL SCORE: ${engine.score}`, 'game-over-state', 0);
        setOverlay(
          true,
          `GAME OVER<br>PLAY AGAIN?`,
          false
        );
        updateUIState('NOT_PLAYING');
      }
      drawIsland(ctx, WIDTH, HEIGHT, waveTime, dangerLevel, true);
      drawWater(ctx, WIDTH, HEIGHT, displayWaterLevel, waveTime);
      rafId = requestAnimationFrame(gameLoop);
      return;
    }

    drawIsland(ctx, WIDTH, HEIGHT, waveTime, dangerLevel);
    drawWater(ctx, WIDTH, HEIGHT, displayWaterLevel, waveTime);

    if (gameState === 'PLAYING') {
      engine.update();
      for (const drop of engine.drops) drawDrop(ctx, drop, waveTime);
    } else if (gameState === 'PAUSED') {
      for (const drop of engine.drops) drawDrop(ctx, drop, waveTime);
    }

    rafId = requestAnimationFrame(gameLoop);
  }

  rafId = requestAnimationFrame(gameLoop);

  // --- cleanup -----------------------------------------------------------
  
  return function destroy() {
    destroyed = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (statusTimer) clearTimeout(statusTimer);

    document.removeEventListener('keydown', handleKeydown);
    keypadButtons.forEach((btn) => {
      btn.removeEventListener('click', handleKeypadInput);
      btn.removeEventListener('touchend', handleKeypadInput);
    });
    if (submitBtn) {
      submitBtn.removeEventListener('click', checkAnswer);
      submitBtn.removeEventListener('touchend', handleSubmitTouch);
    }
    if (difficultyBtn) difficultyBtn.removeEventListener('click', handleDifficultyClick);
    if (startStopBtn) startStopBtn.removeEventListener('click', handleStartStopClick);
    if (pauseBtn) pauseBtn.removeEventListener('click', handlePauseClick);
  };
}