// ==========================================
// Nibbles — Entry Point
// Owns the DOM: level dropdown, control mode toggle, touch/keyboard
// input, overlay, and the render loop. Game rules live in
// nibble-engine.js; drawing lives in nibble-render.js.
// ==========================================

import { NIBBLES_LEVELS } from './nibble-levels.js';
import { NibbleGame } from './nibble-engine.js';
import { renderGame } from './nibble-render.js';

const FIXED_STEP_MS = 140;

export function initSnake(root = document) {
  function $(selector) {
    return root.querySelector(selector);
  }

  const canvas = $('#snakeCanvas');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');

  const wrapper = $('#snakeCanvasWrapper');
  if (!wrapper) return () => {};

  const controller = new AbortController();
  const { signal } = controller;

  let overlay = $('#snakeOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'snakeOverlay';
    overlay.className = 'snake-overlay';
    wrapper.appendChild(overlay);
  }

  function setOverlay(show, text = '') {
    if (show) {
      overlay.style.display = 'flex';
      let blinkClass = text.toLowerCase().includes('start') ? 'snake-blink-text' : '';
      overlay.innerHTML = `<span class="snake-neon-red ${blinkClass}">${text}</span>`;
    } else {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
  }

  const scoreEl = $('#snakeScore');
  const levelHeaderEl = $('#snakeLevelHeader');
  const stopBtn = $('#snakeStopBtn');
  const mainActionBtn = $('#snakeMainActionBtn');
  const gameModeBtn = $('#snakeGameModeBtn');
  const dropdownContainer = $('.snake-custom-dropdown-container');

  function updateScore(score) {
    if (scoreEl) scoreEl.textContent = score;
  }

  function setLevelHeaderText(text) {
    if (levelHeaderEl) levelHeaderEl.innerHTML = text ? text : '&nbsp;';
  }

  function setMainActionText(text) {
    if (mainActionBtn) mainActionBtn.textContent = text;
  }

  function setStopButtonEnabled(enabled) {
    if (!stopBtn) return;
    stopBtn.disabled = !enabled;
    stopBtn.style.opacity = enabled ? '1' : '0.5';
    stopBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
  }

  function setGameModeButtonText(text) {
    if (gameModeBtn) gameModeBtn.textContent = text;
  }

  function setDropdownEnabled(enabled) {
    if (!dropdownContainer) return;
    dropdownContainer.style.opacity = enabled ? '1' : '0.4';
    dropdownContainer.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  function setSelectedLevelDisplay(levelId) {
    setSelectedLevel(levelId);
  }

  const game = new NibbleGame(canvas.width, canvas.height, {
    updateScore,
    setOverlay,
    setLevelHeaderText,
    setMainActionText,
    setStopButtonEnabled,
    setGameModeButtonText,
    setDropdownEnabled,
    setSelectedLevelDisplay,
  });

  // --- Level dropdown (custom + native, kept in sync) ---
  const levelSelect = $('#snakeLevelSelect');
  const trigger = $('#snakeSelectTrigger');
  const selectText = $('#snakeSelectText');
  const optionsMenu = $('#snakeSelectOptions');

  function populateLevelDropdown() {
    if (!levelSelect || !optionsMenu) return;
    levelSelect.innerHTML = '';
    optionsMenu.innerHTML = '';

    const reversedLevels = [...NIBBLES_LEVELS].reverse();
  
    reversedLevels.forEach(level => {
      const option = document.createElement('option');
      option.value = level.id;
      option.textContent = level.dropdownName || level.fullName;
      levelSelect.appendChild(option);

      const customDiv = document.createElement('div');
      customDiv.className = 'snake-custom-option';
      customDiv.dataset.value = level.id;
      customDiv.textContent = level.dropdownName || level.fullName;
      optionsMenu.appendChild(customDiv);
    });
  }

  function setSelectedLevel(levelId) {
    const level = NIBBLES_LEVELS.find(l => l.id === levelId) || NIBBLES_LEVELS[0];
    if (levelSelect) levelSelect.value = level.id;
    if (selectText) selectText.textContent = level.dropdownName || level.fullName;

    if (optionsMenu) {
      const options = optionsMenu.querySelectorAll('.snake-custom-option');
      options.forEach(opt => {
        if (opt.getAttribute('data-value') === level.id) {
          opt.classList.add('selected');
        } else {
          opt.classList.remove('selected');
        }
      });
    }
  }

  function openDropdown() {
    if (levelSelect && levelSelect.disabled) return;
    optionsMenu.classList.remove('closing');
    optionsMenu.classList.add('open');

    const selectedOption = optionsMenu.querySelector(
      `.snake-custom-option[data-value="${game.selectedLevelKey}"]`
    );

    if (selectedOption) {
      selectedOption.scrollIntoView({ block: 'nearest' });
    }
  }

  function closeDropdown() {
    optionsMenu.classList.remove('open');
    optionsMenu.classList.add('closing');
    setTimeout(() => {
      optionsMenu.classList.remove('closing');
    }, 250);
  }

  if (trigger && optionsMenu) {
    trigger.addEventListener('click', e => {
      if (game.isActive) return;
      const isOpen = optionsMenu.classList.contains('open');
      if (isOpen) closeDropdown();
      else openDropdown();
      e.stopPropagation();
    }, { signal });

    document.addEventListener('click', e => {
      if (!trigger.contains(e.target) && !optionsMenu.contains(e.target)) closeDropdown();
    }, { signal });

    optionsMenu.addEventListener('click', e => {
      const item = e.target.closest('.snake-custom-option');
      if (!item || game.isActive) return;
      const levelId = item.getAttribute('data-value');
      setSelectedLevel(levelId);
      game.setSelectedLevel(levelId);
      renderGame(ctx, game);
      closeDropdown();
    }, { signal });
  }

  populateLevelDropdown();
  setSelectedLevel(game.selectedLevelKey);

  // --- Control mode toggle (D-pad vs swipe pad) ---
  let controlMode = 'buttons';
  const controlModeBtn = $('#snakeControlModeBtn');
  const buttonsPad = $('#snakeButtonsPad');
  const swipePad = $('#snakeSwipePad');

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

  // --- Game mode toggle (Levels vs Endless) ---
  if (gameModeBtn) {
    gameModeBtn.addEventListener('click', () => {
      if (game.isActive) return;
      game.setGameMode(game.gameMode === 'levels' ? 'endless' : 'levels');
      setSelectedLevel(game.selectedLevelKey);
      renderGame(ctx, game);
    }, { signal });
  }

  // --- Swipe pad ---
  let swipePointerDown = false;
  let swipeRect = null;
  let activeSwipeLabel = null;

  const swipeLabels = {
    up: $('#snakeSwipeUp'),
    down: $('#snakeSwipeDown'),
    left: $('#snakeSwipeLeft'),
    right: $('#snakeSwipeRight'),
  };

  function setActiveSwipeLabel(key) {
    const next = key ? swipeLabels[key] : null;
    if (next === activeSwipeLabel) return;
    if (activeSwipeLabel) activeSwipeLabel.classList.remove('snake-swipe-label-active');
    if (next) next.classList.add('snake-swipe-label-active');
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
        game.setNextDirection('ArrowRight');
        setActiveSwipeLabel('right');
      } else if (angle >= 45 && angle < 135) {
        game.setNextDirection('ArrowDown');
        setActiveSwipeLabel('down');
      } else if (angle >= -135 && angle < -45) {
        game.setNextDirection('ArrowUp');
        setActiveSwipeLabel('up');
      } else {
        game.setNextDirection('ArrowLeft');
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

  // --- D-pad buttons ---
  const upBtn = $('#snakeUpBtn');
  const leftBtn = $('#snakeLeftBtn');
  const downBtn = $('#snakeDownBtn');
  const rightBtn = $('#snakeRightBtn');

  if (upBtn) upBtn.addEventListener('pointerdown', e => { game.setNextDirection('ArrowUp'); e.preventDefault(); }, { signal });
  if (leftBtn) leftBtn.addEventListener('pointerdown', e => { game.setNextDirection('ArrowLeft'); e.preventDefault(); }, { signal });
  if (downBtn) downBtn.addEventListener('pointerdown', e => { game.setNextDirection('ArrowDown'); e.preventDefault(); }, { signal });
  if (rightBtn) rightBtn.addEventListener('pointerdown', e => { game.setNextDirection('ArrowRight'); e.preventDefault(); }, { signal });

  // --- Keyboard (arrows + WASD) ---
  const WASD_TO_ARROW = {
    w: 'ArrowUp', a: 'ArrowLeft', s: 'ArrowDown', d: 'ArrowRight',
    W: 'ArrowUp', A: 'ArrowLeft', S: 'ArrowDown', D: 'ArrowRight',
  };

  window.addEventListener('keydown', e => {
    const mappedKey = WASD_TO_ARROW[e.key] || e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(mappedKey)) {
      e.preventDefault();
    }
    game.setNextDirection(mappedKey);
  }, { signal });

  // --- Start / Pause / Resume / Stop ---
  if (mainActionBtn) {
    mainActionBtn.addEventListener('click', () => {
      if (!game.isActive) {
        game.start();
        startLoop();
      } else if (game.isPaused) {
        game.resume();
        startLoop();
      } else {
        game.pause();
      }
    }, { signal });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (!game.isActive && !game.isPaused) return;
      game.stop('PRESS START TO PLAY!');
      renderGame(ctx, game);
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
      if (!game.isActive) break;
    }

    renderGame(ctx, game);

    if (game.isActive && !game.isPaused) {
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
  renderGame(ctx, game);
  setOverlay(true, 'PRESS START TO PLAY!');
  setLevelHeaderText('');

  return function cleanup() {
    controller.abort();
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}