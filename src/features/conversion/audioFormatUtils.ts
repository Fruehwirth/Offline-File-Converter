/**
 * Audio Format Utilities
 * Helpers for detecting lossy formats and generating transcoding warnings
 */

import type { FormatId } from './formatRegistry'

/**
 * Lossy audio formats that lose quality during encoding
 */
export const LOSSY_AUDIO_FORMATS: FormatId[] = ['mp3', 'aac', 'm4a', 'ogg']

/**
 * Lossless audio formats that preserve original quality
 */
export const LOSSLESS_AUDIO_FORMATS: FormatId[] = ['wav', 'flac']

/**
 * Check if a format is lossy
 */
export function isLossyFormat(format: FormatId): boolean {
  return LOSSY_AUDIO_FORMATS.includes(format)
}

/**
 * Check if a format is lossless
 */
export function isLosslessFormat(format: FormatId): boolean {
  return LOSSLESS_AUDIO_FORMATS.includes(format)
}

/**
 * Check if conversion involves transcoding between lossy formats
 * (which causes generation loss / quality degradation)
 */
export function isLossyToLossyTranscode(sourceFormat: FormatId, targetFormat: FormatId): boolean {
  return isLossyFormat(sourceFormat) && isLossyFormat(targetFormat) && sourceFormat !== targetFormat
}

/**
 * Generate a warning message for quality loss during transcoding
 */
export function getTranscodingWarning(
  sourceFormats: FormatId[],
  targetFormat: FormatId
): string | null {
  // Check if any source formats would result in lossy-to-lossy transcoding
  const lossyToLossyFiles = sourceFormats.filter(source =>
    isLossyToLossyTranscode(source, targetFormat)
  )

  if (lossyToLossyFiles.length === 0) {
    return null
  }

  const sourceFormatLabels = lossyToLossyFiles
    .map(f => f.toUpperCase())
    .filter((format, index, arr) => arr.indexOf(format) === index)
    .join(', ')

  return `Quality loss: Converting ${sourceFormatLabels} → ${targetFormat.toUpperCase()} is lossy-to-lossy transcoding. For best quality, convert from original lossless sources (WAV, FLAC).`
}

/**
 * Get a detailed transcoding info message for a specific file
 */
export function getFileTranscodingInfo(
  sourceFormat: FormatId,
  targetFormat: FormatId
): {
  hasWarning: boolean
  message?: string
  severity: 'info' | 'warning'
} {
  // Same format - no conversion needed
  if (sourceFormat === targetFormat) {
    return {
      hasWarning: false,
      severity: 'info',
    }
  }

  // Lossy to lossy - quality degradation
  if (isLossyToLossyTranscode(sourceFormat, targetFormat)) {
    return {
      hasWarning: true,
      severity: 'warning',
      message: `Lossy-to-lossy transcoding (${sourceFormat.toUpperCase()} → ${targetFormat.toUpperCase()}) will degrade audio quality. Consider using lossless source files.`,
    }
  }

  // Lossless to lossy - normal quality loss
  if (isLosslessFormat(sourceFormat) && isLossyFormat(targetFormat)) {
    return {
      hasWarning: true,
      severity: 'info',
      message: `Converting from lossless ${sourceFormat.toUpperCase()} to lossy ${targetFormat.toUpperCase()}. This is the best way to create compressed audio.`,
    }
  }

  // Lossy to lossless - no quality gain
  if (isLossyFormat(sourceFormat) && isLosslessFormat(targetFormat)) {
    return {
      hasWarning: true,
      severity: 'info',
      message: `Converting from lossy ${sourceFormat.toUpperCase()} to lossless ${targetFormat.toUpperCase()} won't improve quality, only increase file size.`,
    }
  }

  // Lossless to lossless - no quality loss
  return {
    hasWarning: false,
    severity: 'info',
  }
}
