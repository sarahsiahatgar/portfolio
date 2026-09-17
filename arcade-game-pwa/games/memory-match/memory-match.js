// ==========================================
// Memory Match
// ==========================================

const MASTER_ICONS = [
  '⚡', '🔥', '🤖', '🚀', '💡', '🛡️', '⚙️', '📈', '🔑', '💻', '🌟', '🎯', '🛠️', '🧭', '🔮', '🔋', '📡', '🧩', '💎', '🎨', '🎮', '🔔', '✨',
  '🌸', '🌹', '🌻', '🌷', '🌼', '🌺', '🍀', '🌿',
  '🐱', '🐶', '🦊', '🐼', '🐨', '🦁', '🐰', '🐯',
  '💖', '💙', '💚', '💛', '💜', '🤍', '🧡', '🤎',
  '🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '🍦', '🍫', '🍬', '🍭', '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🥝', '🥑', '🍍', '🥥', '🌽', '🥕',
  '☀️', '🌙', '🌈', '☁️', '⛈️', '❄️', '🌊', '🌤️',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊', '🏹', '⛳', '🎳',
  '✈️', '🚗', '🚲', '🚁', '⛵', '🚂', '🎡', '🎢',
  '🎵', '🎸', '🎺', '🥁', '🎻', '📷', '🎬', '🎤', '🕹️', '🧸', '🎁', '🎀', '🏆', '🥇',
  '🐸', '🐵', '🦉', '🐧', '🦋', '🐢', '🐙', '🦄', '🐺', '🦝', '🐹', '🐭', '🐷', '🐮',
  '😀', '😎', '🤩', '🥳', '😴', '🤔'
];

const GRID_SIZE_OPTIONS = [
  { size: 12, label: '12 × 12', gap: 3, iconSize: '0.55rem' },
  { size: 10, label: '10 × 10', gap: 4, iconSize: '0.7rem' },
  { size: 8, label: '8 × 8', gap: 6, iconSize: '0.85rem' },
  { size: 6, label: '6 × 6', gap: 8, iconSize: '1.1rem' },
  { size: 4, label: '4 × 4', gap: 10, iconSize: '1.4rem' },
];

const DEFAULT_GRID_SIZE = 6;

