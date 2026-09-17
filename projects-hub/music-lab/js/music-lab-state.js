/* ====================================================================
 * 🎵 MUSIC LAB CORE STATE & COMPOSITION LOGIC
 * ==================================================================== */

import { parseDurationValue, getBeatsPerMeasure, getAbcPitchNotation } from './music-lab-utils.js';
import { playAbcNotePreview, togglePlayPause as audioTogglePlayPause, stopSheetMusic, setAudioBpm, toggleMetronomeAudio } from './music-lab-audio.js';
import { PRESETS } from './music-lab-presets.js';
import { generateAbcString, renderSheetMusic as renderAbcCanvas } from './music-lab-abc.js';

export { downloadSheetMusicPDF } from './music-lab-pdfExporter.js';
export { downloadAudioFile } from './music-lab-audioExporter.js';
export { saveProjectToDynamoDB, loadProjectFromDynamoDB } from './music-lab-dynamodb.js';
export { stopSheetMusic };

let currentInstrument = 'cello';
let currentOctave = 3;
let currentAccidental = 'natural';
let currentDuration = '1';
let currentIsDotted = false;
let initialTimeSignature = '4/4';
let currentTimeSignature = '4/4';
let initialCelloClef = 'bass';
let currentCelloClef = 'bass';
let currentPianoHand = 'right';
let currentBarline = '|';
let currentBpm = 120;
let currentTranspose = 0;
let celloNotes = [];
let pianoRightNotes = [];
let pianoLeftNotes = [];

// The abcjs "visual object" produced by the most recent render. Playback
// reuses this instead of re-rendering "paper" with a different set of
// options, which used to cause a visible resize/clip when Play was pressed.
let lastVisualObj = null;

export function getLastVisualObj() {
  return lastVisualObj;
}

// Redo stacks, one per note array, mirroring the celloNotes/pianoRightNotes/
// pianoLeftNotes split above. Any new edit to an array clears that array's
// redo stack (standard undo/redo behavior).
let celloRedo = [];
let pianoRightRedo = [];
let pianoLeftRedo = [];

export function getActiveNotesArray() {
  return currentInstrument === 'cello' ? celloNotes : (currentPianoHand === 'right' ? pianoRightNotes : pianoLeftNotes);
}

function getActiveRedoArray() {
  return currentInstrument === 'cello' ? celloRedo : (currentPianoHand === 'right' ? pianoRightRedo : pianoLeftRedo);
}

function clearActiveRedoArray() {
  const redo = getActiveRedoArray();
  redo.length = 0;
}

export function getActiveTimeSignature() {
  const activeNotes = getActiveNotesArray();
  for (let i = activeNotes.length - 1; i >= 0; i--) {
    if (activeNotes[i].type === 'timesig') return activeNotes[i].value;
  }
  return initialTimeSignature;
}

export function getActiveCelloClef() {
  if (currentInstrument !== 'cello') return 'bass';
  for (let i = celloNotes.length - 1; i >= 0; i--) {
    if (celloNotes[i].type === 'clef') return celloNotes[i].value;
  }
  return initialCelloClef;
}

export function getRemainingBeatsInMeasure() {
  const activeNotes = getActiveNotesArray();
  let activeTS = initialTimeSignature;
  let currentBeats = 0;

  for (let item of activeNotes) {
    if (item.type === 'timesig') {
      activeTS = item.value;
      currentBeats = 0;
    } else if (item.type === 'barline' || item.type === 'clef') {
      currentBeats = 0;
    } else if (item.type === 'note') {
      const maxBeats = getBeatsPerMeasure(activeTS);
      if (maxBeats <= 0) return Infinity;
      currentBeats += item.durVal;
      if (Math.abs(currentBeats - maxBeats) < 0.001) {
        currentBeats = 0;
      } else if (currentBeats > maxBeats) {
        currentBeats = currentBeats % maxBeats;
      }
    }
  }

  if (activeTS === 'free') return Infinity;
  const maxBeats = getBeatsPerMeasure(activeTS);
  if (maxBeats <= 0) return Infinity;

  currentBeats = Math.round(currentBeats * 1000) / 1000;
  const remaining = Math.round((maxBeats - currentBeats) * 1000) / 1000;
  return remaining === 0 ? maxBeats : remaining;
}

