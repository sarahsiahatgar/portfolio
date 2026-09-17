import { initGameHelp } from '../pwa-game-help.js';
import { initRaindropGame } from './raindrop.js';

// ==========================================
// Raindrop Math Component
// ==========================================
class RaindropCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="raindrop-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2>Raindrop <span class="game-subtitle">(Math)</span></h2>
            </div>
            <span class="game-score-display">Score: <span id="raindropScore">0</span></span>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Raindrop</h4>
              </div>

              <p class="help-desc">
                Use the on-screen keypad to enter your answer and press Submit (✔) to clear falling math equations before they hit the water and flood the island!
              </p>

              <div class="raindrop-help-label">Drop Types & Rewards</div>
              <div class="raindrop-items-box">
                <div class="raindrop-item-row">
				  <span class="raindrop-item-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path fill="#5dadec" d="M28.344 17.768L18.148 1.09L8.7 17.654c-2.2 3.51-2.392 8.074-.081 11.854c3.285 5.373 10.363 7.098 15.811 3.857c5.446-3.24 7.199-10.22 3.914-15.597"/></svg></span> <span><strong>Normal Drop:</strong> Blue raindrop (+10 pts). Missing or hitting bottom raises water level!</span>
				</div>
                <div class="raindrop-item-row">
				  <span class="raindrop-item-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path fill="#ffac33" d="M16 2s0-2 2-2s2 2 2 2v2s0 2-2 2s-2-2-2-2zm18 14s2 0 2 2s-2 2-2 2h-2s-2 0-2-2s2-2 2-2zM4 16s2 0 2 2s-2 2-2 2H2s-2 0-2-2s2-2 2-2zm5.121-8.707s1.414 1.414 0 2.828s-2.828 0-2.828 0L4.878 8.708s-1.414-1.414 0-2.829c1.415-1.414 2.829 0 2.829 0zm21 21s1.414 1.414 0 2.828s-2.828 0-2.828 0l-1.414-1.414s-1.414-1.414 0-2.828s2.828 0 2.828 0zm-.413-18.172s-1.414 1.414-2.828 0s0-2.828 0-2.828l1.414-1.414s1.414-1.414 2.828 0s0 2.828 0 2.828zm-21 21s-1.414 1.414-2.828 0s0-2.828 0-2.828l1.414-1.414s1.414-1.414 2.828 0s0 2.828 0 2.828zM16 32s0-2 2-2s2 2 2 2v2s0 2-2 2s-2-2-2-2z"/><circle cx="18" cy="18" r="10" fill="#ffac33"/></svg></span> <span><strong>Golden / Sun Drop:</strong> Special bonus drop (+30 pts & lowers water level by 25)</span>
				</div>
              </div>

              <div class="raindrop-help-label">Difficulty Levels</div>
              <div class="raindrop-items-box">
                <div class="raindrop-item-row">
                  <span><strong>Easy:</strong> Slow speed. Basic addition & subtraction (+, −).</span>
                </div>
                <div class="raindrop-item-row">
                  <span><strong>Normal:</strong> Medium speed. Adds multiplication & division (+, −, ×, ÷).</span>
                </div>
                <div class="raindrop-item-row">
                  <span><strong>Hard:</strong> Fast speed. Full math operations (+, −, ×, ÷) with faster falling drops.</span>
                </div>
              </div>

              <div class="raindrop-help-label">Water Level & Game Over</div>
              <p class="help-desc raindrop-mb-0">
                Wrong answers, missed drops, or drops reaching the bottom increase the water level. If the water fully floods the stickman's island, it's <strong>Game Over</strong>!
              </p>

            </div>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

          <!-- Retro LED Screen -->
          <div class="arcade-marquee-screen" id="raindropMarqueeScreen">
            <span class="arcade-marquee-text" id="raindropStatus">READY</span>
          </div>
          
          <div id="raindropCanvasWrapper">
            <canvas id="raindropCanvas" width="300" height="210"></canvas>
          </div>
          
          <div class="raindrop-keypad-container">
            <div id="raindropDisplay" class="raindrop-display"></div>

            <div class="raindrop-keys-grid">
              <button class="action-btn kp-btn" data-val="1">1</button>
              <button class="action-btn kp-btn" data-val="2">2</button>
              <button class="action-btn kp-btn" data-val="3">3</button>
              <button class="action-btn kp-btn" data-val="4">4</button>
              <button class="action-btn kp-btn" data-val="5">5</button>
              <button class="action-btn kp-btn" data-val="6">6</button>
              <button class="action-btn kp-btn" data-val="7">7</button>
              <button class="action-btn kp-btn" data-val="8">8</button>
              <button class="action-btn kp-btn" data-val="9">9</button>
              <button class="action-btn kp-btn" data-val="clear" title="Clear">C</button>
              <button class="action-btn kp-btn" data-val="0">0</button>
              <button class="action-btn raindrop-submit-btn" id="raindropSubmitBtn" title="Submit">✔</button>
            </div>

            <div class="raindrop-action-row">
              <button class="action-btn" id="raindropDifficultyBtn">Easy</button>
              <button class="action-btn" id="raindropStartStopBtn">Start</button>
              <button class="action-btn" id="raindropPauseBtn" disabled>Pause</button>
            </div>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._destroyRaindropGame = initRaindropGame(this);
  }

  disconnectedCallback() {
    if (this._destroyRaindropGame) {
      this._destroyRaindropGame();
      this._destroyRaindropGame = null;
    }
  }
}
customElements.define('raindrop-card', RaindropCard);