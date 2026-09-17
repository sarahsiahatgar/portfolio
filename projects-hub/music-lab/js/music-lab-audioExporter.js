// ====================================================================
// AUDIO EXPORTER MODULE (js/music-lab-audioExporter.js)
// ====================================================================

function audioBufferToWavBlob(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let channels = [];
    let sampleRate = buffer.sampleRate;
    let offset = 0;
    let pos = 0;

    function writeString(str) {
        for (let i = 0; i < str.length; i++) {
            out.setUint8(pos++, str.charCodeAt(i));
        }
    }

    writeString('RIFF');
    out.setUint32(pos, length - 8, true); pos += 4;
    writeString('WAVE');

    writeString('fmt ');
    out.setUint32(pos, 16, true); pos += 4;
    out.setUint16(pos, 1, true); pos += 2;
    out.setUint16(pos, numOfChan, true); pos += 2;
    out.setUint32(pos, sampleRate, true); pos += 4;
    out.setUint32(pos, sampleRate * 2 * numOfChan, true); pos += 4;
    out.setUint16(pos, numOfChan * 2, true); pos += 2;
    out.setUint16(pos, 16, true); pos += 2;

    writeString('data');
    out.setUint32(pos, length - pos - 4, true); pos += 4;

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    while (offset < buffer.length) {
        for (let i = 0; i < numOfChan; i++) {
            let sample = Math.max(-1, Math.min(1, channels[i][offset]));
            sample = (sample < 0 ? sample * 32768 : sample * 32767);
            out.setInt16(pos, sample, true);
            pos += 2;
        }
        offset++;
    }

    return new Blob([out.buffer], { type: 'audio/wav' });
}

export async function downloadAudioFile() {
    const statusMsg = document.getElementById('statusMsg');
    const abcText = document.getElementById('abcInput')?.value;
    const projectName = document.getElementById('projectNameInput')?.value.trim() || 'composition';

    if (!abcText) {
        if (statusMsg) {
            statusMsg.textContent = "Error: No music score found to export.";
            statusMsg.style.color = "#e07a5f";
        }
        return;
    }

    try {
        if (statusMsg) {
            statusMsg.textContent = "Rendering audio in background... Please wait.";
            statusMsg.style.color = "#d2daab";
        }

        const visualObj = ABCJS.renderAbc('paper', abcText, { responsive: 'resize' })[0];
        
        if (!visualObj) {
            throw new Error("Could not parse ABC notation for audio rendering.");
        }

        const synthControl = new ABCJS.synth.CreateSynth();
        
        await synthControl.init({
            visualObj: visualObj,
            options: { soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/" }
        });

        await synthControl.prime();

        const renderedBuffer = synthControl.getAudioBuffer();
        
        if (!renderedBuffer) {
            throw new Error("Failed to retrieve rendered audio buffer from abcjs synth.");
        }

        const wavBlob = audioBufferToWavBlob(renderedBuffer);

        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${projectName.replace(/\s+/g, '_')}.wav`;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);

        if (statusMsg) {
            statusMsg.textContent = "✓ Audio exported successfully! WAV file downloaded.";
            statusMsg.style.color = "#b5be8a";
        }

    } catch (error) {
        console.error("Audio export failed:", error);
        if (statusMsg) {
            statusMsg.textContent = "Error generating audio export: " + error.message;
            statusMsg.style.color = "#e07a5f";
        }
    }
}