// popup.js - Handles all popup UI interactions

// ─── Elements ─────────────────────────────────────────────────────────────────
const tabASelect   = document.getElementById('tabASelect');
const tabBSelect   = document.getElementById('tabBSelect');
const tabAFav      = document.getElementById('tabAFav');
const tabBFav      = document.getElementById('tabBFav');
const offsetInput  = document.getElementById('offsetInput');
const syncBtn      = document.getElementById('syncBtn');
const clearBtn     = document.getElementById('clearBtn');
const statusBar    = document.getElementById('statusBar');
const statusDot    = document.getElementById('statusDot');
const refreshBtn   = document.getElementById('refreshBtn');
const shortcutsBtn = document.getElementById('shortcutsBtn');
const donateBtn      = document.getElementById('donateBtn');
const donateDismiss  = document.getElementById('donateDismiss');
const donateSep      = document.getElementById('donateSep');
const nudgeUp      = document.getElementById('nudgeUp');
const nudgeDown    = document.getElementById('nudgeDown');
const nudgeSizeBtns = document.querySelectorAll('.nudge-size-btn');
const autoDetectBtn    = document.getElementById('autoDetectBtn');
const autoDetectResult = document.getElementById('autoDetectResult');
const autoDetectValue  = document.getElementById('autoDetectValue');
const applyDetectedBtn = document.getElementById('applyDetectedBtn');
const dismissDetectedBtn = document.getElementById('dismissDetectedBtn');
const themeToggle      = document.getElementById('themeToggle');
const audioRow         = document.getElementById('audioRow');
const audioBtns        = document.querySelectorAll('.audio-btn');

let nudgeSize = 0.5;
let tabsCache = []; // kept so favicon lookups work after loadTabs()

// ─── Theme toggle ─────────────────────────────────────────────────────────────
chrome.storage.local.get(['theme'], ({ theme }) => {
  if (theme === 'light') document.body.classList.add('light');
});

themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.toggle('light');
  chrome.storage.local.set({ theme: isLight ? 'light' : 'dark' });
});

// ─── Audio source ─────────────────────────────────────────────────────────────
audioBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    audioBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    chrome.runtime.sendMessage({ type: 'SET_AUDIO', audioSource: btn.dataset.audio });
  });
});

function setAudioBtn(source) {
  audioBtns.forEach(b => b.classList.toggle('active', b.dataset.audio === source));
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  await loadTabs();
  await restoreSyncState();
  await restoreOffset();
}

// ─── Load tabs into dropdowns ─────────────────────────────────────────────────
async function loadTabs() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_VIDEO_TABS' }, (response) => {
      tabsCache = response?.tabs || [];
      populateSelect(tabASelect, tabsCache);
      populateSelect(tabBSelect, tabsCache);

      if (tabsCache.length === 0) {
        setStatus('No video tabs detected. Open a video and refresh.', 'warn');
      } else {
        setStatus(`${tabsCache.length} video tab${tabsCache.length > 1 ? 's' : ''} found`);
      }
      resolve();
    });
  });
}

function populateSelect(select, tabs) {
  const current = select.value;
  select.innerHTML = '<option value="">— select tab —</option>';
  tabs.forEach(tab => {
    const opt = document.createElement('option');
    opt.value = tab.id;
    opt.textContent = truncate(tab.title || tab.url, 32);
    select.appendChild(opt);
  });
  if (current) select.value = current;
}

// ─── Favicon helpers ──────────────────────────────────────────────────────────
function updateFavicon(favImg, tabId) {
  const tab = tabsCache.find(t => String(t.id) === String(tabId));
  if (tab?.favIconUrl) {
    favImg.src = tab.favIconUrl;
    favImg.hidden = false;
  } else {
    favImg.hidden = true;
  }
}

tabASelect.addEventListener('change', () => updateFavicon(tabAFav, tabASelect.value));
tabBSelect.addEventListener('change', () => updateFavicon(tabBFav, tabBSelect.value));

// ─── Restore saved sync state ─────────────────────────────────────────────────
async function restoreSyncState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SYNC_STATE' }, (state) => {
      if (state?.isSynced) {
        tabASelect.value  = state.tabA;
        tabBSelect.value  = state.tabB;
        offsetInput.value = state.offset;
        updateFavicon(tabAFav, state.tabA);
        updateFavicon(tabBFav, state.tabB);
        setSynced(true);

        setAudioBtn(state.audioSource || 'A');

        if (state.reloadingA || state.reloadingB) {
          const which = (state.reloadingA && state.reloadingB) ? 'Both tabs'
                      : state.reloadingA ? 'Tab A' : 'Tab B';
          setStatus(`⏳ ${which} reloading — sync resumes automatically`, 'warn');
        } else {
          setStatus(`✓ Synced — offset: ${state.offset}s`, 'ok');
        }
      }
      resolve();
    });
  });
}

