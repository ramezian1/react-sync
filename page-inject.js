// page-inject.js - Runs in MAIN world (page execution context)
// By running here, video.play() is treated as a trusted page call — this
// bypasses Netflix/Disney+ guards that reject programmatic play from
// isolated content scripts.

let videoEl = null;
let suppressEvents = false;
let suppressTimeout = null;
let syncActive = false;

// Prevent focus-pause (Amazon Prime Video, etc.) while sync is active
// by spoofing document.hidden / visibilityState in MAIN world.
const _hiddenDesc = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
const _visDesc    = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
Object.defineProperty(document, 'hidden', {
  get() { return syncActive ? false : _hiddenDesc.get.call(this); },
  configurable: true
});
Object.defineProperty(document, 'visibilityState', {
  get() { return syncActive ? 'visible' : _visDesc.get.call(this); },
  configurable: true
});

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

  video.addEventListener('ended', () => {
    if (suppressEvents) return;
    window.postMessage({ __rs: true, type: 'VIDEO_ENDED' }, '*');
  });
}

// Handle commands and time queries relayed from content.js
window.addEventListener('message', (e) => {
  if (!e.data?.__rsCmd) return;
  const { type, reqId } = e.data;

  if (type === 'CMD_SYNC_ACTIVE') {
    syncActive = e.data.active;
    return;
  }

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

  suppress();

  if (type === 'CMD_PLAY') {
    if (e.data.seekTo !== undefined) videoEl.currentTime = e.data.seekTo;
    videoEl.play().catch(() => {});
  } else if (type === 'CMD_PAUSE') {
    videoEl.pause();
  } else if (type === 'CMD_SEEK') {
    videoEl.currentTime = Math.max(0, e.data.time);
  } else if (type === 'CMD_MUTE') {
    videoEl.muted = true;
  } else if (type === 'CMD_UNMUTE') {
    videoEl.muted = false;
  }
});

// ── Audio capture for offset detection ───────────────────────────────────────
// Records durationSeconds of audio from the video, resamples to 4 kHz, and
// posts back Int16 samples. Runs in MAIN world so captureStream() works on
// sites that would block it from an isolated content script.
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
    const stream = videoEl.captureStream();
    if (stream.getAudioTracks().length === 0) {
      throw new Error('No audio track — content may be DRM-protected');
    }

    // Use ScriptProcessorNode to capture raw PCM — more reliable than
    // MediaRecorder which fails on many sites due to codec constraints.
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const targetRate = 4000;
    const nativeRate = audioCtx.sampleRate;
    const targetSamples = durationSeconds * nativeRate;
    const collected = [];

    await new Promise((resolve, reject) => {
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);

      // Route through a silent gain so audio isn't doubled through speakers
      const silent = audioCtx.createGain();
      silent.gain.value = 0;
      source.connect(processor);
      processor.connect(silent);
      silent.connect(audioCtx.destination);

      let gotAudio = false;
      processor.onaudioprocess = (e) => {
        const chunk = e.inputBuffer.getChannelData(0);
        for (let i = 0; i < chunk.length; i++) collected.push(chunk[i]);
        if (!gotAudio && chunk.some(s => s !== 0)) gotAudio = true;
        if (collected.length >= targetSamples) {
          processor.onaudioprocess = null;
          processor.disconnect();
          source.disconnect();
          audioCtx.close().then(resolve);
        }
      };

      // If no audio signal after 3s, the stream is silent/DRM-blocked
      setTimeout(() => {
        if (!gotAudio) {
          processor.disconnect();
          source.disconnect();
          audioCtx.close();
          reject(new Error('No audio signal — video may be muted or DRM-protected'));
        }
      }, 3000);
    });

    // Downsample via decimation: pick every Nth sample
    const ratio = nativeRate / targetRate;
    const decimated = [];
    for (let i = 0; i < Math.floor(Math.min(collected.length, targetSamples) / ratio); i++) {
      decimated.push(collected[Math.floor(i * ratio)]);
    }

    // Quantize to Int16 for compact JSON transfer (~160 KB for 10 s)
    const samples = decimated.map(s => Math.round(Math.max(-1, Math.min(1, s)) * 32767));

    window.postMessage({ __rs: true, type: 'AUDIO_CAPTURED', reqId, samples, sampleRate: targetRate }, '*');
  } catch (err) {
    window.postMessage({ __rs: true, type: 'AUDIO_CAPTURED', reqId, error: err.message }, '*');
  } finally {
    isCapturing = false;
  }
}

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
