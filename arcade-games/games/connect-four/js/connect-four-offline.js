// connect-four-offline.js

const ROWS = 6;
const COLS = 7;
const AI = 2;
const HUMAN = 1;

function validColumns(board) {
  const cols = [];
  for (let c = 0; c < COLS; c++) if (board[0][c] === 0) cols.push(c);
  return cols;
}

function drop(board, col, player) {
  const next = board.map((row) => [...row]);
  for (let r = ROWS - 1; r >= 0; r--) {
    if (next[r][col] === 0) {
      next[r][col] = player;
      break;
    }
  }
  return next;
}

function checkWin(board, p) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 3 < COLS && [0, 1, 2, 3].every((k) => board[r][c + k] === p)) return true;
      if (r + 3 < ROWS && [0, 1, 2, 3].every((k) => board[r + k][c] === p)) return true;
      if (r + 3 < ROWS && c + 3 < COLS && [0, 1, 2, 3].every((k) => board[r + k][c + k] === p)) return true;
      if (r + 3 < ROWS && c - 3 >= 0 && [0, 1, 2, 3].every((k) => board[r + k][c - k] === p)) return true;
    }
  }
  return false;
}

function scoreWindow(cells, player) {
  const opponent = player === AI ? HUMAN : AI;
  const mine = cells.filter((v) => v === player).length;
  const empty = cells.filter((v) => v === 0).length;
  const theirs = cells.filter((v) => v === opponent).length;

  if (mine === 4) return 100;
  if (mine === 3 && empty === 1) return 5;
  if (mine === 2 && empty === 2) return 2;
  if (theirs === 3 && empty === 1) return -4;
  return 0;
}

function evaluateBoard(board, player) {
  let score = 0;

  const centerCol = board.map((row) => row[Math.floor(COLS / 2)]);
  score += centerCol.filter((v) => v === player).length * 3;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 3 < COLS) {
        score += scoreWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], player);
      }
      if (r + 3 < ROWS) {
        score += scoreWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], player);
      }
      if (r + 3 < ROWS && c + 3 < COLS) {
        score += scoreWindow(
          [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]],
          player
        );
      }
      if (r + 3 < ROWS && c - 3 >= 0) {
        score += scoreWindow(
          [board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3]],
          player
        );
      }
    }
  }

  return score;
}

function isTerminal(board) {
  return checkWin(board, AI) || checkWin(board, HUMAN) || validColumns(board).length === 0;
}

function minimax(board, depth, alpha, beta, maximizing) {
  const cols = validColumns(board);
  const terminal = isTerminal(board);

  if (depth === 0 || terminal) {
    if (terminal) {
      if (checkWin(board, AI)) return { score: 1_000_000 };
      if (checkWin(board, HUMAN)) return { score: -1_000_000 };
      return { score: 0 };
    }
    return { score: evaluateBoard(board, AI) };
  }

  const ordered = [...cols].sort((a, b) => Math.abs(3 - a) - Math.abs(3 - b));

  if (maximizing) {
    let best = { score: -Infinity, col: ordered[0] };
    for (const col of ordered) {
      const result = minimax(drop(board, col, AI), depth - 1, alpha, beta, false);
      if (result.score > best.score) best = { score: result.score, col };
      alpha = Math.max(alpha, result.score);
      if (alpha >= beta) break;
    }
    return best;
  }

  let best = { score: Infinity, col: ordered[0] };
  for (const col of ordered) {
    const result = minimax(drop(board, col, HUMAN), depth - 1, alpha, beta, true);
    if (result.score < best.score) best = { score: result.score, col };
    beta = Math.min(beta, result.score);
    if (alpha >= beta) break;
  }
  return best;
}

export function getOfflineMove(board, { depth = 5, blunderChance = 0.15 } = {}) {
  const cols = validColumns(board);
  if (cols.length === 0) return null;

  for (const col of cols) {
    if (checkWin(drop(board, col, AI), AI)) return col;
  }
  for (const col of cols) {
    if (checkWin(drop(board, col, HUMAN), HUMAN)) return col;
  }

  if (cols.length > 1 && Math.random() < blunderChance) {
    const ranked = cols
      .map((col) => ({ col, score: evaluateBoard(drop(board, col, AI), AI) }))
      .sort((a, b) => b.score - a.score);
    return ranked[Math.min(1, ranked.length - 1)].col;
  }

  const { col } = minimax(board, depth, -Infinity, Infinity, true);
  return col;
}