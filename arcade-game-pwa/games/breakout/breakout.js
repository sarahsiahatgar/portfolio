// ==========================================
// Breakout — Entry Point
// Owns the DOM: level dropdown, control mode toggle, touch/keyboard input,
// overlay, and the render loop. Game rules live in breakout-engine.js;
// drawing lives in breakout-render.js.
// ==========================================

import { GAME_CONFIG } from './breakout-config.js';
import { BREAKOUT_LEVELS, BREAKOUT_LEVEL_NAMES } from './breakout-layouts.js';
import { BreakoutGame, getLevelDisplayName } from './breakout-engine.js';
import { renderGame } from './breakout-render.js';

const FIXED_STEP_MS = 1000 / 60;

function populateLevelDropdowns(selectEl, optionsContainerEl) {
  if (!selectEl || !optionsContainerEl) return;

  selectEl.innerHTML = '';
  optionsContainerEl.innerHTML = '';

  BREAKOUT_LEVELS.forEach((_, index) => {
    const levelNum = index + 1;
    const label = `Level ${levelNum}`;

    const option = document.createElement('option');
    option.value = index;
    option.textContent = label;
    selectEl.appendChild(option);
  });

  for (let i = BREAKOUT_LEVELS.length - 1; i >= 0; i--) {
    const levelNum = i + 1;
    const label = `Level ${levelNum}`;

    const customDiv = document.createElement('div');
    customDiv.className = 'custom-option';
    customDiv.dataset.value = i;
    customDiv.textContent = label;
    optionsContainerEl.appendChild(customDiv);
  }
}

