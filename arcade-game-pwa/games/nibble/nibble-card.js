import { initGameHelp } from '../pwa-game-help.js';
import { initSnake } from './nibble.js';

// ==========================================
// nibble Swipe Pad SVG Template
// ==========================================

const snakeSwipePadSvg = `
  <svg class="snake-swipe-svg" viewBox="0 0 240 240">
    <line x1="0" y1="0" x2="240" y2="240" stroke="#b5be8a" stroke-width="2" opacity="0.4" />
    <line x1="0" y1="240" x2="240" y2="0" stroke="#b5be8a" stroke-width="2" opacity="0.4" />
    <circle cx="120" cy="120" r="18" fill="#b5be8a" stroke="#1e2319" stroke-width="2" />
    <text id="snakeSwipeUp" class="snake-swipe-label" x="120" y="65" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">UP</text>
    <text id="snakeSwipeDown" class="snake-swipe-label" x="120" y="180" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">DOWN</text>
    <text id="snakeSwipeLeft" class="snake-swipe-label" x="62" y="123" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">LEFT</text>
    <text id="snakeSwipeRight" class="snake-swipe-label" x="178" y="123" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">RIGHT</text>
  </svg>
`;

// ==========================================
// nibble Component
// ==========================================
class SnakeCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="nibble-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2>Nibbles</h2>
            </div>
            <span class="game-score-display">Score: <span id="snakeScore">0</span></span>
          </div>

          <div class="snake-led-screen">
            <div id="snakeLevelHeader" class="snake-level-header">&nbsp;</div>
          </div>

          <div id="snakeCanvasWrapper">
            <canvas id="snakeCanvas" width="280" height="210"></canvas>
          </div>

          <div class="snake-controls-header">
            <div>
              <span>Mode:</span>
              <button class="action-btn snake-mode-btn" id="snakeGameModeBtn">Levels</button>
            </div>
            <div>
              <span>Controls:</span>
              <button class="action-btn snake-mode-btn" id="snakeControlModeBtn">Touch Pad</button>
            </div>
          </div>

          <div class="snake-pad-container">
            <div class="snake-trackpad snake-trackpad-grid" id="snakeButtonsPad">
              <button class="control-btn pad-up" id="snakeUpBtn" aria-label="Move up">▲</button>
              <button class="control-btn pad-left" id="snakeLeftBtn" aria-label="Move left">◀</button>
              <div class="pad-center"></div>
              <button class="control-btn pad-right" id="snakeRightBtn" aria-label="Move right">▶</button>
              <button class="control-btn pad-down" id="snakeDownBtn" aria-label="Move down">▼</button>
            </div>

            <div class="snake-swipe-pad" id="snakeSwipePad">
              ${snakeSwipePadSvg}
            </div>
          </div>

          <div class="snake-action-row">
            <div class="snake-custom-dropdown-container">
              <select id="snakeLevelSelect" style="display: none;"></select>
              <div class="snake-custom-select-trigger" id="snakeSelectTrigger">
                <span id="snakeSelectText">Level 1</span>
                <span class="snake-custom-select-arrow">▲</span>
              </div>
              <div class="snake-custom-select-options" id="snakeSelectOptions"></div>
            </div>
            <button class="action-btn" id="snakeMainActionBtn">Start</button>
            <button class="action-btn" id="snakeStopBtn" disabled>Stop</button>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Nibbles</h4>
              </div>

              <p class="help-desc">
                Guide your lone worm across the grid. Eat the glowing red food items to grow longer and score points. But be careful-crashing into the walls or running into your own tail means Game Over!
              </p>

              <div class="snake-help-label">Visual Legend</div>
              <div class="snake-items-box">
                <div class="snake-legend-row">
                  <div class="snake-body-box"></div> 
                  <span><strong>Snake Body:</strong> Your growing green tail.</span>
                </div>
                <div class="snake-legend-row">
                  <div class="snake-food-box"></div> 
                  <span><strong>Food:</strong> Red pellet (+10 points).</span>
                </div>
              </div>

              <div class="snake-help-label">Game Modes & Levels</div>
				<ul class="help-desc" style="margin-top: 4px; margin-bottom: 15px; padding-left: 20px;">
				  <li style="margin-bottom: 5px;">
					<strong>Levels Mode</strong>: Progress through 20 unique stage layouts packed with tricky walls and obstacles. Eat 10 foods to conquer a level and advance to the next challenge!
				  </li>
				  <li>
					<strong>Endless Mode</strong>: Switch to Endless mode for a wide-open field with zero walls and infinite gameplay where you can chase your high score.
				  </li>
				</ul>
              <div class="snake-help-label">Controls</div>
				<ul class="help-desc" style="margin-top: 4px; margin-bottom: 15px; padding-left: 20px;">
				  <li style="margin-bottom: 5px;">
					<strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path stroke="none" d="M0 0h24v24H0z"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="m8 11-1 1 1 1m3-5 1-1 1 1m3 3 1 1-1 1m-5 3 1 1 1-1"/></svg>Buttons</strong>: Use the on-screen directional buttons for easy tap control.
				  </li>
				  <li style="margin-bottom: 5px;">
					<strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path fill="currentColor" d="M20 8h-2A5 5 0 0 0 8 8H6a7 7 0 0 1 14 0"/><path fill="currentColor" d="M25 15a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 21 14a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 16 13.18V8a3 3 0 0 0-6 0v11.1l-2.23-1.52A2.93 2.93 0 0 0 6 17a3 3 0 0 0-2.12 5.13l8 7.3A6.16 6.16 0 0 0 16 31h5a7 7 0 0 0 7-7v-6a3 3 0 0 0-3-3m1 9a5 5 0 0 1-5 5h-5a4.17 4.17 0 0 1-2.76-1l-7.95-7.3A1 1 0 0 1 5 20a1 1 0 0 1 1.6-.8l5.4 3.7V8a1 1 0 0 1 2 0v11h2v-3a1 1 0 0 1 2 0v3h2v-2a1 1 0 0 1 2 0v2h2v-1a1 1 0 0 1 2 0Z"/></svg>Swipe Pad</strong>: Toggle to the Touch Swipe Pad to swipe anywhere in a direction for smooth mobile play.
				  </li>
				  <li>
					<strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25z"/></svg>Keyboard</strong>: Use arrow keys or WASD on your desktop keyboard for classic precision control.
				  </li>
				</ul>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._snakeCleanup = initSnake(this);
  }

  disconnectedCallback() {
    if (this._snakeCleanup) {
      this._snakeCleanup();
      this._snakeCleanup = null;
    }
  }
}
customElements.define('nibble-card', SnakeCard);