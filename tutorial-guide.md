# ReactSync — Setup & Usage Guide

> **Tested on:** Windows 10/11 with the latest version of Google Chrome.
> If you're on an older version, update first at `chrome://settings/help`.

This guide walks you through installing ReactSync and syncing your first pair of videos from start to finish.

---

## Before You Start

You need:
- **Google Chrome** (latest version) or **Firefox 128+**
- The ReactSync extension files (downloaded from this repo)
- Two browser tabs — one with a reaction video, one with the source video

---

## Part 1: Installation

### Step 1 — Download ReactSync

**If you don't have Git (most users):**
1. Click the green **Code** button at the top of the [react-sync repo](https://github.com/ramezian1/react-sync)
2. Click **Download ZIP**
3. Once downloaded, **right-click the ZIP file** and select **Extract All** (Windows) or double-click to unzip (Mac)
4. Move the unzipped `react-sync` folder somewhere easy to find (e.g. your Desktop)

**If you have Git installed:**
```bash
git clone https://github.com/ramezian1/react-sync.git
```

> Do not delete or move the folder after loading it into Chrome — the extension loads from that location.

---

### Step 2 — Load into Chrome

1. Open Chrome and navigate to `chrome://extensions` in the address bar
2. Toggle **Developer Mode** on (top-right corner of the page)
3. Click the **Load unpacked** button that appears
4. In the file picker, navigate to and select the `react-sync` folder you unzipped in Step 1
5. ReactSync will appear in your extensions list with a green toggle

> **Common mistake:** Make sure you select the `react-sync` folder itself — not a parent folder and not a subfolder inside it.

---

### Step 3 — Pin to Your Toolbar

1. Click the **puzzle piece icon** (🧩) in the top-right of Chrome
2. Find **ReactSync** in the list and click the **pin icon** next to it
3. The ReactSync icon will now appear in your Chrome toolbar

---

### Firefox Setup (Experimental, 128+)

> Firefox support is experimental. Only tested on Windows.

1. Download or clone the repo (see Step 1 above)
2. Open Firefox and go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Navigate into the `react-sync` folder and select `manifest.json`

> **Important:** Firefox temporary add-ons are unloaded when the browser closes. You will need to reload the extension each time you restart Firefox until a signed version is available.

---

## Part 2: Syncing Videos

### Step 4 — Open Your Two Videos

Open two tabs in Chrome:
- **Tab A** — the **reaction video** (e.g. a YouTuber reacting to a movie)
- **Tab B** — the **source video** (e.g. the movie or show being reacted to)

**Tips for best results:**
- Make sure both videos are fully loaded before opening the ReactSync popup
- Use Chrome's built-in **Split View** feature to watch both side-by-side without needing a second window

---

### Step 5 — Open ReactSync and Select Your Tabs

1. Click the **ReactSync icon** in your toolbar
2. In the **Reaction Video** dropdown, select Tab A
3. In the **Source Video** dropdown, select Tab B
4. If a tab doesn't appear in the dropdown, click **↻ refresh tabs** and try again

> Both video tabs must be loaded and visible for ReactSync to detect them.

---

### Step 6 — Set the Offset

The **offset** is how many seconds Tab A (the reaction) is ahead of Tab B (the source).

**Example:** If the reaction video is at `1:20` and the source video is at `0:35`, the offset is `45` seconds.

#### Option A — Auto-Detect (YouTube, Vimeo, Patreon, Twitch, Crunchyroll only)

1. Make sure **both videos are playing**
2. Click the **◎ auto-detect offset** button
3. Wait approximately **10 seconds** while ReactSync listens
4. A detected value appears (e.g. `+3.25s`) — click **apply**

> Auto-detect captures audio from both tabs to find the offset. It does **not** work on DRM-protected sites (Netflix, Disney+, HBO Max, etc.) because those services block audio capture at the browser level.

#### Option B — Manual (Required for Netflix, Disney+, HBO Max, etc.)

1. Pause both videos at the same visible moment in the content
2. Note the current timestamp on each tab (e.g. Tab A = `1:20`, Tab B = `0:35`)
3. Calculate the difference: `1:20 - 0:35 = 45 seconds`
4. Enter `45` in the **Offset** field
5. Use the **nudge buttons** (0.5s / 1s / 5s) to fine-tune if needed

**Offset sign reference:**

| Situation | Offset |
|-----------|--------|
| Reaction video is ahead of source | Positive (e.g. `45`) |
| Source video is ahead of reaction | Negative (e.g. `-20`) |
| Both start at the same time | `0` |

---

### Step 7 — Hit SYNC

1. Click the **SYNC** button
2. The **green dot** in the top-right of the popup will light up — sync is now active

From this point:
- Press **play** on either tab → the other tab plays automatically
- Press **pause** on either tab → the other tab pauses
- **Seek** (scrub) on either tab → the other tab jumps to the correct position

---

## Part 3: Tips & Troubleshooting

| Situation | What to do |
|-----------|------------|
| Sync feels slightly off | Use the nudge buttons (0.5s / 1s / 5s) while the video is playing |
| Tab not showing in dropdown | The video must be fully loaded — click **↻ refresh tabs** |
| Netflix / Disney+ auto-detect not working | This is expected — DRM blocks audio capture. Set the offset manually |
| Videos slowly drift out of sync | ReactSync auto-corrects every 60 seconds. You can also nudge manually |
| Want to stop syncing | Click **CLEAR** |
| Switched to a new video | Click **CLEAR**, reload both tabs, then re-sync from Step 4 |
| Keyboard shortcut for nudging | `Alt + Shift + Up` / `Alt + Shift + Down` while watching |

---

## Supported Sites

| Site | Sync | Auto-detect offset |
|------|:----:|:-----------------:|
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
