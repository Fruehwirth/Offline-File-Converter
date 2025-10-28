# FFmpeg WASM Core Files

These files are required for fast, offline audio conversion to OGG, FLAC, AAC, and M4A formats.

## Files

- `ffmpeg-core.js` - FFmpeg WASM JavaScript loader
- `ffmpeg-core.wasm` - FFmpeg compiled to WebAssembly

## Source

These files are from [@ffmpeg/core@0.12.6](https://www.npmjs.com/package/@ffmpeg/core)

## Why Local?

This app must work 100% offline, so we host these files locally instead of loading them from CDN.

## Update Instructions

To update FFmpeg:

1. Check latest version at https://www.npmjs.com/package/@ffmpeg/core
2. Download new files from unpkg.com
3. Replace these files
4. Update version in `src/features/conversion/audioProcessing.ts` comments

## License

FFmpeg is licensed under LGPL 2.1 or later.
See: https://ffmpeg.org/legal.html
