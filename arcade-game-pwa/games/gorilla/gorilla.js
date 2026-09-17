// ==========================================
// Gorilla Banana Fight — Entry Point
// Owns the DOM: builds the canvas wrapper/HUD, wires up buttons and
// audio, and runs the render loop. All game rules live in
// gorilla-engine.js; all drawing lives in gorilla-render.js.
// ==========================================

import { GorillaGame, SCREEN_WIDTH, SCREEN_HEIGHT } from './gorilla-engine.js';
import { renderGame } from './gorilla-render.js';

export function initGorillaGame(root) {
    const canvas = root.querySelector('#gorillaCanvas');
    if (!canvas) return () => {};
    const ctx = canvas.getContext('2d');


    const GAME_WIDTH = SCREEN_WIDTH;
    const GAME_HEIGHT = 230;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    let canvasParent = canvas.parentElement;
    let wrapper = root.querySelector('#gorillaCanvasWrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'gorillaCanvasWrapper';
        canvasParent.insertBefore(wrapper, canvas);
        wrapper.appendChild(canvas);
    }

    let overlay = root.querySelector('#gorillaOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'gorillaOverlay';
        wrapper.appendChild(overlay);
    }

    function setGorillaOverlay(show, text = '') {
        if (!overlay) return;
        if (show) {
            overlay.style.display = 'flex';
            let blinkClass = (text.toLowerCase().includes('start') || text.toLowerCase().includes('play')) ? 'gorilla-blink-text' : '';
            overlay.innerHTML = `<span class="gorilla-neon-red ${blinkClass}">${text}</span>`;
        } else {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
    }

    let marqueeContainer = root.querySelector('#gorillaLedMarquee');
    if (!marqueeContainer) {
        marqueeContainer = document.createElement('div');
        marqueeContainer.id = 'gorillaLedMarquee';
        marqueeContainer.className = 'arcade-marquee-screen';
        marqueeContainer.innerHTML = `<span class="arcade-marquee-text" id="gorillaMarqueeText"></span>`;
        wrapper.parentNode.insertBefore(marqueeContainer, wrapper);
    }

    let currentMarqueeText = '';

	function clearMarqueeNow() {
		const textEl = root.querySelector('#gorillaMarqueeText');
		if (marqueeContainer) marqueeContainer.classList.remove('moving-state');
		if (textEl) textEl.textContent = '';
		currentMarqueeText = '';
	}

	function updateMarqueeText(text) {
		const textEl = root.querySelector('#gorillaMarqueeText');
		if (!textEl) return;

		const cleanText = text.replace(/<[^>]*>/g, ' ').trim();

		if (!cleanText) return;

		if (cleanText === currentMarqueeText) return;
		currentMarqueeText = cleanText;

		textEl.textContent = cleanText;
		marqueeContainer.classList.remove('moving-state');

		void textEl.offsetWidth;

		const duration = Math.max(3.5, cleanText.length * 0.18);
		textEl.style.setProperty('--marquee-duration', `${duration}s`);

		marqueeContainer.classList.add('moving-state');
	}

	let hudContainer = wrapper.querySelector('#gorillaHud');
	if (!hudContainer) {
		hudContainer = document.createElement('div');
		hudContainer.id = 'gorillaHud';
		hudContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 38px; padding: 4px 8px; display: flex; justify-content: space-between; align-items: flex-start; font-family: monospace; font-size: 11px; font-weight: bold; color: #e5e7eb; box-sizing: border-box; z-index: 5; pointer-events: none;';
		hudContainer.innerHTML = `
			<div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
				<div style="color: var(--color-accent, #d1db9e);"><span id="playerLivesDisplay">🍌 🍌 🍌</span></div>
				<div id="windDisplay" style="color: #38bdf8;">WIND: Calm</div>
				<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 2px;">
					<div style="color: var(--color-accent, #d1db9e);"><span id="aiLivesDisplay">🍌 🍌 🍌</span></div>
					<div id="gorillaOfflineBadge" class="gorilla-offline-icon-badge" title="Offline Local AI Mode">
						📡<span class="offline-strike"></span>
					</div>
				</div>
			</div>
		`;
		wrapper.appendChild(hudContainer);
	}

    function setOfflineNotice(show) {
    const badge = root.querySelector('#gorillaOfflineBadge');
    if (badge) badge.classList.toggle('is-visible', show);

    if (marqueeContainer) {
        marqueeContainer.classList.toggle('is-offline', show);
    }
}

    const startSound = new Audio(new URL('./gorillasound.m4a', import.meta.url));
    startSound.loop = false;
    let isMuted = false;

    function playStartSound() {
        if (isMuted) return;
        startSound.pause();
        startSound.currentTime = 0;
        startSound.play().catch(e => {
            console.log("Audio playback prevented by browser policy:", e);
        });
    }

    function setFireButtonState(disabled, text = null) {
        if (!fireBtn) return;
        fireBtn.disabled = disabled;
        fireBtn.style.opacity = disabled ? '0.4' : '1';
        fireBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        if (text) {
            fireBtn.textContent = text;
        }
    }

    function setPlanetButtonState(disabled) {
        if (!planetBtn) return;
        planetBtn.disabled = disabled;
        planetBtn.style.opacity = disabled ? '0.4' : '1';
        planetBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }

    function setDifficultyButtonState(disabled) {
        if (!difficultyBtn) return;
        difficultyBtn.disabled = disabled;
        difficultyBtn.style.opacity = disabled ? '0.4' : '1';
        difficultyBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }

    function updateLives(playerLives, aiLives) {
        const pDisplay = root.querySelector('#playerLivesDisplay');
        const aiDisplay = root.querySelector('#aiLivesDisplay');
        if (pDisplay) pDisplay.textContent = '🍌 '.repeat(Math.max(0, playerLives)).trim() || '❌';
        if (aiDisplay) aiDisplay.textContent = '🍌 '.repeat(Math.max(0, aiLives)).trim() || '❌';
    }

    function updateWind(wind) {
        const windEl = root.querySelector('#windDisplay');
        if (windEl) {
            if (wind === 0) {
                windEl.textContent = "WIND: Calm";
            } else {
                const dir = wind > 0 ? "➔ Right" : "⬅ Left";
                windEl.textContent = `WIND: ${Math.abs(wind)} ${dir}`;
            }
        }
    }

    function updateScore(score) {
        const scoreEl = root.querySelector('#gorillaScore');
        if (scoreEl) scoreEl.textContent = score;
    }

    const game = new GorillaGame({
        setFireButtonState,
        setGorillaOverlay,
        updateLives,
        updateWind,
        updateScore,
        setOfflineNotice,
    });

    const angleInput = root.querySelector('#angleInput');
    const powerInput = root.querySelector('#powerInput');
    const fireBtn = root.querySelector('#gorillaFireBtn');
    const restartBtn = root.querySelector('#gorillaMainActionBtn');
    const soundBtn = root.querySelector('#gorillaSoundBtn');
    const planetBtn = root.querySelector('#gorillaPlanetBtn');
    const difficultyBtn = root.querySelector('#gorillaDifficultyBtn');
    const statusDiv = root.querySelector('#gorillaStatus');

    setGorillaOverlay(true, 'PRESS START TO PLAY!');

    if (planetBtn) {
        planetBtn.textContent = `Earth (g: 9.8)`;
        planetBtn.addEventListener('click', () => {
            if (game.isPlaying) return;
            const planet = game.cyclePlanet();
            planetBtn.textContent = `${planet.name} (g: ${planet.gravity})`;
        });
    }

    soundBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        soundBtn.innerHTML = isMuted
            ? `<svg class="gorilla-speaker-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`
            : `<svg class="gorilla-speaker-icon" viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

        if (isMuted) {
            startSound.pause();
        }
    });

    fireBtn.addEventListener('click', () => {
        if (!game.isPlaying) {
            game.isPlaying = true;
            game.resetGame();
            playStartSound();
            setFireButtonState(false, "Throw 🍌");
            game.message = "";
            setGorillaOverlay(false);
            setPlanetButtonState(true);
            setDifficultyButtonState(true);
            setOfflineNotice(false);
            clearMarqueeNow();
        } else {
            if (game.turn === 1 && !game.banana) {
                game.launchBanana(parseInt(angleInput.value, 10) || 45, parseInt(powerInput.value, 10) || 50);
                game.message = "";
                setFireButtonState(true, "AI's Turn...");
            }
        }
    });

    restartBtn.addEventListener('click', () => {
        game.isPlaying = false;
        setFireButtonState(false, "Start");
        setPlanetButtonState(false);
        setDifficultyButtonState(false);
        game.message = "";
        setGorillaOverlay(true, 'PRESS START TO PLAY!');
        setOfflineNotice(false);
        clearMarqueeNow();
        if (statusDiv) statusDiv.textContent = game.message;
        updateMarqueeText(game.message);
    });

    if (difficultyBtn) {
        difficultyBtn.textContent = `${game.difficulty}`;
        difficultyBtn.addEventListener('click', () => {
            if (game.isPlaying) return;
            const newDiff = game.cycleDifficulty();
            difficultyBtn.textContent = `${newDiff}`;
        });
    }

    let rafId = null;
    let destroyed = false;

    function loop() {
        if (destroyed) return;

        const windEl = root.querySelector('#windDisplay');
        if (windEl) {
            windEl.style.display = game.isPlaying ? 'block' : 'none';
        }

        if (game.isPlaying) {
            if (game.banana && game.banana !== "scored") {
                game.updateBanana();
            }
            if (statusDiv) statusDiv.textContent = game.message;
            updateMarqueeText(game.message);

            if (!game.isPlaying) {
                setPlanetButtonState(false);
                setDifficultyButtonState(false);
                setFireButtonState(false, "Start");
                setGorillaOverlay(true, game.message || 'PRESS START TO PLAY!');
            }
        } else {
            if (statusDiv) statusDiv.textContent = game.message;
            updateMarqueeText(game.message);
        }
        renderGame(ctx, game);
        rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return function destroy() {
        destroyed = true;
        if (rafId) cancelAnimationFrame(rafId);
        game.isPlaying = false;
        startSound.pause();
    };
}