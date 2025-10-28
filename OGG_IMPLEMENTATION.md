# OGG Vorbis Implementation

## Overview

OGG Vorbis encoding is now fully implemented using `wasm-media-encoders` library, providing reliable and high-quality OGG file conversion without depending on FFmpeg.

## Implementation Details

### Library Used

- **Package**: `wasm-media-encoders`
- **Encoder**: OggVorbisEncoder
- **Benefits**:
  - Pre-compiled WebAssembly Vorbis encoder
  - Consistent cross-platform support
  - No dependency on FFmpeg codec availability
  - Fast, worker-based encoding

### Architecture

OGG encoding follows the same pattern as MP3 and WAV:

1. **Main Thread**: Decodes audio using Web Audio API
2. **Worker Thread**: Encodes to OGG Vorbis format
3. **Progress Tracking**: Real-time progress updates during encoding

### Files Modified

1. **`src/features/conversion/audioProcessing.ts`**
   - Added OGG to worker-based encoding path (alongside MP3 and WAV)
   - Removed OGG from FFmpeg path
   - Updated documentation

2. **`src/features/workers/audioProcessing.worker.ts`**
   - Imported `OggVorbisEncoder` from `wasm-media-encoders`
   - Added `encodeOGG()` function
   - Handles interleaved audio data conversion
   - Progress reporting (5% → 95%)

3. **`src/features/conversion/formatRegistry.ts`**
   - Label: "OGG Vorbis"
   - MIME types: `audio/ogg`, `audio/vorbis`

4. **`src/components/TargetFormatSelector.tsx`**
   - Updated description: "OGG Vorbis - Open-source lossy format ✓ Always supported"
   - Marked as always supported (no fallback needed)

5. **Documentation**
   - Updated `public/FFMPEG_README.md`
   - Updated `dist/FFMPEG_README.md`

## Encoding Parameters

- **Bitrate**: Configurable (default: 192 kbps)
- **Sample Rate**: Preserves original sample rate
- **Channels**: Supports mono and stereo

## Technical Notes

### Why Not FFmpeg?

The standard FFmpeg WASM build (`@ffmpeg/ffmpeg@0.11.6`) doesn't include:

- `libvorbis` encoder
- Native `vorbis` encoder
- `libopus` encoder
- Native `opus` encoder

This caused `RuntimeError: null function or function signature mismatch` errors.

### Why wasm-media-encoders?

- ✅ Pre-built with Vorbis support
- ✅ Smaller footprint than custom FFmpeg build
- ✅ Well-maintained and tested
- ✅ Easy integration
- ✅ Consistent behavior across platforms

### Alternative Considered

Building a custom FFmpeg WASM with Vorbis support was considered but rejected because:

- Requires Emscripten toolchain setup
- Complex build configuration
- Much larger file size
- Maintenance overhead
- Not worth it when a pre-built solution exists

## Conversion Paths

### Supported Input Formats → OGG

- MP3 → OGG ✓
- WAV → OGG ✓
- FLAC → OGG ✓
- AAC → OGG ✓
- M4A → OGG ✓
- OGG → OGG ✓ (re-encode)

### Transcoding Warnings

OGG is identified as a **lossy format** in `audioFormatUtils.ts`:

- **Lossy → OGG**: Shows transcoding warning (quality loss)
- **Lossless → OGG**: Info about compression (optimal workflow)

## Quality

OGG Vorbis at 192 kbps provides:

- Excellent quality for most use cases
- Better quality than MP3 at same bitrate
- Open-source codec (no licensing issues)
- Widely supported on modern browsers

## Future Enhancements

Potential improvements:

- [ ] Variable bitrate (VBR) quality setting
- [ ] Quality preset selector (low/medium/high)
- [ ] Advanced encoding options in settings
