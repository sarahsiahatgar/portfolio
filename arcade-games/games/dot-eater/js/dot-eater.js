// ==========================================
// Dot Eater — Entry Point
// Owns the DOM: wires up controls (buttons, keyboard, swipe pad), builds
// the overlay, and runs the render loop. Game rules live in
// dot-eater-engine.js; drawing lives in dot-eater-render.js.
// ==========================================

import { PacmanGame } from './dot-eater-engine.js';
import { renderGame, renderPreview } from './dot-eater-render.js';

export function initPacman() {
  const canvas = document.getElementById('pacmanCanvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');

  const wrapper = document.getElementById('pacCanvasWrapper');
  if (!wrapper) return () => {};

  const controller = new AbortController();
  const { signal } = controller;

  let overlay = document.getElementById('pacOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pacOverlay';
    overlay.className = 'pac-overlay';
    wrapper.appendChild(overlay);
  }

  function setOverlay(show, text = '') {
    if (show) {
      overlay.style.display = 'flex';
      let neonClass = 'pac-neon-red';
      let blinkClass = '';

      if (text.includes('Won')) {
        neonClass = 'pac-neon-green';
      } else if (text.includes('START')) {
        neonClass = 'pac-neon-red';
        blinkClass = 'pac-blink-text';
      }

      overlay.innerHTML = `<span class="${neonClass} ${blinkClass}">${text}</span>`;
    } else {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
  }

  const scoreEl = document.getElementById('pacScore');
  const diffBtn = document.getElementById('pacDifficultyBtn');
  const stopBtn = document.getElementById('pacStopBtn');
  const mainActionBtn = document.getElementById('pacMainActionBtn');

  function setDifficultyButtonState(disabled) {
    if (!diffBtn) return;
    diffBtn.disabled = disabled;
    diffBtn.style.opacity = disabled ? '0.5' : '1';
    diffBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  function setStopButtonState(disabled) {
    if (!stopBtn) return;
    stopBtn.disabled = disabled;
    stopBtn.style.opacity = disabled ? '0.5' : '1';
    stopBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  function setMainActionText(text) {
    if (mainActionBtn) mainActionBtn.textContent = text;
  }

  function updateScore(score) {
    if (scoreEl) scoreEl.textContent = score;
  }

  const game = new PacmanGame(canvas.width, canvas.height, {
    setOverlay,
    updateScore,
    setDifficultyButtonState,
    setStopButtonState,
    setMainActionText,
  });

  let controlMode = 'buttons';
  const controlModeBtn = document.getElementById('pacControlModeBtn');
  const buttonsPad = document.getElementById('pacmanButtonsPad');
  const swipePad = document.getElementById('pacmanSwipePad');

  if (controlModeBtn) {
    controlModeBtn.addEventListener('click', () => {
      if (controlMode === 'buttons') {
        controlMode = 'swipe';
        controlModeBtn.textContent = 'Buttons';
        if (buttonsPad) buttonsPad.style.display = 'none';
        if (swipePad) swipePad.style.display = 'flex';
      } else {
        controlMode = 'buttons';
        controlModeBtn.textContent = 'Swipe Pad';
        if (buttonsPad) buttonsPad.style.display = 'grid';
        if (swipePad) swipePad.style.display = 'none';
      }
    }, { signal });
  }

  let swipePointerDown = false;
  let swipeRect = null;
  let activeSwipeLabel = null;

  const swipeLabels = {
    up: document.getElementById('pacSwipeUp'),
    down: document.getElementById('pacSwipeDown'),
    left: document.getElementById('pacSwipeLeft'),
    right: document.getElementById('pacSwipeRight'),
  };

  function setActiveSwipeLabel(key) {
    const next = key ? swipeLabels[key] : null;
    if (next === activeSwipeLabel) return;
    if (activeSwipeLabel) activeSwipeLabel.classList.remove('pac-swipe-label-active');
    if (next) next.classList.add('pac-swipe-label-active');
    activeSwipeLabel = next;
  }

  function processQuadrantTouch(clientX, clientY) {
    if (!swipePad || !swipeRect) return;
    const centerX = swipeRect.width / 2;
    const centerY = swipeRect.height / 2;
    const relX = clientX - swipeRect.left - centerX;
    const relY = clientY - swipeRect.top - centerY;

    const distance = Math.sqrt(relX * relX + relY * relY);
    if (distance > 18) {
      const angle = Math.atan2(relY, relX) * (180 / Math.PI);
      if (angle >= -45 && angle < 45) {
        game.setNextDir(0, 1);    // Right
        setActiveSwipeLabel('right');
      } else if (angle >= 45 && angle < 135) {
        game.setNextDir(1, 0);    // Down
        setActiveSwipeLabel('down');
      } else if (angle >= -135 && angle < -45) {
        game.setNextDir(-1, 0);   // Up
        setActiveSwipeLabel('up');
      } else {
        game.setNextDir(0, -1);   // Left
        setActiveSwipeLabel('left');
      }
    } else {
      setActiveSwipeLabel(null);
    }
  }

  if (swipePad) {
    swipePad.addEventListener('pointerdown', e => {
      swipePointerDown = true;
      swipeRect = swipePad.getBoundingClientRect();
      swipePad.setPointerCapture(e.pointerId);
      processQuadrantTouch(e.clientX, e.clientY);
      e.preventDefault();
    }, { signal });

    swipePad.addEventListener('pointermove', e => {
      if (!swipePointerDown) return;
      processQuadrantTouch(e.clientX, e.clientY);
      e.preventDefault();
    }, { signal });

    swipePad.addEventListener('pointerup', e => {
      if (!swipePointerDown) return;
      swipePointerDown = false;
      swipeRect = null;
      setActiveSwipeLabel(null);
      try { swipePad.releasePointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    }, { signal });

    swipePad.addEventListener('pointercancel', () => {
      swipePointerDown = false;
      swipeRect = null;
      setActiveSwipeLabel(null);
    }, { signal });
  }

  const upBtn = document.getElementById('pacUpBtn');
  const leftBtn = document.getElementById('pacLeftBtn');
  const downBtn = document.getElementById('pacDownBtn');
  const rightBtn = document.getElementById('pacRightBtn');

  if (upBtn) upBtn.addEventListener('pointerdown', e => { game.setNextDir(-1, 0); e.preventDefault(); }, { signal });
  if (leftBtn) leftBtn.addEventListener('pointerdown', e => { game.setNextDir(0, -1); e.preventDefault(); }, { signal });
  if (downBtn) downBtn.addEventListener('pointerdown', e => { game.setNextDir(1, 0); e.preventDefault(); }, { signal });
  if (rightBtn) rightBtn.addEventListener('pointerdown', e => { game.setNextDir(0, 1); e.preventDefault(); }, { signal });

  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (game.isActive && !game.isPaused) {
      if (e.key === 'ArrowUp') game.setNextDir(-1, 0);
      if (e.key === 'ArrowDown') game.setNextDir(1, 0);
      if (e.key === 'ArrowLeft') game.setNextDir(0, -1);
      if (e.key === 'ArrowRight') game.setNextDir(0, 1);
    }
  }, { signal });

  if (diffBtn) {
    diffBtn.addEventListener('click', () => {
      if (game.isActive) return;
      const newDiff = game.cycleDifficulty();
      diffBtn.textContent = newDiff;
    }, { signal });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (!game.isActive && !game.isPaused) return;
      game.stop('PRESS START TO PLAY!');
      game.generateLayout();
      game.initItems();
      renderPreview(ctx, game);
    }, { signal });
  }

  if (mainActionBtn) {
    mainActionBtn.addEventListener('click', () => {
      if (!game.isActive) {
        game.start();
      } else {
        game.togglePause();
      }
    }, { signal });
  }

  let rafId = null;
  let lastFrameTime = 0;
  let accumulator = 0;

  function loop(timestamp) {
    rafId = requestAnimationFrame(loop);

    if (!lastFrameTime) lastFrameTime = timestamp;
    let delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (delta > 250) delta = 250;

    if (game.isActive && !game.isPaused) {
      accumulator += delta;
      const step = game.getSpeedInterval();
      while (accumulator >= step) {
        game.tick();
        accumulator -= step;
        if (!game.isActive) break;
      }
      renderGame(ctx, game);
    }
  }

  game.generateLayout();
  game.initItems();
  renderPreview(ctx, game);
  setOverlay(true, 'PRESS START TO PLAY!');

  rafId = requestAnimationFrame(loop);

  return function cleanup() {
    controller.abort();
    game.stopTimers();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}