export function initMemoryGame(root = document) {
  function $(selector) {
    return root.querySelector(selector);
  }

  const board = $('#memoryBoard');
  const restartBtn = $('#restartMemBtn');
  const statusEl = $('#memStatus');
  const marqueeEl = $('#arcadeMarquee');
  const scoreEl = $('#memScore');
  const totalPairsEl = $('#memTotalPairs');
  const sizeSelect = $('#memGridSizeSelect');
  const sizeTrigger = $('#memSizeSelectTrigger');
  const sizeSelectText = $('#memSizeSelectText');
  const sizeOptionsMenu = $('#memSizeSelectOptions');

  if (!board) return () => {};

  const controller = new AbortController();
  const { signal } = controller;

  let gridSize = DEFAULT_GRID_SIZE;
  let numberOfPairs = (gridSize * gridSize) / 2;
  let memCards = [];
  let flippedCards = [];
  let matchedPairs = 0;
  let isGameActive = false;
  let pendingFlipBackTimeout = null;

  function clearPendingTimeout() {
    if (pendingFlipBackTimeout) {
      clearTimeout(pendingFlipBackTimeout);
      pendingFlipBackTimeout = null;
    }
  }

  function populateSizeOptions() {
  if (!sizeSelect) return;
  sizeSelect.innerHTML = '';
  if (sizeOptionsMenu) sizeOptionsMenu.innerHTML = '';

  GRID_SIZE_OPTIONS.forEach(opt => {
    const optionEl = document.createElement('option');
    optionEl.value = opt.size;
    optionEl.textContent = opt.label;
    if (opt.size === gridSize) optionEl.selected = true;
    sizeSelect.appendChild(optionEl);

    if (sizeOptionsMenu) {
      const customDiv = document.createElement('div');
      customDiv.className = 'mem-custom-option';
      if (opt.size === gridSize) customDiv.classList.add('selected');
      customDiv.dataset.value = opt.size;
      customDiv.textContent = opt.label;
      sizeOptionsMenu.appendChild(customDiv);
    }
  });

  setSelectedSize(gridSize);
}

function setSelectedSize(val) {
  if (!sizeSelect) return;
  sizeSelect.value = val;
  const matched = sizeSelect.querySelector(`option[value="${val}"]`);
  if (matched && sizeSelectText) {
    sizeSelectText.textContent = matched.textContent;
  }

  if (sizeOptionsMenu) {
    sizeOptionsMenu.querySelectorAll('.mem-custom-option').forEach(opt => {
      if (opt.dataset.value == val) {
        opt.classList.add('selected');
      } else {
        opt.classList.remove('selected');
      }
    });
  }
}

  function applyGridSizing() {
    const config = GRID_SIZE_OPTIONS.find(o => o.size === gridSize) || GRID_SIZE_OPTIONS[0];
    board.style.setProperty('--mem-grid-size', config.size);
    board.style.setProperty('--mem-grid-gap', `${config.gap}px`);
    board.style.setProperty('--mem-icon-size', config.iconSize);
  }

  function setGameActive(active) {
    isGameActive = active;
    if (sizeSelect) sizeSelect.disabled = active;
  }

  function updateCardAria(cardEl, icon, isRevealed) {
    const idx = cardEl.dataset.index;
    cardEl.setAttribute(
      'aria-label',
      isRevealed ? `Card ${Number(idx) + 1}, showing ${icon}` : `Card ${Number(idx) + 1}, hidden`
    );
  }

  function setup() {
    clearPendingTimeout();
    setGameActive(false);

    numberOfPairs = (gridSize * gridSize) / 2;

    board.innerHTML = '';
    flippedCards = [];
    matchedPairs = 0;

    if (scoreEl) scoreEl.textContent = '0';
    if (totalPairsEl) totalPairsEl.textContent = numberOfPairs;

    if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen';
    if (statusEl) {
      statusEl.textContent = 'FLIP CARDS TO MATCH!';
      statusEl.style.color = '';
    }

    applyGridSizing();

    const shuffledMaster = [...MASTER_ICONS].sort(() => Math.random() - 0.5);
    const selectedIcons = shuffledMaster.slice(0, numberOfPairs);

    memCards = [...selectedIcons, ...selectedIcons];
    memCards.sort(() => Math.random() - 0.5);

    memCards.forEach((icon, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.classList.add('memory-card');
      card.dataset.icon = icon;
      card.dataset.index = index;
      updateCardAria(card, icon, false);

      const cardInner = document.createElement('div');
      cardInner.classList.add('memory-card-inner');

      const cardFront = document.createElement('div');
      cardFront.classList.add('memory-card-face', 'memory-card-front');

      const cardBack = document.createElement('div');
      cardBack.classList.add('memory-card-face', 'memory-card-back');
      cardBack.innerHTML = `<span class="card-icon">${icon}</span>`;

      cardInner.appendChild(cardFront);
      cardInner.appendChild(cardBack);
      card.appendChild(cardInner);

      card.addEventListener('click', flipCard, { signal });
      board.appendChild(card);
    });
  }

  function flipCard() {
    if (flippedCards.length === 2 || this.classList.contains('flipped')) return;

    if (!isGameActive) {
      setGameActive(true);
      if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen active-state';
      if (statusEl) statusEl.textContent = '';
    }

    this.classList.add('flipped');
    updateCardAria(this, this.dataset.icon, true);
    flippedCards.push(this);

    if (flippedCards.length === 2) {
      checkMatch();
    }
  }

  function checkMatch() {
    const [card1, card2] = flippedCards;

    if (card1.dataset.icon === card2.dataset.icon) {
      card1.classList.add('matched');
      card2.classList.add('matched');
      matchedPairs++;
      if (scoreEl) scoreEl.textContent = matchedPairs;
      flippedCards = [];

      if (matchedPairs === numberOfPairs) {
        if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen win-state';
        if (statusEl) {
          statusEl.textContent = '★ YOU WIN! PLAY AGAIN? ★';
        }
      }
    } else {
      clearPendingTimeout();
      pendingFlipBackTimeout = setTimeout(() => {
        pendingFlipBackTimeout = null;
        card1.classList.remove('flipped');
        card2.classList.remove('flipped');
        updateCardAria(card1, card1.dataset.icon, false);
        updateCardAria(card2, card2.dataset.icon, false);
        flippedCards = [];
      }, 800);
    }
  }

  if (sizeTrigger && sizeOptionsMenu) {
    function openDropdown() {
      sizeOptionsMenu.classList.add('open');
    }

    function closeDropdown() {
      sizeOptionsMenu.classList.add('closing');
      setTimeout(() => {
        sizeOptionsMenu.classList.remove('open', 'closing');
      }, 250);
    }

    sizeTrigger.addEventListener('click', e => {
      if (sizeSelect && sizeSelect.disabled) return;
      const isOpen = sizeOptionsMenu.classList.contains('open');
      if (isOpen) closeDropdown();
      else openDropdown();
      e.stopPropagation();
    }, { signal });

    document.addEventListener('click', e => {
      if (!sizeTrigger.contains(e.target) && !sizeOptionsMenu.contains(e.target)) closeDropdown();
    }, { signal });

    sizeOptionsMenu.addEventListener('click', e => {
      const item = e.target.closest('.mem-custom-option');
      if (!item) return;
      const val = item.getAttribute('data-value');
      setSelectedSize(val);
      if (sizeSelect) sizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      closeDropdown();
    }, { signal });

    let sizeSelectObserver = null;
    if (sizeSelect) {
      sizeSelectObserver = new MutationObserver(() => {
        if (sizeSelect.disabled) sizeTrigger.classList.add('disabled');
        else sizeTrigger.classList.remove('disabled');
      });
      sizeSelectObserver.observe(sizeSelect, { attributes: true, attributeFilter: ['disabled'] });
    }

    signal.addEventListener('abort', () => {
      if (sizeSelectObserver) sizeSelectObserver.disconnect();
    });
  }

  if (sizeSelect) {
    populateSizeOptions();
    sizeSelect.addEventListener('change', e => {
      if (isGameActive) return;
      gridSize = parseInt(e.target.value, 10);
      setup();
    }, { signal });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', setup, { signal });
  }

  setup();

  return function cleanup() {
    controller.abort();
    clearPendingTimeout();
  };
}