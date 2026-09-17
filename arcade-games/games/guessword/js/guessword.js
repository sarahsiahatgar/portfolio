import { UI_TEXT, KEYBOARDS } from './guessword-config.js';
import {
  fetchDictionary,
  getDateForOffset,
  formatDateString,
  getDaysSinceStart,
  getShuffledWord,
  loadGameState,
  saveGameState,
  evaluateGuess,
  hasFinishedToday,
  recordWin,
  computeStreak
} from './guessword-engine.js';

export function initGuessWordGame(cardElement) {
  let currentLang = 'en';
  let dayOffset = 0; 
  let secretWord = '';
  let currentGuesses = [];
  let currentDict = null;
  let currentGuess = '';
  let currentRow = 0;
  let activeCol = 0;
  let gameOver = false;
  let isExtending = false;
  let totalRows = 6;
  let letterStates = {};
  let introActive = true;

  let loadId = 0;
  let currentMarqueeText = '';
  let currentMarqueeLang = '';
  let currentMarqueeIntro = null;

  const activeRevealTimers = new Set();

  const boardEl = cardElement.querySelector('#gwBoard');
  const keyboardEl = cardElement.querySelector('#gwKeyboard');
  const statusEl = cardElement.querySelector('#gwStatus');
  const marqueeContainer = cardElement.querySelector('#guesswordLedMarquee');
  const marqueeTextEl = cardElement.querySelector('#gwMarqueeText');
  const langSelectEl = cardElement.querySelector('#gwLangSelect');
  const prevBtnEl = cardElement.querySelector('#gwPrevBtn');
  const nextBtnEl = cardElement.querySelector('#gwNextBtn');
  const dateDisplayEl = cardElement.querySelector('#gwDateDisplay');
  const streakDisplayEl = cardElement.querySelector('#gwStreakDisplay');

  const bottomControlsEl = cardElement.querySelector('.game-bottom-controls');
  if (bottomControlsEl) {
    bottomControlsEl.remove();
  }

  let revealContainer = cardElement.querySelector('#gwRevealContainer');
  if (!revealContainer) {
    revealContainer = document.createElement('div');
    revealContainer.id = 'gwRevealContainer';
    revealContainer.style.display = 'none';
    revealContainer.style.alignItems = 'center';
    revealContainer.style.justifyContent = 'space-between';
    revealContainer.style.width = '100%';
    revealContainer.style.gap = '8px';
    revealContainer.style.marginTop = '4px';
    
    if (marqueeContainer && marqueeContainer.parentNode) {
      marqueeContainer.parentNode.insertBefore(revealContainer, marqueeContainer.nextSibling);
    }
  }

  let modalEl = cardElement.querySelector('#gwModalPopup');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'gwModalPopup';
    modalEl.style.position = 'absolute';
    modalEl.style.top = '0';
    modalEl.style.left = '0';
    modalEl.style.width = '100%';
    modalEl.style.height = '100%';
    modalEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    modalEl.style.zIndex = '150';
    modalEl.style.display = 'none';
    modalEl.style.alignItems = 'center';
    modalEl.style.justifyContent = 'center';
    modalEl.style.borderRadius = '20px';
    modalEl.style.padding = '20px';
    modalEl.style.boxSizing = 'border-box';

    modalEl.innerHTML = `
      <div id="gwModalContent" style="background: var(--bg-card-body, #2a3423); border: 2px solid var(--color-accent); border-radius: 12px; padding: 20px; width: 100%; max-width: 300px; text-align: center; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.4);">
        <h3 id="gwModalTitle" style="margin: 0; font-size: 1rem; color: var(--color-accent);"></h3>
        <p id="gwModalDesc" style="margin: 0; font-size: 0.85rem; color: #fff; line-height: 1.4;"></p>
        <div style="display: flex; gap: 8px; margin-top: 6px;">
          <button id="gwModalKeepBtn" style="flex: 1; padding: 8px; background: var(--color-control); color: var(--color-accent); border: 1px solid var(--color-accent); border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem;"></button>
          <button id="gwModalSeeBtn" style="flex: 1; padding: 8px; background: #c9b458; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 0.75rem;"></button>
        </div>
      </div>
    `;
    cardElement.querySelector('.game-body').appendChild(modalEl);

    const keepBtn = modalEl.querySelector('#gwModalKeepBtn');
    const seeBtn = modalEl.querySelector('#gwModalSeeBtn');

    if (keepBtn) {
      keepBtn.addEventListener('click', () => {
        modalEl.style.display = 'none';
        setupPersistentRevealButton();
        totalRows++;
        buildBoard();
        rebuildSavedBoard();
        highlightActiveCell();
        scrollToActiveRow();
      });
    }

    if (seeBtn) {
      seeBtn.addEventListener('click', () => {
        modalEl.style.display = 'none';
        gameOver = true;
        if (revealContainer) revealContainer.style.display = 'none';
        persistCurrentState(false);
        refreshArchiveLockUI();
        updateStatus(UI_TEXT[currentLang].over(secretWord));
      });
    }
  }

  const LED_SCROLL_SPEED_PX_S = 80;

  function updateMarqueeText(text) {
    if (!marqueeTextEl || !marqueeContainer) return;

    const cleanText = (text || '').replace(/<[^>]*>/g, ' ').trim();

    if (!cleanText) {
      marqueeContainer.classList.remove('gw-led-scrolling', 'gw-led-static');
      marqueeTextEl.textContent = '';
      currentMarqueeText = '';
      currentMarqueeLang = currentLang;
      currentMarqueeIntro = introActive;
      return;
    }
	
    if (
      cleanText === currentMarqueeText &&
      currentLang === currentMarqueeLang &&
      introActive === currentMarqueeIntro
    ) {
      return;
    }
    currentMarqueeText = cleanText;
    currentMarqueeLang = currentLang;
    currentMarqueeIntro = introActive;

    marqueeTextEl.textContent = cleanText;
    marqueeContainer.classList.remove('gw-led-scrolling', 'gw-led-static');
	marqueeContainer.classList.toggle('gw-led-fa', currentLang === 'fa');
    marqueeTextEl.style.animation = 'none';
    void marqueeTextEl.offsetWidth;
    marqueeTextEl.style.animation = '';

    if (introActive) {
      const isReverse = currentLang === 'fa';
      const containerWidth = marqueeContainer.clientWidth;
      const textWidth = marqueeTextEl.scrollWidth;
      const startPx = isReverse ? -textWidth : containerWidth;
      const endPx = isReverse ? containerWidth : -textWidth;
      const distance = Math.abs(endPx - startPx);
      const duration = Math.max(3, distance / LED_SCROLL_SPEED_PX_S);

      marqueeTextEl.style.setProperty('--marquee-start', `${startPx}px`);
      marqueeTextEl.style.setProperty('--marquee-end', `${endPx}px`);
      marqueeTextEl.style.setProperty('--marquee-duration', `${duration}s`);
      marqueeContainer.classList.add('gw-led-scrolling');
    } else {
      marqueeContainer.classList.add('gw-led-static');
    }
  }

  async function updateLocalizedTexts(dict) {
    const t = UI_TEXT[currentLang];
    if (prevBtnEl) prevBtnEl.textContent = `◀ ${t.prev}`;
    if (nextBtnEl) nextBtnEl.textContent = `${t.next} ▶`;

    if (dateDisplayEl) {
      if (dayOffset === 0) {
        dateDisplayEl.textContent = '';
      } else {
        const targetDate = getDateForOffset(dayOffset);
        const dayNumber = getDaysSinceStart(dict.startDate, targetDate) + 1;
        dateDisplayEl.textContent = `Day ${dayNumber}`;
      }
    }
    
    const helpTitle = cardElement.querySelector('#helpTitle');
    const helpDesc1 = cardElement.querySelector('#helpDesc1');
    const helpLabelClues = cardElement.querySelector('#helpLabelClues');
    const helpDescClues = cardElement.querySelector('#helpDescClues');
    const helpLabelLang = cardElement.querySelector('#helpLabelLang');
    const helpDescLang = cardElement.querySelector('#helpDescLang');
    const helpCloseBtn = cardElement.querySelector('#helpCloseBtn');

    if (helpTitle) helpTitle.textContent = t.helpTitle;
    if (helpDesc1) helpDesc1.textContent = t.helpDesc1;
    if (helpLabelClues) helpLabelClues.textContent = t.helpLabelClues;
    if (helpDescClues) helpDescClues.innerHTML = t.helpDescClues;
    if (helpLabelLang) helpLabelLang.textContent = t.helpLabelLang;
    if (helpDescLang) helpDescLang.textContent = t.helpDescLang;
    if (helpCloseBtn) helpCloseBtn.textContent = t.helpClose;

    const seeAnsBtn = cardElement.querySelector('#gwSeeAnswerBtn');
    if (seeAnsBtn) seeAnsBtn.textContent = t.seeAnswerBtn;

    const modalTitle = cardElement.querySelector('#gwModalTitle');
    const modalDesc = cardElement.querySelector('#gwModalDesc');
    const modalKeepBtn = cardElement.querySelector('#gwModalKeepBtn');
    const modalSeeBtn = cardElement.querySelector('#gwModalSeeBtn');

    if (modalTitle) modalTitle.textContent = t.outOfTriesTitle;
    if (modalDesc) modalDesc.textContent = t.outOfTriesDesc;
    if (modalKeepBtn) modalKeepBtn.textContent = t.keepGuessingBtn;
    if (modalSeeBtn) modalSeeBtn.textContent = t.seeAnswerBtn;
  }

  async function initGame() {
    const thisLoadId = ++loadId;
    clearAllRevealTimers();

    const dict = await fetchDictionary(currentLang);
    currentDict = dict;

    if (thisLoadId !== loadId) return;

    const targetDate = getDateForOffset(dayOffset);
    const dateStr = formatDateString(targetDate);

    await updateLocalizedTexts(dict);
    if (thisLoadId !== loadId) return;

    const maxDays = getDaysSinceStart(dict.startDate, new Date());

    if (revealContainer) revealContainer.style.display = 'none';
    if (modalEl) modalEl.style.display = 'none';

    const dayIndex = getDaysSinceStart(dict.startDate, targetDate);
    const wordList = dict.answers || ["APPLE"];
    
    const rawWord = getShuffledWord(wordList, dayIndex);
    secretWord = currentLang === 'fa' ? rawWord : rawWord.toUpperCase();

    const savedState = loadGameState(currentLang, dateStr);

    currentGuess = '';
    currentRow = 0;
    activeCol = 0;
    gameOver = false;
    isExtending = false;
    currentGuesses = [];
    letterStates = {};
    totalRows = 6;

    if (savedState) {
      currentGuesses = savedState.guesses || [];
      gameOver = savedState.gameOver || false;
      isExtending = savedState.isExtending || false;
      currentRow = currentGuesses.length;
    }
    
    introActive = currentGuesses.length === 0 && !gameOver;

    buildBoard();
    buildKeyboard();

    updateStatus(UI_TEXT[currentLang].defaultPrompt || 'GUESS THE WORD!');

    if (savedState) {
      try {
        activeCol = 0;

        totalRows = Math.max(6, currentGuesses.length + (isExtending ? 1 : 0));
        
        buildBoard();
        rebuildSavedBoard();

        if (gameOver) {
          if (savedState.won) {
            updateStatus(UI_TEXT[currentLang].win);
          } else {
            updateStatus(UI_TEXT[currentLang].over(secretWord));
          }
        } else if (isExtending) {
          setupPersistentRevealButton();
          updateStatus(UI_TEXT[currentLang].keepGoing);
          highlightActiveCell();
        }
      } catch (e) {
        console.error('Failed to restore saved GuessWord state:', e);
      }
    }

    updateNavButtons(maxDays);
    updateStreakDisplay();
  }

  function persistCurrentState(won) {
    const targetDate = getDateForOffset(dayOffset);
    const dateStr = formatDateString(targetDate);
    saveGameState(currentLang, dateStr, {
      guesses: currentGuesses,
      gameOver: gameOver,
      won: won,
      isExtending: isExtending
    });
  }

  function updateNavButtons(maxDays) {
    if (prevBtnEl) {
      prevBtnEl.style.visibility = (dayOffset <= -maxDays || maxDays === 0) ? 'hidden' : 'visible';

      const locked = dayOffset === 0 && maxDays > 0 && !hasFinishedToday(currentLang);
      prevBtnEl.classList.toggle('locked', locked);
    }
    if (nextBtnEl) {
      nextBtnEl.style.visibility = dayOffset >= 0 ? 'hidden' : 'visible';
    }
  }

  function updateStreakDisplay() {
    if (!streakDisplayEl) return;
    const todayStr = formatDateString(getDateForOffset(0));
    const { current, longest } = computeStreak(currentLang, todayStr);
    streakDisplayEl.textContent = (current === 0 && longest === 0)
      ? ''
      : UI_TEXT[currentLang].streakText(current, longest);
  }

  function refreshArchiveLockUI() {
    if (!currentDict) return;
    const maxDays = getDaysSinceStart(currentDict.startDate, new Date());
    updateNavButtons(maxDays);
  }

  function buildBoard() {
    if (!boardEl) return;
    boardEl.setAttribute('dir', KEYBOARDS[currentLang].dir);
    boardEl.innerHTML = '';

    for (let r = 0; r < totalRows; r++) {
      const row = document.createElement('div');
      row.className = 'gw-row';
      for (let c = 0; c < 5; c++) {
        const tile = document.createElement('div');
        tile.className = 'gw-tile';
        tile.id = `tile-${r}-${c}`;
        
        tile.addEventListener('click', () => {
          if (gameOver || r !== currentRow) return;
          const isRtl = KEYBOARDS[currentLang].dir === 'rtl';
          activeCol = isRtl ? (4 - c) : c;
          highlightActiveCell();
        });

        row.appendChild(tile);
      }
      boardEl.appendChild(row);
    }
  }

  function highlightActiveCell() {
    const isRtl = KEYBOARDS[currentLang].dir === 'rtl';
    for (let c = 0; c < 5; c++) {
      const tileIdx = isRtl ? (4 - c) : c;
      const tile = cardElement.querySelector(`#tile-${currentRow}-${tileIdx}`);
      if (tile) {
        if (c === activeCol) {
          tile.style.borderColor = 'var(--color-ai, #6aaa64)';
        } else {
          tile.style.borderColor = '';
        }
      }
    }
  }

  function buildKeyboard() {
    if (!keyboardEl) return;
    keyboardEl.setAttribute('dir', KEYBOARDS[currentLang].dir);
    keyboardEl.innerHTML = '';
    const layout = KEYBOARDS[currentLang].keyboard;

    layout.forEach(rowKeys => {
      const rowEl = document.createElement('div');
      rowEl.className = 'gw-keyboard-row';
      rowKeys.forEach(key => {
        const keyEl = document.createElement('button');
        keyEl.className = 'gw-key';
        
        if (key === 'ENTER') {
          keyEl.innerHTML = '↵';
          keyEl.title = 'Enter';
          keyEl.classList.add('gw-key-wide');
        } else if (key === 'BACK') {
          keyEl.innerHTML = '⌫';
          keyEl.title = 'Back';
          keyEl.classList.add('gw-key-wide');
        } else {
          keyEl.textContent = key;
        }

        keyEl.dataset.key = key;
        keyEl.addEventListener('click', () => handleKeyPress(key));
        rowEl.appendChild(keyEl);
      });
      keyboardEl.appendChild(rowEl);
    });
    updateKeyboardColors();
  }

  function rebuildSavedBoard() {
    const isRtl = KEYBOARDS[currentLang].dir === 'rtl';
    currentGuesses.forEach((guess, r) => {
      const statuses = evaluateGuess(guess, secretWord);

      for (let c = 0; c < 5; c++) {
        const tileIdx = isRtl ? (4 - c) : c;
        const tile = cardElement.querySelector(`#tile-${r}-${tileIdx}`);
        if (!tile) continue;
        const letter = guess[c];
        tile.textContent = letter;
        tile.classList.add('filled', statuses[c]);

        if (statuses[c] === 'correct') {
          letterStates[letter] = 'correct';
        } else if (statuses[c] === 'present' && letterStates[letter] !== 'correct') {
          letterStates[letter] = 'present';
        } else if (statuses[c] === 'absent' && !letterStates[letter]) {
          letterStates[letter] = 'absent';
        }
      }
    });
    updateKeyboardColors();
  }

  function handleKeyPress(key) {
    if (gameOver) return;

    let guessArr = currentGuess.padEnd(5, ' ').split('');

    if (key === 'BACK') {
      if (activeCol > 0 && guessArr[activeCol] === ' ' && guessArr[activeCol - 1] !== ' ') {
        activeCol--;
        guessArr[activeCol] = ' ';
      } else if (guessArr[activeCol] !== ' ') {
        guessArr[activeCol] = ' ';
      } else if (activeCol > 0) {
        activeCol--;
        guessArr[activeCol] = ' ';
      }
      currentGuess = guessArr.join('').trimEnd();
      updateBoardDisplay();
      highlightActiveCell();
    } else if (key === 'ENTER') {

      introActive = false;
      const trimmed = currentGuess.replace(/\s/g, '');
      if (trimmed.length < 5) {
        if (UI_TEXT[currentLang].notEnough) {
          updateStatus(UI_TEXT[currentLang].notEnough);
        }
        return;
      }
      submitGuess();
    } else {
      guessArr[activeCol] = key;
      currentGuess = guessArr.join('').replace(/\s+$/, '');
      if (activeCol < 4) {
        activeCol++;
      }
      updateBoardDisplay();
      highlightActiveCell();
    }
  }

  function updateBoardDisplay() {
    const isRtl = KEYBOARDS[currentLang].dir === 'rtl';
    const guessArr = currentGuess.padEnd(5, ' ').split('');
    for (let c = 0; c < 5; c++) {
      const tileIdx = isRtl ? (4 - c) : c;
      const tile = cardElement.querySelector(`#tile-${currentRow}-${tileIdx}`);
      if (!tile) continue;
      const char = guessArr[c] === ' ' ? '' : guessArr[c];
      tile.textContent = char;
      if (char) {
        tile.classList.add('filled');
      } else {
        tile.classList.remove('filled');
      }
    }
  }

  function clearAllRevealTimers() {
    activeRevealTimers.forEach((id) => clearTimeout(id));
    activeRevealTimers.clear();
  }

  async function submitGuess() {
    const guess = currentGuess.replace(/\s/g, '');
    const dict = await fetchDictionary(currentLang);
    const validList = dict.validGuesses || dict.answers || [];

    const normalizedGuess = currentLang === 'fa' ? guess : guess.toUpperCase();
    if (!validList.includes(normalizedGuess) && !validList.includes(guess)) {
      if (UI_TEXT[currentLang].notValid) {
        updateStatus(UI_TEXT[currentLang].notValid);
      }
      return;
    }

    const isRtl = KEYBOARDS[currentLang].dir === 'rtl';
    const t = UI_TEXT[currentLang];

    for (let c = 0; c < 5; c++) {
      const tileIdx = isRtl ? (4 - c) : c;
      const tile = cardElement.querySelector(`#tile-${currentRow}-${tileIdx}`);
      if (tile) tile.style.borderColor = '';
    }

    const statuses = evaluateGuess(guess, secretWord);

    for (let c = 0; c < 5; c++) {
      const tileIdx = isRtl ? (4 - c) : c;
      const tile = cardElement.querySelector(`#tile-${currentRow}-${tileIdx}`);
      if (!tile) continue;
      const letter = guess[c];
      
      const timerId = setTimeout(() => {
        activeRevealTimers.delete(timerId);
        tile.classList.add(statuses[c]);
      }, c * 100);
      activeRevealTimers.add(timerId);

      if (statuses[c] === 'correct') {
        letterStates[letter] = 'correct';
      } else if (statuses[c] === 'present' && letterStates[letter] !== 'correct') {
        letterStates[letter] = 'present';
      } else if (statuses[c] === 'absent' && !letterStates[letter]) {
        letterStates[letter] = 'absent';
      }
    }

    currentGuesses.push(guess);
    updateKeyboardColors();

    if (guess === secretWord) {
      gameOver = true;
      if (revealContainer) revealContainer.style.display = 'none';
      const isLucky = currentGuesses.length === 1;
      const winMessage = isLucky ? (t.luckyWin || "WOW, WHAT LUCK! FIRST TRY!") : t.win;
      persistCurrentState(true);
      recordWin(currentLang, formatDateString(getDateForOffset(dayOffset)));
      updateStreakDisplay();
      refreshArchiveLockUI();
      updateStatus(winMessage);
      return;
    }

    currentRow++;
    currentGuess = '';
    activeCol = 0;

    if (currentRow === 6 && !isExtending) {
      isExtending = true;
      persistCurrentState(false);
      showInGameModal();
    } else if (isExtending) {
      totalRows++;
      buildBoard();
      rebuildSavedBoard();
      persistCurrentState(false);
      updateStatus(t.keepGoing);
      highlightActiveCell();
      scrollToActiveRow();
    } else {

      updateStatus('');
      persistCurrentState(false);
      highlightActiveCell();
    }
  }

  function showInGameModal() {
    updateStatus(UI_TEXT[currentLang].keepGoing);
    if (modalEl) {
      modalEl.style.display = 'flex';
    }
  }

  function setupPersistentRevealButton() {
    const t = UI_TEXT[currentLang];
    if (revealContainer) {
      revealContainer.innerHTML = `
        <span style="font-size: 0.8rem; opacity: 0.8;">${t.keepGoing}</span>
        <button id="gwSeeAnswerBtn" style="padding: 4px 10px; background: #c9b458; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">${t.seeAnswerBtn}</button>
      `;
      revealContainer.style.display = 'flex';

      const seeAnsBtn = cardElement.querySelector('#gwSeeAnswerBtn');
      if (seeAnsBtn) {
        seeAnsBtn.addEventListener('click', () => {
          gameOver = true;
          if (revealContainer) revealContainer.style.display = 'none';
          persistCurrentState(false);
          refreshArchiveLockUI();
          updateStatus(t.over(secretWord));
        });
      }
    }
  }

  function scrollToActiveRow() {
    if (boardEl) {
      const activeRowEl = boardEl.children[currentRow];
      if (activeRowEl) {
        boardEl.scrollTo({
          top: activeRowEl.offsetTop - boardEl.clientHeight / 2 + activeRowEl.clientHeight / 2,
          behavior: 'smooth'
        });
      }
    }
  }

  function updateKeyboardColors() {
    if (!keyboardEl) return;
    const keys = keyboardEl.querySelectorAll('.gw-key');
    keys.forEach(keyEl => {
      const letter = keyEl.dataset.key;
      if (letterStates[letter]) {
        keyEl.classList.remove('correct', 'present', 'absent');
        keyEl.classList.add(letterStates[letter]);
      }
    });
  }

  function updateStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
    updateMarqueeText(msg);
  }

  if (langSelectEl) {
    langSelectEl.value = currentLang;
    langSelectEl.addEventListener('change', (e) => {
      currentLang = e.target.value;
      dayOffset = 0;
      initGame();
    });
  }

  if (prevBtnEl) {
    prevBtnEl.addEventListener('click', () => {
      
      if (dayOffset === 0 && !hasFinishedToday(currentLang)) {
        updateStatus(UI_TEXT[currentLang].lockedArchive);
        return;
      }
      dayOffset--;
      initGame();
    });
  }

  if (nextBtnEl) {
    nextBtnEl.addEventListener('click', () => {
      if (dayOffset < 0) {
        dayOffset++;
        initGame();
      }
    });
  }

  const keydownHandler = (e) => {
    if (gameOver) return;
    if (modalEl && modalEl.style.display === 'flex') return;

    const active = document.activeElement;
    if (active) {
      const tag = active.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable) {
        return;
      }
    }

    if (e.key === 'Enter') {
      handleKeyPress('ENTER');
    } else if (e.key === 'Backspace') {
      handleKeyPress('BACK');
    } else {
      const upper = e.key.toUpperCase();
      const layoutKeys = KEYBOARDS[currentLang].keyboard.flat();
      if (layoutKeys.includes(upper) || layoutKeys.includes(e.key)) {
        handleKeyPress(upper);
      }
    }
  };
  document.addEventListener('keydown', keydownHandler);

  initGame();

  return function destroy() {
    loadId++;
    clearAllRevealTimers();
    document.removeEventListener('keydown', keydownHandler);
  };
}