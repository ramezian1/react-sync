# ReactSync — Setup & Usage Guide

> **Tested on:** Windows 10/11 with the latest version of Google Chrome.
> If you're on an older Chrome version, update it first — go to **chrome://settings/help** to check.

---

## Step 1: Clone/Download this Repository (react-sync)

Go to [github.com/ramezian1/react-sync](https://github.com/ramezian1/react-sync), click the green **Code** button → **Download ZIP**, then unzip it somewhere on your computer.
Or if you have Git installed, use git clone command to clone the repository into your directory. 

---

## Step 2: Load it into Chrome

> Make sure you have the **latest version of Chrome** installed before continuing — go to **chrome://settings/help** to check.

1. Open Chrome and go to **chrome://extensions** (Firefox currently in beta)
2. Toggle on **Developer Mode** in the top-right corner
3. Click **Load unpacked**
4. Select the unzipped `react-sync` folder
5. ReactSync will appear in your extensions list

---

## Step 3: Pin it to Your Toolbar

1. Click the **puzzle piece** icon in the top-right of Chrome
2. Find **ReactSync** and click the **pin** icon next to it
3. The ReactSync icon (⟳) will now appear in your toolbar

---

## Step 4: Open Your Two Videos

- **Tab A** — your reaction video (e.g. a YouTube reaction)
- **Tab B** — the original source video (e.g. the movie/show being reacted to)
- Highly Recommend using the new **Chrome "Split View"** feature, which lets you split your browser between 2 tabs rather then having to separate the tabs and fit them to one side of your screen.

Make sure both videos are loaded and visible before opening the popup.

---

## Step 5: Set Up the Sync

1. Click the **ReactSync icon** in your toolbar
2. In the **Reaction Video** dropdown, select Tab A
3. In the **Source Video** dropdown, select Tab B
4. If your tabs don't appear, click **↻ refresh tabs**

---

## Step 6: Set the Offset

The offset = how many seconds Tab A (reaction) is **ahead** of Tab B (source).

### Option A — Set it manually
- Pause both videos at the same moment in the content
- Calculate the time difference (e.g. reaction is at 1:20, source is at 0:35 → offset is `45`)
- Type that number into the **Offset** field
- Use the **nudge buttons** (0.5s / 1s / 5s) to fine-tune

### Option B — Auto-detect (YouTube, Vimeo, Patreon, Twitch only)
- Make sure both videos are **playing**
- Click **◎ auto-detect offset**
- Wait ~10 seconds while it listens
- A detected value appears (e.g. `+3.25s`) — click **apply**

> Auto-detect does not work on Netflix, Disney+, or other DRM-protected services. Set the offset manually on those sites.

---

## Step 7: Hit SYNC

Click the **SYNC** button. The green dot in the top-right corner of the popup will light up.

From this point on:
- Press play on either tab → the other follows
- Pause either tab → the other pauses
- Scrub / seek either tab → the other jumps to the correct position

---

## Firefox Setup (128+)

> Firefox support is experimental and has only been tested on Windows.

1. Clone or download the repo
2. Go to **about:debugging#/runtime/this-firefox**
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file inside the `react-sync` folder

> Note: Temporary add-ons are removed when Firefox closes. For permanent installation, the extension would need to be signed by Mozilla.

---

## Supported Sites

> Tested on **Windows 10/11 + latest Chrome**. Behaviour on other operating systems or browsers may vary.

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

---

## Tips

| Situation | What to do |
|-----------|------------|
| Sync feels slightly off | Use the nudge buttons (0.5s / 1s / 5s) to fine-tune while watching |
| Tab not showing in dropdown | The video must be loaded first — hit ↻ refresh tabs |
| Netflix / Disney+ | Sync works, but auto-detect is blocked by DRM — set offset manually |
| Want to stop syncing | Click **CLEAR** |
| Switched to a new video | Hit CLEAR, reload the tabs, then re-sync |
