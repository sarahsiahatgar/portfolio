import { initGameHelp } from '../pwa-game-help.js';
import { initConnectFour } from './connect-four.js';

// ==========================================
// Connect Four Component
// ==========================================
class ConnectFourCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="connectfour-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2>Connect Four <span class="game-subtitle">(Powered by AI)</span></h2>
            </div>
            <span class="game-score-display">Wins: <span id="c4Score">0</span></span>
          </div>

          <div class="c4-game-status-row">
            <div class="c4-game-status" id="c4Status"></div>
            <span class="c4-offline-badge hidden" id="c4OfflineBadge">📡 Offline AI</span>
          </div>

          <div class="c4-options-row">
            <label class="c4-option-label">
              Your Color:
              <select id="c4ColorSelect" class="c4-select">
                <option value="yellow" selected>🟡</option>
                <option value="red">🔴</option>
              </select>
            </label>
            <label class="c4-option-label">
              Go First:
              <select id="c4FirstSelect" class="c4-select">
                <option value="player" selected>You</option>
                <option value="ai">AI</option>
              </select>
            </label>
          </div>
          
          <div class="c4-board-container">
            <div class="c4-overlay" id="c4Overlay">
              <span class="c4-neon-red c4-blink-text" id="c4OverlayText">PRESS START TO PLAY!</span>
            </div>
            <div class="c4-board" id="c4Board"></div>
          </div>
          
          <div class="c4-action-row">
            <button class="action-btn flex-1" id="c4StartBtn">Start</button>
            <button class="action-btn flex-1" id="c4StopBtn" disabled>Stop</button>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Connect Four</h4>
              </div>

              <p class="help-desc">
                Take turns dropping your tokens into any of the 7 columns. Align four of your pieces in a row to win!
              </p>

              <div class="c4-help-label">Winning Combinations</div>
              <div class="c4-items-box">
                <div class="c4-winning-legend">
                  
                  <div class="c4-legend-item">
                    <div class="c4-token-row">
                      <div class="c4-legend-token"></div>
                      <div class="c4-legend-token"></div>
                      <div class="c4-legend-token"></div>
                      <div class="c4-legend-token"></div>
                    </div>
                    <span class="c4-legend-label">Horizontal</span>
                  </div>
                  
                  <div class="c4-legend-item">
                    <div class="c4-token-col">
                      <div class="c4-legend-token"></div>
                      <div class="c4-legend-token"></div>
                      <div class="c4-legend-token"></div>
                      <div class="c4-legend-token"></div>
                    </div>
                    <span class="c4-legend-label">Vertical</span>
                  </div>

                  <div class="c4-legend-item">
                    <div class="c4-token-grid">
                      <div class="c4-legend-token c4-pos-1"></div>
                      <div class="c4-legend-token c4-pos-2"></div>
                      <div class="c4-legend-token c4-pos-3"></div>
                      <div class="c4-legend-token c4-pos-4"></div>
                    </div>
                    <span class="c4-legend-label">Diagonal</span>
                  </div>

                </div>
              </div>

              <div class="c4-help-label">AI Intelligence</div>
              <p class="help-desc" style="margin-bottom: 0;">
                Powered by a cunning algorithmic solver that simulates future drops ahead of time to instantly block your wins and snatch victory! If your connection drops, a local offline AI steps in so you can keep playing.
              </p>
            </div>
            <button class="action-btn help-close-btn" style="margin-top: 14px; width: 100%;">Back to Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._destroyC4 = initConnectFour(this);
  }

  disconnectedCallback() {
    if (this._destroyC4) {
      this._destroyC4();
      this._destroyC4 = null;
    }
  }
}
customElements.define('connect-four-card', ConnectFourCard);