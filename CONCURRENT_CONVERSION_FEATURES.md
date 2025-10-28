# Concurrent Conversion & Transcoding Warning Features

## Overview

This document describes the new features added to support concurrent file conversions and smart transcoding warnings for audio formats.

## Features Implemented

### 1. Smart Format Detection & Transcoding Warnings

#### New Utility: `audioFormatUtils.ts`

- **Lossy Format Detection**: Identifies lossy audio formats (MP3, AAC, M4A, OGG)
- **Lossless Format Detection**: Identifies lossless audio formats (WAV, FLAC)
- **Transcoding Detection**: Detects when converting between lossy formats (quality loss)
- **Warning Generation**: Provides user-friendly warnings about quality degradation

#### Warning Scenarios:

- **Lossy → Lossy**: ⚠️ Warning about generation loss (e.g., MP3 → M4A)
- **Lossless → Lossy**: ℹ️ Info about compression (optimal workflow)
- **Lossy → Lossless**: ℹ️ Info about no quality gain (file size increase only)
- **Lossless → Lossless**: No warning (no quality loss)

### 2. Concurrent Conversion Processing

#### Architecture Changes:

- **Before**: Sequential processing (one file at a time)
- **After**: Concurrent processing (multiple files simultaneously)

#### Implementation Details:

- Uses `Promise.allSettled()` to process all files in parallel
- Each file maintains independent progress tracking
- Better utilization of system resources (CPU, GPU, hardware acceleration)
- Faster overall conversion times for multiple files

#### Benefits:

- **Speed**: Multiple files convert at the same time
- **Efficiency**: Better CPU/resource utilization
- **User Experience**: See progress on all files simultaneously

### 3. Enhanced UI for Concurrent Processing

#### FileList Component Updates:

- **Processing Counter**: Shows how many files are currently converting
- **Status Summary**: Real-time counts of processing/completed/queued/failed files
- **Individual Progress**: Each file shows its own progress bar and percentage
- **Status Indicators**: Visual dots with animations for different states
  - 🔵 Blue pulsing = Processing
  - 🟢 Green = Completed
  - ⚪ Gray = Queued
  - 🔴 Red = Failed

#### TargetFormatSelector Component Updates:

- **Inline Warnings**: Shows transcoding warnings when selecting lossy target formats
- **Visual Feedback**: Yellow warning box with icon and detailed message
- **Context-Aware**: Only shows warnings when applicable to current files

### 4. Conversion Flow Updates

#### App.tsx Changes:

- Refactored `handleConvert()` to use concurrent processing
- Added transcoding warning toast before conversion starts
- Maintains all error handling and progress tracking
- Compatible with both image and audio conversions

## Code Quality

### Testing

- Comprehensive test suite for `audioFormatUtils.ts`
- Tests cover all format detection scenarios
- Tests validate warning generation logic
- All existing tests continue to pass

### Type Safety

- Full TypeScript support
- No type errors or linter warnings
- Proper type guards for format detection

## User Benefits

1. **Faster Conversions**: Multiple files process simultaneously
2. **Better Informed**: Clear warnings about quality loss before converting
3. **Visual Feedback**: See status of all files at a glance
4. **No Breaking Changes**: Existing functionality preserved

## Technical Notes

### Performance Considerations

- Web Workers already handle heavy processing (no main thread blocking)
- Concurrent processing leverages multi-core CPUs
- Progress tracking uses efficient state updates
- No memory leaks (proper cleanup in `Promise.allSettled`)

### Browser Compatibility

- All features use standard Web APIs
- Fallback handling already in place (MediaRecorder API)
- Progressive enhancement approach

## Example Usage

### Before (Sequential):

```
File 1: [=====>    ] 50%
File 2: [          ] 0%  (waiting)
File 3: [          ] 0%  (waiting)
```

### After (Concurrent):

```
File 1: [=====>    ] 50%
File 2: [===>      ] 30%  (processing simultaneously)
File 3: [==        ] 20%  (processing simultaneously)
```

### Transcoding Warning Example:

When converting MP3 → M4A, users see:

```
⚠️ Quality loss: Converting MP3 → M4A is lossy-to-lossy transcoding.
   For best quality, convert from original lossless sources (WAV, FLAC).
```

## Files Modified

1. **New Files**:
   - `src/features/conversion/audioFormatUtils.ts` - Format detection utilities
   - `src/__tests__/audioFormatUtils.test.ts` - Comprehensive tests

2. **Modified Files**:
   - `src/pages/App.tsx` - Concurrent conversion logic
   - `src/components/FileList.tsx` - Enhanced status display
   - `src/components/TargetFormatSelector.tsx` - Transcoding warnings

## Future Enhancements

Potential improvements for future versions:

- Hardware acceleration for supported formats (WebCodecs API)
- MediaRecorder for MP3 encoding (when browser support improves)
- Configurable concurrency limits
- Batch size optimization based on system resources
