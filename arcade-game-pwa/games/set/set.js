// ==========================================
// Set
// ==========================================

const SET_COLORS = ['#991b1b', '#166534', '#581c87'];
const COLOR_NAMES = ['red', 'green', 'purple'];
const SHAPE_NAMES = ['oval', 'squiggle', 'diamond'];
const SHADING_NAMES = ['solid', 'striped', 'open'];

function getCardDescription(card) {
  const color = COLOR_NAMES[card.color];
  const shape = SHAPE_NAMES[card.shape];
  const shading = SHADING_NAMES[card.shading];
  const plural = card.count > 1 ? 's' : '';
  return `${card.count} ${shading} ${color} ${shape}${plural}`;
}

function cardSignature(card) {
  return `${card.color}-${card.shape}-${card.count}-${card.shading}`;
}

export function initSetGame(root = document) {
  let setDeck = [];
  let setBoardCards = [];
  let selectedSetCards = [];
  let setsFoundCount = 0;
  let foundSetSignatures = [];
  let foundSetCardsHistory = [];
  let hintsRemaining = 3;
  let currentHintSet = null;
  let hintRevealedIndices = []; 
  let gameMode = 'static';
  let isFoundSetsVisible = true;
  let isErrorState = false;
  let isProcessingSet = false;
  let cvdMode = false;
  let isDayMode = false;
  let hasPlayed = false;

  let pendingTimeoutId = null;

  function cancelPendingTimeout() {
    if (pendingTimeoutId !== null) {
      clearTimeout(pendingTimeoutId);
      pendingTimeoutId = null;
    }
  }

  function $(selector) {
    return root.querySelector(selector);
  }

  function getCvdBadgeHtml(card) {
    const letter = COLOR_NAMES[card.color].charAt(0).toUpperCase();
    return `<span class="set-cvd-badge">${letter}</span>`;
  }

  function updateCvdButton() {
    const btn = $('#setCvdBtn');
    if (btn) btn.textContent = `CVD: ${cvdMode ? 'On' : 'Off'}`;
  }

  function updateThemeButton() {
    const btn = $('#setDayModeBtn');
    if (btn) btn.textContent = isDayMode ? 'Day' : 'Night';
    root.classList.toggle('set-day-mode', isDayMode);
  }

  function updateMarqueeUI() {
    const statusEl = $('#setStatus');
    const marqueeEl = $('#setArcadeMarquee');
    if (!statusEl || !marqueeEl) return;

    marqueeEl.className = 'arcade-marquee-screen';

    if (setsFoundCount >= 6 && gameMode === 'static') {
      marqueeEl.classList.add('win-state');
      statusEl.textContent = "ALL SETS FOUND!";
      return;
    }

    if (hasPlayed) {
      statusEl.textContent = '';
      return;
    }

    marqueeEl.classList.add('moving-state');
    statusEl.textContent = "FIND THE SETS!";
  }

  function initSetGameInternal() {
    cancelPendingTimeout();

    setsFoundCount = 0;
    foundSetSignatures = [];
    foundSetCardsHistory = [];
    selectedSetCards = [];
    hintsRemaining = 3;
    currentHintSet = null;
    hintRevealedIndices = [];
    isErrorState = false;
    isProcessingSet = false;
    hasPlayed = false;

    const scoreEl = $('#setScore');
    const scoreSuffixEl = $('#setScoreSuffix');

    if (scoreEl) scoreEl.textContent = setsFoundCount;
    if (scoreSuffixEl) {
      scoreSuffixEl.style.display = gameMode === 'static' ? 'inline' : 'none';
    }

    const hintBtn = $('#setHintBtn');
    if (hintBtn) {
      hintBtn.textContent = `Hint (${hintsRemaining})`;
      hintBtn.disabled = false;
    }

    const modeBtn = $('#setModeBtn');
    if (modeBtn) {
      modeBtn.textContent = `Mode: ${gameMode.charAt(0).toUpperCase() + gameMode.slice(1)}`;
    }

    generateNewDeck();
    dealSetBoard();
    updateFoundSetsUI();
    updateCvdButton();
    updateThemeButton();
    updateMarqueeUI();
  }

  function toggleGameMode() {
    gameMode = gameMode === 'static' ? 'dynamic' : 'static';
    initSetGameInternal();
    
    hasPlayed = false;
    const statusEl = $('#setStatus');
    const marqueeEl = $('#setArcadeMarquee');
    if (statusEl && marqueeEl) {
      marqueeEl.className = 'arcade-marquee-screen static-state';
      statusEl.textContent = gameMode === 'static' ? "FIND 6 SETS" : "ENDLESS MODE";
    }
  }

  function generateNewDeck(excludeCards = []) {
    const excludeSignatures = new Set(excludeCards.map(cardSignature));
    setDeck = [];
    for (let color = 0; color < 3; color++) {
      for (let shape = 0; shape < 3; shape++) {
        for (let count = 1; count <= 3; count++) {
          for (let shading = 0; shading < 3; shading++) {
            const card = { color, shape, count, shading };
            if (!excludeSignatures.has(cardSignature(card))) {
              setDeck.push(card);
            }
          }
        }
      }
    }
    setDeck.sort(() => Math.random() - 0.5);
  }

  function hasMinColors(cards) {
    let counts = [0, 0, 0];
    cards.forEach(c => counts[c.color]++);
    return counts[0] >= 2 && counts[1] >= 2 && counts[2] >= 2;
  }

  function dealSetBoard() {
    currentHintSet = null;
    hintRevealedIndices = [];
    isErrorState = false;
    const hintBtn = $('#setHintBtn');
    if (hintBtn) {
      hintBtn.textContent = hintsRemaining > 0 ? `Hint (${hintsRemaining})` : "No Hints";
      hintBtn.disabled = hintsRemaining <= 0;
    }

    let validBoardFound = false;
    while (!validBoardFound) {
      if (setDeck.length < 12) {
        generateNewDeck();
      }
      setBoardCards = setDeck.splice(0, 12);

      if (gameMode === 'static') {
        if (findAllValidSets().length >= 6) {
          validBoardFound = true;
        } else {
          setDeck = setDeck.concat(setBoardCards);
          setDeck.sort(() => Math.random() - 0.5);
        }
      } else {
        if (hasMinColors(setBoardCards) && findAllValidSets().length > 0) {
          validBoardFound = true;
        } else {
          setDeck = setDeck.concat(setBoardCards);
          setDeck.sort(() => Math.random() - 0.5);
        }
      }
    }
    renderSetBoard();
  }

  function renderSetBoard() {
    const boardEl = $('#setBoard');
    if (!boardEl) return;
    boardEl.innerHTML = '';

    setBoardCards.forEach((card, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      let className = 'set-card-btn';
      const isSelected = selectedSetCards.includes(index);
      if (isSelected) {
        className += isErrorState ? ' error' : ' selected';
      }
      btn.className = className;
      btn.setAttribute('aria-label', getCardDescription(card));
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      btn.onclick = () => {
        if (!isErrorState) {
          selectSetCard(index);
        }
      };
      btn.innerHTML = renderCardSvg(card, false, `board-${index}`) + (cvdMode ? getCvdBadgeHtml(card) : '');
      boardEl.appendChild(btn);
    });
  }

  function renderCardSvg(card, isMini, uidPrefix) {
    const colorHex = SET_COLORS[card.color];
    let shapesHtml = '';
    for (let i = 0; i < card.count; i++) {
      shapesHtml += getSingleShapeSvg(card.shape, colorHex, card.shading, isMini, `${uidPrefix}-s${i}`);
    }
    return `<div style="display: flex; gap: ${isMini ? '2px' : '4px'}; align-items: center; justify-content: center; height: 100%;">
              ${shapesHtml}
            </div>`;
  }

  function getSingleShapeSvg(shapeType, color, shading, isMini, uid) {
    const patternId = `stripe-${color.replace('#', '')}-${uid}`;
    let fill = shading === 0 ? color : (shading === 1 ? `url(#${patternId})` : 'none');
    let stroke = color;
    let strokeWidth = isMini ? 4 : 2.5;

    const w = isMini ? (shapeType === 0 ? "10" : "11") : (shapeType === 0 ? "22" : "24");
    const h = isMini ? "20" : "45";

    if (shapeType === 0) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 24 50">
        <defs>
          <pattern id="${patternId}" width="6" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="6" y2="0" stroke="${color}" stroke-width="4"/>
          </pattern>
        </defs>
        <rect x="2" y="2" width="20" height="46" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
      </svg>`;
    } else if (shapeType === 1) {
      return `<svg width="${w}" height="${h}" viewBox="0 0 24 50">
        <defs>
          <pattern id="${patternId}" width="6" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="6" y2="0" stroke="${color}" stroke-width="4"/>
          </pattern>
        </defs>
        <path d="M 12,3 C 7,3 3,7 3,13 C 3,19 10,22 13,25 C 16,28 21,31 21,37 C 21,43 17,47 12,47 C 7,47 3,43 3,37 C 3,31 8,28 11,25 C 14,22 21,19 21,13 C 21,7 17,3 12,3 Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
      </svg>`;
    } else {
      return `<svg width="${w}" height="${h}" viewBox="0 0 24 50">
        <defs>
          <pattern id="${patternId}" width="6" height="6" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="6" y2="0" stroke="${color}" stroke-width="4"/>
          </pattern>
        </defs>
        <polygon points="12,2 22,25 12,48 2,25" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
      </svg>`;
    }
  }

  function selectSetCard(index) {
    if (isErrorState || isProcessingSet) return;
    
    hasPlayed = true;

    const cardIdx = selectedSetCards.indexOf(index);
    if (cardIdx > -1) {
      selectedSetCards.splice(cardIdx, 1);
    } else {
      selectedSetCards.push(index);
      if (selectedSetCards.length === 3) {
        checkSelectedSet();
      }
    }
    updateMarqueeUI();
    renderSetBoard();
  }

  function triggerErrorFeedback() {
    isErrorState = true;
    renderSetBoard();

    cancelPendingTimeout();
    pendingTimeoutId = setTimeout(() => {
      pendingTimeoutId = null;
      isErrorState = false;
      selectedSetCards = [];
      updateMarqueeUI();
      renderSetBoard();
    }, 600);
  }

  function checkSelectedSet() {
    const sortedIndices = [...selectedSetCards].sort((a, b) => a - b);
    const signature = sortedIndices.join(',');
    const [c1, c2, c3] = selectedSetCards.map(i => setBoardCards[i]);

    const isSetValid =
      (c1.color + c2.color + c3.color) % 3 === 0 &&
      (c1.shape + c2.shape + c3.shape) % 3 === 0 &&
      (c1.count + c2.count + c3.count) % 3 === 0 &&
      (c1.shading + c2.shading + c3.shading) % 3 === 0;

    const isDuplicate = gameMode === 'static' && isSetValid && foundSetSignatures.includes(signature);

    currentHintSet = null;
    hintRevealedIndices = [];

    if (isSetValid && !isDuplicate) {
      isProcessingSet = true;
      renderSetBoard();

      cancelPendingTimeout();
      pendingTimeoutId = setTimeout(() => {
        pendingTimeoutId = null;
        try {
          if (gameMode === 'static') {
            foundSetSignatures.push(signature);
            foundSetCardsHistory.push([c1, c2, c3]);
            setsFoundCount++;

            const scoreEl = $('#setScore');
            if (scoreEl) scoreEl.textContent = setsFoundCount;

            updateFoundSetsUI();

            if (setsFoundCount >= 6) {
              selectedSetCards = [];
              isProcessingSet = false;
              updateMarqueeUI();
              renderSetBoard();
              return;
            }
          } else {
            setsFoundCount++;
            const scoreEl = $('#setScore');
            if (scoreEl) scoreEl.textContent = setsFoundCount;

            let validNewBoard = false;
            let safetyCounter = 0;
            let finalTempBoard = [...setBoardCards];
            let indicesToReplace = [...selectedSetCards];

            while (!validNewBoard && safetyCounter < 100) {
              safetyCounter++;

              if (setDeck.length < 3) {
                const cardsStayingOnBoard = setBoardCards.filter((_, idx) => !indicesToReplace.includes(idx));
                generateNewDeck(cardsStayingOnBoard);
              }

              let tempBoard = [...setBoardCards];
              let poppedCards = [];

              indicesToReplace.sort((a, b) => b - a).forEach(idx => {
                if (setDeck.length > 0) {
                  let card = setDeck.pop();
                  poppedCards.push({ idx, card });
                  tempBoard[idx] = card;
                }
              });

              let validSets = findAllValidSets(tempBoard);
              let hasColors = hasMinColors(tempBoard);

              if (hasColors && validSets.length >= 1) {
                finalTempBoard = tempBoard;
                validNewBoard = true;
              } else {
                poppedCards.forEach(p => setDeck.push(p.card));
                setDeck.sort(() => Math.random() - 0.5);
              }
            }

            if (!validNewBoard) {
              dealSetBoard();
              return;
            }

            setBoardCards = finalTempBoard;
          }
        } catch (err) {
          console.error("Error updating board after valid set:", err);
        } finally {
          selectedSetCards = [];
          isProcessingSet = false;
          updateMarqueeUI();
          renderSetBoard();
        }
      }, 400);

    } else {
      triggerErrorFeedback();
    }
  }

  function findAllValidSets(board = setBoardCards) {
    let sets = [];
    for (let i = 0; i < board.length; i++) {
      for (let j = i + 1; j < board.length; j++) {
        for (let k = j + 1; k < board.length; k++) {
          let c1 = board[i], c2 = board[j], c3 = board[k];
          if (
            (c1.color + c2.color + c3.color) % 3 === 0 &&
            (c1.shape + c2.shape + c3.shape) % 3 === 0 &&
            (c1.count + c2.count + c3.count) % 3 === 0 &&
            (c1.shading + c2.shading + c3.shading) % 3 === 0
          ) {
            sets.push([i, j, k]);
          }
        }
      }
    }
    return sets;
  }

  function showSetHint() {
    if (isErrorState || isProcessingSet) return;
    if (hintsRemaining <= 0) return;

    hasPlayed = true;

    const allValidSets = findAllValidSets();
    let remainingSets = allValidSets;

    if (gameMode === 'static') {
      remainingSets = allValidSets.filter(s => {
        const sig = [...s].sort((a, b) => a - b).join(',');
        return !foundSetSignatures.includes(sig);
      });
    }

    if (remainingSets.length === 0) return;

    if (!currentHintSet || !remainingSets.some(s => s.join(',') === currentHintSet.join(','))) {
      currentHintSet = remainingSets[0];
      hintRevealedIndices = [];
    }

    const nextCard = currentHintSet.find(idx => !hintRevealedIndices.includes(idx));

    if (nextCard === undefined) {
      selectedSetCards = [...currentHintSet];
      updateMarqueeUI();
      renderSetBoard();
      checkSelectedSet();
      return;
    }

    hintRevealedIndices.push(nextCard);
    hintsRemaining--;

    const stillSelectedFromHint = selectedSetCards.filter(idx => currentHintSet.includes(idx));
    selectedSetCards = [...stillSelectedFromHint, nextCard];

    const hintBtn = $('#setHintBtn');
    if (hintBtn) {
      hintBtn.textContent = hintsRemaining > 0 ? `Hint (${hintsRemaining})` : "No Hints";
      hintBtn.disabled = hintsRemaining <= 0;
    }

    updateMarqueeUI();
    renderSetBoard();

    if (selectedSetCards.length === 3) {
      checkSelectedSet();
    }
  }

  function updateFoundSetsUI() {
    const containerEl = $('#foundSetsContainer');
    const listEl = $('#foundSetsList');
    const toggleBtn = $('#toggleFoundSetsBtn');
    const toggleText = $('#toggleFoundSetsText');
    if (!containerEl || !listEl) return;

    if (gameMode !== 'static') {
      containerEl.style.display = 'none';
      return;
    }

    containerEl.style.display = 'block';
    listEl.style.display = isFoundSetsVisible ? 'grid' : 'none';

    if (toggleText) {
      toggleText.textContent = isFoundSetsVisible ? 'Hide Found Sets' : 'Show Found Sets';
    }

    if (toggleBtn) {
      toggleBtn.onclick = () => {
        isFoundSetsVisible = !isFoundSetsVisible;
        updateFoundSetsUI();
      };
    }

    listEl.innerHTML = '';

    for (let i = 0; i < 6; i++) {
      const slotWrapper = document.createElement('div');
      slotWrapper.className = 'set-found-slot';

      if (foundSetCardsHistory[i]) {
        foundSetCardsHistory[i].forEach((card, cardIdx) => {
          const shapeContainer = document.createElement('div');
          shapeContainer.className = 'set-found-shape';
          shapeContainer.innerHTML = renderCardSvg(card, true, `found-${i}-${cardIdx}`) + (cvdMode ? getCvdBadgeHtml(card) : '');
          slotWrapper.appendChild(shapeContainer);
        });
      }

      listEl.appendChild(slotWrapper);
    }
  }

  const modeBtn = $('#setModeBtn');
  if (modeBtn) modeBtn.onclick = toggleGameMode;

  const restartBtn = $('#setRestartBtn');
  if (restartBtn) restartBtn.onclick = () => initSetGameInternal();

  const hintBtn = $('#setHintBtn');
  if (hintBtn) hintBtn.onclick = showSetHint;

  const cvdBtn = $('#setCvdBtn');
  if (cvdBtn) {
    cvdBtn.onclick = () => {
      cvdMode = !cvdMode;
      updateCvdButton();
      renderSetBoard();
      updateFoundSetsUI();
    };
  }

  const dayModeBtn = $('#setDayModeBtn');
  if (dayModeBtn) {
    dayModeBtn.onclick = () => {
      isDayMode = !isDayMode;
      updateThemeButton();
    };
  }

  initSetGameInternal();

  return function cleanup() {
    cancelPendingTimeout();
  };
}