function getDottedAbcDuration(durStr) {
  if (durStr === '1') return '3/2';
  if (durStr === '2') return '3';
  if (durStr === '1/2') return '3/4';
  if (durStr === '1/4') return '3/8';
  if (durStr === '1/8') return '3/16';
  return durStr;
}

export function updateDurationButtonsUI() {
  const activeTS = getActiveTimeSignature();
  const remaining = getRemainingBeatsInMeasure();

  document.querySelectorAll('.dur-btn').forEach(btn => {
    const baseDurVal = parseDurationValue(btn.dataset.dur, activeTS);
    const durVal = currentIsDotted && btn.dataset.dur !== '4' ? baseDurVal * 1.5 : baseDurVal;
    const isValid = (activeTS === 'free') || (durVal <= remaining + 0.001);
    btn.disabled = !isValid;
    btn.style.opacity = isValid ? '1' : '0.35';
    btn.style.cursor = isValid ? 'pointer' : 'not-allowed';
  });
}

export function updateOctaveButtonsUI() {
  const minOct = currentInstrument === 'cello' ? 2 : 1;
  const maxOct = currentInstrument === 'cello' ? 5 : 7;
  if (currentOctave < minOct) currentOctave = minOct;
  if (currentOctave > maxOct) currentOctave = maxOct;

  document.querySelectorAll('.oct-btn').forEach(btn => {
    const oct = parseInt(btn.dataset.oct, 10);
    btn.style.display = (oct >= minOct && oct <= maxOct) ? 'inline-block' : 'none';
    btn.classList.toggle('active', oct === currentOctave);
  });
}

export function renderSheetMusic() {
  const projectName = document.getElementById('projectNameInput')?.value || 'My Composition';
  const composerName = document.getElementById('composerNameInput')?.value || 'Anonymous';
  
  const abcString = generateAbcString({
    projectName,
    composerName,
    initialTimeSignature,
    currentBpm,
    currentInstrument,
    currentCelloClef,
    celloNotes,
    pianoRightNotes,
    pianoLeftNotes
  });

  const abcInput = document.getElementById('abcInput');
  if (abcInput && document.activeElement !== abcInput) {
    abcInput.value = abcString;
  }

  updateDurationButtonsUI();
  updateRedoButtonUI();
  lastVisualObj = renderAbcCanvas(abcString, currentTranspose);
}

function updateRedoButtonUI() {
  const redoBtn = document.getElementById('redoBtn');
  if (redoBtn) redoBtn.disabled = getActiveRedoArray().length === 0;
}

export function addManualLineBreak() {
  const targetArrays = currentInstrument === 'piano' ? [pianoRightNotes, pianoLeftNotes] : [getActiveNotesArray()];

  targetArrays.forEach(notesArr => {
    notesArr.push({
      type: 'linebreak',
      raw: '\n'
    });
  });

  if (currentInstrument === 'piano') {
    pianoRightRedo.length = 0;
    pianoLeftRedo.length = 0;
  } else {
    clearActiveRedoArray();
  }
  renderSheetMusic();
}

export function getCurrentClef() {
  return currentInstrument === 'cello' ? getActiveCelloClef() : (currentPianoHand === 'right' ? 'treble' : 'bass');
}

export function setInstrumentMode(mode) {
  currentInstrument = mode;
  document.getElementById('modeCello')?.classList.toggle('active', mode === 'cello');
  document.getElementById('modePiano')?.classList.toggle('active', mode === 'piano');
  
  const celloSection = document.getElementById('celloClefSection');
  const pianoSection = document.getElementById('pianoClefSection');
  if (celloSection) celloSection.style.display = mode === 'cello' ? 'block' : 'none';
  if (pianoSection) pianoSection.style.display = mode === 'piano' ? 'block' : 'none';
  
  updateOctaveButtonsUI();
  renderSheetMusic();
}

