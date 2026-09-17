import { initGameHelp } from '../../game-help.js';
import { initPacman } from './js/dot-eater.js';

// ==========================================
// Pac-Man Game Component
// ==========================================
class PacmanCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="dot-eater-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2 class="pac-title">🧪 Dot Eater <span class="game-subtitle">(BETA)</span></h2>
            </div>
            <span class="game-score-display">Score: <span id="pacScore">0</span></span>
          </div>

          <div id="pacCanvasWrapper">
            <canvas id="pacmanCanvas" width="280" height="200"></canvas>
          </div>
          
          <div class="pac-control-mode-row">
            <span>Controls:</span>
            <button class="action-btn" id="pacControlModeBtn">Buttons</button>
          </div>

          <div class="pac-pads-container">
            <div class="pacman-trackpad" id="pacmanButtonsPad">
              <button class="control-btn pad-up" id="pacUpBtn" aria-label="Move up">▲</button>
              <button class="control-btn pad-left" id="pacLeftBtn" aria-label="Move left">◀</button>
              <div class="pad-center"></div>
              <button class="control-btn pad-right" id="pacRightBtn" aria-label="Move right">▶</button>
              <button class="control-btn pad-down" id="pacDownBtn" aria-label="Move down">▼</button>
            </div>

            <div class="pacman-swipe-pad" id="pacmanSwipePad" style="display: none;">
              <svg class="pac-swipe-svg" viewBox="0 0 240 240">
                <line x1="0" y1="0" x2="240" y2="240" stroke="#b5be8a" stroke-width="2" opacity="0.4" />
                <line x1="0" y1="240" x2="240" y2="0" stroke="#b5be8a" stroke-width="2" opacity="0.4" />
                <circle cx="120" cy="120" r="18" fill="#b5be8a" stroke="#1e2319" stroke-width="2" />
                <text id="pacSwipeUp" class="pac-swipe-label" x="120" y="65" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">UP</text>
                <text id="pacSwipeDown" class="pac-swipe-label" x="120" y="180" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">DOWN</text>
                <text id="pacSwipeLeft" class="pac-swipe-label" x="62" y="123" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">LEFT</text>
                <text id="pacSwipeRight" class="pac-swipe-label" x="178" y="123" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">RIGHT</text>
              </svg>
            </div>
          </div>

          <div class="pac-action-row">
            <button class="action-btn" id="pacDifficultyBtn">Normal</button>
            <button class="action-btn" id="pacMainActionBtn">Start</button>
            <button class="action-btn" id="pacStopBtn" disabled>Stop</button>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Dot Eater</h4>
              </div>

              <p class="help-desc">
                Navigate the maze, eat all glowing dots, collect random bonus items, and avoid chasing ghosts to rack up a high score!<br>
                (This game is still in 🧪 BETA!)
              </p>

              
              <div class="pac-help-label">Items & Rewards</div>
              <div class="pac-items-box">
                <div class="pac-item-row">
                  <span class="pac-item-icon">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="3.5" fill="#b5be8a" />
                    </svg>
                  </span> 
                  <span><strong>Sage Dots:</strong> Clear all dots to beat the maze (+10 pts each)</span>
                </div>

                <div class="pac-item-row">
                  <span class="pac-item-icon">
                    <div class="fruit-grid">
                      <span>🍒</span><span>🍌</span>
                      <span>🍎</span><span>🍓</span>
                    </div>
                  </span> 
                  <span><strong>Fruits:</strong> Spawn randomly every 5s (+50 pts)</span>
                </div>

                <div class="pac-item-row">
                  <span class="pac-item-icon">🤍</span> 
                  <span><strong>Heart:</strong> Spawns every 10s (+30 pts)</span>
                </div>
              </div>
            
			<div class="pac-help-label">Control Options</div>
              <ul class="help-desc" style="margin-top: 4px; margin-bottom: 12px; padding-left: 20px;">
				  <li style="margin-bottom: 6px;"><strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25z"/></svg>Keyboard:</strong> Use the Arrow Keys on your desktop keyboard.</li>
				  <li style="margin-bottom: 6px;"><strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path stroke="none" d="M0 0h24v24H0z"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="m8 11-1 1 1 1m3-5 1-1 1 1m3 3 1 1-1 1m-5 3 1 1 1-1"/></svg>Buttons:</strong> Use the on-screen 4-way D-pad buttons.</li>
				  <li><strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path fill="currentColor" d="M20 8h-2A5 5 0 0 0 8 8H6a7 7 0 0 1 14 0"/><path fill="currentColor" d="M25 15a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 21 14a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 16 13.18V8a3 3 0 0 0-6 0v11.1l-2.23-1.52A2.93 2.93 0 0 0 6 17a3 3 0 0 0-2.12 5.13l8 7.3A6.16 6.16 0 0 0 16 31h5a7 7 0 0 0 7-7v-6a3 3 0 0 0-3-3m1 9a5 5 0 0 1-5 5h-5a4.17 4.17 0 0 1-2.76-1l-7.95-7.3A1 1 0 0 1 5 20a1 1 0 0 1 1.6-.8l5.4 3.7V8a1 1 0 0 1 2 0v11h2v-3a1 1 0 0 1 2 0v3h2v-2a1 1 0 0 1 2 0v2h2v-1a1 1 0 0 1 2 0Z"/></svg>Swipe Pad:</strong> Toggle to Touch mode to use directional drag/swipe gestures.</li>
				</ul>
			</div>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._pacmanCleanup = initPacman();
  }

  disconnectedCallback() {
    if (this._pacmanCleanup) {
      this._pacmanCleanup();
      this._pacmanCleanup = null;
    }
  }
}
customElements.define('dot-eater-card', PacmanCard);