# ReactSync 🔄

> Sync reaction videos with source videos across browser tabs. Set the offset once — it handles the rest.

Built for the classic pain point: watching a Patreon reaction video alongside the original movie/show and having to manually pause/play both every time.

---

## Features

- ✅ Detects video tabs automatically
- ✅ Set a time offset between Tab A (reaction) and Tab B (source)
- ✅ Play, pause, and seek events mirror across both tabs
- ✅ Nudge offset in 0.5s / 1s / 5s increments for fine-tuning
- ✅ Sync state persists while tabs are open
- ✅ Works with YouTube, Patreon, Vimeo, Netflix, Disney+, and any HTML5 video
- ✅ Zero data collected, fully local

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
- Use the nudge buttons to fine-tune in real time

---

## Install (Development)

### Chrome
1. Clone this repo
2. Go to `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load unpacked** → select the `reactsync` folder
5. Pin the extension from the toolbar puzzle icon

### Firefox (128+)
1. Clone this repo
2. Go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** → select `manifest.json`

---

## Project Structure

```
reactsync/
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
- [ ] Auto-detect offset by audio fingerprinting (future feature)
- [x] Firefox support (Firefox 128+)
- [ ] Keyboard shortcut for nudging offset while watching

---

## Tech Stack

- Vanilla JS (no frameworks needed)
- Chrome Extensions Manifest V3
- YouTube HTML5 video API + generic `<video>` element events
- `chrome.tabs` messaging for cross-tab sync

---

## Author

Bobby Mezian — [github.com/ramezian1](https://github.com/ramezian1)
