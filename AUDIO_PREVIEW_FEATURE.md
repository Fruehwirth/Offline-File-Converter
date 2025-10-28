# Audio Preview Feature

## Overview

Interactive audio preview feature for audio files in the file list. When users hover over audio file icons, the icon flips over with a smooth 3D animation and plays the audio at 25% volume with fade in/out effects.

## Features

### 1. Visual Feedback

- **3D Flip Animation**: Smooth 500ms card flip effect using CSS 3D transforms
- **Real-Time Waveform Visualization**: 7 vertical bars showing actual audio frequency spectrum
- **Accurate Audio Analysis**: Uses Web Audio API to analyze and display live audio data
- **Hover State**: Clear visual indication when audio is playing with real-time animation

### 2. Audio Playback

- **Volume**: Fixed at 25% maximum for quiet, non-intrusive preview
- **Fade In**: Smooth fade in from 0% to 25% volume over 1 second
- **Fade Out**: Quick fade out from 25% to 0% volume over 0.4 seconds
- **Loop**: Audio loops continuously while hovering
- **Auto-pause**: Audio stops when user moves cursor away
- **Failsafe Stop**: Automatic cleanup ensures audio always stops after 500ms

### 3. Performance

- **Lazy Loading**: Audio URLs created only when component mounts
- **Cleanup**: Proper cleanup of audio elements, audio contexts, and object URLs on unmount
- **requestAnimationFrame**: Efficient fade animations and waveform updates using RAF
- **No Memory Leaks**: All event listeners, animation frames, and audio contexts properly cleaned up
- **Race Condition Protection**: Uses refs to track hover state, preventing audio from continuing when quickly unhovering
- **Smooth Fade Out**: Audio fades out smoothly even when unhovered during fade-in
- **Efficient FFT**: Uses small FFT size (256) for real-time analysis with minimal CPU impact

### 4. Supported Formats

Works with all supported audio formats:

- MP3 (audio/mpeg)
- WAV (audio/wav)
- FLAC (audio/flac)
- OGG (audio/ogg)
- AAC (audio/aac)
- M4A (audio/mp4)

## Implementation

### Files Created

- `src/components/AudioPreviewIcon.tsx` - Main audio preview component

### Files Modified

- `src/components/FileList.tsx` - Integrated AudioPreviewIcon for audio files

### Technical Details

#### Component Structure

```
AudioPreviewIcon
├── Audio Element (hidden, controls playback)
├── Web Audio API
│   ├── AudioContext (audio processing pipeline)
│   ├── AnalyserNode (frequency analysis, FFT size 256)
│   └── MediaElementSource (audio input)
├── Flip Container (3D transform container)
│   ├── Front Side (FileTypeIcon)
│   └── Back Side (Real-time waveform - 7 frequency bars)
└── State Management
    ├── isHovering (hover state)
    ├── waveformData (7-element array of frequency values)
    └── Various refs for audio/animation control
```

#### Animation Details

- **Flip Animation**: `rotateY(0deg)` → `rotateY(180deg)` with `transition: 500ms ease-out`
- **Waveform Visualization**:
  - 7 bars representing frequency bands
  - Real-time updates at 60fps using Web Audio API's AnalyserNode
  - Smooth transitions with 75ms CSS duration
- **Fade In**: Linear volume adjustment at 60fps from 0% to 25% over 1 second
- **Fade Out**: Linear volume adjustment at 60fps from 25% to 0% over 0.4 seconds

#### User Experience

1. User hovers over audio file icon
2. Icon smoothly flips revealing real-time waveform visualization (7 bars)
3. Audio starts playing from the beginning
4. Volume fades in from 0% to 25% over 1 second
5. Waveform bars animate in real-time, reflecting the actual audio frequencies
6. Audio loops while hovering
7. On mouse leave, volume quickly fades out to 0% over 0.4 seconds
8. Icon flips back to original state
9. Audio is completely stopped and reset to beginning

## Browser Compatibility

- Requires support for:
  - HTML5 Audio API
  - CSS 3D Transforms
  - requestAnimationFrame
  - URL.createObjectURL

All modern browsers (Chrome, Firefox, Safari, Edge) fully supported.

## Future Enhancements

Potential improvements:

- Add waveform visualization instead of generic sound waves
- Allow user to adjust preview volume in settings
- Add visual progress indicator showing position in audio file
- Support for seeking/scrubbing through audio on hover
- Show audio metadata (duration, bitrate) in tooltip
