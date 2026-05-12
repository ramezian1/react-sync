// page-inject.js - Runs in MAIN world (page execution context)
// By running here, video.play() is treated as a trusted page call — this
// bypasses Netflix/Disney+ guards that reject programmatic play from
// isolated content scripts.

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

  // Notify content.js that a video was found so it can tell the background
  window.postMessage({ __rs: true, type: 'VIDEO_FOUND' }, '*');

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

// Handle commands and time queries relayed from content.js
window.addEventListener('message', (e) => {
  if (!e.data?.__rsCmd) return;
  const { type, reqId } = e.data;

  if (type === 'PING') {
    window.postMessage({ __rs: true, type: 'PING_RESPONSE', reqId, hasVideo: !!findVideo() }, '*');
    return;
  }

  if (type === 'GET_VIDEO_TIME') {
    if (!videoEl || !document.contains(videoEl)) videoEl = findVideo();
    window.postMessage({
      __rs: true, type: 'VIDEO_TIME_RESPONSE', reqId,
      currentTime: videoEl ? videoEl.currentTime : null
    }, '*');
    return;
  }

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

// Stay alive permanently — Netflix/Disney+ replace <video> elements on
// loading screens, ads, and episode transitions
const rsObserver = new MutationObserver(() => {
  const v = findVideo();
  if (!v) return;
  if (!videoEl || !document.contains(videoEl) || v !== videoEl) {
    attachToVideo(v);
  }
});

rsObserver.observe(document.documentElement, { childList: true, subtree: true });

const rsInit = findVideo();
if (rsInit) attachToVideo(rsInit);
