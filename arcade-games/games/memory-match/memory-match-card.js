import { initGameHelp } from '../../game-help.js';
import { initMemoryGame } from './js/memory-match.js';

class MemoryMatchCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="memory-match-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2 class="mem-title">Memory Match</h2>
            </div>
            <span class="game-score-display">Matches: <span id="memScore">0</span>/<span id="memTotalPairs">18</span></span>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play</h4>
              </div>

              <p class="help-desc">
                Flip over two cards at a time to find the matching pairs (🦊, 🧩, 🌻, etc.). Match every pair to win the game!
              </p>

              <div class="mem-help-label">Card States</div>
              <div class="mem-items-box">
                <div class="mem-item-row mem-help-flex-row">
                  <div class="mem-preview-col">
                    <span>Hidden</span>
                  </div>
                  <div class="mem-preview-arrow">➔</div>
                  <div class="mem-preview-col">
                    <div class="mem-preview-box mem-flipped-card">🐱</div>
                    <span>Flipped</span>
                  </div>
                </div>
              </div>

              <div class="mem-help-label">Board Size</div>
              <p class="help-desc">
                Pick a grid size before you start - from a quick 4×4 up to a 12×12 marathon. The size picker locks once you flip your first card of a round.
              </p>

              <div class="mem-help-label">Rules & Strategy</div>
              <p class="help-desc mem-mb-0">
                If two flipped cards match, they stay face up. If they don't match, they automatically flip back over after a short moment. Test and train your memory skills!
              </p>
            </div>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

          <!-- RETRO LED SCREEN -->
          <div class="arcade-marquee-screen" id="arcadeMarquee">
            <span class="arcade-marquee-text" id="memStatus">FLIP CARDS TO MATCH!</span>
          </div>
          
          <div class="memory-grid" id="memoryBoard"></div>

          <div class="mem-controls-row">
            <div class="mem-custom-dropdown-container mem-size-dropdown">
              <select id="memGridSizeSelect" style="display: none;"></select>
              <div class="mem-custom-select-trigger" id="memSizeSelectTrigger">
                <span id="memSizeSelectText">6 × 6</span>
                <span class="mem-custom-select-arrow">▲</span>
              </div>
              <div class="mem-custom-select-options" id="memSizeSelectOptions"></div>
            </div>
            <button class="action-btn" id="restartMemBtn">New Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._memoryCleanup = initMemoryGame(this);
  }

  disconnectedCallback() {
    if (this._memoryCleanup) {
      this._memoryCleanup();
      this._memoryCleanup = null;
    }
  }
}

customElements.define('memory-match-card', MemoryMatchCard);