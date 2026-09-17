// tictactoe-offline.js

const WIN_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWin(board, player) {
  return WIN_COMBOS.some((combo) => combo.every((i) => board[i] === player));
}

function isFull(board) {
  return board.every((cell) => cell !== '');
}

function emptyIndices(board) {
  return board.map((v, i) => (v === '' ? i : null)).filter((v) => v !== null);
}

function minimax(board, aiSymbol, playerSymbol, isMaximizing, depth) {
  if (checkWin(board, aiSymbol)) return 10 - depth;
  if (checkWin(board, playerSymbol)) return depth - 10;
  if (isFull(board)) return 0;

  const empties = emptyIndices(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const i of empties) {
      board[i] = aiSymbol;
      best = Math.max(best, minimax(board, aiSymbol, playerSymbol, false, depth + 1));
      board[i] = '';
    }
    return best;
  }

  let best = Infinity;
  for (const i of empties) {
    board[i] = playerSymbol;
    best = Math.min(best, minimax(board, aiSymbol, playerSymbol, true, depth + 1));
    board[i] = '';
  }
  return best;
}

export function getOfflineMove(board, aiSymbol, playerSymbol, blunderChance = 0.15) {
  const empties = emptyIndices(board);
  if (empties.length === 0) return null;
  if (empties.length === 9) return 4;

  const scored = empties
    .map((i) => {
      const next = [...board];
      next[i] = aiSymbol;
      return { index: i, score: minimax(next, aiSymbol, playerSymbol, false, 1) };
    })
    .sort((a, b) => b.score - a.score);

  const shouldBlunder = scored.length > 1 && Math.random() < blunderChance;
  return shouldBlunder ? scored[1].index : scored[0].index;
}