# File Converter – Privacy-First, 100% Local

<div align="center">

**Convert files in your browser. Zero uploads. Zero tracking. Zero network activity.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://react.dev/)

[**🚀 Try It Live**](https://localconvert.org) • [**Features**](#features) • [**Privacy**](#privacy-guarantees) • [**Development**](#development)

</div>

---

## 🔒 Privacy Guarantees

**Your data never leaves your device.** This is not marketing—it's enforced by design:

- ✅ **Strict Content Security Policy (CSP)** blocks all external connections
- ✅ **Network API guards** throw errors if `fetch`/`XHR`/`WebSocket` are called
- ✅ **E2E tests** fail if any network request is detected
- ✅ **No analytics, no telemetry, no CDNs, no fonts, no third-party code**
- ✅ **No local storage of files**—only UI preferences (theme) are saved

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

## ✨ Features

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

- [ ] JPEG ⇄ PNG ⇄ WEBP
- [ ] SVG ⇄ PNG
- [ ] GIF ⇄ PNG (with animation support)
- [ ] PDF → Images
- [ ] Batch presets (e.g., "Generate all icon sizes")
- [ ] Optional Service Worker for true offline PWA

---

## 🚀 Getting Started

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

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

### Test Coverage

- **Unit tests**: MIME detection, format registry, file naming, CSP validation
- **Integration tests**: PNG→ICO and ICO→PNG roundtrips
- **E2E tests**: Complete workflows, network monitoring, accessibility

---

## 🏗️ Architecture

### Project Structure

```
/
├── src/
│   ├── components/          # React UI components
│   │   ├── DropZone.tsx
│   │   ├── FileList.tsx
│   │   ├── TargetFormatSelector.tsx
│   │   ├── OptionsPanel.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Toast.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── features/
│   │   ├── conversion/      # Core conversion logic
│   │   │   ├── formatRegistry.ts      # Declarative format capabilities
│   │   │   ├── detectMime.ts          # Magic number detection
│   │   │   ├── commonDenominators.ts  # Multi-file target logic
│   │   │   ├── imageProcessing.ts     # Unified image processing wrapper
│   │   │   ├── download.ts            # Single/batch/ZIP downloads
│   │   │   └── fileNamer.ts           # Collision-safe naming
│   │   │
│   │   ├── workers/         # Web Workers
│   │   │   └── imageProcessing.worker.ts
│   │   │
│   │   ├── theming/         # Theme system
│   │   │   ├── themeTokens.css        # CSS variables
│   │   │   └── ThemeProvider.tsx
│   │   │
│   │   └── state/           # State management
│   │       └── useConversionStore.ts  # Zustand store
│   │
│   ├── pages/
│   │   └── App.tsx          # Main application
│   │
│   ├── utils/               # Utilities
│   │   ├── bytes.ts
│   │   ├── guardNoNetwork.ts
│   │   ├── csp.ts
│   │   └── accessibility.ts
│   │
│   └── __tests__/           # Tests
│       ├── unit tests
│       ├── e2e/
│       └── fixtures/
│
├── public/                  # Static assets
├── index.html               # Entry point with CSP
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Key Design Patterns

#### 1. **Format Registry** (Declarative & Extensible)

```typescript
export const FORMATS: Capability[] = [
  {
    id: 'png',
    mime: ['image/png'],
    signatures: [{ offset: 0, bytes: [0x89, 0x50, 0x4E, 0x47, ...] }],
    canConvertTo: ['ico']
  },
  // Add more formats here
]
```

#### 2. **Web Workers** (Non-blocking Conversion)

```typescript
// Main thread
const blob = await convertImage(file, targetFormat, options, progress => {
  console.log(progress.percent)
})

// Worker handles heavy lifting
```

#### 3. **Zustand Store** (Lightweight State)

```typescript
const files = useConversionStore(state => state.files)
const addFiles = useConversionStore(state => state.addFiles)
```

#### 4. **Magic Number Detection** (Reliable Format Detection)

```typescript
// Checks file signature, not just extension
const { format } = await detectFormat(file) // 'png' | 'ico' | null
```

---

## 🎨 Customization

### Theming

Edit `src/features/theming/themeTokens.css`:

```css
[data-theme='dark'] {
  --color-bg: #0a0a0a;
  --color-accent: #3b82f6;
  /* ... */
}
```

Themes are stored in `localStorage` under the key `app-theme`.

### Adding New Formats

1. **Update format registry** (`src/features/conversion/formatRegistry.ts`):

   ```typescript
   {
     id: 'webp',
     mime: ['image/webp'],
     signatures: [{ offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }],
     canConvertTo: ['png', 'jpg']
   }
   ```

2. **Create conversion logic** (e.g., `src/features/conversion/webpToPng.ts`)

3. **Add worker** if needed (`src/features/workers/webpToPng.worker.ts`)

4. **Update App.tsx** to handle new conversions

---

## 📊 Supported Formats

| Format | Read | Write | Notes                                                       |
| ------ | ---- | ----- | ----------------------------------------------------------- |
| PNG    | ✅   | ✅    | Full RGBA support, any resolution                           |
| ICO    | ✅   | ✅    | Multi-resolution, up to 256x256 (PNG-inside-ICO for larger) |
| JPEG   | 🔜   | 🔜    | Planned                                                     |
| WEBP   | 🔜   | 🔜    | Planned                                                     |
| SVG    | 🔜   | 🔜    | Planned (rasterization)                                     |
| GIF    | 🔜   | 🔜    | Planned (animation aware)                                   |

---

## 🔧 Configuration

### File Size Limit

Edit `src/utils/bytes.ts`:

```typescript
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
```

### localStorage Keys

The app uses **only these** localStorage keys:

- `app-theme`: `'light' | 'dark'`

**No files are stored locally.** All processing is in-memory.

---

## 🛡️ Security

### Content Security Policy

```
default-src 'self';
connect-src 'none';          ← No network connections
img-src 'self' blob: data:;  ← Only local images
script-src 'self';           ← No inline scripts (except CSP allows)
style-src 'self' 'unsafe-inline';  ← Tailwind requires inline styles
```

### ESLint Rules

```javascript
'no-restricted-globals': ['error',
  { name: 'fetch', message: 'Network calls forbidden' },
  { name: 'XMLHttpRequest', message: 'Network calls forbidden' },
  { name: 'WebSocket', message: 'Network calls forbidden' }
]
```

---

## ♿ Accessibility

- **Keyboard Navigation**: Full Tab/Enter/Space support
- **Screen Readers**: ARIA labels, live regions for announcements
- **Focus Management**: Visible focus rings, logical tab order
- **Color Contrast**: WCAG AA compliant (tested in both themes)

---

## 🐛 Known Limitations

1. **Very Large Images**: Memory usage is proportional to image dimensions. 50MB limit by default.
2. **Browser Support**: Requires Web Workers and OffscreenCanvas (modern browsers only).
3. **ICO Sizes**: Non-standard sizes > 256px are supported but may not work in all Windows contexts.

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Write tests for new functionality
4. Ensure `npm test` and `npm run lint` pass
5. Submit a pull request

### Development Guidelines

- **TypeScript strict mode** is enforced
- **No semicolons** (Prettier config)
- **No network calls** (enforced by tests)
- Self-documenting code with JSDoc for public APIs

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **JSZip** for batch downloads
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Vite** for blazing-fast dev experience

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/fruehwirth/offline-file-converter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/fruehwirth/offline-file-converter/discussions)

**Remember**: This app **never** sends data anywhere. If you see network activity, please report it as a critical bug.

---

<div align="center">

**Built with privacy and user control in mind.**

⭐ Star this repo if you believe in local-first software!

</div>
