import { initGameHelp } from '../../game-help.js';
import { initSetGame } from './js/set.js';

// ==========================================
// Set Game Help SVGs
// ==========================================
const helpSvgs = {
  ovalRed: `<svg width="10" height="20" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#991b1b" stroke="#991b1b" stroke-width="2.5"/></svg>`,
  squiggleRed: `<svg width="10" height="20" viewBox="0 0 24 50"><path d="M 12,3 C 7,3 3,7 3,13 C 3,19 10,22 13,25 C 16,28 21,31 21,37 C 21,43 17,47 12,47 C 7,47 3,43 3,37 C 3,31 8,28 11,25 C 14,22 21,19 21,13 C 21,7 17,3 12,3 Z" fill="#991b1b" stroke="#991b1b" stroke-width="2.5"/></svg>`,
  diamondRed: `<svg width="10" height="20" viewBox="0 0 24 50"><polygon points="12,2 22,25 12,48 2,25" fill="#991b1b" stroke="#991b1b" stroke-width="2.5"/></svg>`,
  
  rectPurple: `<svg width="10" height="20" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#581c87" stroke="#581c87" stroke-width="2.5"/></svg>`,
  rectGreen: `<svg width="10" height="20" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#166534" stroke="#166534" stroke-width="2.5"/></svg>`,
  
  numOne: `<svg width="8" height="16" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#581c87" stroke="#581c87" stroke-width="2.5"/></svg>`,
  numTwo: `<svg width="7" height="16" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#581c87" stroke="#581c87" stroke-width="2.5"/></svg>`,
  numThree: `<svg width="6" height="16" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#581c87" stroke="#581c87" stroke-width="2.5"/></svg>`,
  
  shadingSolid: `<svg width="10" height="20" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#166534" stroke="#166534" stroke-width="2.5"/></svg>`,
  shadingStriped: `<svg width="10" height="20" viewBox="0 0 24 50"><defs><pattern id="hl-stripe" width="6" height="6" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="6" y2="0" stroke="#166534" stroke-width="4"/></pattern></defs><rect x="2" y="2" width="20" height="46" rx="10" fill="url(#hl-stripe)" stroke="#166534" stroke-width="2.5"/></svg>`,
  shadingOpen: `<svg width="10" height="20" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="none" stroke="#166534" stroke-width="2.5"/></svg>`,

  exampleStripe: `<svg width="8" height="16" viewBox="0 0 24 50"><defs><pattern id="ex-stripe" width="6" height="6" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="6" y2="0" stroke="#991b1b" stroke-width="4"/></pattern></defs><rect x="2" y="2" width="20" height="46" rx="10" fill="url(#ex-stripe)" stroke="#991b1b" stroke-width="2.5"/></svg>`,

  greenDiamondOpen: `<svg width="8" height="16" viewBox="0 0 24 50"><polygon points="12,2 22,25 12,48 2,25" fill="none" stroke="#166534" stroke-width="2.5"/></svg>`,
  purpleSquiggleStripe: `<svg width="8" height="16" viewBox="0 0 24 50"><defs><pattern id="ex-purp-stripe" width="6" height="6" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="6" y2="0" stroke="#581c87" stroke-width="4"/></pattern></defs><path d="M 12,3 C 7,3 3,7 3,13 C 3,19 10,22 13,25 C 16,28 21,31 21,37 C 21,43 17,47 12,47 C 7,47 3,43 3,37 C 3,31 8,28 11,25 C 14,22 21,19 21,13 C 21,7 17,3 12,3 Z" fill="url(#ex-purp-stripe)" stroke="#581c87" stroke-width="2.5"/></svg>`,
  redSquiggleStripe: `<svg width="8" height="16" viewBox="0 0 24 50"><defs><pattern id="ex-red-stripe" width="6" height="6" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="6" y2="0" stroke="#991b1b" stroke-width="4"/></pattern></defs><path d="M 12,3 C 7,3 3,7 3,13 C 3,19 10,22 13,25 C 16,28 21,31 21,37 C 21,43 17,47 12,47 C 7,47 3,43 3,37 C 3,31 8,28 11,25 C 14,22 21,19 21,13 C 21,7 17,3 12,3 Z" fill="url(#ex-red-stripe)" stroke="#991b1b" stroke-width="2.5"/></svg>`,
  greenOvalSolid: `<svg width="8" height="16" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#166534" stroke="#166534" stroke-width="2.5"/></svg>`,
  purpleOvalSolid: `<svg width="8" height="16" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#581c87" stroke="#581c87" stroke-width="2.5"/></svg>`,
  redOvalSolid: `<svg width="8" height="16" viewBox="0 0 24 50"><rect x="2" y="2" width="20" height="46" rx="10" fill="#991b1b" stroke="#991b1b" stroke-width="2.5"/></svg>`
};