export function setCelloClef(clef) {
  currentCelloClef = clef;
  if (currentInstrument !== 'cello') return;

  let lastBarIndex = -1;
  for (let i = celloNotes.length - 1; i >= 0; i--) {
    if (celloNotes[i].type === 'barline') {
      lastBarIndex = i;
      break;
    }
  }

  let existingClefIndex = -1;
  const searchStartIndex = lastBarIndex !== -1 ? lastBarIndex + 1 : 0;
  for (let i = searchStartIndex; i < celloNotes.length; i++) {
    if (celloNotes[i].type === 'clef') {
      existingClefIndex = i;
      break;
    }
    if (celloNotes[i].type === 'note') {
      break;
    }
  }

  if (existingClefIndex !== -1) {
    celloNotes[existingClefIndex].value = clef;
  } else {
    const insertPos = lastBarIndex !== -1 ? lastBarIndex + 1 : 0;
    celloNotes.splice(insertPos, 0, { type: 'clef', value: clef });
  }

  document.querySelectorAll('#celloClefSection .mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-clef') === clef);
  });

  clearActiveRedoArray();
  renderSheetMusic();
}

export function setPianoHand(hand) {
  currentPianoHand = hand;
  document.querySelectorAll('#pianoClefSection .mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-hand') === hand);
  });
  renderSheetMusic();
}

export function setOctave(oct) {
  const minOct = currentInstrument === 'cello' ? 2 : 1;
  const maxOct = currentInstrument === 'cello' ? 5 : 7;
  if (oct >= minOct && oct <= maxOct) {
    currentOctave = oct;
    updateOctaveButtonsUI();
  }
}

export function setAccidental(acc) {
  currentAccidental = acc;
  document.querySelectorAll('.acc-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.acc === acc);
  });
}

export function setDuration(dur) {
  currentDuration = dur;
  const dotBtn = document.getElementById('dotToggleBtn');
  
  if (dur === '4') {
    currentIsDotted = false;
    if (dotBtn) {
      dotBtn.classList.remove('active');
      dotBtn.disabled = true;
      dotBtn.style.opacity = '0.35';
      dotBtn.style.cursor = 'not-allowed';
    }
  } else {
    if (dotBtn) {
      dotBtn.disabled = false;
      dotBtn.style.opacity = '1';
      dotBtn.style.cursor = 'pointer';
    }
  }

  document.querySelectorAll('.dur-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.dur === dur);
  });
  updateDurationButtonsUI();
}

export function setTimeSignature(ts) {
  currentTimeSignature = ts;
  const targetArrays = currentInstrument === 'piano' ? [pianoRightNotes, pianoLeftNotes] : [getActiveNotesArray()];

  const tsSelect = document.getElementById('timeSignatureSelect');
  if (tsSelect && tsSelect.value !== ts) {
    tsSelect.value = ts;
  }

  targetArrays.forEach(activeNotes => {
    let lastBarIndex = -1;
    for (let i = activeNotes.length - 1; i >= 0; i--) {
      if (activeNotes[i].type === 'barline') {
        lastBarIndex = i;
        break;
      }
    }

    let existingTsIndex = -1;
    const searchStartIndex = lastBarIndex !== -1 ? lastBarIndex + 1 : 0;
    for (let i = searchStartIndex; i < activeNotes.length; i++) {
      if (activeNotes[i].type === 'timesig') {
        existingTsIndex = i;
        break;
      }
      if (activeNotes[i].type === 'note') {
        break;
      }
    }

    if (existingTsIndex !== -1) {
      activeNotes[existingTsIndex].value = ts;
    } else {
      const insertPos = lastBarIndex !== -1 ? lastBarIndex + 1 : 0;
      activeNotes.splice(insertPos, 0, { type: 'timesig', value: ts });
    }
  });

  if (currentInstrument === 'piano') {
    pianoRightRedo.length = 0;
    pianoLeftRedo.length = 0;
  } else {
    clearActiveRedoArray();
  }

  renderSheetMusic();
}

export function setBarline(type) {
  currentBarline = type;
  
  const barSelect = document.getElementById('barlineSelect');
  if (barSelect && barSelect.value !== type) {
    barSelect.value = type;
  }

  const targetArrays = currentInstrument === 'piano' ? [pianoRightNotes, pianoLeftNotes] : [getActiveNotesArray()];

  targetArrays.forEach(activeNotes => {
    let updated = false;
    for (let i = activeNotes.length - 1; i >= 0; i--) {
      if (activeNotes[i].type === 'barline') {
        activeNotes[i].raw = type;
        updated = true;
        break;
      }
    }

    if (!updated) {
      activeNotes.push({
        type: 'barline',
        raw: type
      });
    }
  });

  if (currentInstrument === 'piano') {
    pianoRightRedo.length = 0;
    pianoLeftRedo.length = 0;
  } else {
    clearActiveRedoArray();
  }
  renderSheetMusic();
}

