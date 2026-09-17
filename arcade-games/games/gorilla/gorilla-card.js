import { initGameHelp } from '../../game-help.js';
import { initGorillaGame } from './js/gorilla.js';
import { initIOSWheels } from './js/gorilla-iosWheel.js';

// ==========================================
// (AI-)Gorilla Banana Fight Component
// ==========================================
class GorillaCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card gorilla-card" id="gorilla-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2 class="gorilla-title">(AI-)Gorilla Banana Fight</h2>
            </div>
            <span class="game-score-display">Score: <span id="gorillaScore">0</span></span>
          </div>

          <div class="game-status" id="gorillaStatus" style="display: none;"></div>
          
          <canvas id="gorillaCanvas" width="280" height="230"></canvas>
          
          <div class="gorilla-pickers-row">
            <div class="gorilla-picker-group">
              <span class="gorilla-picker-label">Angle (°)</span>
              <div class="ios-picker-container">
                <div class="ios-picker-highlight"></div>
                <div class="ios-picker-scroll" id="angleWheel"></div>
              </div>
              <input type="hidden" id="angleInput" value="45">
            </div>

            <div class="gorilla-picker-group">
              <span class="gorilla-picker-label">Power</span>
              <div class="ios-picker-container">
                <div class="ios-picker-highlight"></div>
                <div class="ios-picker-scroll" id="powerWheel"></div>
              </div>
              <input type="hidden" id="powerInput" value="50">
            </div>
          </div>

          <div class="gorilla-controls-col">
            <button class="action-btn gorilla-full-btn" id="gorillaFireBtn">Start</button>
            <button class="action-btn gorilla-full-btn gorilla-btn-small" id="gorillaPlanetBtn">Planet: Earth (g: 9.8)</button>
            <div class="gorilla-btn-row">
              <button class="action-btn gorilla-flex-btn" id="gorillaDifficultyBtn">Normal</button>
              <button class="action-btn gorilla-flex-btn" id="gorillaMainActionBtn">Restart</button>
              <button class="action-btn gorilla-flex-btn" id="gorillaSoundBtn" aria-label="Toggle Sound">
                <svg class="gorilla-speaker-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path class="gorilla-sound-waves" d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">🍌 Gorilla Banana Fight Guide</h4>
              </div>

              <p class="help-desc">
                A classic ballistic math engine tracking wind, gravity, and launch angles against a responsive AI primate!
              </p>

              <div class="gorilla-help-label">Controls & Mechanics</div>
              <div class="gorilla-items-box">
                <p class="help-desc gorilla-mb-6">• <strong>Angle & Power:</strong> Use the iOS-style scroll pickers to adjust your trajectory.</p>
                <p class="help-desc gorilla-mb-6">• <strong>Planets:</strong> Change gravity parameters (Earth, Moon, Mars, Jupiter) before starting.</p>
                <p class="help-desc gorilla-mb-6">• <strong>Wind:</strong> Watch the HUD indicator; wind speed pushes your banana left or right mid-air.</p>
                <p class="help-desc gorilla-mb-0">• <strong>Lives:</strong> Each player starts with 3 banana lives. Direct hits reduce lives and trigger AI trash-talk!</p>
              </div>

              <div class="gorilla-help-label">Tips</div>
              <p class="help-desc gorilla-mb-0">
                Hit buildings to clear a path or adjust for wind deflection. The AI learns from its misses, so stay sharp! If your connection drops, a local offline AI takes over so you can keep playing.
              </p>
            </div>
            <button class="action-btn help-close-btn" style="margin-top: 14px; width: 100%;">Back to Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._destroyGorillaGame = initGorillaGame(this);
    initIOSWheels(this);
  }

  disconnectedCallback() {
    if (this._destroyGorillaGame) {
      this._destroyGorillaGame();
      this._destroyGorillaGame = null;
    }
  }
}
customElements.define('gorilla-card', GorillaCard);