// ==========================================
// Set Game Component
// ==========================================
class SetGameCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card" id="set-section">
        <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2>Set Game</h2>
            </div>
            <span class="game-score-display">Sets Found: <span id="setScore">0</span><span id="setScoreSuffix">/6</span></span>
          </div>

          <!-- LED SCREEN -->
          <div class="set-top-bar">
            <button class="set-toggle-btn" id="setCvdBtn">CVD: Off</button>
            
            <div class="arcade-marquee-screen" id="setArcadeMarquee">
              <span class="arcade-marquee-text" id="setStatus">FIND THE SETS!</span>
            </div>

            <button class="set-toggle-btn" id="setDayModeBtn">Night</button>
          </div>
          
          <div class="set-board" id="setBoard"></div>
          
          <div class="set-found-container" id="foundSetsContainer">
            <div class="found-sets-divider-wrapper" id="toggleFoundSetsBtn">
              <div class="found-sets-line"></div>
              <span class="found-sets-label" id="toggleFoundSetsText">Hide Found Sets</span>
              <div class="found-sets-line"></div>
            </div>
            <div class="set-found-list" id="foundSetsList"></div>
          </div>
          
          <div class="set-action-row">
            <button class="action-btn" id="setHintBtn">Hint (3)</button>
            <button class="action-btn" id="setModeBtn">Mode: Static</button>
            <button class="action-btn" id="setRestartBtn">Start new Match</button>
          </div>

          <!-- Help Overlay -->
          <div class="game-help-overlay">
            <div class="help-content-inner">
              
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">How to Play Set</h4>
              </div>

              <p class="help-desc">
                Find SETs by selecting 3 cards at a time.<br>
                A <strong>SET</strong> consists of 3 cards where each individual feature is either <strong>all the same</strong> or <strong>all different</strong> across all 3 cards.
              </p>

              <div class="set-help-label">Game Modes:</div>
              <ul class="help-desc" style="margin-top: 4px; margin-bottom: 12px; padding-left: 20px;">
                <li style="margin-bottom: 6px;"><strong>Static Mode:</strong> Find all 6 predetermined SETs present on the fixed board to win.</li>
                <li><strong>Dynamic Mode:</strong> Endless gameplay where found SETs are replaced with fresh cards from the deck.</li>
              </ul>

              <div class="set-help-label">The 4 Features:</div>
              <div class="help-features-grid">
                
                <!-- Shape Column -->
                <div class="help-feature-col">
                  <span class="help-col-title">Shape</span>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.ovalRed}</div><span>oval</span></div>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.squiggleRed}</div><span>squiggle</span></div>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.diamondRed}</div><span>diamond</span></div>
                </div>

                <!-- Color Column -->
                <div class="help-feature-col">
                  <span class="help-col-title">Color</span>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.ovalRed}</div><span>red</span></div>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.rectPurple}</div><span>purple</span></div>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.rectGreen}</div><span>green</span></div>
                </div>

                <!-- Number Column -->
                <div class="help-feature-col">
                  <span class="help-col-title">Number</span>
                  <div class="help-row"><div class="help-mini-card set-gap-1">${helpSvgs.numOne}</div><span>one</span></div>
                  <div class="help-row"><div class="help-mini-card set-gap-1">${helpSvgs.numTwo}${helpSvgs.numTwo}</div><span>two</span></div>
                  <div class="help-row"><div class="help-mini-card set-gap-1">${helpSvgs.numThree}${helpSvgs.numThree}${helpSvgs.numThree}</div><span>three</span></div>
                </div>

                <!-- Shading Column -->
                <div class="help-feature-col">
                  <span class="help-col-title">Shading</span>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.shadingSolid}</div><span>solid</span></div>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.shadingStriped}</div><span>striped</span></div>
                  <div class="help-row"><div class="help-mini-card">${helpSvgs.shadingOpen}</div><span>open</span></div>
                </div>

              </div>

              <div class="set-help-label set-mt-10">Example SETs</div>
              
              <!-- Example 1 -->
              <div class="set-example-subtitle">1. Same shape, color, number — different shading</div>
              <div class="help-example-row">
                <div class="help-example-card">${helpSvgs.numOne}${helpSvgs.numOne}</div>
                <div class="help-example-card">${helpSvgs.exampleStripe}${helpSvgs.exampleStripe}</div>
                <div class="help-example-card">${helpSvgs.shadingOpen}${helpSvgs.shadingOpen}</div>
              </div>

              <!-- Example 2 -->
              <div class="set-example-subtitle" style="margin-top: 12px;">2. All features different (shape, color, number, shading)</div>
              <div class="help-example-row">
                <div class="help-example-card">${helpSvgs.numOne}</div>
                <div class="help-example-card">${helpSvgs.greenDiamondOpen}${helpSvgs.greenDiamondOpen}</div>
                <div class="help-example-card">${helpSvgs.redSquiggleStripe}${helpSvgs.redSquiggleStripe}${helpSvgs.redSquiggleStripe}</div>
              </div>

              <!-- Example 3 -->
              <div class="set-example-subtitle" style="margin-top: 12px;">3. Same shape & shading — different color & number</div>
              <div class="help-example-row">
                <div class="help-example-card">${helpSvgs.redOvalSolid}</div>
                <div class="help-example-card">${helpSvgs.purpleOvalSolid}${helpSvgs.purpleOvalSolid}</div>
                <div class="help-example-card">${helpSvgs.greenOvalSolid}${helpSvgs.greenOvalSolid}${helpSvgs.greenOvalSolid}</div>
              </div>

              <p class="help-desc set-help-desc-footer" style="margin-top: 16px;">
                <strong>Stuck?</strong> Click <strong>Hint</strong> to highlight a card from an unfound SET. Up to 3 hints are available per match.
              </p>
            </div>
            <button class="action-btn help-close-btn">Back to Game</button>
          </div>

        </div>
      </div>
    `;

    initGameHelp(this);
    this._setGameCleanup = initSetGame(this);
  }

  disconnectedCallback() {
    if (this._setGameCleanup) {
      this._setGameCleanup();
      this._setGameCleanup = null;
    }
  }
}
customElements.define('set-game-card', SetGameCard);