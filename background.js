// background.js - Service Worker
// Manages sync state and routes play/pause/seek messages between tabs

// ─── Sync State ───────────────────────────────────────────────────────────────
let syncState = {
  tabA: null,       // Reaction video tab ID
  tabB: null,       // Source video tab ID
  offset: 0,        // Seconds tabA is AHEAD of tabB (can be negative)
  isSynced: false
};

// Tabs that have reported a video element
let videoTabs = {};

// Synced tabs that are currently reloading
let reloadingTabs = new Set();

// Restore persisted sync state when service worker starts up
chrome.storage.session.get(['syncState']).then(({ syncState: saved }) => {
  if (saved?.isSynced) syncState = saved;
});

function saveState() {
  chrome.storage.session.set({ syncState });
}

// ─── Message Router ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const senderTabId = sender.tab?.id;

  switch (message.type) {

    // Tab reports it has a video element
    case 'VIDEO_FOUND':
      if (senderTabId) {
        videoTabs[senderTabId] = {
          id: senderTabId,
          title: message.title,
          url: message.url
        };
        // Tab finished reloading and found a video — sync resumes automatically
        reloadingTabs.delete(senderTabId);
      }
      break;

    // Popup requests list of tabs with videos
    case 'GET_VIDEO_TABS':
      chrome.tabs.query({}, (tabs) => {
        // Always include synced tabs even if videoTabs was cleared by a SW restart
        const syncedIds = new Set([syncState.tabA, syncState.tabB].filter(Boolean));
        const enriched = tabs
          .filter(t => videoTabs[t.id] || syncedIds.has(t.id))
          .map(t => ({
            id: t.id,
            title: t.title,
            url: t.url,
            favIconUrl: t.favIconUrl
          }));
        sendResponse({ tabs: enriched });
      });
      return true; // keep channel open for async

    // Popup sets sync config
    case 'SET_SYNC':
      syncState.tabA = message.tabA;
      syncState.tabB = message.tabB;
      syncState.offset = parseFloat(message.offset) || 0;
      syncState.isSynced = true;
      saveState();
      sendResponse({ ok: true });
      break;

    // Popup clears sync
    case 'CLEAR_SYNC':
      syncState = { tabA: null, tabB: null, offset: 0, isSynced: false };
      saveState();
      sendResponse({ ok: true });
      break;

    // Popup requests current sync state
    case 'GET_SYNC_STATE':
      sendResponse({
        ...syncState,
        reloadingA: reloadingTabs.has(syncState.tabA),
        reloadingB: reloadingTabs.has(syncState.tabB)
      });
      return true;

    // Popup requests auto-detection of offset via audio cross-correlation
    case 'DETECT_OFFSET': {
      if (!syncState.isSynced) {
        sendResponse({ error: 'Not synced — set Tab A and Tab B first' });
        break;
      }
      const duration = 10; // seconds of audio to capture per tab

      Promise.all([
        tabMessage(syncState.tabA, { type: 'CAPTURE_AUDIO', duration }),
        tabMessage(syncState.tabB, { type: 'CAPTURE_AUDIO', duration })
      ]).then(([resultA, resultB]) => {
        if (resultA?.error) return sendResponse({ error: `Tab A: ${resultA.error}` });
        if (resultB?.error) return sendResponse({ error: `Tab B: ${resultB.error}` });
        const offset = findOffsetSeconds(resultA.samples, resultB.samples, resultA.sampleRate);
        sendResponse({ offset });
      }).catch(err => sendResponse({ error: err.message }));

      return true; // keep channel open for async sendResponse
    }

    // ── Video events from content scripts ──────────────────────────────────

    case 'VIDEO_PLAY':
      if (!syncState.isSynced) break;
      handlePlay(senderTabId, message.currentTime);
      break;

    case 'VIDEO_PAUSE':
      if (!syncState.isSynced) break;
      handlePause(senderTabId);
      break;

    case 'VIDEO_SEEK':
      if (!syncState.isSynced) break;
      handleSeek(senderTabId, message.currentTime);
      break;
  }
});

// ─── Sync Handlers ────────────────────────────────────────────────────────────

function handlePlay(fromTabId, currentTime) {
  const targetTabId = getTargetTab(fromTabId);
  if (targetTabId === null) return;

  const targetTime = calculateTargetTime(fromTabId, currentTime);
  safeSend(targetTabId, { type: 'CMD_PLAY', seekTo: targetTime });
}

