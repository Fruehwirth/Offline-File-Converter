/**
 * Target format selector
 * Allows user to choose which format to convert to
 */

import { useConversionStore } from '../features/state/useConversionStore'
import { getFormatLabel, type FormatId } from '../features/conversion/formatRegistry'
import { OptionsMenu } from './OptionsMenu'

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
  flac: 'FLAC - Lossless compression (may fall back to WAV if unsupported)',
  ogg: 'OGG Opus - Modern open-source format (may fall back to MP3 if unsupported)',
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

  if (availableTargets.length === 0) {
    return null
  }

  const handleFormatClick = (format: string) => {
    if (disabled) return
    setSelectedTargetFormat(format as any)
  }

  return (
    <div className="space-y-4">
      {/* Format selector */}
      <div
        className={`space-y-3 transition-opacity ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-3">
          <label className="block text-lg font-bold text-brand-text">Convert to</label>
          <OptionsMenu />
        </div>

        <div className="flex flex-wrap gap-2">
          {availableTargets.map(format => (
            <button
              key={format}
              onClick={() => handleFormatClick(format)}
              className={`
                relative px-6 py-2 rounded-brand border-2 font-medium min-w-[80px]
                transition-all
                focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg
                ${
                  selectedTargetFormat === format
                    ? 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-brand-text'
                    : 'bg-white dark:bg-gray-900 border-brand-border text-brand-text hover:border-brand-accent/50'
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
          <p className="text-xs text-brand-text-secondary">
            All selected files can be converted to these formats
          </p>
        )}
      </div>
    </div>
  )
}
