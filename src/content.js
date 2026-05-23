// content.js - Bridge between page-inject.js (MAIN world) and the background
// service worker. Does not touch video elements directly — all video control
// runs in page-inject.js so it is trusted by Netflix/Disney+ playback guards.

// ── Page → Background ─────────────────────────────────────────────────────────
// Forward video events and notifications from page-inject.js to background.

// chrome.runtime.sendMessage throws synchronously when the extension is reloaded
// and this content script is stale. Wrap every call so it never surfaces as an
// uncaught error, and stop listening once the context is gone.
let _contextValid = true;
function rsSend(msg) {
  if (!_contextValid) return;
  try {
    chrome.runtime.sendMessage(msg).catch(() => {});
  } catch (e) {
    _contextValid = false; // extension reloaded — this script is stale
  }
}

window.addEventListener('message', (e) => {
  if (!e.data?.__rs) return;
  const { type, currentTime } = e.data;

  switch (type) {
    case 'VIDEO_FOUND':
      rsSend({ type: 'VIDEO_FOUND', title: document.title, url: window.location.href });
      break;

    case 'VIDEO_PLAY':
      rsSend({ type: 'VIDEO_PLAY', currentTime });
      break;

    case 'VIDEO_PAUSE':
      rsSend({ type: 'VIDEO_PAUSE', currentTime });
      break;

    case 'VIDEO_SEEK':
      rsSend({ type: 'VIDEO_SEEK', currentTime });
      break;
  }
});

// ── Background → Page ─────────────────────────────────────────────────────────
// Relay commands and queries from background to page-inject.js via postMessage.
let _reqCounter = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type } = message;

  if (type === 'CMD_PLAY' || type === 'CMD_PAUSE' || type === 'CMD_SEEK') {
    window.postMessage({ __rsCmd: true, ...message }, '*');
    return;
  }

  if (type === 'GET_VIDEO_TIME' || type === 'PING') {
    const reqId = `r${++_reqCounter}`;
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

  if (type === 'CAPTURE_AUDIO') {
    const reqId = `r${++_reqCounter}`;
    const duration = message.duration || 10;

    let timer;
    const handler = (e) => {
      if (!e.data?.__rs || e.data.type !== 'AUDIO_CAPTURED' || e.data.reqId !== reqId) return;
      clearTimeout(timer);
      window.removeEventListener('message', handler);
      sendResponse(e.data.error
        ? { error: e.data.error }
        : { samples: e.data.samples, sampleRate: e.data.sampleRate }
      );
    };
    window.addEventListener('message', handler);

    // Extra 5s headroom beyond the capture duration for decode/resample
    timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      sendResponse({ error: 'Capture timed out' });
    }, (duration + 5) * 1000);

    window.postMessage({ __rsCmd: true, type: 'CAPTURE_AUDIO', reqId, duration }, '*');
    return true;
  }
});

// ── SPA navigation ─────────────────────────────────────────────────────────────
// Re-announce VIDEO_FOUND after SPA navigations so the background keeps its
// tab registry current. page-inject.js will also fire VIDEO_FOUND via
// postMessage when it attaches to the new video element.
function onNavigation() {
  setTimeout(() => {
    rsSend({ type: 'VIDEO_FOUND', title: document.title, url: window.location.href });
  }, 500);
}

document.addEventListener('yt-navigate-finish', onNavigation);
window.addEventListener('popstate', onNavigation);
