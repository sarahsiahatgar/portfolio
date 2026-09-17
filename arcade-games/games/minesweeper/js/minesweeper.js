export function initMinesweeperGame(hostElement) {
  let ROWS = 9;
  let COLS = 9;
  let TOTAL_MINES = 10;

  let board = [];
  let gameOver = false;
  let gameWon = false;
  let firstClick = true;
  let flagsLeft = TOTAL_MINES;
  let revealedCount = 0;
  let statusTimeout = null;

  const activePressTimers = new Set();

  function clearAllPressTimers() {
    activePressTimers.forEach((id) => clearTimeout(id));
    activePressTimers.clear();
  }

  const boardEl = hostElement.querySelector('#minesweeperBoard');
  const restartBtn = hostElement.querySelector('#restartMineBtn');
  const statusEl = hostElement.querySelector('#mineStatus');
  const marqueeEl = hostElement.querySelector('#mineMarquee');
  const flagsEl = hostElement.querySelector('#mineFlags');
  const sizeToggleBtn = hostElement.querySelector('#mineSizeToggleBtn');

  const difficulties = [
    { label: '10 Mines', mines: 10 },
    { label: '15 Mines', mines: 15 },
    { label: '22 Mines', mines: 22 }
  ];
  let currentDiffIndex = 0;

  function applyCurrentDifficulty() {
    const config = difficulties[currentDiffIndex];
    TOTAL_MINES = config.mines;
    sizeToggleBtn.textContent = config.label;
    
    ROWS = 9;
    COLS = 9;
    boardEl.style.gridTemplateColumns = `repeat(9, minmax(28px, 36px))`;
    boardEl.style.gridTemplateRows = `repeat(9, minmax(28px, 36px))`;
  }

  function cellAriaLabel(cell) {
    if (cell.mark === 1) return 'Flagged tile';
    if (cell.mark === 2) return 'Tile marked with a question mark';
    if (cell.revealed) return cell.count > 0 ? `Revealed tile, ${cell.count} adjacent mines` : 'Revealed empty tile';
    return 'Hidden tile';
  }

  function setup() {
    clearAllPressTimers();
    boardEl.innerHTML = '';
    board = [];
    gameOver = false;
    gameWon = false;
    firstClick = true;
    flagsLeft = TOTAL_MINES;
    revealedCount = 0;
    
    if (statusTimeout) clearTimeout(statusTimeout);
    if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen';
    statusEl.textContent = 'CLICK ANY TILE TO START!';
    statusEl.style.color = '';
    flagsEl.textContent = flagsLeft;

    for (let r = 0; r < ROWS; r++) {
      let row = [];
      for (let c = 0; c < COLS; c++) {
        row.push({
          row: r,
          col: c,
          mine: false,
          revealed: false,
          mark: 0, // 0: None, 1: Flag (🚩), 2: Question (?)
          count: 0
        });
      }
      board.push(row);
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cellEl = document.createElement('div');
        cellEl.classList.add('mine-cell');
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;
        cellEl.tabIndex = 0;
        cellEl.setAttribute('role', 'button');
        cellEl.setAttribute('aria-label', cellAriaLabel(board[r][c]));

        let pressTimer = null;
        let isLongPressTriggered = false;

        cellEl.addEventListener('pointerdown', (e) => {
          if (gameOver || gameWon) return;
          isLongPressTriggered = false;

          if (cellEl.setPointerCapture) {
            try { cellEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
          }

          pressTimer = setTimeout(() => {
            activePressTimers.delete(pressTimer);
            isLongPressTriggered = true;
            handleCellMark(r, c);
          }, 1000);
          activePressTimers.add(pressTimer);
        });

        cellEl.addEventListener('pointerup', () => {
          if (pressTimer) {
            clearTimeout(pressTimer);
            activePressTimers.delete(pressTimer);
            pressTimer = null;
          }
        });

        cellEl.addEventListener('pointercancel', () => {
          if (pressTimer) {
            clearTimeout(pressTimer);
            activePressTimers.delete(pressTimer);
            pressTimer = null;
          }
        });

        cellEl.addEventListener('click', () => {
          if (isLongPressTriggered) return;
          handleCellClick(r, c);
        });

        cellEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          handleCellMark(r, c);
        });

        cellEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCellClick(r, c);
          } else if (e.key === 'f' || e.key === 'F') {
            e.preventDefault();
            handleCellMark(r, c);
          }
        });

        boardEl.appendChild(cellEl);
      }
    }
  }

  function showTemporaryStatus(message, isFlagMessage = false) {
    if (gameOver || gameWon) return;
    statusEl.textContent = message;

    if (isFlagMessage && marqueeEl) {
      marqueeEl.className = 'arcade-marquee-screen flag-state';
    }

    if (statusTimeout) clearTimeout(statusTimeout);
    
    statusTimeout = setTimeout(() => {
      if (!gameOver && !gameWon) {
        if (firstClick) {
          if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen';
          statusEl.textContent = 'CLICK ANY TILE TO START!';
        } else {
          if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen active-state';
          statusEl.textContent = '';
        }
      }
    }, 1200);
  }

  function placeMines(exceptRow, exceptCol) {
    let minesPlaced = 0;
    while (minesPlaced < TOTAL_MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);

      if (Math.abs(r - exceptRow) <= 1 && Math.abs(c - exceptCol) <= 1) continue;

      if (!board[r][c].mine) {
        board[r][c].mine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].mine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) {
                count++;
              }
            }
          }
          board[r][c].count = count;
        }
      }
    }
  }

  function handleCellClick(r, c) {
    if (gameOver || gameWon) return;
    const cell = board[r][c];

    if (cell.revealed) {
      if (cell.count > 0) {
        handleChord(r, c);
      }
      return;
    }

    if (cell.mark > 0) {
      handleCellMark(r, c);
      return;
    }

    if (firstClick) {
      firstClick = false;
      if (statusTimeout) clearTimeout(statusTimeout);
      if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen active-state';
      statusEl.textContent = '';
      placeMines(r, c);
    }

    if (cell.mine) {
      if (statusTimeout) clearTimeout(statusTimeout);
      revealAllMines(r, c);
      gameOver = true;
      
      if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen game-over-state';
      statusEl.textContent = '💥 BOOM! GAME OVER';
      statusEl.style.color = '';
      boardEl.classList.add('board-shake');
      setTimeout(() => boardEl.classList.remove('board-shake'), 400);
      return;
    }

    revealCell(r, c);
    checkWinCondition();
  }

  function handleChord(r, c) {
    const cell = board[r][c];
    let flagCount = 0;
    const neighbors = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
          const neighbor = board[nr][nc];
          neighbors.push(neighbor);
          if (neighbor.mark === 1) {
            flagCount++;
          }
        }
      }
    }

    const validNeighbors = neighbors.filter(n => !n.revealed && n.mark !== 1);

    validNeighbors.forEach(n => {
      const nEl = getCellElement(n.row, n.col);
      if (nEl) nEl.classList.add('chord-peek');
    });

    setTimeout(() => {
      validNeighbors.forEach(n => {
        const nEl = getCellElement(n.row, n.col);
        if (nEl) nEl.classList.remove('chord-peek');
      });
    }, 250);

    if (flagCount === cell.count) {
      for (const neighbor of validNeighbors) {
        if (neighbor.mine) {
          if (statusTimeout) clearTimeout(statusTimeout);
          revealAllMines(neighbor.row, neighbor.col);
          gameOver = true;
          if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen game-over-state';
          statusEl.textContent = '💥 BOOM! GAME OVER';
          statusEl.style.color = '';
          boardEl.classList.add('board-shake');
          setTimeout(() => boardEl.classList.remove('board-shake'), 400);
          return;
        }

        revealCell(neighbor.row, neighbor.col);
      }
      checkWinCondition();
    }
  }

  function revealCell(r, c) {
    const cell = board[r][c];
    if (cell.revealed || cell.mark > 0) return;

    cell.revealed = true;
    revealedCount++;

    const cellEl = getCellElement(r, c);
    if (!cellEl) return;
    cellEl.classList.add('revealed');
    cellEl.classList.remove('question');

    if (cell.count > 0) {
      cellEl.textContent = cell.count;
      cellEl.dataset.value = cell.count;
      cellEl.setAttribute('aria-label', cellAriaLabel(cell));
    } else {
      cellEl.setAttribute('aria-label', cellAriaLabel(cell));
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
            if (!board[nr][nc].revealed && !board[nr][nc].mine) {
              revealCell(nr, nc);
            }
          }
        }
      }
    }
  }

  function handleCellMark(r, c) {
    if (gameOver || gameWon) return;
    const cell = board[r][c];
    if (cell.revealed) return;

    const cellEl = getCellElement(r, c);
    if (!cellEl) return;

    if (cell.mark === 0) {
      if (flagsLeft > 0) {
        cell.mark = 1;
        flagsLeft--;
        cellEl.classList.add('flagged');
        cellEl.textContent = '🚩';
        showTemporaryStatus('🚩 FLAG PLACED!', true);
      }
    } else if (cell.mark === 1) {
      cell.mark = 2;
      flagsLeft++; 
      cellEl.classList.remove('flagged');
      cellEl.classList.add('question');
      cellEl.innerHTML = '<span class="question-symbol">?</span>';
    } else {
      cell.mark = 0;
      cellEl.classList.remove('question');
      cellEl.textContent = '';
    }

    cellEl.setAttribute('aria-label', cellAriaLabel(cell));
    flagsEl.textContent = flagsLeft;
  }

  function getCellElement(r, c) {
    return boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
  }

  function revealAllMines(clickedR, clickedC) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        const cellEl = getCellElement(r, c);
        if (!cellEl) continue;

        if (r === clickedR && c === clickedC) {
          cellEl.classList.add('revealed', 'exploded');
          cellEl.innerHTML = '💥';
          continue;
        }

        if (cell.mine) {
          if (cell.mark === 1) {
            continue; 
          }

          cellEl.classList.add('revealed');
          cellEl.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="6.5" fill="#000000"/>
              <rect x="9.5" y="9.5" width="2.5" height="2.5" fill="#ffffff"/>
            </svg>
          `;
        } else if (cell.mark === 1) {
          cellEl.classList.add('revealed');
          cellEl.textContent = '❌';
        }
      }
    }
  }

  function checkWinCondition() {
    if (revealedCount === (ROWS * COLS - TOTAL_MINES)) {
      if (statusTimeout) clearTimeout(statusTimeout);
      gameWon = true;
      
      if (marqueeEl) marqueeEl.className = 'arcade-marquee-screen win-state';
      statusEl.textContent = 'YOU WIN! PLAY AGAIN?';
      statusEl.style.color = '';
      
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (board[r][c].mine && board[r][c].mark !== 1) {
            board[r][c].mark = 1;
            const cellEl = getCellElement(r, c);
            if (cellEl) {
              cellEl.classList.add('flagged');
              cellEl.textContent = '🚩';
            }
          }
        }
      }
      flagsLeft = 0;
      flagsEl.textContent = '0';
    }
  }

  restartBtn.addEventListener('click', setup);

  sizeToggleBtn.addEventListener('click', () => {
    currentDiffIndex = (currentDiffIndex + 1) % difficulties.length;
    applyCurrentDifficulty();
    setup();
  });

  applyCurrentDifficulty();
  setup();

  return function destroy() {
    clearAllPressTimers();
    if (statusTimeout) clearTimeout(statusTimeout);
  };
}