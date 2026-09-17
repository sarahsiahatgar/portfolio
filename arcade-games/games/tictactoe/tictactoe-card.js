import { initGameHelp } from '../../game-help.js';
import { initTicTacToe } from './js/tictactoe.js';

// ==========================================
// Tic-Tac-Toe Component
// ==========================================
class TicTacToeCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="tictactoe-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2>Tic-Tac-Toe <span class="game-subtitle">(Powered by AI)</span></h2>
            </div>
            <span class="game-score-display">Wins: <span id="tttScore">0</span></span>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Tic-Tac-Toe</h4>
              </div>
              <p class="help-desc">
                Take turns placing your marks on the 3×3 grid. Get 3 of your marks in a row (horizontally, vertically, or diagonally) to win!
              </p>
              <div class="ttt-help-label">Winning Example (Diagonal)</div>
              
              <div class="ttt-example-grid">
                <div class="ttt-example-cell highlight">X</div>
                <div class="ttt-example-cell">O</div>
                <div class="ttt-example-cell"></div>
                
                <div class="ttt-example-cell"></div>
                <div class="ttt-example-cell highlight">X</div>
                <div class="ttt-example-cell">O</div>
                
                <div class="ttt-example-cell"></div>
                <div class="ttt-example-cell"></div>
                <div class="ttt-example-cell highlight">X</div>
              </div>

              <div class="ttt-help-label">AI Intelligence</div>
              <p class="help-desc">
                Powered by a self-learning Q-Learning model (stored in DynamoDB). It starts smart with built-in strategy and continuously adapts its moves based on every match you play! If your connection drops, a local offline AI steps in so you can keep playing.
              </p>
            </div>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

          <div class="ttt-game-status-row">
            <div class="ttt-game-status" id="tttStatus"></div>
            <span class="ttt-offline-badge hidden" id="tttOfflineBadge">📡 Offline AI</span>
          </div>
          
          <div class="ttt-options-row">
            <label class="ttt-option-label">
              Your Symbol:
              <select id="tttSymbolSelect" class="ttt-select">
                <option value="X" selected>X</option>
                <option value="O">O</option>
              </select>
            </label>
            <label class="ttt-option-label">
              Go First:
              <select id="tttFirstSelect" class="ttt-select">
                <option value="player" selected>You</option>
                <option value="ai">AI</option>
              </select>
            </label>
          </div>

          <div class="ttt-board-container">
            <div class="ttt-overlay" id="tttOverlay">
              <span class="blink-text" id="tttOverlayText">PRESS START TO PLAY!</span>
            </div>
            <div class="ttt-board" id="tttBoard">
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
              <button class="ttt-cell"></button>
            </div>
          </div>

          <div class="ttt-action-row">
            <button class="action-btn flex-1" id="tttStartBtn">Start</button>
            <button class="action-btn flex-1" id="tttStopBtn" disabled>Stop</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._destroyTTT = initTicTacToe(this);
  }

  disconnectedCallback() {
    if (this._destroyTTT) {
      this._destroyTTT();
      this._destroyTTT = null;
    }
  }
}
customElements.define('tictactoe-card', TicTacToeCard);