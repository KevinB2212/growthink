<p align="center">
  <img src="https://img.shields.io/badge/version-5.1-00e6a7?style=for-the-badge&labelColor=0a0a1a" alt="Version">
  <img src="https://img.shields.io/badge/PWA-installable-00c9ff?style=for-the-badge&logo=pwa&labelColor=0a0a1a" alt="PWA">
  <img src="https://img.shields.io/badge/vanilla-JS-f7df1e?style=for-the-badge&logo=javascript&labelColor=0a0a1a" alt="Vanilla JS">
  <img src="https://img.shields.io/badge/zero-frameworks-a855f7?style=for-the-badge&labelColor=0a0a1a" alt="No Frameworks">
  <img src="https://img.shields.io/badge/license-MIT-ff4757?style=for-the-badge&labelColor=0a0a1a" alt="MIT License">
</p>

<h1 align="center">🌱 GroWthink</h1>

<p align="center">
  <strong>A mindful note-taking app where your thoughts grow a living plant.</strong><br>
  Write, reflect, earn XP, and watch your garden flourish.
</p>

<p align="center">
  <a href="https://kevinb2212.github.io/growthink"><strong>🚀 Try it live →</strong></a>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="https://kevinb2212.github.io/growthink/about.html"><strong>📖 Full Feature Docs →</strong></a>
</p>

---

## ✨ What is GroWthink?

GroWthink combines journaling with gamification. Every note you write **waters your virtual plant**, earning XP and keeping it alive. Skip a day? Your plant's health drops. Build streaks, unlock achievements, and watch your garden grow as your mind does.

**The core loop:** Write → Earn XP → Level Up → Plant Grows → Unlock Rewards → Keep Writing

---

## 🎯 Features

### 📝 Writing & Input
- Rich notes with mood tracking, categories, and tags
- Focus mode — distraction-free fullscreen writing
- AI chat interface for conversational note capture
- Speech-to-text, photo notes, and voice recordings
- Smart tag suggestions and note templates

### 🌿 Plant & Garden
- 4 plant species with procedural SVG rendering
- Plant DNA system — 8 genetic traits, mutations, and breeding
- Multi-plant garden tied to note categories
- 5 evolution stages: Sprout → Sapling → Bloom → Ancient → Legendary
- Pet companions (Cat, Bird, Frog, Butterfly, Squirrel)

### 📈 Analytics
- Sentiment analysis with 30-day trend chart
- Word cloud visualization
- Weekly review cards and 90-day activity heatmap
- Location-tagged notes with interactive map
- Mind map generator on canvas

### 🎮 Gamification
- XP system with 20+ levels and streak tracking
- 12 achievement badges and daily/weekly challenges
- Cosmetic shop with 35+ items (hats, effects, pots)
- Pomodoro timer with XP bonus
- Challenge mode with personal records

### 🎵 Sound & Atmosphere
- Procedural lo-fi music engine (no audio files!)
- 5 adaptive soundscapes: Rain, Ocean, Forest, Campfire, Café
- Dynamic sky that follows time of day (8 phases)
- Weather integration with animated particles

### 📤 Export & Sync
- Export as JSON, Markdown, CSV, or text
- Monthly zine — auto-generated magazine from your notes
- QR code sync for cross-device data transfer
- Notion integration
- PIN lock for private notes

---

## 🏗️ Architecture

```
index.html    →  429 lines   Clean HTML structure
style.css     →  615 lines   Full responsive styling
app.js        →  1,115 lines Core application logic
db.js         →  IndexedDB storage layer (50MB+)
perf.js       →  Debounce, throttle, lazy loading, virtual scroll
lofi.js       →  Procedural lo-fi music engine (Web Audio API)
sounds.js     →  Ambient soundscape generator
sw.js         →  Service worker with offline caching
```

**Zero frameworks. Zero dependencies.** Pure vanilla HTML, CSS, and JavaScript. Runs entirely in your browser with no server required.

### Performance Optimizations
- Lazy-loaded CDN scripts (Leaflet, html2canvas, lz-string, jsQR)
- Debounced input handlers (200ms)
- IndexedDB with localStorage fallback
- Service worker with cache-first strategy
- Terser minification (14% size reduction)
- Data migration system for seamless version upgrades

---

## 🚀 Getting Started

### Use it now
Visit **[kevinb2212.github.io/growthink](https://kevinb2212.github.io/growthink)** — works on any device with a modern browser. Install as a PWA for the full experience.

### Run locally
```bash
git clone https://github.com/KevinB2212/growthink.git
cd growthink
npm install        # Install dev dependencies
npm run dev        # Start Vite dev server
```

### Build for production
```bash
npm run build      # Minifies JS → dist/
```

---

## 📜 Version History

| Version | Highlights |
|---------|-----------|
| **v5.1** | Modular file split, IndexedDB, lazy loading, Vite build, service worker upgrade |
| **v5.0** | Focus mode, sentiment analysis, word cloud, smart tags, plant DNA, mind map, QR sync |
| **v4.0** | Pet companions, soundscapes, daily challenges, photo/voice notes, PIN lock |
| **v3.0** | XP shop, weather, time capsules, heatmap, templates, lo-fi music |
| **v2.0** | Achievements, insights, mood tracking, plant types, pomodoro, themes, PWA |
| **v1.0** | Core notes, virtual plant, AI chat, speech-to-text, Notion sync |

Each version is preserved as a branch (`v1`–`v5`) with annotated tags.

---

## 🛠️ Tech Stack

| Technology | Usage |
|-----------|-------|
| **Vanilla JS** | Core application logic |
| **CSS3** | Animations, gradients, responsive design |
| **HTML5 Canvas** | Mind map, plant rendering |
| **IndexedDB** | Primary storage (50MB+) |
| **Web Audio API** | Procedural lo-fi music |
| **Service Workers** | Offline support, caching |
| **Geolocation API** | Location-tagged notes |
| **Notification API** | Note reminders |
| **Speech Recognition** | Voice-to-text input |
| **MediaRecorder** | Voice note recording |
| **Leaflet.js** | Interactive maps |
| **Vite** | Dev server & build tool |

---

## 📄 License

MIT © Kevin

---

<p align="center">
  <em>"Your mind is a garden, your thoughts are the seeds.<br>You can grow flowers or you can grow weeds."</em>
</p>

<p align="center">
  <a href="https://kevinb2212.github.io/growthink"><strong>🌱 Start growing yours today</strong></a>
</p>
