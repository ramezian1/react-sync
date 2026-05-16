'use strict';

// renderer.js — control strip UI logic.
// Ported from popup.js; chrome.runtime.sendMessage replaced with ipcRenderer.

const { ipcRenderer } = require('electron');

// ─── Elements ─────────────────────────────────────────────────────────────────
const urlAInput   = document.getElementById('urlA');
const urlBInput   = document.getElementById('urlB');
const goABtn      = document.getElementById('goA');
const goBBtn      = document.getElementById('goB');
const offsetInput = document.getElementById('offsetInput');
const nudgeUp     = document.getElementById('nudgeUp');
const nudgeDown   = document.getElementById('nudgeDown');
const nudgeSizeBtns = document.querySelectorAll('.nudge-size-btn');
const syncBtn     = document.getElementById('syncBtn');
const clearBtn    = document.getElementById('clearBtn');
const statusBar   = document.getElementById('statusBar');
const statusDot   = document.getElementById('statusDot');
const autoDetectBtn      = document.getElementById('autoDetectBtn');
const autoDetectResult   = document.getElementById('autoDetectResult');
const autoDetectValue    = document.getElementById('autoDetectValue');
const applyDetectedBtn   = document.getElementById('applyDetectedBtn');
const dismissDetectedBtn = document.getElementById('dismissDetectedBtn');

let nudgeSize = 0.5;
let detectedOffset = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  const state = await ipcRenderer.invoke('ui:get-sync-state');
  if (state?.isSynced) {
    offsetInput.value = state.offset;
    setSynced(true);
    setStatus(`✓ Synced — offset: ${state.offset}s`, 'ok');
  }
}

// ─── URL loading ──────────────────────────────────────────────────────────────
function loadUrl(panel, input) {
  let url = input.value.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  input.value = url;
  ipcRenderer.send('ui:load-url', { panel, url });
  setStatus(`Loading Panel ${panel}…`, 'warn');
}

goABtn.addEventListener('click', () => loadUrl('A', urlAInput));
goBBtn.addEventListener('click', () => loadUrl('B', urlBInput));
urlAInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadUrl('A', urlAInput); });
urlBInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadUrl('B', urlBInput); });

// ─── Sync button ──────────────────────────────────────────────────────────────
syncBtn.addEventListener('click', async () => {
  const offset = parseFloat(offsetInput.value) || 0;
  const res = await ipcRenderer.invoke('ui:set-sync', { offset });
  if (res?.ok) {
    setSynced(true);
    setStatus(`✓ Synced — offset: ${offset}s`, 'ok');
  }
});

// ─── Clear button ─────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', async () => {
  await ipcRenderer.invoke('ui:clear-sync');
  setSynced(false);
  setStatus('Sync cleared');
});

// ─── Nudge buttons ────────────────────────────────────────────────────────────
nudgeUp.addEventListener('click', () => {
  offsetInput.value = (parseFloat(offsetInput.value || 0) + nudgeSize).toFixed(1);
});
nudgeDown.addEventListener('click', () => {
  offsetInput.value = (parseFloat(offsetInput.value || 0) - nudgeSize).toFixed(1);
});
nudgeSizeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    nudgeSizeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    nudgeSize = parseFloat(btn.dataset.size);
  });
});

// ─── Auto-detect offset ───────────────────────────────────────────────────────
autoDetectBtn.addEventListener('click', async () => {
  hideDetectedResult();
  autoDetectBtn.disabled = true;
  autoDetectBtn.textContent = '⏳ capturing 10s…';
  setStatus('Capturing audio from both panels…', 'warn');

  const res = await ipcRenderer.invoke('ui:detect-offset');

  autoDetectBtn.disabled = false;
  autoDetectBtn.textContent = '◎ auto-detect';

  if (res?.error) {
    setStatus(`⚠ ${res.error}`, 'error');
    return;
  }

  detectedOffset = res.offset;
  const sign = detectedOffset >= 0 ? '+' : '';
  autoDetectValue.textContent = `${sign}${detectedOffset}s`;
  autoDetectResult.hidden = false;
  setStatus(`Detected: ${sign}${detectedOffset}s — apply?`, 'warn');
});

applyDetectedBtn.addEventListener('click', async () => {
  if (detectedOffset === null) return;
  offsetInput.value = detectedOffset;
  hideDetectedResult();
  const res = await ipcRenderer.invoke('ui:set-sync', { offset: detectedOffset });
  if (res?.ok) {
    setSynced(true);
    setStatus(`✓ Synced — offset: ${detectedOffset}s (auto-detected)`, 'ok');
  }
  detectedOffset = null;
});

dismissDetectedBtn.addEventListener('click', () => {
  hideDetectedResult();
  detectedOffset = null;
  setStatus('Dismissed — offset unchanged');
});

// ─── Push events from main process ───────────────────────────────────────────
ipcRenderer.on('main:status', (_, { message, level }) => setStatus(message, level));

ipcRenderer.on('main:sync-state', (_, { isSynced, offset }) => {
  offsetInput.value = offset;
  setSynced(isSynced);
});

ipcRenderer.on('main:video-found', (_, { panel, title }) => {
  setStatus(`Panel ${panel} video: ${title || 'detected'}`, 'ok');
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setStatus(msg, type = '') {
  statusBar.textContent = msg;
  statusBar.className = 'status-bar' + (type ? ` ${type}` : '');
}

function setSynced(active) {
  statusDot.classList.toggle('synced', active);
  syncBtn.classList.toggle('active', active);
  autoDetectBtn.disabled = !active;
  if (!active) hideDetectedResult();
}

function hideDetectedResult() {
  autoDetectResult.hidden = true;
  autoDetectValue.textContent = '';
}

init();
