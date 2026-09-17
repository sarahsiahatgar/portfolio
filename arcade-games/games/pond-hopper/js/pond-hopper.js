// ==========================================
// Pond Hopper — Entry Point
// Owns the DOM: overlay, color picker, control mode toggle, touch/
// keyboard input, and the render loop. Game rules live in
// pond-hopper-engine.js; drawing lives in pond-hopper-render.js.
// ==========================================

import { PondHopperGame } from './pond-hopper-engine.js';
import { drawGameScene } from './pond-hopper-render.js';

const FIXED_STEP_MS = 1000 / 30;

export function initPondHopper(root = document) {
  function $(selector) {
    return root.querySelector(selector);
  }

  const canvas = $('#pondHopperCanvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');

  const controller = new AbortController();
  const { signal } = controller;

  const scoreEl = $('#phScore');
  const livesEl = $('#phLives');
  const startBtn = $('#phMainActionBtn');
  const stopBtn = $('#phStopBtn');
  const modeBtn = $('#phControlModeBtn');
  const colorBtn = $('#phColorBtn');
  const buttonsPad = $('#pondHopperButtonsPad');
  const swipePad = $('#pondHopperSwipePad');
  const overlay = $('#phOverlay');

  function updateScore(score) {
    if (scoreEl) scoreEl.textContent = score;
  }

  function updateLives(lives) {
    if (livesEl) livesEl.textContent = lives;
  }

  function setOverlay(show, message = '', isBlinking = true) {
    if (!overlay) return;
    if (show) {
      const blinkClass = isBlinking ? 'ph-blink-text' : '';
      overlay.innerHTML = `<div class="ph-neon-red ${blinkClass}">${message}</div>`;
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  function setMainActionText(text) {
    if (startBtn) startBtn.textContent = text;
  }

  function setStopButtonEnabled(enabled) {
    if (!stopBtn) return;
    stopBtn.disabled = !enabled;
  }

  function setColorButtonText(text) {
    if (colorBtn) colorBtn.textContent = text;
  }

  const game = new PondHopperGame(canvas.width, canvas.height, {
    updateScore,
    updateLives,
    setOverlay,
    setMainActionText,
    setStopButtonEnabled,
    setColorButtonText,
  });

  function drawGame() {
    drawGameScene(
      ctx, canvas, game.GRID, game.homeSlots, game.homeSlotXCoords,
      game.obstacles, game.frog, game.insect, game.getCurrentColor(), game.waveOffset
    );
  }

  // --- Color picker ---
  if (colorBtn) {
    colorBtn.textContent = game.getCurrentColor().name;
    colorBtn.addEventListener('click', () => {
      game.cycleColor();
      drawGame();
    }, { signal });
  }

  // --- Control mode toggle (D-pad vs swipe pad) ---
  let controlMode = 'Buttons';
  if (modeBtn) {
    modeBtn.addEventListener('click', () => {
      if (controlMode === 'Buttons') {
        controlMode = 'Swipe';
        modeBtn.textContent = 'Swipe';
        if (buttonsPad) buttonsPad.style.display = 'none';
        if (swipePad) swipePad.style.display = 'flex';
      } else {
        controlMode = 'Buttons';
        modeBtn.textContent = 'Buttons';
        if (buttonsPad) buttonsPad.style.display = 'grid';
        if (swipePad) swipePad.style.display = 'none';
      }
    }, { signal });
  }

  // --- Swipe pad ---
  let swipeActive = false;
  let swipeRect = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let activeSwipeLabel = null;
  const minSwipeDistance = 15;

  const swipeLabels = {
    up: $('#phSwipeUp'),
    down: $('#phSwipeDown'),
    left: $('#phSwipeLeft'),
    right: $('#phSwipeRight'),
  };

  function setActiveSwipeLabel(key) {
    const next = key ? swipeLabels[key] : null;
    if (next === activeSwipeLabel) return;
    if (activeSwipeLabel) activeSwipeLabel.classList.remove('ph-swipe-label-active');
    if (next) next.classList.add('ph-swipe-label-active');
    activeSwipeLabel = next;
  }

  function getSwipeDirection(diffX, diffY) {
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > minSwipeDistance) return diffX > 0 ? 'right' : 'left';
    } else {
      if (Math.abs(diffY) > minSwipeDistance) return diffY > 0 ? 'down' : 'up';
    }
    return null;
  }

  if (swipePad) {
    swipePad.addEventListener('pointerdown', e => {
      swipeActive = true;
      swipeRect = swipePad.getBoundingClientRect();
      swipePad.setPointerCapture(e.pointerId);
      touchStartX = e.clientX - swipeRect.left;
      touchStartY = e.clientY - swipeRect.top;
      e.preventDefault();
    }, { signal });

    swipePad.addEventListener('pointermove', e => {
      if (!swipeActive || !swipeRect) return;
      const curX = e.clientX - swipeRect.left;
      const curY = e.clientY - swipeRect.top;
      const dir = getSwipeDirection(curX - touchStartX, curY - touchStartY);
      setActiveSwipeLabel(dir);
      e.preventDefault();
    }, { signal });

    swipePad.addEventListener('pointerup', e => {
      if (!swipeActive || !swipeRect) return;
      const endX = e.clientX - swipeRect.left;
      const endY = e.clientY - swipeRect.top;
      const dir = getSwipeDirection(endX - touchStartX, endY - touchStartY);
      if (dir) game.moveFrog(dir);

      swipeActive = false;
      swipeRect = null;
      setActiveSwipeLabel(null);
      try { swipePad.releasePointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }, { signal });

    swipePad.addEventListener('pointercancel', () => {
      swipeActive = false;
      swipeRect = null;
      setActiveSwipeLabel(null);
    }, { signal });
  }

  // --- D-pad buttons ---
  const upBtn = $('#phUpBtn');
  const downBtn = $('#phDownBtn');
  const leftBtn = $('#phLeftBtn');
  const rightBtn = $('#phRightBtn');

  if (upBtn) upBtn.addEventListener('pointerdown', e => { game.moveFrog('up'); e.preventDefault(); }, { signal });
  if (downBtn) downBtn.addEventListener('pointerdown', e => { game.moveFrog('down'); e.preventDefault(); }, { signal });
  if (leftBtn) leftBtn.addEventListener('pointerdown', e => { game.moveFrog('left'); e.preventDefault(); }, { signal });
  if (rightBtn) rightBtn.addEventListener('pointerdown', e => { game.moveFrog('right'); e.preventDefault(); }, { signal });

  // --- Keyboard ---
  window.addEventListener('keydown', e => {
    if (game.gameState !== 'RUNNING') return;
    if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); game.moveFrog('up'); }
    if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); game.moveFrog('down'); }
    if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); game.moveFrog('left'); }
    if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); game.moveFrog('right'); }
  }, { signal });

  // --- Start / Pause / Resume / Stop ---
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (game.gameState === 'STOPPED') {
        game.start();
        startLoop();
      } else if (game.gameState === 'RUNNING') {
        game.pause();
      } else if (game.gameState === 'PAUSED') {
        game.resume();
        startLoop();
      }
    }, { signal });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (game.gameState === 'STOPPED') return;
      game.stop('PRESS START TO PLAY!', true);
      drawGame();
    }, { signal });
  }

  // --- render loop ---
  let rafId = null;
  let lastFrameTime = null;
  let accumulator = 0;

  function loop(timestamp) {
    if (lastFrameTime === null) lastFrameTime = timestamp;
    let delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (delta > 250) delta = 250;
    accumulator += delta;

    while (accumulator >= FIXED_STEP_MS) {
      game.tick();
      accumulator -= FIXED_STEP_MS;
      if (game.gameState !== 'RUNNING') break;
    }

    drawGame();

    if (game.gameState === 'RUNNING') {
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  }

  function startLoop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    lastFrameTime = null;
    accumulator = 0;
    rafId = requestAnimationFrame(loop);
  }

  // --- Initial idle state ---
  game.resetFrog();
  drawGame();
  setOverlay(true, 'PRESS START TO PLAY!', true);

  return function cleanup() {
    controller.abort();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}