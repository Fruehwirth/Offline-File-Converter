# Quick Start Guide

Get up and running with the File Converter in 3 minutes.

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

## First Conversion

1. **Drag & Drop** a PNG or ICO file onto the drop zone
2. **Select target format** (PNG or ICO)
3. **Configure options** (optional)
4. **Click "Convert"**
5. **Download** your converted file(s)

## Example: PNG → ICO

1. Drop a PNG file (e.g., `logo.png`)
2. Select **ICO** as target format
3. (Optional) Enable "Include standard sizes" for multi-resolution ICO
4. Click "Convert"
5. Download `logo.ico`

## Example: ICO → PNG

1. Drop an ICO file (e.g., `favicon.ico`)
2. Select **PNG** as target format
3. Choose size option:
   - **Largest size only** (default) - exports the highest resolution
   - **All available sizes** - exports each size as separate PNG
4. Click "Convert"
5. Download result(s)

## Batch Conversion

1. Drop multiple files at once
2. Files must have a common target format
3. Click "Convert" to process all files
4. Use "Download All" to get a ZIP archive

## Running Tests

```bash
# Unit tests
npm test

# E2E tests (starts dev server automatically)
npm run test:e2e

# Watch mode for unit tests
npm run test:watch
```

## Building for Production

```bash
# Build
npm run build

# Preview build
npm run preview
```

The `dist/` folder can be deployed to any static hosting service.

## Key Features to Try

- **Dark/Light Theme Toggle** - Click the theme button in the header
- **Keyboard Navigation** - Tab through all controls, Enter/Space to activate
- **Drag & Drop** - Drag files from your file explorer
- **Batch Processing** - Drop multiple files at once
- **ZIP Download** - Download all converted files as a single archive

## Troubleshooting

### Build errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Dev server won't start

```bash
# Check port 5173 is available
# Or specify different port:
npm run dev -- --port 3000
```

### Tests fail

```bash
# Ensure dev dependencies are installed
npm install --include=dev

# Run tests with verbose output
npm test -- --reporter=verbose
```

## Privacy Verification

To verify no network activity:

1. Open browser DevTools → Network tab
2. Use the app to convert files
3. You should see **zero** network requests (except initial page load)

Or run E2E tests:

```bash
npm run test:e2e
# Tests will fail if ANY network request is detected
```

## Next Steps

- Read the [full README](README.md) for architecture details
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to add new formats
- Explore the [format registry](src/features/conversion/formatRegistry.ts) to understand extensibility

---

**Need Help?** Open an [issue](https://github.com/fruehwirth/offline-file-converter/issues)
