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

function clampTime(video, t) {
  const max = isFinite(video.duration) ? video.duration : t;
  return Math.max(0, Math.min(t, max));
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

  if (type === 'CAPTURE_AUDIO') {
    captureAudioSamples(reqId, e.data.duration || 10);
    return;
  }

  if (!videoEl || !document.contains(videoEl)) videoEl = findVideo();
  if (!videoEl) return;

  if (type === 'CMD_MUTE') {
    videoEl.muted = true;
    return;
  } else if (type === 'CMD_UNMUTE') {
    videoEl.muted = false;
    return;
  }

  suppress();

  if (type === 'CMD_PLAY') {
    if (e.data.seekTo !== undefined) videoEl.currentTime = clampTime(videoEl, e.data.seekTo);
    videoEl.play().catch(() => {});
  } else if (type === 'CMD_PAUSE') {
    videoEl.pause();
  } else if (type === 'CMD_SEEK') {
    videoEl.currentTime = clampTime(videoEl, e.data.time);
  }
});

// ── Audio capture for offset detection ───────────────────────────────────────
// Records durationSeconds of audio from the video, resamples to 4 kHz, and
// posts back Int16 samples. Runs in MAIN world so captureStream() works on
// sites that would block it from an isolated content script.

// Worklet processor inlined as a Blob URL — page-inject runs in MAIN world
// and has no access to chrome.runtime.getURL for a packaged worklet file.
const _workletSrc = `
class PCMCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this._done = false;
    this.port.onmessage = (e) => { if (e.data === 'stop') this._done = true; };
  }
  process(inputs) {
    if (this._done) return false;
    const ch = inputs[0]?.[0];
    if (ch && ch.length) this.port.postMessage(ch.slice());
    return true;
  }
}
registerProcessor('rs-pcm-capture', PCMCapture);
`;

let isCapturing = false;

async function captureAudioSamples(reqId, durationSeconds) {
  if (isCapturing) {
    window.postMessage({ __rs: true, type: 'AUDIO_CAPTURED', reqId, error: 'Already capturing' }, '*');
    return;
  }
  if (!videoEl || !document.contains(videoEl)) videoEl = findVideo();
  if (!videoEl) {
    window.postMessage({ __rs: true, type: 'AUDIO_CAPTURED', reqId, error: 'No video found' }, '*');
    return;
  }

  isCapturing = true;
  try {
    if (videoEl.paused) {
      throw new Error('Video is paused — press play on both tabs before auto-detecting');
    }
    const stream = videoEl.captureStream();
    if (stream.getAudioTracks().length === 0) {
      throw new Error('No audio track — content may be DRM-protected');
    }

    const audioCtx = new AudioContext();
    // Chrome suspends AudioContext when created outside a user gesture — resume it explicitly
    await audioCtx.resume();
    const source = audioCtx.createMediaStreamSource(stream);
    const targetRate = 4000;
    const nativeRate = audioCtx.sampleRate;
    const targetSamples = Math.ceil(durationSeconds * nativeRate);
    // Pre-allocate to avoid repeated resizing from push() on 480 K+ samples
    const collected = new Float32Array(targetSamples);
    let collectedCount = 0;

    const blobUrl = URL.createObjectURL(new Blob([_workletSrc], { type: 'application/javascript' }));
    await audioCtx.audioWorklet.addModule(blobUrl);
    URL.revokeObjectURL(blobUrl);

    await new Promise((resolve, reject) => {
      const workletNode = new AudioWorkletNode(audioCtx, 'rs-pcm-capture');

      // Silent gain so captured audio isn't doubled through speakers
      const silent = audioCtx.createGain();
      silent.gain.value = 0;
      source.connect(workletNode);
      workletNode.connect(silent);
      silent.connect(audioCtx.destination);

      let gotAudio = false;
      let silenceTimer = null;
      let stallTimer = null;
      let settled = false;

      const teardown = () => {
        clearTimeout(silenceTimer);
        clearTimeout(stallTimer);
        try { workletNode.port.postMessage('stop'); } catch {}
        try { workletNode.disconnect(); } catch {}
        try { source.disconnect(); } catch {}
      };

      workletNode.port.onmessage = (e) => {
        if (settled) return;
        // Worklet always sends Float32Array, but guard against unexpected types
        const chunk = e.data instanceof Float32Array ? e.data : new Float32Array(e.data);
        const available = Math.min(chunk.length, targetSamples - collectedCount);
        collected.set(chunk.subarray(0, available), collectedCount);
        collectedCount += available;
        if (!gotAudio && chunk.some(s => s !== 0)) gotAudio = true;
        if (collectedCount >= targetSamples) {
          settled = true;
          teardown();
          audioCtx.close().then(resolve);
        }
      };

      // If no audio signal after 3s, the stream is silent/DRM-blocked
      silenceTimer = setTimeout(() => {
        if (settled || gotAudio) return;
        settled = true;
        teardown();
        audioCtx.close();
        reject(new Error('No audio signal — video may be muted or DRM-protected'));
      }, 3000);

      // Hard stall guard: capture should complete in ~durationSeconds.
      // If audio started flowing but then stopped (e.g. video paused mid-capture),
      // resolve with what we have if it's enough to cross-correlate, else reject.
      stallTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        teardown();
        const minUsable = Math.floor(targetSamples * 0.4); // need ≥40% of window
        if (gotAudio && collectedCount >= minUsable) {
          audioCtx.close().then(resolve);
        } else {
          audioCtx.close();
          reject(new Error('Capture stalled — keep both videos playing through the full 10s'));
        }
      }, (durationSeconds + 3) * 1000);
    });

    // Downsample via decimation and quantize to Int16 in one pass (~160 KB for 10 s)
    const ratio = nativeRate / targetRate;
    const count = Math.min(collectedCount, targetSamples);
    const decimLength = Math.floor(count / ratio);
    const samples = new Array(decimLength);
    for (let i = 0; i < decimLength; i++) {
      const s = collected[Math.floor(i * ratio)];
      samples[i] = Math.round(Math.max(-1, Math.min(1, s)) * 32767);
    }

    window.postMessage({ __rs: true, type: 'AUDIO_CAPTURED', reqId, samples, sampleRate: targetRate }, '*');
  } catch (err) {
    window.postMessage({ __rs: true, type: 'AUDIO_CAPTURED', reqId, error: err.message }, '*');
  } finally {
    isCapturing = false;
  }
}

// Stay alive permanently — Netflix/Disney+ replace <video> elements on
// loading screens, ads, and episode transitions.
// Debounced so findVideo() doesn't run on every individual DOM mutation
// (heavy pages like YouTube can fire hundreds of mutations per second).
let _mutationTimer = null;
const rsObserver = new MutationObserver(() => {
  if (_mutationTimer) return;
  _mutationTimer = setTimeout(() => {
    _mutationTimer = null;
    const v = findVideo();
    if (!v) return;
    if (!videoEl || !document.contains(videoEl) || v !== videoEl) {
      attachToVideo(v);
    }
  }, 200);
});

rsObserver.observe(document.documentElement, { childList: true, subtree: true });

const rsInit = findVideo();
if (rsInit) attachToVideo(rsInit);
