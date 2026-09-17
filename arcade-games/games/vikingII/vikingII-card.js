import { initGameHelp } from '../../game-help.js';
import { initVikingGame } from './js/vikingII.js';

class VikingCard extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="game-card viking-card" id="viking-section">
          <div class="game-body no-select">
          
          <div class="game-inner-header">
            <div class="game-title-wrapper">
              <button class="help-toggle-btn" aria-label="Toggle Help" title="Instructions">?</button>
              <h2 class="viking-title">🧪 VikingII (Defend the Fort)</h2>
            </div>
            <span class="game-score-display">Score: <span id="scoreDisplay">0</span></span>
          </div>

          <div class="viking-content-inner">
            
            <!-- LED Marquee Screen -->
            <div class="arcade-marquee-screen" id="vikingMarqueeScreen">
              <!-- Left Item -->
              <span id="waveDisplay" class="marquee-left viking-hidden">WAVE 1</span>

              <!-- Center Item (Powerup timers or Final Score) -->
              <span class="arcade-marquee-text" id="vikingStatus"></span>

              <!-- Right Item -->
              <span id="hpDisplay" class="marquee-right viking-hidden">HP 100</span>
            </div>

            <div class="viking-canvas-wrapper">
              <canvas id="vikingCanvas" width="520" height="225"></canvas>
              
              <div class="viking-overlay" id="startOverlay">
                <span class="viking-overlay-text viking-blink-text viking-neon-red">PRESS START TO PLAY!</span>
              </div>
              
              <div class="viking-overlay viking-hidden" id="pauseOverlay">
                <span class="viking-overlay-text viking-blink-text viking-neon-red">PAUSED</span>
              </div>

              <div class="viking-overlay viking-hidden" id="gameOverOverlay">
                <span class="viking-overlay-text viking-neon-red" id="gameOverOverlayText">FALLEN!</span>
              </div>
            </div>

            <div id="gameOverInputRow">
              <div class="viking-input-flex">
                <input type="text" id="playerName" maxlength="15" placeholder="Enter your name" />
              </div>
              <div id="scoreErrorMsg"></div>
            </div>

            <div class="viking-action-row">
              <button class="action-btn viking-action-btn" id="vikingDifficultyBtn">Normal</button>
              <button class="action-btn viking-action-btn" id="startBtn">Start</button>
              <button class="action-btn viking-action-btn" id="leftHandedBtn">Mode: Left</button>         
              
              <button class="action-btn viking-action-btn viking-hidden" id="pauseBtn">Pause</button>
              <button class="action-btn viking-action-btn viking-hidden" id="submitScoreBtn">Submit Score</button>
              <button class="action-btn viking-action-btn viking-hidden" id="skipScoreBtn">Skip</button>
              <button class="action-btn viking-action-btn viking-hidden" id="exitGameBtn">Exit</button>
            </div>

            <div class="leaderboard-container viking-hidden" id="leaderboardContainer">
              <h3>🏆 Leaderboard 🏆</h3>
              <ul id="leaderboardList">
                <li class="leaderboard-loading">Loading scores...</li>
              </ul>
            </div>
          </div>

          <div class="game-help-overlay">
            <div class="help-content-inner">
              <div class="game-help-header">
                <button class="help-toggle-btn">?</button>
                <h4 class="help-title">Viking II: Defend the Fort Guide</h4>
              </div>
              <p class="help-desc">
                Protect your longhouse against relentless waves of incoming raiders using continuous arrow volleys, power-ups, and tactical fort upgrades!<br>
                (This game is still in 🧪 BETA!)
              </p>
              <div class="viking-help-label">Controls & Mechanics</div>
              <div class="viking-items-box">
                <p class="help-desc viking-help-desc-mb6">• <strong>Continuous Shooting:</strong> Hold down your click or touch anywhere on the canvas to rain down continuous arrow fire toward your cursor.</p>
                <p class="help-desc viking-help-desc-mb6">• <strong>Left-Handed Mode:</strong> Toggle this option before starting to flip your fort and defensive lines to the right side of the screen.</p>
                <p class="help-desc viking-mb-0">• <strong>Difficulty Modes:</strong> Cycle between <em>Easy</em>, <em>Normal</em>, and <em>Hard</em> to adjust enemy movement speeds and damage multipliers.</p>
              </div>
              <div class="viking-help-label">Enemies & Fort HP</div>
              <div class="viking-items-box">
                <p class="help-desc viking-help-desc-mb6">• <strong>Normal Raiders:</strong> Fast-moving attackers requiring a single direct arrow hit.</p>
                <p class="help-desc viking-help-desc-mb6">• <strong>Heavy Raiders:</strong> Armored brutes with high health pools (requires 4 direct hits) that deal heavy damage to your walls.</p>
                <p class="help-desc viking-mb-0">• <strong>Longhouse HP:</strong> Starts at 100 HP. If it drops to 0, the fort falls!</p>
              </div>
              <div class="viking-help-label">Power-Ups</div>
              <div class="viking-items-box">
                <p class="help-desc viking-help-desc-mb6">• 💚 <strong>Health Boost:</strong> Restores +20 HP to your fortress.</p>
                <p class="help-desc viking-help-desc-mb6">• 🔥 <strong>Fire Shield:</strong> Ignites your walls for 10 seconds to incinerate oncoming raiders and earn bonus points.</p>
                <p class="help-desc viking-mb-0">• ⚔️ <strong>5-Shot Spread:</strong> Unleashes a powerful 5-arrow fan spread for 5 seconds to clear out entire invasion waves.</p>
              </div>
              <div class="viking-help-label">🏆 Cloud Leaderboard</div>
              <p class="help-desc viking-mb-0">
                Fight for glory! Submit your final score with a custom name when defeated. Top 3 warriors receive glorious <span style="color: #d4af37; font-weight: bold;">Gold</span>, <span style="color: #c0c0c0; font-weight: bold;">Silver</span>, and <span style="color: #cd7f32; font-weight: bold;">Bronze</span> highlights on the global leaderboard.
              </p>
            </div>
            <button class="action-btn help-close-btn" style="margin-top: 14px; width: 100%;">Back to Game</button>
          </div>

        </div>
      </div>
    `;
    initGameHelp(this);
    this._vikingCleanup = initVikingGame();
  }

  disconnectedCallback() {
    if (this._vikingCleanup) {
      this._vikingCleanup();
      this._vikingCleanup = null;
    }
  }
}
customElements.define('viking-card', VikingCard);