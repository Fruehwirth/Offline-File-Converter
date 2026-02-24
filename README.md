# File Converter – Privacy-First, 100% Local

<div align="center">

**Convert files in your browser. Zero uploads. Zero tracking. Zero network activity.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://react.dev/)

[** Try It Live**](https://localconvert.org) • [**Features**](#features) • [**Privacy**](#privacy-guarantees) • [**Development**](#development)

</div>

---

##  Privacy Guarantees

**Your data never leaves your device.** This is not marketing—it's enforced by design:

-  **Strict Content Security Policy (CSP)** blocks all external connections
-  **Network API guards** throw errors if `fetch`/`XHR`/`WebSocket` are called
-  **E2E tests** fail if any network request is detected
-  **No analytics, no telemetry, no CDNs, no fonts, no third-party code**
-  **No local storage of files**—only UI preferences (theme) are saved

### Technical Enforcement

1. **CSP Header** in `index.html`:

   ```
   connect-src 'none';  ← No network connections allowed
   ```

2. **Runtime Guards** patch network APIs in development:

   ```typescript
   window.fetch = () => {
     throw new Error('Network calls forbidden')
   }
   ```

3. **Automated Tests** monitor network activity:
   ```typescript
   page.on('request', req => {
     if (isExternal(req.url())) fail()
   })
   ```

**Everything runs in Web Workers** for background processing without blocking the UI.

---

##  Features

### Current (v1.0)

- **PNG ⇄ ICO** conversion
  - **PNG → ICO**: Preserves exact resolution by default; optional standard sizes (16/32/48/64/128/256)
  - **ICO → PNG**: Exports largest size by default; option to export all sizes or select specific ones
  - Full **alpha transparency** support (32-bit RGBA)
  - High-quality resampling for generated sizes

- **Batch Processing**
  - Drag & drop multiple files
  - Mixed file types auto-detected via magic number signatures
  - Common target formats computed automatically
  - Download all as ZIP or individual files

- **User Experience**
  - Dark mode by default (themeable)
  - Keyboard accessible (WCAG AA compliant)
  - Drag & drop + click-to-browse
  - Real-time progress indicators
  - Per-file status and error handling

### Roadmap

- [X] JPEG ⇄ PNG ⇄ WEBP
- [X] SVG ⇄ PNG
- [X] GIF ⇄ PNG (with animation support)
- [X] PDF → Images
- [X] Batch presets (e.g., "Generate all icon sizes")
- [X] Optional Service Worker for true offline PWA

---

##  Getting Started

### Try It Online

Visit **[localconvert.org](https://localconvert.org)** to use the app right away – no installation needed!

### Local Development

#### Prerequisites

- **Node.js** 18+ and npm
- Modern browser with Web Workers and OffscreenCanvas support

#### Installation

```bash
# Clone the repository
git clone https://github.com/fruehwirth/offline-file-converter.git
cd offline-file-converter

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173`

#### Building for Production

```bash
npm run build
npm run preview
```

The `dist/` folder contains a fully static site that can be:

- Hosted on any static server (GitHub Pages, Netlify, Vercel, etc.)
- Run locally by opening `index.html` (after build)
- Deployed to your own server

**Once loaded, the app works completely offline.**

---


## 📊 Supported Formats

| Format | Read | Write | Notes                                                       |
| ------ | ---- | ----- | ----------------------------------------------------------- |
| PNG    | DONE   | DONE    | Full RGBA support, any resolution                           |
| ICO    | DONE   | DONE    | Multi-resolution, up to 256x256 (PNG-inside-ICO for larger) |
| JPEG   | SOON   | SOON    | Planned                                                     |
| WEBP   | SOON   | SOON    | Planned                                                     |
| SVG    | SOON   | SOON    | Planned (rasterization)                                     |
| GIF    | SOON   | SOON    | Planned (animation aware)                                   |

---




<div align="center">

**Built with privacy and user control in mind.**

</div>
