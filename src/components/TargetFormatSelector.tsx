/**
 * Target format selector
 * Allows user to choose which format to convert to
 */

import { useState, useEffect } from 'react'
import { useConversionStore } from '../features/state/useConversionStore'
import { getFormatLabel, type FormatId } from '../features/conversion/formatRegistry'

// Format descriptions for tooltips
const FORMAT_DESCRIPTIONS: Record<FormatId, string> = {
  // Image formats
  png: 'Portable Network Graphics - Lossless compression with transparency',
  ico: 'Windows Icon - Multi-resolution icon format for Windows',
  jpeg: 'Joint Photographic Experts Group - Lossy compression for photos',
  jpg: 'Joint Photographic Experts Group - Lossy compression for photos',
  webp: 'WebP - Modern format with superior compression',
  gif: 'Graphics Interchange Format - Supports animation',
  bmp: 'Bitmap - Uncompressed raster format',
  tiff: 'Tagged Image File Format - High quality archival format',
  avif: 'AV1 Image File Format - Next-gen format with excellent compression',
  heic: "High Efficiency Image Container - Apple's modern format",
  // Audio formats
  mp3: 'MP3 - Universal lossy format (192 kbps) ✓ Always supported',
  wav: 'WAV - Uncompressed PCM audio ✓ Always supported',
  ogg: 'OGG Vorbis - Open-source lossy format ✓ Always supported',
  flac: 'FLAC - Lossless compression (may fall back to WAV if unsupported)',
  aac: 'AAC - Advanced Audio Coding (may fall back to MP3 if unsupported)',
  m4a: 'M4A - Apple audio format (may fall back to MP3 if unsupported)',
}

function getFormatTooltip(format: FormatId): string {
  const label = getFormatLabel(format)
  const description = FORMAT_DESCRIPTIONS[format]
  return `${label}\n${description}`
}

interface TargetFormatSelectorProps {
  disabled?: boolean
}

export function TargetFormatSelector({ disabled = false }: TargetFormatSelectorProps) {
  const availableTargets = useConversionStore(state => state.availableTargets)
  const selectedTargetFormat = useConversionStore(state => state.selectedTargetFormat)
  const setSelectedTargetFormat = useConversionStore(state => state.setSelectedTargetFormat)
  const files = useConversionStore(state => state.files)

  // Track whether we should show the error (with a small delay to avoid flash during initial calculation)
  const [showError, setShowError] = useState(false)

  const handleFormatClick = (format: string) => {
    if (disabled) return
    setSelectedTargetFormat(format as any)
  }

  // Check if all files have their formats detected (not in initial loading state)
  const allFormatsDetected = files.length > 0 && files.every(f => f.sourceFormat !== null)
  const hasIncompatibleFiles = allFormatsDetected && availableTargets.length === 0

  // Delay showing the error to avoid flash during initial target calculation
  useEffect(() => {
    if (hasIncompatibleFiles) {
      const timer = setTimeout(() => {
        setShowError(true)
      }, 100) // Small delay to let the calculation complete
      return () => clearTimeout(timer)
    } else {
      setShowError(false)
    }
  }, [hasIncompatibleFiles])

  // If there are files with detected formats but no available targets, show error message
  if (showError) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="block text-lg font-bold text-brand-text">Convert to</label>
          </div>

          <div className="px-4 py-3 rounded-brand bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium">
              No common format available
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              The selected files have no compatible conversion format. Please remove some files to
              continue.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (availableTargets.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Format selector */}
      <div
        className={`space-y-3 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-3">
          <label className="block text-lg font-bold text-brand-text">Convert to</label>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTargets.map(format => (
            <button
              key={format}
              onClick={() => handleFormatClick(format)}
              className={`
                relative px-6 py-2 rounded-brand border-2 font-medium min-w-[80px]
                transition-all
                focus:outline-none
                ${
                  selectedTargetFormat === format
                    ? 'bg-brand-accent hover:bg-brand-accent-hover border-brand-accent text-white'
                    : 'bg-gray-100 dark:bg-black/20 border-brand-border text-brand-text hover:border-brand-accent/50'
                }
              `}
              aria-pressed={selectedTargetFormat === format}
              disabled={disabled}
              title={getFormatTooltip(format as FormatId)}
            >
              <span>.{format}</span>
            </button>
          ))}
        </div>

        {availableTargets.length > 1 && (
          <p className="text-xs text-brand-text-secondary mt-3">
            All selected files can be converted to these formats
          </p>
        )}
      </div>
    </div>
  )
}
