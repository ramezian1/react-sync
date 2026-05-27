# ReactSync 🔄

> **Sync reaction videos with source videos across browser tabs — set the offset once and it handles the rest.**

ReactSync is a browser extension built for a common frustration: watching a reaction video (e.g. on Patreon or YouTube) side-by-side with the original movie or show, and having to manually pause and play both tabs every time. With ReactSync, you set the time offset once and every play, pause, and seek action mirrors automatically across both tabs.

---

## Features

- ✅ Auto-detects video tabs in your browser
- ✅ **Mark sync point** — seek each tab to the same moment, click ⊙ A + ⊙ B, offset calculated instantly
- ✅ **Auto-detect offset** — captures 15 s of audio from both tabs and calculates the offset automatically, with a confidence check that flags "couldn't lock on" instead of returning a garbage number
- ✅ Set a time offset manually between Tab A (reaction video) and Tab B (source video)
- ✅ Play, pause, and seek events mirror across both tabs in real time
- ✅ **Audio source selector** — pick which tab plays audio (Tab A only, Tab B only, or both)
- ✅ Fine-tune sync with nudge buttons (0.5s / 1s / 5s) or `Alt+Shift+↑` / `Alt+Shift+↓` keyboard shortcuts — updates live without re-clicking SYNC
- ✅ Drift correction runs every 60 seconds in the background
- ✅ Tab A / Tab B picks and offset persist across popup close, browser minimize, and service-worker restarts
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

> **Why no auto-detect on DRM sites?** Auto-detect works by listening to audio from the video. DRM-protected services (Netflix, Disney+, etc.) block audio capture at the browser level. Sync (play/pause/seek) still works — you just need to set the offset manually or use the mark sync point feature.

---

## Quick Start

1. Open your **reaction video** in Tab A and the **source video** in Tab B
2. Click the **ReactSync icon** in your toolbar
3. Select **Tab A** and **Tab B** from the dropdowns
4. Set the offset using one of the three methods below
5. Click **SYNC**
6. Play either video — the other follows automatically

### Setting the Offset

**Method 1 — Mark sync point (recommended for reaction videos with intros)**

Most reaction videos start with an intro before the movie begins. Use mark sync point to handle any intro length automatically:

1. Seek Tab A (reaction) to the **exact frame where the movie starts**
2. Click **⊙ A** in the popup
3. Seek Tab B (movie) to **0:00** (or the matching frame)
4. Click **⊙ B** in the popup
5. The offset is calculated automatically — click **apply**

**Method 2 — Auto-detect (YouTube, Vimeo, Patreon, Twitch — videos must be playing)**

1. Make sure **both videos are playing**
2. Click **◎ auto-detect offset**
3. Wait ~15 seconds — click **apply** when the result appears

> Detection range is ±15 s — best used to fine-tune after a rough Mark Sync Point alignment, not to find a 2-minute intro from scratch. If the cross-correlation can't lock on (different content, too far apart, or one tab silent), you'll see a clear "Couldn't lock on" message instead of a garbage offset. Does not work on DRM-protected sites (Netflix, Disney+, etc.).

**Method 3 — Manual**

Type the offset directly. The offset is how many seconds Tab A is ahead of Tab B.

| Scenario | Offset |
|----------|--------|
| Reaction video is ahead of the source | Positive (e.g. `155`) |
| Source video is ahead of the reaction | Negative (e.g. `-20`) |
| Videos start at the same time | `0` |

Use the **nudge buttons** (0.5s / 1s / 5s) to fine-tune while watching — they update sync instantly without re-clicking SYNC.

---

## Installation

ReactSync is available on the [Chrome Web Store](https://chromewebstore.google.com/detail/reactsync/eniimhjciampimfbffelhmpcc).

### Developer / Sideload Install

### Step 1 — Download the Extension

**Option A — No Git required:**
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
4. Select the `src/` folder inside the repo (e.g. `react-sync/src`)
5. ReactSync will appear in your extensions list

> Make sure you select the `src/` folder, not the root `react-sync` folder and not a subfolder inside `src/`.

### Step 3 — Pin to Toolbar

1. Click the **puzzle piece** icon (🧩) in the top-right of Chrome
2. Find **ReactSync** and click the **pin** icon next to it
3. The ReactSync icon will now appear in your toolbar for quick access

### Firefox (128+) — Experimental

1. Clone or download the repo (see Step 1 above)
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Navigate into the `react-sync/src/` folder and select `manifest.json`

> **Note:** Firefox temporary add-ons are removed when the browser closes. Permanent Firefox installation requires Mozilla signing.

---

## Project Structure

```
react-sync/
├── src/                   ← Extension source (load this folder in Chrome)
│   ├── manifest.json      # Extension config (Manifest V3)
│   ├── background.js      # Service worker — manages sync state, message routing, and audio cross-correlation
│   ├── content.js         # Injected into isolated world — bridges page-inject.js ↔ background
│   ├── page-inject.js     # Injected into MAIN world — hooks video events, executes playback, captures audio
│   ├── popup.html         # Popup UI
│   ├── popup.css          # Popup styles
│   ├── popup.js           # Popup logic
│   ├── onboarding.html    # First-install welcome / setup page
│   ├── onboarding.css     # Onboarding styles
│   ├── onboarding.js      # Onboarding logic (incl. one-click "Open ReactSync")
│   └── icons/             # Extension icons (16px, 48px, 128px)
├── docs/                  ← User-facing documentation
│   ├── tutorial-guide.md  # Full setup & usage walkthrough
│   └── shortcuts.html     # Keyboard shortcuts reference page
├── store/                 ← Chrome Web Store submission assets
│   ├── store-description.txt
│   ├── store-promo.html
│   ├── store-promo.png
│   ├── privacy-policy.html
│   └── whats-new.txt      # Release notes for the listing's "What's new" copy
├── .github/               # GitHub Actions / Sponsors config
├── google1d716e5b87e1b65f.html  # Google Search Console verification
├── README.md
├── LICENSE
└── .gitignore
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Tab not showing in dropdown | The video tab must be fully loaded first — click **↻ refresh tabs**. Also reload any tabs that were open before installing ReactSync |
| Don't know the offset | Use **mark sync point** (⊙ A / ⊙ B) or **auto-detect** |
| Auto-detect shows "video is paused" | Both videos must be **playing** before clicking auto-detect |
| Auto-detect shows "Couldn't lock on" | Audio doesn't match — get within ±15 s using mark sync point first, then retry to fine-tune |
| Auto-detect shows "Capture stalled" | One of the videos paused mid-capture — keep both playing through the full 15 s |
| Auto-detect doesn't work | Only works on non-DRM sites. Use mark sync point instead |
| Sync feels slightly off | Use the nudge buttons (0.5s / 1s / 5s) or `Alt+Shift+↑` / `Alt+Shift+↓` — they re-sync immediately |
| Netflix / Disney+ offset won't auto-detect | DRM blocks audio capture — use mark sync point or enter manually |
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
