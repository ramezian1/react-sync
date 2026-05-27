# ReactSync — Setup & Usage Guide

> **Tested on:** Windows 10/11 with the latest version of Google Chrome.
> If you're on an older version, update first at `chrome://settings/help`.

This guide walks you through installing ReactSync and syncing your first pair of videos from start to finish.

---

## Before You Start

You need:
- **Google Chrome** (latest version) or **Firefox 128+**
- The ReactSync extension installed ([Chrome Web Store](https://chromewebstore.google.com/detail/reactsync/eniimhjciampimfbffelhmpcc) or sideloaded from this repo)
- Two browser tabs — one with a reaction video, one with the source video

---

## Part 1: Installation

### Option A — Chrome Web Store (Recommended)

Install directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/reactsync/eniimhjciampimfbffelhmpcc) — no setup required.

Then skip to [Part 2: Syncing Videos](#part-2-syncing-videos).

---

### Option B — Developer / Sideload Install

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
4. In the file picker, navigate into the `react-sync` folder and select the **`src`** subfolder
5. ReactSync will appear in your extensions list with a green toggle

> **Common mistakes:**
> - Select the `src/` folder — not the parent `react-sync/` folder and not a subfolder inside `src/`
> - Do not move or delete the `react-sync/src/` folder after loading — Chrome loads the extension live from that path

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
4. Navigate into the `react-sync/src/` folder and select `manifest.json`

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

Reaction videos almost always have an intro before the movie starts, so the offset is typically the length of that intro. There are three ways to set it:

---

#### Option A — Mark Sync Point (Recommended)

This is the easiest method and works on all sites including Netflix and Disney+.

1. **Seek Tab A** (reaction) to the exact frame where the reactor starts watching the movie — the moment the movie appears on screen
2. Click **⊙ A** in the popup — it captures Tab A's current timestamp (e.g. `2:35`)
3. **Seek Tab B** (movie) to `0:00` — or the same matching scene if you prefer a mid-movie sync point
4. Click **⊙ B** in the popup — it captures Tab B's current timestamp (e.g. `0:00`)
5. The offset is calculated automatically (`2:35 - 0:00 = 155s`) — click **apply**
6. ReactSync sets the offset and syncs both tabs instantly

**Example — mid-movie sync point:**
If you're already partway through and want to re-sync, find the same recognisable scene in both tabs (a character walking through a door, a scene change), pause each tab at that exact moment, and click ⊙ A and ⊙ B. The offset is the difference between the two timestamps.

---

#### Option B — Auto-Detect (YouTube, Vimeo, Patreon, Twitch, Crunchyroll)

> Both videos must be **playing** when you click auto-detect. It will not work if either video is paused.

1. Make sure **both videos are playing**
2. Click the **◎ auto-detect offset** button
3. Wait approximately **15 seconds** while ReactSync captures audio from both tabs
4. A detected value appears (e.g. `+3.25s`) — click **apply**

> Auto-detect captures a short clip of audio from each tab and uses cross-correlation to find how far apart they are. It is best used for **fine-tuning** once you're already roughly aligned, not for finding a 2+ minute intro offset from scratch. It does **not** work on DRM-protected sites (Netflix, Disney+, HBO Max, etc.).

---

#### Option C — Manual Entry

Type the offset directly into the **Offset** field.

**How to calculate it:**
1. Pause both videos at the same visible moment in the content
2. Note the timestamp of each (e.g. Tab A = `2:35`, Tab B = `0:00`)
3. Subtract: `2:35 − 0:00 = 155 seconds`
4. Enter `155` in the offset field

| Situation | Offset |
|-----------|--------|
| Reaction video is ahead of source | Positive (e.g. `155`) |
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

### Step 8 — Choose Audio Source (Optional)

Once synced, an **🔊 Audio** row appears in the popup with three buttons: **Tab A**, **Tab B**, **Both**.

| Button | Effect | When to use |
|---|---|---|
| **Tab A** | Mutes Tab B, only the reaction's audio plays | You want the reactor's commentary front and centre |
| **Tab B** | Mutes Tab A, only the source's audio plays | You want clean movie audio without the reactor talking over it |
| **Both** (default) | Both tabs play audio | Mixed listening — both reactor and source |

You can switch between these at any time while watching — the change is instant. **CLEAR**ing sync resets this back to "Both".

---

### Fine-Tuning While Watching

If the sync feels slightly off after starting:

- Click **−** or **+** in the popup to nudge the offset by 0.5s, 1s, or 5s — the change takes effect immediately, no need to re-click SYNC
- Use **`Alt + Shift + ↑`** / **`Alt + Shift + ↓`** on your keyboard to nudge without even opening the popup

The nudge size buttons (`0.5s` / `1s` / `5s`) change how much each − / + click moves the offset. Use **5s** to catch up to a lag you've already noticed; use **0.5s** to dial in the final alignment.

---

## Part 3: Common Scenarios

### Scenario 1 — YouTube reaction to a YouTube source

The classic case. Both tabs support every feature.

1. Open the reaction video and the source video in two tabs
2. Pin ReactSync if you haven't already (see Step 3)
3. Click the **⟳ ReactSync** icon → pick both tabs
4. Use **Mark Sync Point** (recommended) or **Auto-detect** to find the offset
5. Hit **SYNC** → done

### Scenario 2 — YouTube reaction to a Netflix / Disney+ / Max source

DRM-protected services block audio capture, so **auto-detect won't work** on the source tab. Sync (play/pause/seek) still works perfectly. Use **Mark Sync Point** or **Manual Entry** instead.

1. Open the reaction (YouTube) and source (Netflix etc.) in two tabs
2. In the popup, pick both tabs
3. Seek both to the same recognisable scene (the moment the movie starts in the reaction → the movie's actual frame at that point)
4. Click **⊙ A** in the reaction tab's popup, then **⊙ B** in the source's
5. Click **apply** → ReactSync calculates the offset and syncs

> Avoid leaving full-screen mode on Netflix mid-sync — Netflix sometimes pauses when it loses focus, which will trigger ReactSync to pause the other tab too. That's working as intended; just hit play again.

### Scenario 3 — Patreon reaction to a local file or other source

Patreon's video player is fully supported. If your source is a local file (`file://` URL), make sure you've enabled **Allow access to file URLs** for ReactSync in `chrome://extensions`.

### Scenario 4 — Re-syncing mid-watch after a buffer or pause

If the videos drift apart by more than a second, ReactSync's drift correction (every 60 seconds) usually catches it. If not:

- Quick fix: use the **nudge** buttons or `Alt+Shift+↑/↓` keyboard shortcut
- Bigger drift: pause both, find the same matching scene in each, click **⊙ A** + **⊙ B** + **apply** — this re-marks the sync point with the current positions

### Scenario 5 — Switched to the next episode

ReactSync tracks specific tabs, so:

1. Click **CLEAR** in the popup
2. Reload both tabs (`Ctrl+R` / `Cmd+R`)
3. Start over from Step 4 with the new episode's offset

---

## Part 4: Understanding the Sync Methods

| Method | Range | Accuracy | Works on DRM | Best for |
|---|---|---|:---:|---|
| **Mark Sync Point** | Any offset | Frame-accurate (depends on how precisely you seek) | ✅ | First-time sync, large intros, DRM sites |
| **Auto-detect** | ±15 seconds | ~10 ms when locked on | ❌ | Fine-tuning after rough alignment |
| **Manual Entry** | Any offset | As precise as you type | ✅ | You already know the number |

### When auto-detect says "Couldn't lock on…"

This means the audio cross-correlation didn't find a confident match between the two tabs. Common causes:

- The two tabs are showing **different content** at that moment (e.g. the reactor is talking and the source is silent, or vice versa)
- The two tabs are **more than 15 seconds apart** in content position — outside auto-detect's range
- One or both tabs are at **low volume** or muted

**Fix**: roughly align the two tabs first (use Mark Sync Point, or manually seek), then run auto-detect again to fine-tune.

---

## Part 5: Tips & Troubleshooting

| Situation | What to do |
|-----------|------------|
| Don't know the offset | Use **Mark Sync Point** (⊙ A / ⊙ B) — seek each tab to the same moment |
| Auto-detect shows "video is paused" | Both videos must be **playing** before clicking auto-detect |
| Auto-detect shows "no audio signal" | Make sure the video is unmuted and not DRM-protected |
| Auto-detect shows "Couldn't lock on…" | The audio doesn't match (too far apart, or one tab is silent). Use Mark Sync Point to roughly align, then retry |
| Auto-detect shows "Capture stalled" | One of the videos paused mid-capture. Make sure both keep playing through the full 15 seconds |
| Netflix / Disney+ auto-detect not working | Expected — DRM blocks audio capture. Use Mark Sync Point or enter the offset manually |
| Sync feels slightly off | Click **−** / **+** nudge buttons while watching — they re-sync immediately |
| Tab not showing in dropdown | The video must be fully loaded — click **↻ refresh tabs**. Also reload any tabs that were open before installing ReactSync |
| Videos slowly drift out of sync | ReactSync auto-corrects every 60 seconds. You can also nudge manually |
| Tab A / Tab B picks reset when popup closes | This is fixed in v1.5.1+. Update via Chrome's extensions menu |
| Want to stop syncing | Click **CLEAR** |
| Switched to a new video | Click **CLEAR**, reload both tabs, then re-sync from Step 4 |
| Keyboard shortcut for nudging | `Alt + Shift + Up` / `Alt + Shift + Down` while watching |
| Want to see this guide again | Visit this page on GitHub, or re-open the onboarding by reinstalling the extension |

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
