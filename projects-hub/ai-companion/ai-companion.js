let currentAudio = null;
let num1, num2;
let currentCaptchaToken = null;

const PLAY_SYMBOL = "▶";
const PAUSE_SYMBOL = "⏸";
const FETCH_TIMEOUT_MS = 30000;

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export async function initAiCompanionForm() {
    const captchaLabel = document.getElementById('captchaLabel');
    const refreshBtn = document.getElementById('refreshCaptchaBtn');

    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.classList.add('spin-animation');
    }

    try {
        const response = await fetch('/api/ai-companion', { method: 'GET' });
        const data = await response.json();

        if (!response.ok || typeof data.num1 !== 'number' || typeof data.num2 !== 'number' || !data.token) {
            throw new Error(data.error || 'Failed to load security check.');
        }

        num1 = data.num1;
        num2 = data.num2;
        currentCaptchaToken = data.token;

        if (captchaLabel) {
            captchaLabel.textContent = `Security Check: What is ${num1} + ${num2}?`;
        }
    } catch (err) {
        console.error('Failed to load security check:', err);
        currentCaptchaToken = null;
        if (captchaLabel) {
            captchaLabel.textContent = 'Security Check: having trouble loading — try the refresh button?';
        }
    } finally {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            setTimeout(() => refreshBtn.classList.remove('spin-animation'), 400);
        }
    }
}

export function toggleAudioPlayback() {
    if (!currentAudio) return;
    const btn = document.getElementById('audioToggleBtn');
    if (!btn) return;

    if (currentAudio.paused) {
        currentAudio.play().then(() => {
            btn.innerHTML = PAUSE_SYMBOL;
            btn.setAttribute('aria-label', 'Pause Audio');
        }).catch(e => console.log("Playback error:", e));
    } else {
        currentAudio.pause();
        btn.innerHTML = PLAY_SYMBOL;
        btn.setAttribute('aria-label', 'Play Audio');
    }
}

export function updateCharCount() {
    const textInput = document.getElementById('docText');
    const charCount = document.getElementById('charCount');

    if (textInput && charCount) {
        const currentLength = textInput.value.length;
        charCount.textContent = `${currentLength}/4000`;
        charCount.classList.toggle('near-limit', currentLength >= 3800);
    }
}

export async function analyzeStory() {
    const titleInput = document.getElementById('docTitle');
    const textInput = document.getElementById('docText');
    const outputDiv = document.getElementById('resultOutput');
    const submitBtn = document.getElementById('analyzeBtn');
    const companyField = document.getElementById('companyField');
    const captchaInput = document.getElementById('captchaAnswer');

    const title = titleInput.value.trim();
    const text = textInput.value.trim();
    const userAnswer = parseInt(captchaInput ? captchaInput.value : '', 10);

    if (!title || !text) {
        outputDiv.innerHTML = `<p class="error-text">Please fill in both fields before reflecting on the story.</p>`;
        return;
    }

    if (isNaN(userAnswer)) {
        outputDiv.innerHTML = `<p class="error-text">Please complete the security math check before submitting.</p>`;
        return;
    }

    if (!currentCaptchaToken) {
        outputDiv.innerHTML = `<p class="error-text">Security check not ready yet — please wait a moment, or use the refresh button, and try again.</p>`;
        return;
    }

    if (typeof num1 === 'number' && typeof num2 === 'number' && userAnswer !== num1 + num2) {
        outputDiv.innerHTML = `<p class="error-text">Almost — double check the math and try again.</p>`;
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
    }

    outputDiv.innerHTML = `<p class="placeholder-text">Reflecting on your story via AWS serverless backend...</p>`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const response = await fetch('/api/ai-companion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                text,
                company: companyField ? companyField.value : '',
                captchaToken: currentCaptchaToken,
                captchaAnswer: userAnswer
            }),
            signal: controller.signal
        });

        const result = await response.json();
        if (response.status === 429) {
            outputDiv.innerHTML = `<p class="error-text">${escapeHtml(result.error || "You're sending requests a bit too fast. Please wait a few minutes and try again.")}</p>`;
        } else if (response.ok) {
            const data = result.data;

            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }

            if (data.audio_base64) {
                currentAudio = new Audio(`data:audio/mp3;base64,${data.audio_base64}`);
                currentAudio.onended = () => {
                    const btn = document.getElementById('audioToggleBtn');
                    if (btn) {
                        btn.innerHTML = PLAY_SYMBOL;
                        btn.setAttribute('aria-label', 'Play Audio');
                    }
                };
            }

            const highlights = Array.isArray(data.key_highlights) && data.key_highlights.length > 0
                ? data.key_highlights
                : ['No highlights captured'];
            const highlightsList = highlights.map(h => `<li>${escapeHtml(h)}</li>`).join('');

            outputDiv.innerHTML = `
                <div class="reflection-top">
                    <h4>AI Reflection</h4>
                    ${data.audio_base64 ? `
                        <button id="audioToggleBtn" type="button" class="audio-icon-btn" onclick="toggleAudioPlayback()" aria-label="Play Audio">
                            ${PLAY_SYMBOL}
                        </button>
                    ` : ''}
                </div>
                <p class="reflection-quote">"${escapeHtml(data.emotional_reaction)}"</p>
                <div class="highlights-label">Key Highlights</div>
                <ul class="reflection-highlights">
                    ${highlightsList}
                </ul>
            `;

            if (captchaInput) captchaInput.value = '';
            await initAiCompanionForm();

        } else {
            outputDiv.innerHTML = `<p class="error-text">Error: ${escapeHtml(result.error || 'Unknown server error')}</p>`;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            outputDiv.innerHTML = `<p class="error-text">The request took too long and timed out. Please try again.</p>`;
        } else {
            outputDiv.innerHTML = `<p class="error-text">Network Error: ${escapeHtml(error.message)}</p>`;
        }
    } finally {
        clearTimeout(timeoutId);
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
}