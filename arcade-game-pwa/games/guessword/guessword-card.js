import { initGameHelp } from '../pwa-game-help.js';
import { initGuessWordGame } from './guessword.js';

class GuessWordGameCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="guessword-section">
        <div class="game-body no-select">
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2 class="guess-title">GuessWord</h2>
            </div>
            <select id="gwLangSelect" class="gw-lang-select game-lang-select" aria-label="Select Language">
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fa">فارسی</option>
            </select>
          </div>

          <div class="gw-archive-nav" style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 320px; font-size: 0.85rem; font-weight: bold; color: var(--color-accent);">
            <button class="action-btn" id="gwPrevBtn" title="Previous Day" style="padding: 2px 8px; font-size: 0.75rem;">◀ Prev</button>
            <button class="action-btn" id="gwNextBtn" title="Next Day" style="padding: 2px 8px; font-size: 0.75rem;">Next ▶</button>
          </div>
          <div class="gw-day-label" id="gwDateDisplay"></div>

          <div class="gw-led-marquee" id="guesswordLedMarquee" aria-hidden="true">
            <span class="gw-led-text" id="gwMarqueeText"></span>
          </div>

          <div class="gw-streak-display" id="gwStreakDisplay"></div>

          <div class="guessword-grid" id="gwBoard"></div>
          
          <div class="gw-keyboard" id="gwKeyboard"></div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title" id="helpTitle">How to Play</h4>
              </div>

              <p class="help-desc" id="helpDesc1">
                Guess the hidden word in 6 tries. Each guess must be a valid 5-letter word.
              </p>

              <div class="mine-help-label" id="helpLabelClues">Color Clues</div>
              <p class="help-desc" id="helpDescClues">
                • <span style="color: #6aaa64; font-weight:bold;">Green:</span> Letter is in the correct spot.<br>
                • <span style="color: #c9b458; font-weight:bold;">Yellow:</span> Letter is in the word but wrong spot.<br>
                • <span style="color: var(--color-ai); font-weight:bold;">Red:</span> Letter is not in the word.
              </p>

              <div class="mine-help-label" id="helpLabelLang">Multilingual Support</div>
              <p class="help-desc mem-mb-0" id="helpDescLang">
                Switch between English, German, and Persian anytime using the dropdown menu! Persian uses Right-to-Left (RTL) mode automatically.
              </p>
            </div>
            <button class="action-btn help-close-btn" id="helpCloseBtn" style="margin-top: 14px; width: 100%;">Back to Game</button>
          </div>
        </div>
      </div>
    `;
    
    initGameHelp(this);
    this._destroyGuessWord = initGuessWordGame(this);
  }

  disconnectedCallback() {
    if (this._destroyGuessWord) {
      this._destroyGuessWord();
      this._destroyGuessWord = null;
    }
  }
}

customElements.define('guessword-card', GuessWordGameCard);