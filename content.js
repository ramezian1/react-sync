// content.js - Injected into every tab
// Hooks into video elements and communicates with the background service worker

let videoElement = null;
let suppressEvents = false;
let suppressTimeout = null;
let seekDebounce = null;
let observer = null;

// ─── Suppress flag ────────────────────────────────────────────────────────────
// Prevents infinite loops when we programmatically control the video.
// (our command fires an event → that event broadcasts back → infinite loop)
function suppress(duration = 500) {
  suppressEvents = true;
  clearTimeout(suppressTimeout);
  suppressTimeout = setTimeout(() => {
    suppressEvents = false;
  }, duration);
}

// ─── Find video element ───────────────────────────────────────────────────────
// Prefers large visible videos to avoid latching onto ad players or thumbnails.
// YouTube-specific: skips the ad <video> by preferring the one with a src or
// that is NOT inside .ytp-ad-player-overlay ancestry.
function findVideo() {
  const videos = Array.from(document.querySelectorAll('video'));

  // Filter to visible, non-tiny candidates
  const candidates = videos.filter(v => v.offsetWidth > 100 && v.offsetHeight > 100);

  if (candidates.length === 0) return videos[0] || null;
  if (candidates.length === 1) return candidates[0];

  // YouTube has multiple candidates during ads — prefer the one that is NOT
  // inside the ad container, or the one with the largest area
  const nonAd = candidates.find(v => !v.closest('.ad-showing') && !v.closest('[id*="ad"]'));
  if (nonAd) return nonAd;

  // Fallback: largest by rendered area
  return candidates.reduce((best, v) =>
    v.offsetWidth * v.offsetHeight > best.offsetWidth * best.offsetHeight ? v : best
  );
}

// ─── Attach event listeners ───────────────────────────────────────────────────
function attachVideoListeners(video) {
  if (video._reactSyncAttached) return; // don't double-attach
  video._reactSyncAttached = true;
  videoElement = video;

  // Notify background that this tab has a video
  chrome.runtime.sendMessage({
    type: 'VIDEO_FOUND',
    title: document.title,
    url: window.location.href
  }).catch(() => {});

  // Play event
  video.addEventListener('play', () => {
    if (suppressEvents) return;
    chrome.runtime.sendMessage({
      type: 'VIDEO_PLAY',
      currentTime: video.currentTime
    }).catch(() => {});
  });

  // Pause event
  video.addEventListener('pause', () => {
    if (suppressEvents) return;
    chrome.runtime.sendMessage({
      type: 'VIDEO_PAUSE',
      currentTime: video.currentTime
    }).catch(() => {});
  });

  // Seek — debounced 300ms because YouTube fires multiple seeked events
  // from a single scrub on the progress bar
  video.addEventListener('seeked', () => {
    if (suppressEvents) return;
    clearTimeout(seekDebounce);
    seekDebounce = setTimeout(() => {
      chrome.runtime.sendMessage({
        type: 'VIDEO_SEEK',
        currentTime: video.currentTime
      }).catch(() => {});
    }, 300);
  });
}

// ─── Re-init after navigation ─────────────────────────────────────────────────
// Called whenever the page navigates (SPA-style or full reload).
// Resets the video reference and scans for a new element.
function handleNavigation() {
  // Detach stale reference — element is likely gone from the DOM
  videoElement = null;

  // Small delay: YouTube needs ~300ms after yt-navigate-finish before the
  // new <video> element is inserted into the DOM
  setTimeout(() => {
    const v = findVideo();
    if (v) attachVideoListeners(v);
    // Observer is already running — it will catch the video if it loads later
  }, 400);

  // Also re-notify background with new page title/url
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'VIDEO_FOUND',
      title: document.title,
      url: window.location.href
    }).catch(() => {});
  }, 500);
}

// ─── Listen for commands from background ─────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Always refresh reference — element may have been replaced since last event
  if (!videoElement || !document.contains(videoElement)) {
    videoElement = findVideo();
  }

  if (message.type === 'GET_VIDEO_TIME') {
    sendResponse({ currentTime: videoElement ? videoElement.currentTime : null });
    return true;
  }

  if (message.type === 'PING') {
    sendResponse({ hasVideo: !!findVideo() });
    return true;
  }

  if (!videoElement) return;

  suppress();

  switch (message.type) {
    case 'CMD_PLAY':
      if (message.seekTo !== undefined) {
        videoElement.currentTime = message.seekTo;
      }
      videoElement.play().catch(() => {});
      break;

    case 'CMD_PAUSE':
      videoElement.pause();
      break;

    case 'CMD_SEEK':
      videoElement.currentTime = Math.max(0, message.time);
      break;
  }
});

// ─── MutationObserver — stays alive permanently ───────────────────────────────
// FIX: We no longer disconnect after finding the first video.
// YouTube replaces <video> elements on navigation and ad transitions —
// we need to keep watching so we can re-attach to the new element.
function startObserver() {
  observer = new MutationObserver(() => {
    const v = findVideo();
    if (!v) return;

    // Only re-attach if we have a brand new element (old one left the DOM
    // or we haven't attached to this one yet)
    if (!videoElement || !document.contains(videoElement) || v !== videoElement) {
      attachVideoListeners(v);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}

// ─── SPA Navigation listeners ─────────────────────────────────────────────────
// YouTube fires 'yt-navigate-finish' on document when a SPA navigation completes.
// This is the most reliable hook for YouTube — better than MutationObserver alone.
document.addEventListener('yt-navigate-finish', handleNavigation);

// Generic SPA fallback for other sites (Patreon, Vimeo, etc.)
window.addEventListener('popstate', handleNavigation);

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  const video = findVideo();
  if (video) attachVideoListeners(video);
  startObserver(); // always start observer — never disconnect it
}

init();
