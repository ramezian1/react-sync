# ReactSync 🔄

[![GitHub Sponsors](https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/ramezian1)
[![License: MIT](https://img.shields.io/badge/license-MIT-00e5a0)](LICENSE)

> Sync reaction videos with source videos across browser tabs. Set the offset once — it handles the rest.

Built for the classic pain point: watching a reaction video alongside the original on YouTube, Patreon, Netflix, or anywhere else — and having to manually pause/play both every time.

---

## Features

- ✅ Detects video tabs automatically
- ✅ Set a time offset between Tab A (reaction) and Tab B (source)
- ✅ Play, pause, and seek events mirror across both tabs in real time
- ✅ Nudge offset in 0.5s / 1s / 5s increments, or use **Alt+Shift+Up / Down** keyboard shortcuts
- ✅ Auto-detect offset via audio fingerprinting (~10s, works on non-DRM content)
- ✅ Sync state persists across popup closes — reopening the popup restores your tabs and offset
- ✅ Handles tab refreshes — sync resumes automatically once the video reloads
- ✅ Dark and light mode
- ✅ Works with YouTube, Patreon, Vimeo, Netflix, Disney+, and any HTML5 video player
- ✅ Zero data collected, fully local

---

## Supported Sites

| Site | Sync (play / pause / seek) | Auto-detect offset |
|------|:--------------------------:|:------------------:|
| ![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=flat&logo=youtube&logoColor=white) | ✅ | ✅ |
| ![Vimeo](https://img.shields.io/badge/Vimeo-1AB7EA?style=flat&logo=vimeo&logoColor=white) | ✅ | ✅ |
| ![Patreon](https://img.shields.io/badge/Patreon-FF424D?style=flat&logo=patreon&logoColor=white) | ✅ | ✅ |
| ![Twitch](https://img.shields.io/badge/Twitch-9146FF?style=flat&logo=twitch&logoColor=white) | ✅ | ✅ |
| ![Crunchyroll](https://img.shields.io/badge/Crunchyroll-F47521?style=flat&logo=crunchyroll&logoColor=white) | ✅ | ✅ |
| ![Netflix](https://img.shields.io/badge/Netflix-E50914?style=flat&logo=netflix&logoColor=white) | ✅ | ❌ DRM |
| ![Disney+](https://img.shields.io/badge/Disney+-0072D2?style=flat&logo=disneyplus&logoColor=white) | ✅ | ❌ DRM |
| ![Max](https://img.shields.io/badge/Max-002BE7?style=flat&logo=hbo&logoColor=white) | ✅ | ❌ DRM |
| ![Hulu](https://img.shields.io/badge/Hulu-1CE783?style=flat&logo=hulu&logoColor=black) | ✅ | ❌ DRM |
| ![Amazon Prime](https://img.shields.io/badge/Prime_Video-00A8E0?style=flat&logo=amazonprime&logoColor=white) | ✅ | ❌ DRM |
| ![Apple TV+](https://img.shields.io/badge/Apple_TV+-000000?style=flat&logo=appletv&logoColor=white) | ✅ | ❌ DRM |
| ![Paramount+](https://img.shields.io/badge/Paramount+-0064FF?style=flat&logo=paramountplus&logoColor=white) | ✅ | ❌ DRM |
| ![Peacock](https://img.shields.io/badge/Peacock-000000?style=flat&logo=peacocktv&logoColor=white) | ✅ | ❌ DRM |

> **Auto-detect** requires capturing audio from the video. DRM-protected services block this at the browser level — set the offset manually on those sites.

---

## How It Works

1. Open your reaction video in Tab A and your source video in Tab B
2. Click the ReactSync icon in your toolbar
3. Select Tab A and Tab B from the dropdowns
4. Set the offset (e.g. `45` if the reaction video starts 45 seconds before the source)
5. Hit **SYNC**
6. Play either video — the other follows automatically

**Offset explained:**
- Positive offset = Tab A (reaction) is ahead of Tab B (source)
- Negative offset = Tab B (source) is further along than Tab A
- Use the nudge buttons or keyboard shortcuts to fine-tune in real time

---

## Install (Development)

### Chrome
1. Clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked** → select the `react-sync` folder
5. Pin the extension from the toolbar puzzle icon

### Firefox (128+)
1. Clone this repo
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** → select `manifest.json`

---

## Project Structure

```
react-sync/
├── manifest.json       # Extension config (Manifest V3)
├── popup.html          # Popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic
├── background.js       # Service worker — manages sync state & message routing
├── page-inject.js      # Injected into MAIN world — hooks video events & executes playback
├── content.js          # Injected into isolated world — bridges page-inject.js ↔ background
└── icons/              # Extension icons
```

---

## Known Limitations / Roadmap

- [x] Netflix & Disney+ support — MAIN world injection bypasses playback guards
- [x] Auto-detect offset by audio fingerprinting (±10s range, works on non-DRM content)
- [x] Firefox support (Firefox 128+)
- [x] Keyboard shortcut for nudging offset while watching (Alt+Shift+Up / Down)
- [x] Persist sync state across popup closes and service worker restarts
- [x] Dark / light mode toggle
- [x] Tab refresh handling — sync resumes automatically
- [x] Auto-pause when a video ends
- [x] Focus-pause fix for Amazon Prime (spoof document.hidden while synced)
- [x] Audio source selector — choose Tab A, Tab B, or Both
- [ ] Visual drift indicator

---

## Tech Stack

- Vanilla JS (no frameworks needed)
- Chrome Extensions Manifest V3
- YouTube HTML5 video API + generic `<video>` element events
- `chrome.tabs` messaging for cross-tab sync
- Web Audio API + FFT cross-correlation for offset auto-detection

---

## Documentation

- [Setup & Usage Guide](tutorial-guide.md) — step-by-step instructions, supported sites, and tips
- [Privacy Policy](https://ramezian1.github.io/react-sync/privacy-policy.html)

---

## Author

Bobby Mezian — [github.com/ramezian1](https://github.com/ramezian1)
