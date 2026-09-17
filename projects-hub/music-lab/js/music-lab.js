/* ====================================================================
 * 🗺️ ARCHITECTURE MAP
 * ====================================================================
 * To modify or extend features, edit the corresponding module below:
 *
 * 📍 music-lab-state.js    		    - Score state, note array, & UI state bridge
 * 📍 music-lab-audio.js  				- Web Audio API, Canvas visualizer loop, Synth playback
 * 📍 music-lab-presets.js				- Classical sample ABC score strings
 * 📍 music-lab-utils.js				- Pitch notation parsing, beat/measure calculations
 * 📍 music-lab-dynamodb.js 			- AWS API Gateway / DynamoDB persistence hooks
 * 📍 music-lab-pdfExporter.js			- High-res vector SVG to PDF export generator
 * 📍 music-lab-audioExporter.js		- Offline Web Audio API background render & WAV export
 * 📍 music-lab-abc.js					- ABC notation string generation & visual sheet music rendering
 * ==================================================================== */

/* ====================================================================
 * 🎹 MUSIC LAB PAGE CONTROLLER (FRONTEND UI & EVENT WIRING)
 * ==================================================================== */

import {  
  setInstrumentMode, 
  setCelloClef,
  setPianoHand,
  setOctave, 
  setAccidental, 
  setDuration,
  setTimeSignature,
  setBarline,
  addManualLineBreak,
  playAndAddNote, 
  addRest, 
  addBarline, 
  undoLastNote, 
  redoLastNote,
  clearComposition,
  renderSheetMusic, 
  downloadSheetMusicPDF,
  downloadAudioFile,
  loadPreset, 
  togglePlayPause, 
  stopSheetMusic,
  onTextareaChange,
  saveProjectToDynamoDB,
  loadProjectFromDynamoDB,
  updateBPM, 
  adjustBPM,
  toggleMetronome,
  adjustTranspose,
  toggleDotModifier
} from './music-lab-state.js';

window.setInstrumentMode = setInstrumentMode;
window.setCelloClef = setCelloClef;
window.setPianoHand = setPianoHand;
window.setOctave = setOctave;
window.setAccidental = setAccidental;
window.setDuration = setDuration;
window.setTimeSignature = setTimeSignature;
window.setBarline = setBarline;
window.addManualLineBreak = addManualLineBreak;
window.playAndAddNote = playAndAddNote;
window.addRest = addRest;
window.addBarline = addBarline;
window.undoLastNote = undoLastNote;
window.redoLastNote = redoLastNote;
window.clearComposition = clearComposition;
window.renderSheetMusic = renderSheetMusic;
window.downloadSheetMusicPDF = downloadSheetMusicPDF;
window.downloadAudioFile = downloadAudioFile;
window.loadPreset = loadPreset;
window.togglePlayPause = togglePlayPause;
window.stopSheetMusic = stopSheetMusic;
window.onTextareaChange = onTextareaChange;
window.saveProjectToDynamoDB = saveProjectToDynamoDB;
window.loadProjectFromDynamoDB = loadProjectFromDynamoDB;
window.updateBPM = updateBPM;
window.adjustBPM = adjustBPM;
window.toggleMetronome = toggleMetronome;
window.adjustTranspose = adjustTranspose;
window.toggleDotModifier = toggleDotModifier;

document.addEventListener('DOMContentLoaded', () => {
  const barlineSelect = document.getElementById('barlineSelect');
  if (barlineSelect) {
    barlineSelect.addEventListener('change', (e) => {
      setBarline(e.target.value);
    });
  }

  if (window.ABCJS) {
    loadPreset();
  } else {
    const checkInterval = setInterval(() => {
      if (window.ABCJS) {
        clearInterval(checkInterval);
        loadPreset();
      }
    }, 100);
  }
});