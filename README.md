# ReactSync 🔄

> **Sync reaction videos with source videos across browser tabs — set the offset once and it handles the rest.**

ReactSync is a browser extension built for a common frustration: watching a reaction video (e.g. on Patreon or YouTube) side-by-side with the original movie or show, and having to manually pause and play both tabs every time. With ReactSync, you set the time offset once and every play, pause, and seek action mirrors automatically across both tabs.

---

## Features

- ✅ Auto-detects video tabs in your browser
- ✅ Set a time offset between Tab A (reaction video) and Tab B (source video)
- ✅ Play, pause, and seek events mirror across both tabs in real time
- ✅ Fine-tune sync with nudge buttons (0.5s / 1s / 5s increments)
- ✅ Sync state persists while tabs remain open
- ✅ Works with YouTube, Patreon, Vimeo, Netflix, Disney+, and any HTML5 video
- ✅ Zero data collected — fully local, nothing leaves your browser

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

> **Why no auto-detect on DRM sites?** Auto-detect works by listening to audio from the video. DRM-protected services (Netflix, Disney+, etc.) block audio capture at the browser level. Sync (play/pause/seek) still works — you just need to set the offset manually.

---

## Quick Start

1. Open your **reaction video** in Tab A and the **source video** in Tab B
2. Click the **ReactSync icon** in your toolbar
3. Select **Tab A** and **Tab B** from the dropdowns
4. Set the offset — e.g. `45` if the reaction video starts 45 seconds ahead of the source
5. Click **SYNC**
6. Play either video — the other follows automatically

### Understanding the Offset

| Scenario | Offset Value |
|----------|--------------|
| Reaction video is ahead of the source | Positive number (e.g. `45`) |
| Source video is ahead of the reaction | Negative number (e.g. `-20`) |
| Videos start at the same time | `0` |

Use the **nudge buttons** (0.5s / 1s / 5s) to fine-tune the offset while watching.

---

## Installation (Developer / Sideload)

> ReactSync is not yet on the Chrome Web Store. Follow the steps below to install it manually.

### Step 1 — Download the Extension

**Option A — No Git required (recommended for most users):**
1. Click the green **Code** button at the top of this page
2. Select **Download ZIP**
3. Unzip the downloaded file to a folder you can find easily (e.g. `Desktop/react-sync`)

**Option B — With Git:**
```bash
git clone https://github.com/ramezian1/react-sync.git
```

### Step 2 — Load into Chrome

1. Open Chrome and go to `chrome://extensions`
2. Toggle on **Developer Mode** (top-right corner)
3. Click **Load unpacked**
4. Select the unzipped `react-sync` folder
5. ReactSync will appear in your extensions list

> Make sure you select the `react-sync` folder itself, not a subfolder inside it.

### Step 3 — Pin to Toolbar

1. Click the **puzzle piece** icon (🧩) in the top-right of Chrome
2. Find **ReactSync** and click the **pin** icon next to it
3. The ReactSync icon will now appear in your toolbar for quick access

### Firefox (128+) — Experimental

1. Clone or download the repo (see Step 1 above)
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Navigate into the `react-sync` folder and select `manifest.json`

> **Note:** Firefox temporary add-ons are removed when the browser closes. Permanent Firefox installation requires Mozilla signing.

---

## Project Structure

```
react-sync/
├── manifest.json      # Extension config (Manifest V3)
├── popup.html         # Popup UI
├── popup.css          # Popup styles
├── popup.js           # Popup logic
├── background.js      # Service worker — manages sync state & message routing
├── page-inject.js     # Injected into MAIN world — hooks video events & executes playback
├── content.js         # Injected into isolated world — bridges page-inject.js ↔ background
└── icons/             # Extension icons
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tab not showing in dropdown | The video tab must be fully loaded first — click **↻ refresh tabs** |
| Sync feels slightly off | Use the nudge buttons (0.5s / 1s / 5s) while the video is playing |
| Netflix / Disney+ offset won't auto-detect | DRM blocks audio capture — set the offset manually |
| Videos get out of sync over time | Auto drift correction runs every 60 seconds — or nudge manually |
| Want to stop syncing | Click **CLEAR** |
| Switched to a new video | Click **CLEAR**, reload the tabs, then re-sync |

---

## Tech Stack

- Vanilla JavaScript (no frameworks)
- Chrome Extensions Manifest V3
- HTML5 Video API + site-specific hooks (YouTube, Vimeo, etc.)

---

## License

MIT — see [LICENSE](LICENSE) for details.
