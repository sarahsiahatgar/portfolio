// ====================================================================
// AUDIO ENGINE & VISUALIZER MODULE (js/music-lab-audio.js)
// ====================================================================
import { parseBpmFromAbc } from './music-lab-utils.js';
import { getCurrentClef, getLastVisualObj } from './music-lab-state.js';

let audioCtx = null;
let analyser = null;
let synthInstance = null;
let isMetronomeOn = false;
let metronomeBpm = 120;
let metronomeTimer = null;
let currentBeat = 0;
let visualizerAnimationId = null;
let timingCallbacks = null;

export function initAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    const originalConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(destination, output, input) {
      if (destination === audioCtx.destination && this !== analyser) {
        return originalConnect.call(this, analyser, output, input);
      }
      return originalConnect.call(this, destination, output, input);
    };

    analyser.connect(audioCtx.destination);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  startVisualizerLoop();
}

export function startVisualizerLoop() {
  if (visualizerAnimationId) return;

  function draw() {
    visualizerAnimationId = requestAnimationFrame(draw);

    const canvas = document.getElementById('visualizerCanvas');
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = '#e3d9bc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 2.2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;

      ctx.fillStyle = `rgb(${dataArray[i] + 100}, 190, 138)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  draw();
}

export function playMetronomeClick() {
  initAudioContext();
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.value = (currentBeat === 0) ? 1000 : 800;

  gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(analyser);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);

  currentBeat = (currentBeat + 1) % 4;
}

export function setAudioBpm(bpm) {
  metronomeBpm = parseInt(bpm, 10) || 120;
  if (isMetronomeOn) {
    stopMetronomeTimer();
    startMetronomeTimer();
  }
}

function startMetronomeTimer() {
  currentBeat = 0;
  playMetronomeClick();
  const intervalMs = (60 / metronomeBpm) * 1000;
  metronomeTimer = setInterval(playMetronomeClick, intervalMs);
}

function stopMetronomeTimer() {
  if (metronomeTimer) {
    clearInterval(metronomeTimer);
    metronomeTimer = null;
  }
}

export function toggleMetronomeAudio() {
  isMetronomeOn = !isMetronomeOn;
  const btn = document.getElementById('metronomeBtn');

  if (isMetronomeOn) {
    startMetronomeTimer();
    if (btn) {
      btn.classList.add('active');
      btn.innerHTML = '<span class="metro-icon"><svg class="ml-svg-icon"><use href="svg/music-lab-icons.svg#icon-metronom"></use></svg></span> On';
    }
  } else {
    stopMetronomeTimer();
    if (btn) {
      btn.classList.remove('active');
      btn.innerHTML = '<span class="metro-icon"><svg class="ml-svg-icon"><use href="svg/music-lab-icons.svg#icon-metronom"></use></svg></span> Off';
    }
  }

  return isMetronomeOn;
}

export async function playAbcNotePreview(abcPitch, currentInstrument, renderCallback) {
  initAudioContext();
  if (!window.ABCJS) return;

  const clef = getCurrentClef();
  const program = currentInstrument === 'cello' ? 42 : 0;
  const singleNoteAbc = `X:1\nK:C clef=${clef}\nM:4/4\nL:1/4\n${abcPitch}`;
  
  try {
    const tempVisualObj = ABCJS.renderAbc("paper", singleNoteAbc)[0];
    const previewSynth = new ABCJS.synth.CreateSynth();

    await previewSynth.init({
      visualObj: tempVisualObj,
      audioContext: audioCtx,
      options: { program: program, pan: 0 }
    });

    await previewSynth.prime();
    previewSynth.start();

    if (typeof renderCallback === 'function') renderCallback();
  } catch (err) {
    console.error("Preview playback error:", err);
  }
}

let isPlayingState = false;
let isPausedState = false;

function clearCursorHighlight() {
  document.querySelectorAll('#paper svg .abcjs-highlight').forEach(el => {
    el.classList.remove('abcjs-highlight');
  });
}

function handleCursorEvent(ev) {
  clearCursorHighlight();
  if (!ev || !ev.elements) return;
  ev.elements.forEach(group => {
    group.forEach(el => el.classList.add('abcjs-highlight'));
  });
}

export async function togglePlayPause(currentInstrument) {
  const abcText = document.getElementById('abcInput').value;
  const playBtn = document.getElementById('playPauseBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (isPlayingState && !isPausedState && synthInstance) {
    synthInstance.pause();
    if (timingCallbacks) timingCallbacks.pause();
    isPausedState = true;
    if (playBtn) playBtn.textContent = "▶ Resume";
    return;
  }

  if (isPlayingState && isPausedState && synthInstance) {
    synthInstance.resume();
    // start() with no position argument resumes from where pause() left
    // off - it does not restart from the beginning.
    if (timingCallbacks) timingCallbacks.start();
    isPausedState = false;
    if (playBtn) playBtn.textContent = "⏸ Pause";
    return;
  }

  initAudioContext();

  const program = currentInstrument === 'cello' ? 42 : 0;

  // Reuse the visual object from the last render instead of re-rendering
  // "paper" here with a different, more minimal set of options - that
  // mismatch (missing staffwidth/responsive/padding) was what made the
  // sheet music appear to "zoom in" and clip the lower staff on Play.
  const visualObj = getLastVisualObj();
  if (!visualObj) {
    console.error("No rendered sheet music available to play.");
    return;
  }

  const qpm = parseBpmFromAbc(abcText);

  clearCursorHighlight();
  timingCallbacks = new ABCJS.TimingCallbacks(visualObj, {
    qpm: qpm,
    beatSubdivisions: 2,
    eventCallback: handleCursorEvent
  });

  try {
    synthInstance = new ABCJS.synth.CreateSynth();
    
    await synthInstance.init({
      visualObj: visualObj,
      audioContext: audioCtx,
      options: { 
        program: program, 
        pan: 0, 
        qpm: qpm, 
        chordsOff: true,
        onEnded: () => {
          // Guard: abcjs's internal pause mechanism can spuriously fire
          // onEnded (Web Audio buffer sources can't truly pause, so it's
          // simulated by stopping/rescheduling). If we're intentionally
          // paused, ignore this - otherwise the next click would restart
          // from the beginning instead of resuming.
          if (isPausedState) return;
          isPlayingState = false;
          isPausedState = false;
          if (playBtn) playBtn.textContent = "▶ Play";
          if (stopBtn) stopBtn.disabled = true;
          if (timingCallbacks) timingCallbacks.stop();
          clearCursorHighlight();
        }
      }
    });

    await synthInstance.prime();
    synthInstance.start();
    timingCallbacks.start();
    
    isPlayingState = true;
    isPausedState = false;
    if (playBtn) playBtn.textContent = "⏸ Pause";
    if (stopBtn) stopBtn.disabled = false;

  } catch (err) {
    console.error("Error playing score:", err);
    isPlayingState = false;
    isPausedState = false;
  }
}

export function stopSheetMusic() {
  if (synthInstance) {
    try {
      synthInstance.stop();
    } catch (e) {
      console.warn("Synth stop error:", e);
    }
  }

  if (timingCallbacks) {
    timingCallbacks.stop();
    timingCallbacks = null;
  }
  clearCursorHighlight();

  isPlayingState = false;
  isPausedState = false;

  const playBtn = document.getElementById('playPauseBtn');
  const stopBtn = document.getElementById('stopBtn');

  if (playBtn) playBtn.textContent = "▶ Play";
  if (stopBtn) stopBtn.disabled = true;
}