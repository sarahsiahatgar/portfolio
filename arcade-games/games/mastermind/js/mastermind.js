// ==========================================
// Mastermind
// ==========================================

const MM_COLORS = ['Red', 'Yellow', 'Green', 'Blue', 'Cyan', 'Orange'];
const MM_CODE_LENGTH = 4;
const MM_MAX_ROWS = 10;

function getColorInitial(colorName) {
  switch (colorName) {
    case 'Red':    return 'R';
    case 'Yellow': return 'Y';
    case 'Green':  return 'G';
    case 'Blue':   return 'B';
    case 'Cyan':   return 'C';
    case 'Orange': return 'O';
    default:       return '';
  }
}

function getColorHex(colorName) {
  switch (colorName) {
    case 'Red':    return '#c9182b';
    case 'Yellow': return '#e09f00';
    case 'Green':  return '#1e7838';
    case 'Blue':   return '#264673';
    case 'Cyan':   return '#0082C7';
    case 'Orange': return '#d95d00';
    default:       return '#555';
  }
}

export function initMastermind(root = document) {
  let mmSecret = [];
  let mmCurrentRow = 0;
  let mmBoardState = [];
  let mmGuessPegs = [];
  let mmActiveCol = null;
  let mmScore = 0;
  let mmGameOver = false;
  let mmGameOverReason = null; // 'won' | 'lost' | null
  let mmColorblindMode = false;

  const controller = new AbortController();
  const { signal } = controller;

  function $(selector) {
    return root.querySelector(selector);
  }

  function applyColorLabel(el, color) {
    if (mmColorblindMode && color) {
      el.textContent = getColorInitial(color);
      el.classList.add('mm-cvd-label');
    } else {
      el.textContent = '';
      el.classList.remove('mm-cvd-label');
    }
  }

  function updateColorPickerStyling() {
    root.querySelectorAll('.mm-color-btn').forEach(btn => {
      applyColorLabel(btn, btn.getAttribute('data-color'));
    });
  }

  function updateScoreDisplay() {
    const scoreEl = $('#mmScore');
    if (scoreEl) scoreEl.textContent = mmScore;
  }

  function getLossMessage() {
    const secretHtml = mmSecret.map(color => {
      const hex = getColorHex(color);
      const span = document.createElement('span');
      span.className = 'mm-secret-peg';
      span.style.background = hex;
      applyColorLabel(span, color);
      return span.outerHTML;
    }).join('');

    return `<span>GAME OVER! SECRET CODE:</span><div class="mm-secret-row">${secretHtml}</div>`;
  }

  function renderMastermindBoard() {
    const boardEl = $('#mastermindBoard');
    if (!boardEl) return;

    boardEl.innerHTML = '';

    for (let r = 0; r < MM_MAX_ROWS; r++) {
      const rowDiv = document.createElement('div');
      rowDiv.className = `mm-row ${r === mmCurrentRow && !mmGameOver ? 'active-row' : ''}`;

      const pegsDiv = document.createElement('div');
      pegsDiv.className = 'mm-pegs';

      for (let c = 0; c < MM_CODE_LENGTH; c++) {
        const slotBtn = document.createElement('button');
        slotBtn.className = 'mm-slot';
        slotBtn.type = 'button';

        if (r === mmCurrentRow && !mmGameOver && mmActiveCol === c) {
          slotBtn.classList.add('active-slot');
        }

        let color = null;
        if (r < mmCurrentRow || (r === mmCurrentRow && mmBoardState[r].submitted)) {
          color = mmBoardState[r].pegs[c];
        } else if (r === mmCurrentRow && !mmGameOver) {
          color = mmGuessPegs[c];
        }

        if (color) {
          slotBtn.style.background = getColorHex(color);
          slotBtn.classList.add('filled');
          applyColorLabel(slotBtn, color);
        } else {
          slotBtn.style.background = '#2e3429';
          slotBtn.textContent = '';
        }

        slotBtn.setAttribute('aria-label', `Row ${r + 1}, peg ${c + 1}: ${color || 'empty'}`);

        if (r === mmCurrentRow && !mmGameOver) {
          slotBtn.onclick = () => {
            mmActiveCol = c;
            renderMastermindBoard();
          };
        } else {
          slotBtn.disabled = true;
        }

        pegsDiv.appendChild(slotBtn);
      }
      rowDiv.appendChild(pegsDiv);

      const feedbackDiv = document.createElement('div');
      feedbackDiv.className = 'mm-feedback';

      const fb = mmBoardState[r].submitted ? mmBoardState[r].feedback : { blacks: 0, whites: 0 };
      const totalPins = fb.blacks + fb.whites;

      for (let p = 0; p < MM_CODE_LENGTH; p++) {
        const pin = document.createElement('div');
        pin.className = 'mm-feedback-pin';
        if (p < fb.blacks) {
          pin.style.background = '#000';
          pin.style.border = '1px solid #777';
        } else if (p < totalPins) {
          pin.style.background = '#fff';
        } else {
          pin.style.background = 'transparent';
          pin.style.border = '1px dashed #555';
        }
        feedbackDiv.appendChild(pin);
      }
      rowDiv.appendChild(feedbackDiv);

      boardEl.appendChild(rowDiv);
    }

    const isRowFull = mmGuessPegs.every(peg => peg !== null);
    const submitBtn = $('#mmSubmitBtn');
    if (submitBtn) {
      submitBtn.disabled = !(isRowFull && !mmGameOver);
    }
  }

  function selectMmColor(color) {
    if (mmGameOver) return;

    const marqueeEl = $('#arcadeMarquee');
    const statusEl = $('#mmStatus');
    if (marqueeEl && !marqueeEl.classList.contains('active-state')) {
      marqueeEl.className = 'arcade-marquee-screen active-state';
      if (statusEl) statusEl.textContent = `GUESSING ROW ${mmCurrentRow + 1}`;
    }

    if (mmActiveCol !== null) {
      mmGuessPegs[mmActiveCol] = color;
      mmActiveCol = null;
    } else {
      const emptyIndex = mmGuessPegs.findIndex(peg => peg === null);
      if (emptyIndex !== -1) {
        mmGuessPegs[emptyIndex] = color;
      }
    }

    renderMastermindBoard();
  }

  function submitMmGuess() {
    if (mmGameOver || !mmGuessPegs.every(p => p !== null)) return;

    let blacks = 0;
    let whites = 0;
    let secretCopy = [...mmSecret];
    let guessCopy = [...mmGuessPegs];

    for (let i = 0; i < MM_CODE_LENGTH; i++) {
      if (guessCopy[i] === secretCopy[i]) {
        blacks++;
        secretCopy[i] = null;
        guessCopy[i] = null;
      }
    }

    for (let i = 0; i < MM_CODE_LENGTH; i++) {
      if (guessCopy[i] !== null) {
        const indexInSecret = secretCopy.indexOf(guessCopy[i]);
        if (indexInSecret !== -1) {
          whites++;
          secretCopy[indexInSecret] = null;
        }
      }
    }

    mmBoardState[mmCurrentRow].pegs = [...mmGuessPegs];
    mmBoardState[mmCurrentRow].feedback = { blacks, whites };
    mmBoardState[mmCurrentRow].submitted = true;

    const statusEl = $('#mmStatus');
    const marqueeEl = $('#arcadeMarquee');
    const pickerEl = $('#mmColorPicker');

    if (blacks === MM_CODE_LENGTH) {
      mmGameOver = true;
      mmGameOverReason = 'won';
      mmScore++;
      updateScoreDisplay();
      if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen win-state';
      if (statusEl) {
		statusEl.innerHTML = '★ CODE CRACKED! ★<br>PLAY AGAIN?';
	  }
      if (pickerEl) pickerEl.classList.add('mm-hidden');
      renderMastermindBoard();
      return;
    }

    if (mmCurrentRow >= MM_MAX_ROWS - 1) {
      mmGameOver = true;
      mmGameOverReason = 'lost';
      if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen game-over-state';
      if (statusEl) {
        statusEl.innerHTML = getLossMessage();
      }
      if (pickerEl) pickerEl.classList.add('mm-hidden');
      renderMastermindBoard();
      return;
    }

    mmCurrentRow++;
    mmActiveCol = null;
    mmGuessPegs = Array(MM_CODE_LENGTH).fill(null);
    if (statusEl) {
      statusEl.textContent = `ROW ${mmCurrentRow + 1} of ${MM_MAX_ROWS}`;
    }
    renderMastermindBoard();
  }

  function startNewRound() {
    mmSecret = [];
    for (let i = 0; i < MM_CODE_LENGTH; i++) {
      mmSecret.push(MM_COLORS[Math.floor(Math.random() * MM_COLORS.length)]);
    }

    mmCurrentRow = 0;
    mmActiveCol = null;
    mmGameOver = false;
    mmGameOverReason = null;
    mmGuessPegs = Array(MM_CODE_LENGTH).fill(null);

    mmBoardState = Array.from({ length: MM_MAX_ROWS }, () => ({
      pegs: Array(MM_CODE_LENGTH).fill(null),
      feedback: { blacks: 0, whites: 0 },
      submitted: false
    }));

    renderMastermindBoard();

    const marqueeEl = $('#arcadeMarquee');
    const statusEl = $('#mmStatus');
    if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen';
    if (statusEl) {
      statusEl.textContent = 'CRACK THE CODE!';
    }

    const pickerEl = $('#mmColorPicker');
    if (pickerEl) pickerEl.classList.remove('mm-hidden');

    const submitBtn = $('#mmSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;

    updateColorPickerStyling();
  }

  root.addEventListener('click', e => {
    const colorBtn = e.target.closest('.mm-color-btn');
    if (colorBtn) {
      selectMmColor(colorBtn.getAttribute('data-color'));
      return;
    }

    if (e.target.closest('#mmSubmitBtn')) {
      submitMmGuess();
      return;
    }

    if (e.target.closest('#mmRestartBtn')) {
      startNewRound();
      return;
    }

    const cvdBtn = e.target.closest('#mmColorblindBtn');
    if (cvdBtn) {
      mmColorblindMode = !mmColorblindMode;
      cvdBtn.textContent = `CVD: ${mmColorblindMode ? 'On' : 'Off'}`;
      updateColorPickerStyling();

      const statusEl = $('#mmStatus');
      if (mmGameOver && mmGameOverReason === 'lost' && statusEl) {
        statusEl.innerHTML = getLossMessage();
      }

      renderMastermindBoard();
    }
  }, { signal });

  window.addEventListener('keydown', e => {
    const targetTag = e.target && e.target.tagName;
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT' || (e.target && e.target.isContentEditable)) {
      return;
    }
    if (mmGameOver) return;

    const digit = parseInt(e.key, 10);
    if (digit >= 1 && digit <= MM_COLORS.length) {
      selectMmColor(MM_COLORS[digit - 1]);
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      const submitBtn = $('#mmSubmitBtn');
      if (submitBtn && !submitBtn.disabled) {
        submitMmGuess();
        e.preventDefault();
      }
    }
  }, { signal });

  updateScoreDisplay();
  startNewRound();

  return function cleanup() {
    controller.abort();
  };
}