export function addBarline() {
  const selectedBarline = document.getElementById('barlineSelect')?.value || currentBarline;
  const activeTS = getActiveTimeSignature();
  const maxBeats = getBeatsPerMeasure(activeTS);
  const remaining = getRemainingBeatsInMeasure();

  if (activeTS !== 'free' && maxBeats > 0 && Math.abs(remaining - maxBeats) > 0.001) {
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
      statusMsg.textContent = `⚠️ Cannot add a barline before completing the measure (${remaining} unit(s) remaining).`;
      statusMsg.style.color = "#e07a5f";
    }
    return;
  }

  const targetArrays = currentInstrument === 'piano' ? [pianoRightNotes, pianoLeftNotes] : [getActiveNotesArray()];

  targetArrays.forEach(notesArr => {
    notesArr.push({
      type: 'barline',
      raw: selectedBarline
    });
  });

  if (currentInstrument === 'piano') {
    pianoRightRedo.length = 0;
    pianoLeftRedo.length = 0;
  } else {
    clearActiveRedoArray();
  }

  renderSheetMusic();
}

export function playAndAddNote(baseNote) {
  const activeNotes = getActiveNotesArray();
  const activeTS = getActiveTimeSignature();
  const baseDurVal = parseDurationValue(currentDuration, activeTS);
  const noteDurVal = currentIsDotted && currentDuration !== '4' ? baseDurVal * 1.5 : baseDurVal;
  const maxBeats = getBeatsPerMeasure(activeTS);
  const remaining = getRemainingBeatsInMeasure();

  if (activeTS !== 'free' && noteDurVal > remaining + 0.001) {
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
      statusMsg.textContent = `⚠️ Duration exceeds remaining measure capacity (${remaining} unit(s) left).`;
      statusMsg.style.color = "#e07a5f";
    }
    return;
  }

  let accSym = currentAccidental === 'sharp' ? '#' : (currentAccidental === 'flat' ? 'b' : '');
  const noteLabel = `${baseNote}${accSym}${currentOctave}`;
  const abcPitch = getAbcPitchNotation(baseNote, currentOctave, currentAccidental);

  playAbcNotePreview(abcPitch, currentInstrument, renderSheetMusic);

  let abcDur = '';
  if (activeTS === '6/8') {
    if (currentIsDotted) {
      if (currentDuration === '1/8') abcDur = '3/16';
      else if (currentDuration === '1/4') abcDur = '3/8';
      else if (currentDuration === '1/2') abcDur = '3/4';
      else if (currentDuration === '1') abcDur = '3/2';
      else if (currentDuration === '2') abcDur = '3';
      else abcDur = getDottedAbcDuration(currentDuration);
    } else {
      if (currentDuration === '1/8') abcDur = '1/8';
      else if (currentDuration === '1/4') abcDur = '1/4';
      else if (currentDuration === '1/2') abcDur = '1/2';
      else if (currentDuration === '1') abcDur = '';
      else if (currentDuration === '2') abcDur = '2';
      else if (currentDuration === '4') abcDur = '4';
      else abcDur = currentDuration;
    }
  } else {
    abcDur = currentIsDotted ? getDottedAbcDuration(currentDuration) : (currentDuration === '1' ? '' : currentDuration);
  }
  
  activeNotes.push({
    type: 'note',
    raw: `"${noteLabel}"${abcPitch}${abcDur}`,
    durVal: noteDurVal
  });

  if (activeTS !== 'free' && maxBeats > 0) {
    const newRemaining = getRemainingBeatsInMeasure();
    if (Math.abs(newRemaining - maxBeats) < 0.001) {
      activeNotes.push({
        type: 'barline',
        raw: '|'
      });
    }
  }

  clearActiveRedoArray();
  renderSheetMusic();
}