// ─── Persist last used offset ─────────────────────────────────────────────────
// Saves offset to chrome.storage.local so it survives popup close/reopen.
function saveOffset(offset) {
  chrome.storage.local.set({ lastOffset: offset });
}

async function restoreOffset() {
  // Only restore if not already filled in by restoreSyncState
  if (offsetInput.value && parseFloat(offsetInput.value) !== 0) return;
  chrome.storage.local.get('lastOffset', (data) => {
    if (data.lastOffset !== undefined) {
      offsetInput.value = data.lastOffset;
    }
  });
}

// ─── Sync button ──────────────────────────────────────────────────────────────
syncBtn.addEventListener('click', () => {
  const tabA   = parseInt(tabASelect.value);
  const tabB   = parseInt(tabBSelect.value);
  const offset = parseFloat(offsetInput.value) || 0;

  if (!tabA || !tabB) {
    setStatus('⚠ Select both tabs first', 'error');
    return;
  }

  if (tabA === tabB) {
    setStatus('⚠ Tab A and Tab B must be different', 'error');
    return;
  }

  chrome.runtime.sendMessage(
    { type: 'SET_SYNC', tabA, tabB, offset },
    (res) => {
      if (res?.ok) {
        saveOffset(offset);
        setSynced(true);
        setStatus(`✓ Synced — pick your audio source above`, 'ok');
      }
    }
  );
});

// ─── Clear button ─────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'CLEAR_SYNC' }, () => {
    setSynced(false);
    setStatus('Sync cleared');
  });
});

// ─── Refresh button ───────────────────────────────────────────────────────────
refreshBtn.addEventListener('click', loadTabs);

// ─── Shortcuts button ─────────────────────────────────────────────────────────
shortcutsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('shortcuts.html') });
});

donateBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://github.com/sponsors/ramezian1' });
});

const DONATE_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

donateDismiss.addEventListener('click', () => {
  hideDonate();
  chrome.storage.local.set({ donateSnoozedAt: Date.now() });
});

function hideDonate() {
  donateBtn.hidden = true;
  donateDismiss.hidden = true;
  donateSep.hidden = true;
}

chrome.storage.local.get('donateSnoozedAt', ({ donateSnoozedAt }) => {
  if (donateSnoozedAt && Date.now() - donateSnoozedAt < DONATE_SNOOZE_MS) hideDonate();
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setStatus(msg, type = '') {
  statusBar.textContent = msg;
  statusBar.className = 'status-bar' + (type ? ` ${type}` : '');
}

function setSynced(active) {
  statusDot.classList.toggle('synced', active);
  syncBtn.classList.toggle('active', active);
  autoDetectBtn.disabled = !active;
  audioRow.hidden = !active;
  if (!active) {
    hideDetectedResult();
    setAudioBtn('both');
  }
}

function truncate(str, len) {
  return str?.length > len ? str.substring(0, len) + '…' : str;
}

function hideDetectedResult() {
  autoDetectResult.hidden = true;
  autoDetectValue.textContent = '';
}

// ─── Auto-detect offset ───────────────────────────────────────────────────────
let detectedOffset = null;

autoDetectBtn.addEventListener('click', () => {
  hideDetectedResult();
  autoDetectBtn.disabled = true;
  autoDetectBtn.textContent = '⏳ capturing 10s…';
  setStatus('Capturing audio from both tabs…', 'warn');

  chrome.runtime.sendMessage({ type: 'DETECT_OFFSET' }, (res) => {
    autoDetectBtn.disabled = false;
    autoDetectBtn.textContent = '◎ auto-detect offset';

    if (res?.error) {
      setStatus(`⚠ ${res.error}`, 'error');
      return;
    }

    detectedOffset = res.offset;
    const sign = detectedOffset >= 0 ? '+' : '';
    autoDetectValue.textContent = `${sign}${detectedOffset}s`;
    autoDetectResult.hidden = false;
    setStatus(`Detected offset: ${sign}${detectedOffset}s — apply?`, 'warn');
  });
});

applyDetectedBtn.addEventListener('click', () => {
  if (detectedOffset === null) return;
  offsetInput.value = detectedOffset;
  hideDetectedResult();

  const tabA = parseInt(tabASelect.value);
  const tabB = parseInt(tabBSelect.value);
  chrome.runtime.sendMessage({ type: 'SET_SYNC', tabA, tabB, offset: detectedOffset }, (res) => {
    if (res?.ok) {
      saveOffset(detectedOffset);
      setSynced(true);
      setStatus(`✓ Synced — offset: ${detectedOffset}s (auto-detected)`, 'ok');
    }
  });
  detectedOffset = null;
});

dismissDetectedBtn.addEventListener('click', () => {
  hideDetectedResult();
  detectedOffset = null;
  setStatus('Dismissed — offset unchanged');
});

// ─── Kick off ─────────────────────────────────────────────────────────────────
init();
