// popup.js - Handles all popup UI interactions

// ─── Elements ─────────────────────────────────────────────────────────────────
const tabASelect   = document.getElementById('tabASelect');
const tabBSelect   = document.getElementById('tabBSelect');
const offsetInput  = document.getElementById('offsetInput');
const syncBtn      = document.getElementById('syncBtn');
const clearBtn     = document.getElementById('clearBtn');
const statusBar    = document.getElementById('statusBar');
const statusDot    = document.getElementById('statusDot');
const refreshBtn   = document.getElementById('refreshBtn');
const nudgeUp      = document.getElementById('nudgeUp');
const nudgeDown    = document.getElementById('nudgeDown');
const nudgeSizeBtns = document.querySelectorAll('.nudge-size-btn');

let nudgeSize = 0.5;

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  await loadTabs();
  await restoreSyncState();
}

// ─── Load tabs into dropdowns ─────────────────────────────────────────────────
async function loadTabs() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_VIDEO_TABS' }, (response) => {
      const tabs = response?.tabs || [];
      populateSelect(tabASelect, tabs);
      populateSelect(tabBSelect, tabs);

      if (tabs.length === 0) {
        setStatus('No video tabs detected. Open a video and refresh.', 'warn');
      } else {
        setStatus(`${tabs.length} video tab${tabs.length > 1 ? 's' : ''} found`);
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

// ─── Restore saved sync state ─────────────────────────────────────────────────
async function restoreSyncState() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_SYNC_STATE' }, (state) => {
      if (state?.isSynced) {
        tabASelect.value  = state.tabA;
        tabBSelect.value  = state.tabB;
        offsetInput.value = state.offset;
        setSynced(true);
        setStatus(`✓ Synced — offset: ${state.offset}s`, 'ok');
      }
      resolve();
    });
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
        setSynced(true);
        setStatus(`✓ Synced — offset: ${offset}s`, 'ok');
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
}

function truncate(str, len) {
  return str?.length > len ? str.substring(0, len) + '…' : str;
}

// ─── Kick off ─────────────────────────────────────────────────────────────────
init();
