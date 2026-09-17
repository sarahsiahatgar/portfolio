import { isBarlineToken, getBeatsPerMeasure } from './music-lab-utils.js';

export function formatNoteArrayToAbcBody(notesArray, initialTimeSignature) {
  if (!notesArray || notesArray.length === 0) return 'z';
  
  let activeTimeSig = initialTimeSignature;
  let maxBeats = getBeatsPerMeasure(activeTimeSig);
  let bodyParts = [];
  let currentMeasureBeats = 0;

  for (let i = 0; i < notesArray.length; i++) {
    const item = notesArray[i];

    if (item.type === 'timesig') {
      activeTimeSig = item.value;
      maxBeats = getBeatsPerMeasure(activeTimeSig);
      bodyParts.push(item.value === 'free' ? '[M:none]' : `[M:${item.value}]`);
      currentMeasureBeats = 0;
    } 
    else if (item.type === 'clef') {
      bodyParts.push(`[K:clef=${item.value}]`);
    }
    else if (item.type === 'barline') {
      if (bodyParts.length > 0 && isBarlineToken(bodyParts[bodyParts.length - 1])) {
        bodyParts.pop();
      }
      bodyParts.push(item.raw);
      currentMeasureBeats = 0;
    } 
    else if (item.type === 'linebreak') {
      bodyParts.push('\n');
      currentMeasureBeats = 0;
    }
    else if (item.type === 'note') {
      if (maxBeats > 0 && currentMeasureBeats + item.durVal > maxBeats + 0.001 && currentMeasureBeats > 0) {
        if (bodyParts.length > 0 && !isBarlineToken(bodyParts[bodyParts.length - 1]) && bodyParts[bodyParts.length - 1] !== '\n') {
          bodyParts.push('|');
        }
        currentMeasureBeats = 0;
      }

      bodyParts.push(item.raw);
      currentMeasureBeats += item.durVal;

      if (maxBeats > 0 && Math.abs(currentMeasureBeats - maxBeats) < 0.001) {
        const nextItem = notesArray[i + 1];
        if (!nextItem || (nextItem.type !== 'barline' && nextItem.type !== 'timesig' && nextItem.type !== 'clef' && nextItem.type !== 'linebreak')) {
          bodyParts.push('|');
        }
        currentMeasureBeats = 0;
      }
    }
  }

  return bodyParts.reduce((acc, curr) => {
    if (curr === '\n') {
      return acc.trimEnd() + '\n';
    }
    if (acc === '' || acc.endsWith('\n')) return acc + curr;
    return acc + ' ' + curr;
  }, '').trim() || 'z';
}

export function generateAbcString(config) {
  const {
    projectName,
    composerName,
    initialTimeSignature,
    currentBpm,
    currentInstrument,
    celloNotes,
    pianoRightNotes,
    pianoLeftNotes
  } = config;

  const initialMeter = initialTimeSignature === 'free' ? 'none' : initialTimeSignature;
  const composer = composerName || 'Anonymous';
  
  const midiProgram = currentInstrument === 'cello' ? 42 : 0;

  if (currentInstrument === 'cello') {
    let startClef = 'bass';
    for (let item of celloNotes) {
      if (item.type === 'clef') {
        startClef = item.value;
        break;
      }
    }
    let header = `X: 1\nT: ${projectName}\nC: ${composer}\nR: ♩ = ${currentBpm}\n%%printtempo false\nM: ${initialMeter}\nL: 1/4\n%%MIDI program ${midiProgram}\nK: C clef=${startClef}\n`;
    let body = formatNoteArrayToAbcBody(celloNotes, initialTimeSignature);
    return header + body;
  } else {
    let header = `X: 1\nT: ${projectName}\nC: ${composer}\nR: ♩ = ${currentBpm}\n%%printtempo false\nM: ${initialMeter}\nL: 1/4\n%%score {RH | LH}\nV: RH clef=treble\nV: LH clef=bass\n%%MIDI program 0\nK: C\n`;
    let rhBody = formatNoteArrayToAbcBody(pianoRightNotes, initialTimeSignature);
    let lhBody = formatNoteArrayToAbcBody(pianoLeftNotes, initialTimeSignature);

    return header + `[V:RH] ${rhBody}\n[V:LH] ${lhBody}\n`;
  }
}

export function renderSheetMusic(abcText, currentTranspose) {
  const statusMsg = document.getElementById('statusMsg');
  if (!window.ABCJS || !abcText) return null;

  try {
    const visualObj = ABCJS.renderAbc("paper", abcText, {
      responsive: "resize",
      staffwidth: 740,
      add_classes: true,
      paddingtop: 15,
      paddingbottom: 15,
      visualTranspose: currentTranspose
    })[0];

    if (statusMsg) {
      statusMsg.textContent = "Sheet music rendered live.";
      statusMsg.style.color = "#5C5F3F";
    }

    return visualObj;
  } catch (err) {
    if (statusMsg) {
      statusMsg.textContent = "Syntax notice: " + err.message;
      statusMsg.style.color = "#e07a5f";
    }
    return null;
  }
}