import { initGameHelp } from '../../game-help.js';
import { initBreakout } from './js/breakout.js';

// ==========================================
// Breakout Component
// ==========================================
class BreakoutCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card breakout-card breakout-fade-in" id="breakout-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2>🧪 Breakout <span class="game-subtitle">(BETA)</span></h2>
            </div>
            <div class="game-score-display">
              <span>Score: <span id="breakoutScore">0</span></span>
              <span style="margin-left: 8px;">Lives: <span id="breakoutLives">3</span></span>
            </div>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Breakout</h4>
              </div>

              <div class="help-section">
                <div class="breakout-help-label">Objective</div>
                <p class="help-desc">
                  Bounce the ball with your paddle to clear all bricks across 20 unique levels. Don't let the ball fall past your paddle!<br>
                  (This game is still in 🧪 BETA!)
                </p>
              </div>

              <div class="help-section">
                <div class="breakout-help-label">Power-Ups & Falling Drops</div>
                <p class="help-desc" style="margin-bottom: 6px;">
                  Destroy special power-up bricks to spawn falling shapes. Catch them with your paddle to activate unique abilities:
                </p>
                <ul class="help-powerups-list">
                  <li>
                    <div class="powerup-header">
                      <span class="powerup-badge" style="background-color: #f1c40f;">3x</span>
                      <strong>Triple Ball</strong>
                    </div>
                    <p class="powerup-desc">Spawns extra active balls onto the board.</p>
                  </li>
                  <li>
                    <div class="powerup-header">
                      <span class="powerup-badge" style="background-color: #4ecdc4; ">C</span>
                      <strong>Catch Paddle (Catch)</strong>
                    </div>
                    <p class="powerup-desc">Ball sticks to paddle on contact for 8 seconds. Press Space or Tap to launch!</p>
                  </li>
                  <li>
                    <div class="powerup-header">
                      <span class="powerup-badge" style="background-color: #2ecc71;">W</span>
                      <strong>Expand Paddle</strong>
                    </div>
                    <p class="powerup-desc">Increases your paddle size for 8 seconds.</p>
                  </li>
                  <li>
                    <div class="powerup-header">
                      <span class="powerup-badge" style="background-color: #e74c3c;">S-</span>
                      <strong>Shrink Paddle</strong>
                    </div>
                    <p class="powerup-desc">Reduces your paddle size for 8 seconds.</p>
                  </li>
                  <li>
                    <div class="powerup-header">
                      <span class="powerup-badge" style="background-color: #e84393;">L</span>
                      <strong>Extra Life</strong>
                    </div>
                    <p class="powerup-desc">Adds +1 life to your current run.</p>
                  </li>
                </ul>
              </div>

              <div class="help-section">
                <div class="breakout-help-label">Control Options</div>
                <ul class="help-controls-list">
				  <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25z"/></svg><strong>Keyboard:</strong> Use Left / Right Arrow keys &amp; Space key.</li>
				  <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path stroke="none" d="M0 0h24v24H0z"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="m8 11-1 1 1 1m3-5 1-1 1 1m3 3 1 1-1 1m-5 3 1 1 1-1"/></svg><strong>Buttons:</strong> Tap the on-screen <strong>‹</strong> and <strong>›</strong> buttons.</li>
				  <li><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path fill="currentColor" d="M20 8h-2A5 5 0 0 0 8 8H6a7 7 0 0 1 14 0"/><path fill="currentColor" d="M25 15a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 21 14a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 16 13.18V8a3 3 0 0 0-6 0v11.1l-2.23-1.52A2.93 2.93 0 0 0 6 17a3 3 0 0 0-2.12 5.13l8 7.3A6.16 6.16 0 0 0 16 31h5a7 7 0 0 0 7-7v-6a3 3 0 0 0-3-3m1 9a5 5 0 0 1-5 5h-5a4.17 4.17 0 0 1-2.76-1l-7.95-7.3A1 1 0 0 1 5 20a1 1 0 0 1 1.6-.8l5.4 3.7V8a1 1 0 0 1 2 0v11h2v-3a1 1 0 0 1 2 0v3h2v-2a1 1 0 0 1 2 0v2h2v-1a1 1 0 0 1 2 0Z"/></svg><strong>Swipe Touchpad:</strong> Drag inside the swipe zone.</li>
				</ul>
                <p class="help-desc-sub">
                  <em>Tip: Switch control schemes anytime using the "Controls" button below the canvas.</em>
                </p>
              </div>

            </div>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

          <div class="game-status" id="breakoutStatus"></div>
          
          <!-- RETRO LED SCREEN HEADER -->
          <div class="breakout-led-screen">
            <span id="breakoutLedHeader" class="breakout-level-header"></span>
          </div>

          <div id="breakoutCanvasWrapper">
            <canvas id="breakoutCanvas" width="280" height="200"></canvas>
            <div id="breakoutOverlay">
              <div class="breakout-neon-red breakout-blink-text">PRESS START TO PLAY!</div>
            </div>
          </div>

          <div class="breakout-control-mode-row">
            <span>Controls:</span>
            <button class="action-btn" id="breakoutControlModeBtn">Buttons</button>
          </div>

          <div class="breakout-pads-container">
            <div class="touch-controls breakout-trackpad is-active" id="breakoutButtonsPad">
              <button class="control-btn" id="breakoutLeftBtn">‹</button>
              <button class="control-btn" id="breakoutRightBtn">›</button>
            </div>

            <div id="breakoutSwipePad">
              <span>SWIPE TOUCHPAD</span>
            </div>
          </div>

          <div class="breakout-controls-row">
            <div class="custom-dropdown-container">
              <select id="breakoutLevelSelect" style="display: none;"></select>
              <div class="custom-select-trigger" id="breakoutSelectTrigger">
                <span id="breakoutSelectText">Level 1</span>
                <span class="custom-select-arrow">▲</span>
              </div>
              <div class="custom-select-options" id="breakoutSelectOptions"></div>
            </div>

            <button class="action-btn" id="startBreakoutBtn">Start</button>
            <button class="action-btn" id="stopBreakoutBtn" disabled>Stop</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._breakoutCleanup = initBreakout();
  }

  disconnectedCallback() {
    if (this._breakoutCleanup) {
      this._breakoutCleanup();
      this._breakoutCleanup = null;
    }
  }
}
customElements.define('breakout-card', BreakoutCard);