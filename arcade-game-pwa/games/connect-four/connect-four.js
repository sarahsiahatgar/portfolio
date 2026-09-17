// connect-four.js

import { callAiGames } from '../pwa-ai-connection.js';
import { getOfflineMove } from './connect-four-offline.js';

export function initConnectFour(root) {
  let c4BoardState = Array(6).fill(null).map(() => Array(7).fill(0));
  let c4Active = false;
  let isPlayerTurn = true;
  let c4Wins = 0;
  let lastMove = null;
  let gameId = 0;

  const boardEl = root.querySelector('#c4Board');
  const statusEl = root.querySelector('#c4Status');
  const scoreEl = root.querySelector('#c4Score');
  const overlay = root.querySelector('#c4Overlay');
  const overlayText = root.querySelector('#c4OverlayText');
  const colorSelect = root.querySelector('#c4ColorSelect');
  const firstSelect = root.querySelector('#c4FirstSelect');
  const startBtn = root.querySelector('#c4StartBtn');
  const stopBtn = root.querySelector('#c4StopBtn');
  const offlineBadge = root.querySelector('#c4OfflineBadge');

  function setOfflineBadge(show) {
    if (offlineBadge) offlineBadge.classList.toggle('hidden', !show);
  }

  function updateButtonStates(isRunning) {
    if (startBtn) startBtn.disabled = isRunning;
    if (stopBtn) stopBtn.disabled = !isRunning;
    if (colorSelect) colorSelect.disabled = isRunning;
    if (firstSelect) firstSelect.disabled = isRunning;
  }

  function showOverlay(message, isBlinking = false) {
    if (overlay && overlayText) {
      overlayText.textContent = message;
      if (isBlinking) {
        overlayText.classList.add('c4-blink-text');
      } else {
        overlayText.classList.remove('c4-blink-text');
      }
      overlay.classList.remove('hidden');
    }
  }

  function hideOverlay() {
    if (overlay) overlay.classList.add('hidden');
  }

  function renderC4Preview() {
    c4BoardState = Array(6).fill(null).map(() => Array(7).fill(0));
    c4BoardState[5][2] = 1;
    c4BoardState[5][3] = 2;
    c4BoardState[4][3] = 1;
    c4BoardState[5][4] = 2;
    c4Active = false;
    lastMove = null;
    showOverlay('PRESS START TO PLAY!', true);
    updateButtonStates(false);
    if (statusEl) statusEl.textContent = '';
    renderC4();
  }

  function renderC4() {
    boardEl.innerHTML = '';

    const playerColorClass = (colorSelect && colorSelect.value === 'red') ? 'player-red' : 'player-yellow';
    const aiColorClass = (colorSelect && colorSelect.value === 'red') ? 'ai-yellow' : 'ai-red';

    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        const cell = document.createElement('div');
        cell.classList.add('c4-cell');

        if (c4BoardState[r][c] === 1) {
          cell.classList.add('player', playerColorClass);
          if (lastMove && lastMove.r === r && lastMove.c === c) cell.classList.add('dropping');
        }
        if (c4BoardState[r][c] === 2) {
          cell.classList.add('ai', aiColorClass);
          if (lastMove && lastMove.r === r && lastMove.c === c) cell.classList.add('dropping');
        }

        cell.addEventListener('click', () => {
          if (!c4Active) return;
          playC4(c);
        });

        boardEl.appendChild(cell);
      }
    }
  }

  function endC4(overlayMessage) {
    c4Active = false;
    showOverlay(overlayMessage, false);
    if (statusEl) statusEl.textContent = '';
    updateButtonStates(false);
    renderC4();
  }

  function startC4() {
    gameId++;
    c4BoardState = Array(6).fill(null).map(() => Array(7).fill(0));
    c4Active = true;
    lastMove = null;

    const startingTurn = firstSelect ? firstSelect.value : 'player';

    if (startingTurn === 'ai') {
      isPlayerTurn = false;
    } else {
      isPlayerTurn = true;
    }

    if (statusEl) statusEl.textContent = '';
    hideOverlay();
    updateButtonStates(true);
    renderC4();

    if (startingTurn === 'ai') aiC4Move();
  }

  function stopC4() {
    gameId++;
    c4Active = false;
    if (statusEl) statusEl.textContent = '';
    showOverlay('PRESS START TO PLAY!', true);
    updateButtonStates(false);
  }

  function playC4(col) {
    if (!c4Active || !isPlayerTurn) return;

    for (let r = 5; r >= 0; r--) {
      if (c4BoardState[r][col] === 0) {
        c4BoardState[r][col] = 1;
        lastMove = { r, c: col };
        renderC4();

        if (checkC4Win(1)) {
          c4Wins++;
          if (scoreEl) scoreEl.textContent = c4Wins;
          endC4('YOU WON! PLAY AGAIN?');
          return;
        }

        if (c4BoardState.every((row) => row.every((cell) => cell !== 0))) {
          endC4("IT'S A DRAW! PLAY AGAIN?");
          return;
        }

        isPlayerTurn = false;
        if (statusEl) statusEl.textContent = '';
        aiC4Move();
        return;
      }
    }
  }

  function applyAiColumn(col, thisGameId) {
    if (thisGameId !== gameId || !c4Active) return false;

    for (let r = 5; r >= 0; r--) {
      if (c4BoardState[r][col] === 0) {
        c4BoardState[r][col] = 2;
        lastMove = { r, c: col };
        renderC4();

        if (checkC4Win(2)) {
          endC4('AI WON! PLAY AGAIN?');
        } else if (c4BoardState.every((row) => row.every((cell) => cell !== 0))) {
          endC4("IT'S A DRAW! PLAY AGAIN?");
        } else {
          if (statusEl) statusEl.textContent = '';
          isPlayerTurn = true;
        }
        return true;
      }
    }
    return false;
  }

  function playOfflineC4Move(thisGameId) {
    if (thisGameId !== gameId || !c4Active) return;

    setTimeout(() => {
      if (thisGameId !== gameId || !c4Active) return;
      const col = getOfflineMove(c4BoardState);
      if (col !== null) applyAiColumn(col, thisGameId);
    }, 600);
  }

  async function aiC4Move() {
    if (!c4Active) return;
    const thisGameId = gameId;

    try {
      const data = await callAiGames({ game: 'connectfour', boardState: c4BoardState });

      if (thisGameId !== gameId || !c4Active) return;

      setOfflineBadge(false);
      const col = data.column;
      if (col !== undefined && col >= 0 && col < 7 && c4BoardState[0][col] === 0) {
        applyAiColumn(col, thisGameId);
      } else {
        playOfflineC4Move(thisGameId);
      }
    } catch (err) {
      if (thisGameId !== gameId || !c4Active) return;
      console.error('Connect Four AI error, using offline AI:', err);
      setOfflineBadge(true);
      playOfflineC4Move(thisGameId);
    }
  }

  function checkC4Win(p) {
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        if (c + 3 < 7 && p === c4BoardState[r][c] && p === c4BoardState[r][c+1] && p === c4BoardState[r][c+2] && p === c4BoardState[r][c+3]) return true;
        if (r + 3 < 6 && p === c4BoardState[r][c] && p === c4BoardState[r+1][c] && p === c4BoardState[r+2][c] && p === c4BoardState[r+3][c]) return true;
        if (r + 3 < 6 && c + 3 < 7 && p === c4BoardState[r][c] && p === c4BoardState[r+1][c+1] && p === c4BoardState[r+2][c+2] && p === c4BoardState[r+3][c+3]) return true;
        if (r + 3 < 6 && c - 3 >= 0 && p === c4BoardState[r][c] && p === c4BoardState[r+1][c-1] && p === c4BoardState[r+2][c-2] && p === c4BoardState[r+3][c-3]) return true;
      }
    }
    return false;
  }

  if (startBtn) startBtn.addEventListener('click', startC4);
  if (stopBtn) stopBtn.addEventListener('click', stopC4);

  renderC4Preview();

  return function destroy() {
    gameId++;
    c4Active = false;
  };
}