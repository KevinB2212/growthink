# GroWthink v5.0 Build Plan

## Architecture
Single-file PWA (index.html) with external libs loaded via CDN:
- Leaflet.js for location map
- html2canvas for zine export

All features pure client-side, localStorage-based.

## Agent Assignments

### Agent A: UI & Quick Features
- **Focus Mode**: Fullscreen overlay, minimal textarea, ambient bg, word count, auto-save
- **Daily Affirmations**: Random affirmation on app open, dismissable card above quote
- **Enhanced Search**: Mood filter buttons, date range picker, category filter in history
- **Pinned Notes Section**: Separate pinned section at top of history tab

### Agent B: Insights & Analytics  
- **Word Cloud**: Canvas-rendered, sized by frequency, colored by theme, in insights tab
- **Weekly Review**: Auto-generated card (note count, mood trend, top tags, streak, best day)
- **Sentiment Analysis**: Keyword-based scoring (-5 to +5 per note), trend line chart, mood prediction
- **Smart Tags**: Auto-suggest tags based on note content keywords, clickable suggestions

### Agent C: Plant & Garden Systems
- **Plant DNA**: Procedural traits (stem curve, leaf shape, color hue, growth rate, mutation chance), DNA string display, breeding UI
- **Multi-Plant Garden**: Grid view of multiple plants, each tied to a category, tap to focus
- **Plant Evolution**: Plants can evolve at certain levels, visual changes + particle effects

### Agent D: Advanced Interactions
- **Adaptive Soundscapes**: Typing speed detection, mood-reactive audio parameters, smooth transitions
- **Note Reminders**: Set reminder time on notes, Notification API, reminder list in goals tab
- **Location Notes**: GPS tag on add, Leaflet map in insights, location filter
- **Mind Map**: Canvas-based, auto-layout from tags/connections, zoom/pan, tap to expand

### Agent E: Export & Social
- **Monthly Zine**: Compile month's notes into styled HTML pages, export as images/PDF
- **Challenge Mode**: Personal records, weekly goals, streak challenges, XP multipliers
- **QR Sync**: Export state as compressed JSON → QR code, scan to import on another device

## Merge Order
1. Agent A (UI foundations)
2. Agent B (insights - builds on data)
3. Agent C (plant systems - independent)
4. Agent D (interactions - may touch sounds/input)
5. Agent E (export/social - final layer)

## Version: v5.0
