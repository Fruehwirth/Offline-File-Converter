/**
 * Main application component
 * Orchestrates the entire conversion workflow
 */

import { useEffect } from 'react'
import { useConversionStore } from '../features/state/useConversionStore'
import { Header } from '../components/Header'
import { EmptyState } from '../components/EmptyState'
import { FileList } from '../components/FileList'
import { TargetFormatSelector } from '../components/TargetFormatSelector'
import { Toast } from '../components/Toast'
import { convertImage } from '../features/conversion/imageProcessing'
import { convertAudio } from '../features/conversion/audioProcessing'
import { generateOutputFilename } from '../features/conversion/fileNamer'
import { announceToScreenReader } from '../utils/accessibility'
import { getFormat, type FormatId } from '../features/conversion/formatRegistry'
import { findCommonTargets } from '../features/conversion/commonDenominators'

/**
 * Detect format from MIME type (for handling fallback conversions)
 */
function detectFormatFromMime(mimeType: string): FormatId | null {
  const mimeToFormat: Record<string, FormatId> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/aac': 'aac',
    'audio/mp4': 'm4a',
    'audio/webm': 'ogg', // WebM audio is usually Opus, treat as OGG
  }

  return mimeToFormat[mimeType] || null
}

export function App() {
  // Prevent default drag & drop behavior on the entire page
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Prevent browser from opening files
    window.addEventListener('dragover', preventDefaults)
    window.addEventListener('drop', preventDefaults)

    return () => {
      window.removeEventListener('dragover', preventDefaults)
      window.removeEventListener('drop', preventDefaults)
    }
  }, [])

  const files = useConversionStore(state => state.files)
  const selectedTargetFormat = useConversionStore(state => state.selectedTargetFormat)
  const isConverting = useConversionStore(state => state.isConverting)

  const setIsConverting = useConversionStore(state => state.setIsConverting)
  const updateFileStatus = useConversionStore(state => state.updateFileStatus)
  const setFileResult = useConversionStore(state => state.setFileResult)
  const replaceFileWithResult = useConversionStore(state => state.replaceFileWithResult)
  const setAvailableTargets = useConversionStore(state => state.setAvailableTargets)
  const addToast = useConversionStore(state => state.addToast)

  const hasFiles = files.length > 0
  const canConvert = hasFiles && selectedTargetFormat && !isConverting

  const handleConvert = async () => {
    if (!canConvert) return

    setIsConverting(true)
    announceToScreenReader('Conversion started')

    const filesToConvert = files.filter(f => f.sourceFormat && f.status !== 'completed')

    // Convert all files concurrently using Promise.allSettled
    // This allows multiple conversions to run simultaneously
    const conversionPromises = filesToConvert.map(async fileItem => {
      updateFileStatus(fileItem.id, 'processing', 0)

      try {
        const sourceFormat = fileItem.sourceFormat as FormatId
        const targetFormat = selectedTargetFormat as FormatId

        // Check if file is already in target format - skip conversion if so
        if (sourceFormat === targetFormat) {
          // Pass through the original file without conversion
          updateFileStatus(fileItem.id, 'processing', 100, 'Skipped (already in target format)')

          const blob = new Blob([await fileItem.file.arrayBuffer()], { type: fileItem.file.type })
          const filename = fileItem.file.name
          setFileResult(fileItem.id, [{ blob, filename }])

          return { success: true, fileId: fileItem.id, fileName: fileItem.file.name, skipped: true }
        }

        // Determine if this is an image or audio conversion
        const sourceFormatInfo = getFormat(sourceFormat)
        const isAudioConversion = sourceFormatInfo?.category === 'audio'

        let blob: Blob

        if (isAudioConversion) {
          // Use audio processing for audio conversions
          blob = await convertAudio(fileItem.file, targetFormat, { bitrate: 192 }, progress => {
            updateFileStatus(fileItem.id, 'processing', progress.percent, progress.message)
          })
        } else {
          // Use image processing for image conversions
          blob = await convertImage(fileItem.file, targetFormat, { quality: 0.92 }, progress => {
            updateFileStatus(fileItem.id, 'processing', progress.percent)
          })
        }

        // Detect actual format from blob (in case of fallback)
        const actualFormat = detectFormatFromMime(blob.type) || targetFormat
        const filename = generateOutputFilename(fileItem.file.name, actualFormat)
        setFileResult(fileItem.id, [{ blob, filename }])

        return { success: true, fileId: fileItem.id, fileName: fileItem.file.name }
      } catch (error) {
        // Log full error details to console
        console.error(`[App] Conversion failed for ${fileItem.file.name}:`, error)
        if (error instanceof Error && error.stack) {
          console.error('[App] Stack trace:', error.stack)
        }

        const message = error instanceof Error ? error.message : 'Conversion failed'
        updateFileStatus(fileItem.id, 'error', 0, message)

        addToast({
          type: 'error',
          message: `Failed to convert ${fileItem.file.name}: ${message}`,
        })

        return { success: false, fileId: fileItem.id, fileName: fileItem.file.name }
      }
    })

    // Wait for all conversions to complete
    await Promise.allSettled(conversionPromises)

    setIsConverting(false)

    const successCount = files.filter(f => f.status === 'completed').length

    // Replace converted files with their results for sequential conversions
    const convertedFiles = files.filter(f => f.status === 'completed' && f.result)
    convertedFiles.forEach(f => replaceFileWithResult(f.id))

    // Recalculate available targets based on new source formats
    // We need to wait a bit for the state to update
    setTimeout(() => {
      const currentFiles = useConversionStore.getState().files
      const sourceFormats = currentFiles
        .map(f => f.sourceFormat)
        .filter((format): format is FormatId => format !== null)
        .filter((format, index, arr) => arr.indexOf(format) === index)

      const commonTargets = findCommonTargets(sourceFormats)
      setAvailableTargets(commonTargets)
    }, 0)

    announceToScreenReader(`Conversion complete. ${successCount} file(s) converted.`)
  }

  // Calculate overall progress for multiple file conversions
  const overallProgress =
    isConverting && files.length > 0
      ? files.reduce((sum, file) => sum + (file.progress || 0), 0) / files.length
      : 0

  const showProgressBackground = isConverting && files.length > 2

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {!hasFiles ? (
          <EmptyState />
        ) : (
          <div className="max-w-[630px] mx-auto space-y-6 pb-24">
            {/* File list with integrated DropZone */}
            <FileList />

            {/* Target format selector with integrated options menu */}
            <TargetFormatSelector disabled={isConverting} />
          </div>
        )}
      </main>

      {/* Full-width convert button at the bottom */}
      {hasFiles && (
        <div className="fixed bottom-0 left-0 right-0 shadow-lg z-40">
          <div
            className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm"
            style={{
              maskImage: 'linear-gradient(to top, black 0%, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 0%, black 70%, transparent 100%)',
            }}
          />
          <div className="container mx-auto px-4 py-4 max-w-[630px] relative z-10">
            <button
              onClick={handleConvert}
              disabled={!canConvert}
              className={`
                w-full px-8 py-4 rounded-brand font-semibold text-lg
                transition-all relative overflow-hidden
                focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg
                ${
                  canConvert
                    ? 'bg-brand-accent hover:bg-brand-accent-hover text-white'
                    : 'bg-brand-bg-secondary text-brand-text-secondary cursor-not-allowed'
                }
              `}
            >
              {/* Progress background overlay - only shown when converting more than 2 files */}
              {showProgressBackground && (
                <div
                  className="absolute inset-0 bg-white/20 transition-all duration-300"
                  style={{
                    width: `${overallProgress}%`,
                  }}
                />
              )}
              {isConverting ? (
                <span className="flex items-center justify-center gap-3 relative z-10">
                  <svg
                    className="animate-spin h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Converting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3 relative z-10">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Convert
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <Toast />
    </div>
  )
}
