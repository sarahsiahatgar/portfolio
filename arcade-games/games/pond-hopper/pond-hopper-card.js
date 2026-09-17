import { initGameHelp } from '../../game-help.js';
import { initPondHopper } from './js/pond-hopper.js';
import { drawInsect, drawLilyPad, drawLog, drawTurtle, drawVehicle } from './js/pond-hopper-render.js';

// ==========================================
// Pond Hopper Game Component
// ==========================================

class PondHopperCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
	<div class="game-card" id="pond-hopper-section">
			<div class="game-body no-select">
			  
			  <div class="game-inner-header">
				<div class="game-title-wrapper">
				  <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
				  <h2 class="ph-title">Pond Hopper <span class="game-subtitle">(BETA)</span></h2>
				</div>
				<div class="game-score-display">
				  <span>Score: <span id="phScore">0</span></span>
				  <span style="margin-left: 8px;">Lives: <span id="phLives">3</span></span>
				</div>
			  </div>

          <div id="phCanvasWrapper">
            <canvas id="pondHopperCanvas" width="280" height="240"></canvas>
            
            <div class="ph-overlay" id="phOverlay">
              <div class="ph-neon-red ph-blink-text">PRESS START TO PLAY!</div>
            </div>
          </div>
          
          <div class="ph-control-mode-row">
            <button class="action-btn" id="phColorBtn">Frog Pallet</button>
            <div class="ph-control-right">
              <span>Controls:</span>
              <button class="action-btn" id="phControlModeBtn">Buttons</button>
            </div>
          </div>

          <div class="ph-pads-container">
            <div class="ph-trackpad" id="pondHopperButtonsPad">
              <button class="control-btn pad-up" id="phUpBtn" aria-label="Move up">▲</button>
              <button class="control-btn pad-left" id="phLeftBtn" aria-label="Move left">◀</button>
              <div class="pad-center"></div>
              <button class="control-btn pad-right" id="phRightBtn" aria-label="Move right">▶</button>
              <button class="control-btn pad-down" id="phDownBtn" aria-label="Move down">▼</button>
            </div>

            <div class="ph-swipe-pad" id="pondHopperSwipePad" style="display: none;">
              <svg class="ph-swipe-svg" viewBox="0 0 240 240">
                <line x1="0" y1="0" x2="240" y2="240" stroke="#b5be8a" stroke-width="2" opacity="0.4" />
                <line x1="0" y1="240" x2="240" y2="0" stroke="#b5be8a" stroke-width="2" opacity="0.4" />
                <circle cx="120" cy="120" r="18" fill="#b5be8a" stroke="#1e2319" stroke-width="2" />
                <text id="phSwipeUp" class="ph-swipe-label" x="120" y="65" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">UP</text>
                <text id="phSwipeDown" class="ph-swipe-label" x="120" y="180" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">DOWN</text>
                <text id="phSwipeLeft" class="ph-swipe-label" x="62" y="123" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">LEFT</text>
                <text id="phSwipeRight" class="ph-swipe-label" x="178" y="123" fill="#b5be8a" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" opacity="0.85" letter-spacing="1px">RIGHT</text>
              </svg>
            </div>
          </div>

          <div class="ph-action-row">
            <button class="action-btn" id="phMainActionBtn">Start</button>
            <button class="action-btn" id="phStopBtn" disabled>Stop</button>
          </div>

          <!-- Help Overlay moved here as the last direct child of .game-body -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Pond Hopper</h4>
              </div>

              <p class="help-desc">
                <strong>Goal:</strong> Guide your pixel frog safely from the bottom across a busy highway and a rushing river to reach the top home slots <strong>5 times</strong> and claim <strong>VICTORY!</strong> Don't get hit by cars or drown in the water. Press Start again anytime for a fresh run.<br>
                (This game is still in 🧪 BETA!)
              </p>
             
              <div class="ph-help-label">Game Elements & Obstacles</div>
              <div class="ph-items-box">
                
                <!-- Cars -->
                <div class="ph-item-row">
                  <canvas id="helpCarCanvas" width="54" height="16" class="ph-help-canvas ph-help-canvas-car"></canvas>
                  <span><strong>Cars & Trucks:</strong> Fast-moving highway traffic. One hit costs a life!</span>
                </div>

                <!-- Logs & Turtles -->
                <div class="ph-item-row">
                  <canvas id="helpLogCanvas" width="54" height="16" class="ph-help-canvas ph-help-canvas-log"></canvas>
                  <span><strong>Logs & Turtles:</strong> Hop on top of floating timber and swimming turtles to cross the river safely.</span>
                </div>

                <!-- Water Lilies -->
                <div class="ph-item-row">
                  <canvas id="helpLilyCanvas" width="54" height="20" class="ph-help-canvas ph-help-canvas-lily"></canvas>
                  <span><strong>Water Lilies:</strong> Fill all 5 blooming home slots at the top to complete your journey.</span>
                </div>

                <!-- Insects -->
                <div class="ph-item-row">
                  <canvas id="helpBugCanvas" width="54" height="20" class="ph-help-canvas ph-help-canvas-lily"></canvas>
                  <span><strong>Insects:</strong> Catch flies, butterflies, and fireflies for massive bonuses and extra lives (up to a max of 5 lives).</span>
                </div>
              </div>

              <div class="ph-help-label">Controls</div>
				<ul class="help-desc" style="margin-top: 4px; margin-bottom: 12px; padding-left: 20px;">
				  <li style="margin-bottom: 6px;"><strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path stroke="none" d="M0 0h24v24H0z"/><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="m8 11-1 1 1 1m3-5 1-1 1 1m3 3 1 1-1 1m-5 3 1 1 1-1"/></svg>Buttons:</strong> Use the on-screen 4-way directional pad.</li>
				  <li style="margin-bottom: 6px;"><strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path fill="currentColor" d="M20 8h-2A5 5 0 0 0 8 8H6a7 7 0 0 1 14 0"/><path fill="currentColor" d="M25 15a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 21 14a2.94 2.94 0 0 0-1.47.4A3 3 0 0 0 16 13.18V8a3 3 0 0 0-6 0v11.1l-2.23-1.52A2.93 2.93 0 0 0 6 17a3 3 0 0 0-2.12 5.13l8 7.3A6.16 6.16 0 0 0 16 31h5a7 7 0 0 0 7-7v-6a3 3 0 0 0-3-3m1 9a5 5 0 0 1-5 5h-5a4.17 4.17 0 0 1-2.76-1l-7.95-7.3A1 1 0 0 1 5 20a1 1 0 0 1 1.6-.8l5.4 3.7V8a1 1 0 0 1 2 0v11h2v-3a1 1 0 0 1 2 0v3h2v-2a1 1 0 0 1 2 0v2h2v-1a1 1 0 0 1 2 0Z"/></svg>Swipe Pad:</strong> Swipe anywhere on the screen for smooth mobile movement.</li>
				  <li><strong><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style="vertical-align: -2px; margin-right: 4px;"><path d="M14 5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM2 4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M13 10.25a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm0-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5 0A.25.25 0 0 1 8.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 8 8.75zm2 0a.25.25 0 0 1 .25-.25h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5a.25.25 0 0 1-.25-.25zm1 2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-5-2A.25.25 0 0 1 6.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 6 8.75zm-2 0A.25.25 0 0 1 4.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 4 8.75zm-2 0A.25.25 0 0 1 2.25 8h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 2 8.75zm11-2a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm-2 0A.25.25 0 0 1 9.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 9 6.75zm-2 0A.25.25 0 0 1 7.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 7 6.75zm-2 0A.25.25 0 0 1 5.25 6h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5A.25.25 0 0 1 5 6.75zm-3 0A.25.25 0 0 1 2.25 6h1.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-1.5A.25.25 0 0 1 2 6.75zm0 4a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25zm2 0a.25.25 0 0 1 .25-.25h5.5a.25.25 0 0 1 .25.25v.5a.25.25 0 0 1-.25.25h-5.5a.25.25 0 0 1-.25-.25z"/></svg>Keyboard:</strong> Use Arrow Keys to move the frog across the board.</li>
				</ul>
              <div class="ph-help-label" style="margin-top: 10px;">Pro Tip</div>
              <p class="help-desc" style="margin-top: 4px;">
                💡 <em>Tip:</em> You can customize and choose your favorite color for your frog before starting your run!
              </p>
            </div>
            <button class="action-btn help-close-btn" style="margin-top: 14px; width: 100%;">Back to Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._pondHopperCleanup = initPondHopper(this);
    this.renderHelpThumbnails();
  }

  disconnectedCallback() {
    if (this._pondHopperCleanup) {
      this._pondHopperCleanup();
      this._pondHopperCleanup = null;
    }
  }

  renderHelpThumbnails() {
    // 1. Render Cars & Trucks
    const carCtx = this.querySelector('#helpCarCanvas').getContext('2d');
    drawVehicle(carCtx, 2, 3, 20, 10, '#f0ad4e', false, true);   // car, facing right
    drawVehicle(carCtx, 26, 3, 24, 10, '#d9534f', true, false); // truck, facing left

    // 2. Render Logs & Turtles
    const logCtx = this.querySelector('#helpLogCanvas').getContext('2d');
    drawLog(logCtx, 2, 3, 21, 10);
    drawTurtle(logCtx, 27, 3, 22, 10, true); // facing right

    // 3. Render Water Lilies (Home Slots)
    const lilyCtx = this.querySelector('#helpLilyCanvas').getContext('2d');
    [12, 42].forEach((hx, idx) => {
      drawLilyPad(lilyCtx, hx, 10, 8, idx !== 0);
    });

    // 4. Render Insects (Fly, Butterfly, Firefly sequence)
    const bugCtx = this.querySelector('#helpBugCanvas').getContext('2d');
    drawInsect(bugCtx, { active: true, type: 'fly', x: 2, row: 0, timer: 0 }, 16);
    drawInsect(bugCtx, { active: true, type: 'butterfly', x: 20, row: 0, timer: 0 }, 16);
    drawInsect(bugCtx, { active: true, type: 'firefly', x: 38, row: 0, timer: 0 }, 16);
  }
}
customElements.define('pond-hopper-card', PondHopperCard);