export function initBreakout() {
  const canvas = document.getElementById('breakoutCanvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');

  const controller = new AbortController();
  const { signal } = controller;

  const scoreEl = document.getElementById('breakoutScore');
  const livesEl = document.getElementById('breakoutLives');
  const statusEl = document.getElementById('breakoutStatus');
  const ledHeaderEl = document.getElementById('breakoutLedHeader');
  const levelSelect = document.getElementById('breakoutLevelSelect');
  const startBtn = document.getElementById('startBreakoutBtn');
  const stopBtn = document.getElementById('stopBreakoutBtn');
  const leftBtn = document.getElementById('breakoutLeftBtn');
  const rightBtn = document.getElementById('breakoutRightBtn');

  const controlModeBtn = document.getElementById('breakoutControlModeBtn');
  const buttonsPad = document.getElementById('breakoutButtonsPad');
  const swipePad = document.getElementById('breakoutSwipePad');

  const trigger = document.getElementById('breakoutSelectTrigger');
  const optionsMenu = document.getElementById('breakoutSelectOptions');
  const selectText = document.getElementById('breakoutSelectText');

  const overlay = document.getElementById('breakoutOverlay');

  function setOverlay(show, htmlContent = '', isBlinking = false) {
    if (!overlay) return;
    if (show) {
      overlay.style.display = 'flex';
      let blinkClass = isBlinking ? 'breakout-blink-text' : '';
      overlay.innerHTML = `<div class="breakout-neon-red ${blinkClass}" style="line-height: 1.4;">${htmlContent}</div>`;
    } else {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
  }

  function updateScore(score) {
    if (scoreEl) scoreEl.textContent = score;
  }

  function updateLives(lives) {
    if (livesEl) livesEl.textContent = lives;
  }

  function setStatusText(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function setLevelHeaderText(text) {
    if (ledHeaderEl) ledHeaderEl.textContent = text;
  }

  function setSelectedLevel(val) {
    if (!levelSelect) return;
    levelSelect.value = val;
    const matched = levelSelect.querySelector(`option[value="${val}"]`);
    if (matched && selectText) {
      selectText.textContent = matched.textContent;
    }

    if (optionsMenu) {
      const options = optionsMenu.querySelectorAll('.custom-option');
      options.forEach(opt => {
        if (opt.getAttribute('data-value') === String(val)) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });
    }
  }

  function setGameState(state) {
    if (state === 'stopped') {
      if (startBtn) startBtn.textContent = 'Start';
      if (stopBtn) stopBtn.disabled = true;
      if (levelSelect) levelSelect.disabled = false;
    } else if (state === 'playing') {
      if (startBtn) startBtn.textContent = 'Pause';
      if (stopBtn) stopBtn.disabled = false;
      if (levelSelect) levelSelect.disabled = true;
    } else if (state === 'paused') {
      if (startBtn) startBtn.textContent = 'Resume';
      if (stopBtn) stopBtn.disabled = false;
      if (levelSelect) levelSelect.disabled = true;
    }
  }

  const game = new BreakoutGame(canvas.width, canvas.height, {
    updateScore,
    updateLives,
    setOverlay,
    setGameState,
    setStatusText,
    setLevelHeaderText,
    setSelectedLevel,
  });

  if (levelSelect && optionsMenu) {
    populateLevelDropdowns(levelSelect, optionsMenu);
  }

  if (trigger && optionsMenu) {
    function openDropdown() {
      optionsMenu.classList.remove('closing');
      optionsMenu.classList.add('open');

      const currentVal = levelSelect ? levelSelect.value : '0';
      const selectedOption = optionsMenu.querySelector(
        `.custom-option[data-value="${currentVal}"]`
      );

      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest' });
      }
    }

    function closeDropdown() {
      optionsMenu.classList.add('closing');
      setTimeout(() => {
        optionsMenu.classList.remove('open', 'closing');
      }, 250);
    }

    trigger.addEventListener('click', e => {
      if (levelSelect && levelSelect.disabled) return;
      const isOpen = optionsMenu.classList.contains('open');
      if (isOpen) closeDropdown();
      else openDropdown();
      e.stopPropagation();
    }, { signal });

    document.addEventListener('click', e => {
      if (!trigger.contains(e.target) && !optionsMenu.contains(e.target)) closeDropdown();
    }, { signal });

    optionsMenu.addEventListener('click', e => {
      const item = e.target.closest('.custom-option');
      if (!item) return;
      const val = item.getAttribute('data-value');
      setSelectedLevel(val);
      if (levelSelect) levelSelect.dispatchEvent(new Event('change', { bubbles: true }));
      closeDropdown();
    }, { signal });

    let selectObserver = null;
    if (levelSelect) {
      selectObserver = new MutationObserver(() => {
        if (levelSelect.disabled) trigger.classList.add('disabled');
        else trigger.classList.remove('disabled');
      });
      selectObserver.observe(levelSelect, { attributes: true, attributeFilter: ['disabled'] });
    }

    controller.signal.addEventListener('abort', () => {
      if (selectObserver) selectObserver.disconnect();
    });
  }

  if (levelSelect) {
    levelSelect.addEventListener('change', e => {
      const lvlIndex = parseInt(e.target.value, 10);
      if (game.gameState === 'stopped') {
        game.loadLevel(lvlIndex);
        setLevelHeaderText(getLevelDisplayName(lvlIndex));
        renderGame(ctx, game);
      }
    }, { signal });
  }

  if (controlModeBtn && buttonsPad && swipePad) {
    buttonsPad.classList.add('is-active');
    swipePad.classList.remove('is-active');

    controlModeBtn.addEventListener('click', () => {
      const isButtonsActive = buttonsPad.classList.contains('is-active');
      if (isButtonsActive) {
        buttonsPad.classList.remove('is-active');
        swipePad.classList.add('is-active');
        controlModeBtn.textContent = 'Touch Pad';
      } else {
        swipePad.classList.remove('is-active');
        buttonsPad.classList.add('is-active');
        controlModeBtn.textContent = 'Buttons';
      }
    }, { signal });
  }

  let isDragging = false;

  canvas.addEventListener('pointerdown', e => {
    if (game.gameState === 'playing' || game.gameState === 'paused') {
      isDragging = true;
      canvas.setPointerCapture(e.pointerId);
      if (game.balls.some(b => b.isStuck)) game.launchBall();
      else updatePaddleFromPointer(e);
      e.preventDefault();
    }
  }, { signal });

  canvas.addEventListener('pointermove', e => {
    if (!isDragging || game.gameState !== 'playing') return;
    updatePaddleFromPointer(e);
    e.preventDefault();
  }, { signal });

  canvas.addEventListener('pointerup', e => {
    isDragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
  }, { signal });

  canvas.addEventListener('pointercancel', () => {
    isDragging = false;
  }, { signal });

  function updatePaddleFromPointer(e) {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    game.movePaddleTo(touchX);
  }

  let isSwipeDragging = false;
  let lastSwipeX = 0;

  if (swipePad) {
    swipePad.addEventListener('pointerdown', e => {
      if (game.gameState === 'playing' || game.gameState === 'paused') {
        isSwipeDragging = true;
        lastSwipeX = e.clientX;
        swipePad.setPointerCapture(e.pointerId);
        if (game.balls.some(b => b.isStuck)) game.launchBall();
        e.preventDefault();
      }
    }, { signal });

    swipePad.addEventListener('pointermove', e => {
      if (!isSwipeDragging || game.gameState !== 'playing') return;
      const deltaX = e.clientX - lastSwipeX;
      lastSwipeX = e.clientX;
      game.movePaddle(deltaX * 1.5);
      e.preventDefault();
    }, { signal });

    const endSwipe = e => {
      isSwipeDragging = false;
      if (e && e.pointerId !== undefined) {
        try { swipePad.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    };
    swipePad.addEventListener('pointerup', endSwipe, { signal });
    swipePad.addEventListener('pointercancel', endSwipe, { signal });
  }

  window.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp'].includes(e.key)) return;

    e.preventDefault();

    if (e.key === 'ArrowLeft') game.movePaddle(-GAME_CONFIG.paddle.speed);
    if (e.key === 'ArrowRight') game.movePaddle(GAME_CONFIG.paddle.speed);
    if (e.key === ' ' || e.key === 'ArrowUp') {
      if (game.balls.some(b => b.isStuck)) game.launchBall();
    }
  }, { signal });

  if (leftBtn) leftBtn.addEventListener('pointerdown', e => { game.movePaddle(-GAME_CONFIG.paddle.speed); e.preventDefault(); }, { signal });
  if (rightBtn) rightBtn.addEventListener('pointerdown', e => { game.movePaddle(GAME_CONFIG.paddle.speed); e.preventDefault(); }, { signal });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (game.gameState === 'stopped') {
        const selectedLvl = levelSelect ? parseInt(levelSelect.value, 10) : 0;
        game.start(selectedLvl);
        startLoop();
      } else if (game.gameState === 'playing') {
        game.pause();
      } else if (game.gameState === 'paused') {
        game.resume();
        startLoop();
      }
    }, { signal });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      const lvl = levelSelect ? parseInt(levelSelect.value, 10) : 0;
      game.stop(lvl);
      renderGame(ctx, game);
    }, { signal });
  }

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
      if (game.gameState !== 'playing') break;
    }

    renderGame(ctx, game);

    if (game.gameState === 'playing') {
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

  game.loadLevel(0);
  renderGame(ctx, game);
  setGameState('stopped');
  setStatusText('');
  setLevelHeaderText('');
  setOverlay(true, 'PRESS START TO PLAY!', true);

  return function cleanup() {
    controller.abort();
    game.resetPaddlePowerups();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}