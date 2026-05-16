'use strict';

// preload.js — runs in each video panel's isolated world.
// Bridges window.postMessage (MAIN world hook) ↔ ipcRenderer (main process).
// Also handles audio capture directly since Web APIs are available here.

const { ipcRenderer } = require('electron');

const panelArg = process.argv.find(a => a.startsWith('--rs-panel='));
const PANEL_ID = panelArg ? panelArg.split('=')[1] : 'A';

// ─── MAIN world → main process ───────────────────────────────────────────────
window.addEventListener('message', (e) => {
  if (!e.data?.__rs) return;
  const { type } = e.data;

  if (type === 'VIDEO_FOUND') {
    ipcRenderer.send('panel:video-found', { panel: PANEL_ID, title: e.data.title, url: e.data.url });
  } else if (type === 'VIDEO_PLAY') {
    ipcRenderer.send('panel:video-play', { panel: PANEL_ID, currentTime: e.data.currentTime });
  } else if (type === 'VIDEO_PAUSE') {
    ipcRenderer.send('panel:video-pause', { panel: PANEL_ID, currentTime: e.data.currentTime });
  } else if (type === 'VIDEO_SEEK') {
    ipcRenderer.send('panel:video-seek', { panel: PANEL_ID, currentTime: e.data.currentTime });
  }
});

// ─── main process → MAIN world ───────────────────────────────────────────────
ipcRenderer.on('cmd:play', (_, { seekTo }) => {
  window.postMessage({ __rsCmd: true, type: 'CMD_PLAY', seekTo }, '*');
});

ipcRenderer.on('cmd:pause', () => {
  window.postMessage({ __rsCmd: true, type: 'CMD_PAUSE' }, '*');
});

ipcRenderer.on('cmd:seek', (_, { time }) => {
  window.postMessage({ __rsCmd: true, type: 'CMD_SEEK', time }, '*');
});

// ─── Audio capture ───────────────────────────────────────────────────────────
// Runs directly in the preload — AudioContext and captureStream() are available
// in Electron's renderer process regardless of contextIsolation.
let isCapturing = false;

ipcRenderer.on('cmd:capture-audio', async (_, { id, duration }) => {
  const reply = (result) => ipcRenderer.send(`panel:audio-result:${id}`, result);

  if (isCapturing) { reply({ error: 'Already capturing' }); return; }

  const videoEl = findVideoInPage();
  if (!videoEl) { reply({ error: 'No video found in panel' }); return; }

  isCapturing = true;
  try {
    const stream = videoEl.captureStream();
    if (stream.getAudioTracks().length === 0) {
      throw new Error('No audio track — content may be DRM-protected');
    }

    const audioCtx = new AudioContext();
    const source   = audioCtx.createMediaStreamSource(stream);
    const targetRate  = 4000;
    const nativeRate  = audioCtx.sampleRate;
    const targetSamples = duration * nativeRate;
    const collected = [];

    await new Promise((resolve, reject) => {
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      const silent = audioCtx.createGain();
      silent.gain.value = 0;
      source.connect(processor);
      processor.connect(silent);
      silent.connect(audioCtx.destination);

      let gotAudio = false;
      processor.onaudioprocess = (ev) => {
        const chunk = ev.inputBuffer.getChannelData(0);
        for (let i = 0; i < chunk.length; i++) collected.push(chunk[i]);
        if (!gotAudio && chunk.some(s => s !== 0)) gotAudio = true;
        if (collected.length >= targetSamples) {
          processor.onaudioprocess = null;
          processor.disconnect();
          source.disconnect();
          audioCtx.close().then(resolve);
        }
      };

      setTimeout(() => {
        if (!gotAudio) {
          processor.disconnect();
          source.disconnect();
          audioCtx.close();
          reject(new Error('No audio signal — video may be muted or DRM-protected'));
        }
      }, 3000);
    });

    // Decimate to 4 kHz
    const ratio = nativeRate / targetRate;
    const decimated = [];
    for (let i = 0; i < Math.floor(Math.min(collected.length, targetSamples) / ratio); i++) {
      decimated.push(collected[Math.floor(i * ratio)]);
    }

    // Quantize to Int16
    const samples = decimated.map(s => Math.round(Math.max(-1, Math.min(1, s)) * 32767));
    reply({ samples, sampleRate: targetRate });
  } catch (err) {
    reply({ error: err.message });
  } finally {
    isCapturing = false;
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function findVideoInPage() {
  const videos = Array.from(document.querySelectorAll('video'));
  const candidates = videos.filter(v => v.offsetWidth > 100 && v.offsetHeight > 100);
  if (candidates.length === 0) return videos[0] || null;
  if (candidates.length === 1) return candidates[0];
  const nonAd = candidates.find(v => !v.closest('.ad-showing') && !v.closest('[id*="ad"]'));
  if (nonAd) return nonAd;
  return candidates.reduce((best, v) =>
    v.offsetWidth * v.offsetHeight > best.offsetWidth * best.offsetHeight ? v : best
  );
}
