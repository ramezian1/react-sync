// content.js - Bridge between page-inject.js (MAIN world) and the background
// service worker. Does not touch video elements directly — all video control
// runs in page-inject.js so it is trusted by Netflix/Disney+ playback guards.

// ── Page → Background ─────────────────────────────────────────────────────────
// Forward video events and notifications from page-inject.js to background.
window.addEventListener('message', (e) => {
  if (!e.data?.__rs) return;
  const { type, currentTime } = e.data;

  switch (type) {
    case 'VIDEO_FOUND':
      chrome.runtime.sendMessage({
        type: 'VIDEO_FOUND',
        title: document.title,
        url: window.location.href
      }).catch(() => {});
      break;

    case 'VIDEO_PLAY':
      chrome.runtime.sendMessage({ type: 'VIDEO_PLAY', currentTime }).catch(() => {});
      break;

    case 'VIDEO_PAUSE':
      chrome.runtime.sendMessage({ type: 'VIDEO_PAUSE', currentTime }).catch(() => {});
      break;

    case 'VIDEO_SEEK':
      chrome.runtime.sendMessage({ type: 'VIDEO_SEEK', currentTime }).catch(() => {});
      break;
  }
});

// ── Background → Page ─────────────────────────────────────────────────────────
// Relay commands and queries from background to page-inject.js via postMessage.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message;

  if (type === 'CMD_PLAY' || type === 'CMD_PAUSE' || type === 'CMD_SEEK') {
    window.postMessage({ __rsCmd: true, ...message }, '*');
    return;
  }

  if (type === 'GET_VIDEO_TIME' || type === 'PING') {
    const reqId = Math.random().toString(36).slice(2);
    const responseType = type === 'PING' ? 'PING_RESPONSE' : 'VIDEO_TIME_RESPONSE';

    let timer;
    const handler = (e) => {
      if (!e.data?.__rs || e.data.type !== responseType || e.data.reqId !== reqId) return;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      if (type === 'PING') {
        sendResponse({ hasVideo: e.data.hasVideo });
      } else {
        sendResponse({ currentTime: e.data.currentTime });
      }
    };
    window.addEventListener('message', handler);

    // Timeout if page-inject.js doesn't respond (e.g. restricted iframe)
    timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      sendResponse(type === 'PING' ? { hasVideo: false } : { currentTime: null });
    }, 1000);

    window.postMessage({ __rsCmd: true, type, reqId }, '*');
    return true; // keep channel open for async sendResponse
  }
});

// ── SPA navigation ─────────────────────────────────────────────────────────────
// Re-announce VIDEO_FOUND after SPA navigations so the background keeps its
// tab registry current. page-inject.js will also fire VIDEO_FOUND via
// postMessage when it attaches to the new video element.
function onNavigation() {
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'VIDEO_FOUND',
      title: document.title,
      url: window.location.href
    }).catch(() => {});
  }, 500);
}

document.addEventListener('yt-navigate-finish', onNavigation);
window.addEventListener('popstate', onNavigation);
