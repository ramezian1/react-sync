'use strict';

const { app, BrowserWindow, WebContentsView, ipcMain, session } = require('electron');
const path = require('path');
const { randomUUID } = require('crypto');

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTROL_HEIGHT = 140; // px — height of the top control strip

// ─── Sync State ───────────────────────────────────────────────────────────────
let syncState = { offset: 0, isSynced: false };

// ─── Window & View refs ───────────────────────────────────────────────────────
let mainWin = null;
let panelA  = null;
let panelB  = null;

// ─── Hook Script (injected into MAIN world of each video panel) ───────────────
// Mirrors page-inject.js from the extension. Uses window.postMessage to bridge
// to the preload, which forwards via ipcRenderer to the main process.
const HOOK_SCRIPT = `
(function () {
  if (window.__rsSyncActive) return;
  window.__rsSyncActive = true;

  let videoEl = null;
  let suppressEvents = false;
  let suppressTimeout = null;

  function suppress(duration = 500) {
    suppressEvents = true;
    clearTimeout(suppressTimeout);
    suppressTimeout = setTimeout(() => { suppressEvents = false; }, duration);
  }

  function findVideo() {
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

  function attachToVideo(video) {
    if (video._rsSyncAttached) return;
    video._rsSyncAttached = true;
    videoEl = video;

    window.postMessage({ __rs: true, type: 'VIDEO_FOUND', title: document.title, url: location.href }, '*');

    video.addEventListener('play', () => {
      if (suppressEvents) return;
      window.postMessage({ __rs: true, type: 'VIDEO_PLAY', currentTime: video.currentTime }, '*');
    });

    video.addEventListener('pause', () => {
      if (suppressEvents) return;
      window.postMessage({ __rs: true, type: 'VIDEO_PAUSE', currentTime: video.currentTime }, '*');
    });

    let seekDebounce = null;
    video.addEventListener('seeked', () => {
      if (suppressEvents) return;
      clearTimeout(seekDebounce);
      seekDebounce = setTimeout(() => {
        window.postMessage({ __rs: true, type: 'VIDEO_SEEK', currentTime: video.currentTime }, '*');
      }, 300);
    });
  }

  // Commands from preload → MAIN world
  window.addEventListener('message', (e) => {
    if (!e.data?.__rsCmd) return;
    const { type } = e.data;
    if (!videoEl || !document.contains(videoEl)) videoEl = findVideo();
    if (!videoEl) return;
    suppress();
    if (type === 'CMD_PLAY') {
      if (e.data.seekTo !== undefined) videoEl.currentTime = e.data.seekTo;
      videoEl.play().catch(() => {});
    } else if (type === 'CMD_PAUSE') {
      videoEl.pause();
    } else if (type === 'CMD_SEEK') {
      videoEl.currentTime = Math.max(0, e.data.time);
    }
  });

  // MutationObserver handles SPA navigation (e.g. YouTube) and dynamic video
  const observer = new MutationObserver(() => {
    const v = findVideo();
    if (!v) return;
    if (!videoEl || !document.contains(videoEl) || v !== videoEl) attachToVideo(v);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const initial = findVideo();
  if (initial) attachToVideo(initial);
})();
`;

// ─── App Init ─────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Override user agent — Google/YouTube block Electron's default UA string
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    callback({ requestHeaders: details.requestHeaders });
  });

  createWindow();
  setupIPC();
});

app.on('window-all-closed', () => app.quit());

// ─── Window & Panel Creation ──────────────────────────────────────────────────
function createWindow() {
  mainWin = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 900,
    minHeight: 500,
    backgroundColor: '#0e0e10',
    title: 'ReactSync',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // renderer/renderer.js uses require('electron')
    }
  });

  panelA = createPanel('A');
  panelB = createPanel('B');

  mainWin.contentView.addChildView(panelA);
  mainWin.contentView.addChildView(panelB);

  mainWin.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWin.once('ready-to-show', () => {
    updateLayout();
    mainWin.show();
  });

  mainWin.on('resize', updateLayout);
}

function createPanel(panelId) {
  const panel = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // required for ipcRenderer in preload
      additionalArguments: [`--rs-panel=${panelId}`]
    }
  });

  // Inject video hooks into the page's MAIN world after every full navigation
  panel.webContents.on('did-finish-load', () => {
    panel.webContents.executeJavaScript(HOOK_SCRIPT).catch(() => {});
  });

  panel.webContents.loadURL('about:blank');
  return panel;
}

function updateLayout() {
  if (!mainWin) return;
  const [w, h] = mainWin.getContentSize();
  const half = Math.floor(w / 2);
  const panelH = Math.max(0, h - CONTROL_HEIGHT);

  panelA.setBounds({ x: 0,    y: CONTROL_HEIGHT, width: half,     height: panelH });
  panelB.setBounds({ x: half, y: CONTROL_HEIGHT, width: w - half, height: panelH });
}

