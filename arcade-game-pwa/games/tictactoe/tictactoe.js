// tictactoe.js

import { callAiGames } from '../pwa-ai-connection.js';
import { getOfflineMove } from './tictactoe-offline.js';

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWin(board, player) {
  return WIN_COMBOS.some((combo) => combo.every((i) => board[i] === player));
}

export function initTicTacToe(root) {
  let board = ['', '', '', '', '', '', '', '', ''];
  let gameActive = false;
  let isPlayerTurn = true;
  let playerSymbol = 'X';
  let aiSymbol = 'O';
  let tttWins = 0;
  let aiMoveHistory = [];
  let gameId = 0;

  const scoreEl = root.querySelector('#tttScore');
  const statusEl = root.querySelector('#tttStatus');
  const overlay = root.querySelector('#tttOverlay');
  const overlayText = root.querySelector('#tttOverlayText');
  const symbolSelect = root.querySelector('#tttSymbolSelect');
  const firstSelect = root.querySelector('#tttFirstSelect');
  const startBtn = root.querySelector('#tttStartBtn');
  const stopBtn = root.querySelector('#tttStopBtn');
  const offlineBadge = root.querySelector('#tttOfflineBadge');
  const cells = root.querySelectorAll('.ttt-cell');

  function setOfflineBadge(show) {
    if (offlineBadge) offlineBadge.classList.toggle('hidden', !show);
  }

  function renderTTT() {
    cells.forEach((cell, idx) => {
      cell.textContent = board[idx];
    });
  }

  function updateButtonStates(isRunning) {
    if (startBtn) startBtn.disabled = isRunning;
    if (stopBtn) stopBtn.disabled = !isRunning;
    if (symbolSelect) symbolSelect.disabled = isRunning;
    if (firstSelect) firstSelect.disabled = isRunning;
  }

  function showOverlay(message, isBlinking = false) {
    if (overlay && overlayText) {
      overlayText.textContent = message;

      overlayText.classList.add('ttt-neon-red');

      if (isBlinking || message === 'PRESS START TO PLAY!') {
        overlayText.classList.add('blink-text');
      } else {
        overlayText.classList.remove('blink-text');
      }

      overlay.classList.remove('hidden');
    }
  }

  async function reportGameOver(outcome) {
    try {
      await callAiGames({ game: 'tictactoe-feedback', moveHistory: aiMoveHistory, outcome });
    } catch (err) {
      console.error('Failed to send learning feedback:', err);
    }
  }

  function endGame(outcome, overlayMessage) {
    gameActive = false;
    if (statusEl) statusEl.textContent = '';
    showOverlay(overlayMessage, false);
    updateButtonStates(false);
    reportGameOver(outcome);
  }

  function makeMove(index) {
    if (!gameActive || !isPlayerTurn || board[index] !== '') return;

    board[index] = playerSymbol;
    renderTTT();

    if (checkWin(board, playerSymbol)) {
      tttWins++;
      if (scoreEl) scoreEl.textContent = tttWins;
      endGame('loss', 'YOU WON! PLAY AGAIN?');
      return;
    }

    if (board.every((cell) => cell !== '')) {
      endGame('draw', "IT'S A DRAW! PLAY AGAIN?");
      return;
    }

    isPlayerTurn = false;
    if (statusEl) statusEl.textContent = '';
    aiMove();
  }

  function applyAiMove(index, thisGameId) {
    if (thisGameId !== gameId || !gameActive || board[index] !== '') return;

    board[index] = aiSymbol;
    renderTTT();

    if (checkWin(board, aiSymbol)) {
      endGame('win', 'AI WON! PLAY AGAIN?');
    } else if (board.every((cell) => cell !== '')) {
      endGame('draw', "IT'S A DRAW! PLAY AGAIN?");
    } else {
      if (statusEl) statusEl.textContent = '';
      isPlayerTurn = true;
    }
  }

  function playOfflineMove(thisGameId) {
    if (thisGameId !== gameId || !gameActive) return;

    setTimeout(() => {
      if (thisGameId !== gameId || !gameActive) return;
      const index = getOfflineMove(board, aiSymbol, playerSymbol);
      if (index !== null) applyAiMove(index, thisGameId);
    }, 500);
  }

  async function aiMove() {
    if (!gameActive) return;
    const thisGameId = gameId;
    const boardStateBeforeMove = [...board];

    try {
      const data = await callAiGames({ game: 'tictactoe', boardState: board });
      if (thisGameId !== gameId || !gameActive) return;

      setOfflineBadge(false);
      const aiIndex = data.index;
      if (aiIndex !== undefined && board[aiIndex] === '') {
        aiMoveHistory.push({ boardKey: boardStateBeforeMove.join(''), moveIndex: aiIndex });
        applyAiMove(aiIndex, thisGameId);
      } else {
        playOfflineMove(thisGameId);
      }
    } catch (err) {
      if (thisGameId !== gameId || !gameActive) return;
      console.error('AI move error, using offline AI:', err);
      setOfflineBadge(true);
      playOfflineMove(thisGameId);
    }
  }

  function startTTT() {
    gameId++;
    board = ['', '', '', '', '', '', '', '', ''];
    aiMoveHistory = [];
    gameActive = true;

    if (symbolSelect) {
      playerSymbol = symbolSelect.value;
      aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
    }

    const startingTurn = firstSelect ? firstSelect.value : 'player';

    if (startingTurn === 'ai') {
      isPlayerTurn = false;
      if (statusEl) statusEl.textContent = '';
    } else {
      isPlayerTurn = true;
      if (statusEl) statusEl.textContent = '';
    }

    updateButtonStates(true);
    if (overlay) overlay.classList.add('hidden');
    renderTTT();

    if (startingTurn === 'ai') aiMove();
  }

  function stopTTT() {
    gameId++;
    gameActive = false;
    if (statusEl) statusEl.textContent = '';
    showOverlay('PRESS START TO PLAY!', true);
    updateButtonStates(false);
  }

  cells.forEach((cell, idx) => {
    cell.addEventListener('click', () => makeMove(idx));
  });
  if (startBtn) startBtn.addEventListener('click', startTTT);
  if (stopBtn) stopBtn.addEventListener('click', stopTTT);

  showOverlay('PRESS START TO PLAY!', true);
  renderTTT();

  return function destroy() {
    gameId++;
    gameActive = false;
  };
}