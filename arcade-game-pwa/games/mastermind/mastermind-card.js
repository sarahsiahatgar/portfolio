import { initGameHelp } from '../pwa-game-help.js';
import { initMastermind } from './mastermind.js';

// ==========================================
// Mastermind Component
// ==========================================
class MastermindCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="mastermind-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2 class="mm-title">Mastermind</h2>
            </div>
            <span class="game-score-display">Wins: <span id="mmScore">0</span></span>
          </div>

          <!-- RETRO LED SCREEN -->
          <div class="arcade-marquee-screen" id="arcadeMarquee">
            <span class="arcade-marquee-text" id="mmStatus">CRACK THE CODE!</span>
          </div>
          
          <div class="mastermind-board" id="mastermindBoard"></div>
          
          <div class="mm-color-picker" id="mmColorPicker">
            <button class="mm-color-btn" data-color="Red" aria-label="Red (key 1)"></button>
            <button class="mm-color-btn" data-color="Yellow" aria-label="Yellow (key 2)"></button>
            <button class="mm-color-btn" data-color="Green" aria-label="Green (key 3)"></button>
            <button class="mm-color-btn" data-color="Blue" aria-label="Blue (key 4)"></button>
            <button class="mm-color-btn" data-color="Cyan" aria-label="Cyan (key 5)"></button>
            <button class="mm-color-btn" data-color="Orange" aria-label="Orange (key 6)"></button>
          </div>

          <div class="mm-actions-row">
            <button class="action-btn mm-btn-fixed" id="mmColorblindBtn">CVD: Off</button>
            <button class="action-btn mm-btn-fixed" id="mmSubmitBtn" disabled>Submit</button>
            <button class="action-btn mm-btn-fixed" id="mmRestartBtn">Restart</button>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Mastermind</h4>
              </div>

              <p class="help-desc">
                Crack the secret 4-color code within 10 attempts. Use logic and feedback pegs to deduce the correct combination!
              </p>

              <div class="mm-help-label">Feedback Pegs Legend</div>
              <div class="mm-items-box">
                <div class="mm-legend-row">
                  <span class="mm-legend-pin mm-pin-black"></span> 
                  <span><strong>Black Pin:</strong> Correct color and correct position.</span>
                </div>
                <div class="mm-legend-row">
                  <span class="mm-legend-pin mm-pin-white"></span> 
                  <span><strong>White Pin:</strong> Correct color, but wrong position.</span>
                </div>
              </div>

              <div class="mm-help-label">Game Rules & Features</div>
              <p class="help-desc">
                • <strong>Colors:</strong> Choose from Red, Yellow, Green, Blue, Cyan, and Orange. Colors can repeat in the secret code!
              </p>
              <p class="help-desc">
                • <strong>Keyboard:</strong> Press 1-6 to pick a color, Enter to submit a full row.
              </p>
              <p class="help-desc mm-mb-0">
                • <strong>Colorblind Mode (CVD):</strong> Toggle CVD on to display letter initials (R, Y, G, B, C, O) directly inside the pegs for high accessibility.
              </p>
            </div>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._mastermindCleanup = initMastermind(this);
  }

  disconnectedCallback() {
    if (this._mastermindCleanup) {
      this._mastermindCleanup();
      this._mastermindCleanup = null;
    }
  }
}
customElements.define('mastermind-card', MastermindCard);