// ─── IPC Setup ────────────────────────────────────────────────────────────────
function setupIPC() {
  // Load a URL into a panel
  ipcMain.on('ui:load-url', (_, { panel, url }) => {
    const target = panel === 'A' ? panelA : panelB;
    target.webContents.loadURL(url).catch(() => {
      mainWin.webContents.send('main:status', { message: `Failed to load URL`, level: 'error' });
    });
  });

  // Activate sync with given offset
  ipcMain.handle('ui:set-sync', (_, { offset }) => {
    syncState.offset = parseFloat(offset) || 0;
    syncState.isSynced = true;
    return { ok: true };
  });

  // Clear sync
  ipcMain.handle('ui:clear-sync', () => {
    syncState.isSynced = false;
    syncState.offset = 0;
    return { ok: true };
  });

  // Query current sync state (used on renderer init)
  ipcMain.handle('ui:get-sync-state', () => ({ ...syncState }));

  // Nudge offset and push new value back to renderer
  ipcMain.handle('ui:nudge-offset', (_, { delta }) => {
    syncState.offset = parseFloat((syncState.offset + delta).toFixed(2));
    mainWin.webContents.send('main:sync-state', { ...syncState });
    return { newOffset: syncState.offset };
  });

  // Detect offset via audio cross-correlation
  ipcMain.handle('ui:detect-offset', async () => {
    if (!syncState.isSynced) return { error: 'Not synced — click SYNC first' };
    try {
      const [resultA, resultB] = await Promise.all([
        requestCapture(panelA.webContents, 10),
        requestCapture(panelB.webContents, 10)
      ]);
      if (resultA.error) return { error: `Panel A: ${resultA.error}` };
      if (resultB.error) return { error: `Panel B: ${resultB.error}` };
      const offset = findOffsetSeconds(resultA.samples, resultB.samples, resultA.sampleRate);
      return { offset };
    } catch (e) {
      return { error: e.message };
    }
  });

  // ── Video events from panels ───────────────────────────────────────────────

  ipcMain.on('panel:video-found', (_, { panel, title, url }) => {
    mainWin.webContents.send('main:video-found', { panel, title, url });
  });

  ipcMain.on('panel:video-play', (_, { panel, currentTime }) => {
    if (!syncState.isSynced) return;
    const isA = panel === 'A';
    const targetTime = isA
      ? Math.max(0, currentTime - syncState.offset)
      : Math.max(0, currentTime + syncState.offset);
    const target = isA ? panelB : panelA;
    target.webContents.send('cmd:play', { seekTo: targetTime });
  });

  ipcMain.on('panel:video-pause', (_, { panel }) => {
    if (!syncState.isSynced) return;
    const target = panel === 'A' ? panelB : panelA;
    target.webContents.send('cmd:pause');
  });

  ipcMain.on('panel:video-seek', (_, { panel, currentTime }) => {
    if (!syncState.isSynced) return;
    const isA = panel === 'A';
    const targetTime = isA
      ? Math.max(0, currentTime - syncState.offset)
      : Math.max(0, currentTime + syncState.offset);
    const target = isA ? panelB : panelA;
    target.webContents.send('cmd:seek', { time: targetTime });
  });
}

// ─── Audio Capture Request ────────────────────────────────────────────────────
// Asks a panel's preload to record audio and waits for the result.
function requestCapture(wc, duration) {
  return new Promise((resolve, reject) => {
    const id = randomUUID();
    const channel = `panel:audio-result:${id}`;

    const timeout = setTimeout(() => {
      ipcMain.removeListener(channel, handler);
      reject(new Error('Capture timed out'));
    }, (duration + 8) * 1000);

    const handler = (_, result) => {
      clearTimeout(timeout);
      ipcMain.removeListener(channel, handler);
      resolve(result || { error: 'No response from panel' });
    };

    ipcMain.on(channel, handler);
    wc.send('cmd:capture-audio', { id, duration });
  });
}

// ─── FFT-based Cross-Correlation (verbatim from background.js) ────────────────

function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

function fftInPlace(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wRe = 1, wIm = 0;
      const half = len >> 1;
      for (let k = 0; k < half; k++) {
        const uRe = re[i + k], uIm = im[i + k];
        const vRe = re[i + k + half] * wRe - im[i + k + half] * wIm;
        const vIm = re[i + k + half] * wIm + im[i + k + half] * wRe;
        re[i + k]        = uRe + vRe;  im[i + k]        = uIm + vIm;
        re[i + k + half] = uRe - vRe;  im[i + k + half] = uIm - vIm;
        const newWRe = wRe * cos - wIm * sin;
        wIm = wRe * sin + wIm * cos;
        wRe = newWRe;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
}

function normalizeSignal(samples) {
  const n = samples.length;
  let sum = 0;
  for (const s of samples) sum += s;
  const mean = sum / n;
  let sumSq = 0;
  for (const s of samples) sumSq += (s - mean) ** 2;
  const rms = Math.sqrt(sumSq / n);
  const out = new Float64Array(n);
  if (rms < 1e-10) return out;
  for (let i = 0; i < n; i++) out[i] = (samples[i] - mean) / rms;
  return out;
}

function findOffsetSeconds(samplesA, samplesB, sampleRate) {
  const a = normalizeSignal(samplesA);
  const b = normalizeSignal(samplesB);
  const n = nextPow2(a.length + b.length);
  const reA = new Float64Array(n), imA = new Float64Array(n);
  const reB = new Float64Array(n), imB = new Float64Array(n);
  for (let i = 0; i < a.length; i++) reA[i] = a[i];
  for (let i = 0; i < b.length; i++) reB[i] = b[i];
  fftInPlace(reA, imA, false);
  fftInPlace(reB, imB, false);
  const reC = new Float64Array(n), imC = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    reC[k] = reA[k] * reB[k] + imA[k] * imB[k];
    imC[k] = reA[k] * imB[k] - imA[k] * reB[k];
  }
  fftInPlace(reC, imC, true);
  const maxLag = Math.min(a.length, b.length) - 1;
  let best = -Infinity, bestLag = 0;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    const idx = lag >= 0 ? lag : n + lag;
    const v = Math.abs(reC[idx]);
    if (v > best) { best = v; bestLag = lag; }
  }
  return parseFloat((bestLag / sampleRate).toFixed(2));
}
