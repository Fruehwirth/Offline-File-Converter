# Test Fixtures

This directory contains test assets for automated testing.

## Files

### test-image.png
A simple PNG image with transparency for testing PNG → ICO conversion.
- Dimensions: 64x64
- Format: 32-bit RGBA PNG
- Contains: Simple colored square with alpha channel

### test-icon.ico
A multi-resolution ICO file for testing ICO → PNG conversion.
- Contains sizes: 16x16, 32x32, 48x48
- Format: 32-bit RGBA ICO entries
- Contains: Simple icon at multiple resolutions

## Generating Test Files

To generate test files for actual E2E testing:

### PNG Test File
```javascript
// Create a simple 64x64 PNG with transparency
const canvas = document.createElement('canvas')
canvas.width = 64
canvas.height = 64
const ctx = canvas.getContext('2d')

// Draw a blue square with alpha
ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'
ctx.fillRect(0, 0, 64, 64)

// Download
canvas.toBlob(blob => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'test-image.png'
  a.click()
}, 'image/png', 1.0)
```

### ICO Test File
You can convert the PNG test file to ICO using online tools or the app itself once it's running:
1. Run the app
2. Upload the test PNG
3. Convert to ICO with standard sizes enabled
4. Save as test-icon.ico

## Usage in Tests

```typescript
import { readFileSync } from 'fs'
import { join } from 'path'

// In Playwright tests
const pngPath = join(__dirname, 'fixtures', 'test-image.png')
await page.setInputFiles('input[type="file"]', pngPath)
```

## Note on Binary Files in Git

The actual binary test files are generated during test setup or can be committed
if test stability requires versioned fixtures. For CI/CD, consider:
- Storing fixtures in Git LFS
- Generating fixtures programmatically in test setup
- Using base64-encoded fixtures in test code