function handlePause(fromTabId) {
  const targetTabId = getTargetTab(fromTabId);
  if (targetTabId === null) return;
  safeSend(targetTabId, { type: 'CMD_PAUSE' });
}

function handleSeek(fromTabId, currentTime) {
  const targetTabId = getTargetTab(fromTabId);
  if (targetTabId === null) return;

  const targetTime = calculateTargetTime(fromTabId, currentTime);
  safeSend(targetTabId, { type: 'CMD_SEEK', time: targetTime });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTargetTab(fromTabId) {
  if (fromTabId === syncState.tabA) return syncState.tabB;
  if (fromTabId === syncState.tabB) return syncState.tabA;
  return null;
}

function calculateTargetTime(fromTabId, currentTime) {
  // offset = how many seconds tabA is AHEAD of tabB
  // tabA at T → tabB should be at T - offset
  // tabB at T → tabA should be at T + offset
  if (fromTabId === syncState.tabA) {
    return Math.max(0, currentTime - syncState.offset);
  } else {
    return Math.max(0, currentTime + syncState.offset);
  }
}

function safeSend(tabId, message) {
  if (reloadingTabs.has(tabId)) return; // skip — tab is mid-reload
  chrome.tabs.sendMessage(tabId, message).catch(() => {});
}

// Callback-based wrapper so Promise.all works with the sendResponse pattern
// used by content.js (which calls sendResponse asynchronously).
function tabMessage(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      resolve(response || { error: chrome.runtime.lastError?.message || 'No response' });
    });
  });
}

// ─── FFT-based Cross-Correlation ──────────────────────────────────────────────
// Pure math — no Web Audio API needed in a service worker.
// Detects the time offset between two audio sample arrays.
// Returns offset in seconds: positive = Tab A is ahead of Tab B.

function nextPow2(n) {
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

// Iterative Cooley-Tukey FFT, in-place on Float64Arrays re/im.
// Length must be a power of 2.
function fftInPlace(re, im, inverse) {
  const n = re.length;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }

  // Butterfly stages
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
  if (rms < 1e-10) return out; // silence — return zeros
  for (let i = 0; i < n; i++) out[i] = (samples[i] - mean) / rms;
  return out;
}

// Returns detected offset in seconds (positive = A ahead of B).
// Usable range: ±(min(lenA, lenB) / sampleRate) seconds.
function findOffsetSeconds(samplesA, samplesB, sampleRate) {
  const a = normalizeSignal(samplesA);
  const b = normalizeSignal(samplesB);

  // Zero-pad to the next power of 2 ≥ lenA + lenB so circular correlation
  // doesn't wrap — this gives us the full linear cross-correlation.
  const n = nextPow2(a.length + b.length);

  const reA = new Float64Array(n), imA = new Float64Array(n);
  const reB = new Float64Array(n), imB = new Float64Array(n);
  for (let i = 0; i < a.length; i++) reA[i] = a[i];
  for (let i = 0; i < b.length; i++) reB[i] = b[i];

  fftInPlace(reA, imA, false);
  fftInPlace(reB, imB, false);

  // C = conj(FFT(A)) * FFT(B)
  // Peak of IFFT(C) at index τ means A leads B by τ / sampleRate seconds.
  const reC = new Float64Array(n), imC = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    reC[k] = reA[k] * reB[k] + imA[k] * imB[k];
    imC[k] = reA[k] * imB[k] - imA[k] * reB[k];
  }

  fftInPlace(reC, imC, true); // IFFT

  // Search only within the valid lag range ±(min(lenA,lenB)-1)
  const maxLag = Math.min(a.length, b.length) - 1;
  let best = -Infinity, bestLag = 0;
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    const idx = lag >= 0 ? lag : n + lag;
    const v = Math.abs(reC[idx]);
    if (v > best) { best = v; bestLag = lag; }
  }

  return parseFloat((bestLag / sampleRate).toFixed(2));
}

// ─── Cleanup closed tabs ──────────────────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  delete videoTabs[tabId];
  reloadingTabs.delete(tabId);
  if (syncState.tabA === tabId || syncState.tabB === tabId) {
    syncState.isSynced = false;
    saveState();
  }
});

// ─── Track synced tab reloads ─────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'loading') return;
  if (tabId === syncState.tabA || tabId === syncState.tabB) {
    reloadingTabs.add(tabId);
  }
});
