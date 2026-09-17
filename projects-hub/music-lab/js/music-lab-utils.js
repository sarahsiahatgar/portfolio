// ====================================================================
// MUSIC UTILITIES MODULE (js/music-lab-utils.js)
// ====================================================================

export function parseBpmFromAbc(abcText) {
  const match = abcText.match(/Q:\s*(?:\d\/\d=)?(\d+)/);
  return match ? parseInt(match[1], 10) : 120;
}

export function parseDurationValue(durStr, timeSignature = '4/4') {
  if (!durStr) durStr = '1';

  if (timeSignature === '6/8') {
    switch (durStr) {
      case '1/8': return 0.25;
      case '1/4': return 0.5;
      case '1/2': return 1.0;
      case '1':   return 3.0;
      case '2':   return 6.0;
      case '3/8': return 3.0;
      case '3/4': return 6.0; 
      case '4':   return 8.0;
      default: {
        let val = 1.0;
        if (durStr.includes('/')) {
          const parts = durStr.split('/');
          const num = parseFloat(parts[0]);
          const den = parseFloat(parts[1]);
          if (!isNaN(num) && !isNaN(den) && den !== 0) val = num / den;
        } else {
          val = parseFloat(durStr) || 1.0;
        }
        return val * 2.0;
      }
    }
  }

  let quarterValue = 1.0;
  if (durStr.includes('/')) {
    const parts = durStr.split('/');
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) {
      quarterValue = num / den;
    }
  } else {
    quarterValue = parseFloat(durStr) || 1.0;
  }
  return quarterValue * 2.0;
}

export function getBeatsPerMeasure(ts) {
  switch (ts) {
    case '4/4': return 8.0;
    case '3/4': return 6.0;
    case '2/4': return 4.0;
    case '6/8': return 6.0;
    default: return 0;
  }
}

export function isBarlineToken(str) {
  if (!str) return false;
  return ['|', '||', '|:', ':|', '|]', '::'].includes(str.trim());
}

export function getAbcPitchNotation(baseNote, octave, accidental) {
  let abcPitch = baseNote;
  if (accidental === 'sharp') abcPitch = '^' + baseNote;
  if (accidental === 'flat') abcPitch = '_' + baseNote;

  switch(octave) {
    case 1: abcPitch += ',,,'; break;
    case 2: abcPitch += ',,'; break;
    case 3: abcPitch += ','; break;
    case 4: abcPitch = abcPitch; break;
    case 5: abcPitch = abcPitch.toLowerCase(); break;
    case 6: abcPitch = abcPitch.toLowerCase() + "'"; break;
    case 7: abcPitch = abcPitch.toLowerCase() + "''"; break;
    default: abcPitch = abcPitch;
  }
  return abcPitch;
}