export function addRest() {
  const activeNotes = getActiveNotesArray();
  const activeTS = getActiveTimeSignature();
  const baseDurVal = parseDurationValue(currentDuration, activeTS);
  const restDurVal = currentIsDotted && currentDuration !== '4' ? baseDurVal * 1.5 : baseDurVal;
  const remaining = getRemainingBeatsInMeasure();

  if (activeTS !== 'free' && restDurVal > remaining + 0.001) {
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
      statusMsg.textContent = `⚠️ Rest duration exceeds remaining measure capacity.`;
      statusMsg.style.color = "#e07a5f";
    }
    return;
  }

  let abcDur = currentIsDotted ? getDottedAbcDuration(currentDuration) : (currentDuration === '1' ? '' : currentDuration);

  activeNotes.push({
    type: 'note',
    raw: `z${abcDur}`,
    durVal: restDurVal
  });

  clearActiveRedoArray();
  renderSheetMusic();
}

export function undoLastNote() {
  const activeNotes = getActiveNotesArray();
  if (activeNotes.length === 0) return;
  const removed = activeNotes.pop();
  getActiveRedoArray().push(removed);
  renderSheetMusic();
}

export function redoLastNote() {
  const redo = getActiveRedoArray();
  if (redo.length === 0) return;
  const restored = redo.pop();
  getActiveNotesArray().push(restored);
  renderSheetMusic();
}

export function clearComposition() {
  celloNotes = [];
  pianoRightNotes = [];
  pianoLeftNotes = [];
  celloRedo = [];
  pianoRightRedo = [];
  pianoLeftRedo = [];
  initialTimeSignature = currentTimeSignature;
  initialCelloClef = currentCelloClef;
  renderSheetMusic();
}

export function updateBPM(newBpm) {
  const bpm = parseInt(newBpm, 10);
  if (isNaN(bpm) || bpm < 40 || bpm > 240) return;
  currentBpm = bpm;
  setAudioBpm(currentBpm);
  renderSheetMusic();
}

export function adjustBPM(amount) {
  const input = document.getElementById('bpmInput');
  if (!input) return;
  let currentVal = parseInt(input.value, 10) || 120;
  let newVal = Math.min(240, Math.max(40, currentVal + amount));
  input.value = newVal;
  updateBPM(newVal);
}

export function toggleMetronome() {
  toggleMetronomeAudio();
}

export function adjustTranspose(delta) {
  currentTranspose = Math.max(-6, Math.min(6, currentTranspose + delta));
  const display = document.getElementById('transposeDisplay');
  if (display) {
    let symbol = currentTranspose > 0 ? '♯' : (currentTranspose < 0 ? '♭' : '♮');
    display.innerHTML = `<span class="acc-icon">${symbol}</span> ${currentTranspose === 0 ? '0 (Original)' : currentTranspose + ' Semitones'}`;
  }
  renderSheetMusic();
}

export function getCurrentTranspose() {
  return currentTranspose;
}

export function onTextareaChange() {
  const abcInput = document.getElementById('abcInput');
  if (!abcInput) return;
  
  const customAbcText = abcInput.value;
  lastVisualObj = renderAbcCanvas(customAbcText, currentTranspose);
  
  const statusMsg = document.getElementById('statusMsg');
  if (statusMsg) {
    statusMsg.textContent = "Raw ABC notation edited live.";
    statusMsg.style.color = "#5C5F3F";
  }
}

export function loadPreset() {
  const presetKey = document.getElementById('abcPreset')?.value || 'bach';
  const abcInput = document.getElementById('abcInput');
  
  if (PRESETS[presetKey] && abcInput) {
    const presetText = PRESETS[presetKey];
    abcInput.value = presetText;
    
    celloNotes = [];
    pianoRightNotes = [];
    pianoLeftNotes = [];
    celloRedo = [];
    pianoRightRedo = [];
    pianoLeftRedo = [];
    
    lastVisualObj = renderAbcCanvas(presetText, currentTranspose);
    updateRedoButtonUI();
    
    const statusMsg = document.getElementById('statusMsg');
    if (statusMsg) {
      statusMsg.textContent = "Preset loaded successfully.";
      statusMsg.style.color = "#5C5F3F";
    }
  }
}

export function togglePlayPause() {
  audioTogglePlayPause(currentInstrument);
}

export function toggleDotModifier() {
  if (currentDuration === '4') return;
  currentIsDotted = !currentIsDotted;
  const btn = document.getElementById('dotToggleBtn');
  if (btn) btn.classList.toggle('active', currentIsDotted);
  updateDurationButtonsUI();
}