import { initGameHelp } from '../../game-help.js';
import { initMinesweeperGame } from './js/minesweeper.js';

class MinesweeperGameCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="minesweeper-section">
        
        <div class="game-body no-select">
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2 class="mine-title">Minesweeper</h2>
            </div>
            <span class="game-score-display">Flags: <span id="mineFlags">10</span></span>
          </div>

          <!-- LED Marquee Display -->
          <div class="arcade-marquee-screen" id="mineMarquee">
            <span class="arcade-marquee-text" id="mineStatus">CLICK ANY TILE TO START!</span>
          </div>

          <div class="minesweeper-grid" id="minesweeperBoard"></div>
          
          <div class="game-bottom-controls" style="display: flex; gap: 10px; width: 100%; max-width: 320px; margin-top: 15px;">
            <button class="action-btn" id="mineSizeToggleBtn" style="flex: 1;">10 Mines</button>
            <button class="action-btn" id="restartMineBtn" style="flex: 1;">New Game</button>
          </div>

          <div class="game-help-overlay">
            <div class="help-content-inner">
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play</h4>
              </div>

              <p class="help-desc">
                Uncover safe tiles while avoiding hidden mines (<svg viewBox="0 0 24 24" width="14" height="14" style="vertical-align: middle;"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke="#000000" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="6.5" fill="#000000"/><rect x="9.5" y="9.5" width="2.5" height="2.5" fill="#ffffff"/></svg>). Use logic and numbers to clear the board!
              </p>

              <div class="mine-help-label">Rules & Markers</div>
              <p class="help-desc">
                • <strong>Numbers:</strong> Tell you how many mines surround that tile.<br>
                • <strong>Flags (🚩):</strong> Place to mark suspected mine locations.<br>
                • <strong>Question Mark (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#fff" width="18" height="18" style="vertical-align: -2px;"><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/></svg>):</strong> Use as a helpful reminder for uncertain spots.
              </p>

              <div class="mine-help-label">Controls</div>
              <p class="help-desc">
                • <strong>Mouse:</strong> Left-click to reveal tiles. Right-click to cycle marks (🚩 ➔ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#ffffff" width="18" height="18" style="vertical-align: -2px; margin: 0 2px;"><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/></svg> ➔ Clear).<br>
                • <strong>Touch / Mobile:</strong> Tap to reveal tiles. Press and hold (1 second) to cycle marks.
              </p>

              <div class="mine-help-label">Pro Tip</div>
              <p class="help-desc mem-mb-0">
                Clicking a revealed numbered tile with the correct number of adjacent flags will instantly "chord" and open remaining neighboring tiles.
              </p>
            </div>
            <button class="action-btn help-close-btn" style="margin-top: 14px; width: 100%;">Back to Game</button>
          </div>

        </div>

      </div>
    `;
    initGameHelp(this);
    this._destroyMinesweeper = initMinesweeperGame(this);
  }

  disconnectedCallback() {
    if (this._destroyMinesweeper) {
      this._destroyMinesweeper();
      this._destroyMinesweeper = null;
    }
  }
}
customElements.define('minesweeper-card', MinesweeperGameCard);