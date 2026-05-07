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
      }
      break;

    // Popup requests list of tabs with videos
    case 'GET_VIDEO_TABS':
      // Also fetch current open tabs and merge
      chrome.tabs.query({}, (tabs) => {
        const enriched = tabs
          .filter(t => videoTabs[t.id])
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
      sendResponse({ ok: true });
      break;

    // Popup clears sync
    case 'CLEAR_SYNC':
      syncState = { tabA: null, tabB: null, offset: 0, isSynced: false };
      sendResponse({ ok: true });
      break;

    // Popup requests current sync state
    case 'GET_SYNC_STATE':
      sendResponse({ ...syncState });
      return true;

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
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    // Tab may have been closed or navigated away — silently ignore
  });
}

// ─── Cleanup closed tabs ──────────────────────────────────────────────────────
chrome.tabs.onRemoved.addListener((tabId) => {
  delete videoTabs[tabId];
  if (syncState.tabA === tabId || syncState.tabB === tabId) {
    syncState.isSynced = false;
  }
});
