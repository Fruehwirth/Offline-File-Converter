/**
 * Main application component
 * Orchestrates the entire conversion workflow
 */

import { useEffect, useState } from 'react'
import { useConversionStore } from '../features/state/useConversionStore'
import { useSettingsStore } from '../features/state/useSettingsStore'
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
import { downloadFiles } from '../features/conversion/download'

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
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isHoveringConvert, setIsHoveringConvert] = useState(false)

  // Get auto-download setting
  const autoDownload = useSettingsStore(state => state.settings.autoDownload)

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
  const allFilesConverted = useConversionStore(state => state.allFilesConverted)
  const availableTargets = useConversionStore(state => state.availableTargets)

  const setIsConverting = useConversionStore(state => state.setIsConverting)
  const setAllFilesConverted = useConversionStore(state => state.setAllFilesConverted)
  const updateFileStatus = useConversionStore(state => state.updateFileStatus)
  const setFileResult = useConversionStore(state => state.setFileResult)
  const replaceFileWithResult = useConversionStore(state => state.replaceFileWithResult)
  const setAvailableTargets = useConversionStore(state => state.setAvailableTargets)
  const addToast = useConversionStore(state => state.addToast)
  const cancelConversion = useConversionStore(state => state.cancelConversion)
  const setConversionAbortController = useConversionStore(
    state => state.setConversionAbortController
  )

  const hasFiles = files.length > 0
  // Allow convert if: files exist AND there are available targets AND (target format selected OR all files converted) AND not currently converting
  const canConvert =
    hasFiles &&
    availableTargets.length > 0 &&
    (selectedTargetFormat || allFilesConverted) &&
    !isConverting

  const handleConvert = async () => {
    if (!canConvert) return

    // If all files were converted, user clicked "Convert again"
    // Replace converted files with their results first
    if (allFilesConverted) {
      const convertedFiles = files.filter(f => f.status === 'completed' && f.result)
      convertedFiles.forEach(f => replaceFileWithResult(f.id))

      // Recalculate available targets based on new source formats
      setTimeout(() => {
        const currentFiles = useConversionStore.getState().files
        const sourceFormats = currentFiles
          .map(f => f.sourceFormat)
          .filter((format): format is FormatId => format !== null)
          .filter((format, index, arr) => arr.indexOf(format) === index)

        const commonTargets = findCommonTargets(sourceFormats)
        setAvailableTargets(commonTargets)
        // Clear the selected target format so user needs to choose again
        useConversionStore.getState().setSelectedTargetFormat(null)
      }, 0)

      // Reset the allFilesConverted flag so the TargetFormatSelector shows again
      setAllFilesConverted(false)
      return
    }

    setIsConverting(true)
    announceToScreenReader('Conversion started')

    // Create AbortController for this conversion batch
    const abortController = new AbortController()
    setConversionAbortController(abortController)

    const filesToConvert = files.filter(f => f.sourceFormat && f.status !== 'completed')

    // Convert all files concurrently using Promise.allSettled
    // This allows multiple conversions to run simultaneously
    const conversionPromises = filesToConvert.map(async fileItem => {
      updateFileStatus(fileItem.id, 'processing', 0)

      try {
        // Check if conversion was cancelled before starting
        if (abortController.signal.aborted) {
          throw new Error('User manually cancelled')
        }

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
          blob = await convertAudio(
            fileItem.file,
            targetFormat,
            { bitrate: 192 },
            progress => {
              console.log(`[App] Updating file ${fileItem.file.name}:`, {
                id: fileItem.id,
                percent: progress.percent,
                message: progress.message,
              })
              updateFileStatus(fileItem.id, 'processing', progress.percent, progress.message)
            },
            abortController.signal
          )
        } else {
          // Use image processing for image conversions
          blob = await convertImage(
            fileItem.file,
            targetFormat,
            { quality: 0.92 },
            progress => {
              updateFileStatus(fileItem.id, 'processing', progress.percent)
            },
            abortController.signal
          )
        }

        // Detect actual format from blob (in case of fallback)
        const actualFormat = detectFormatFromMime(blob.type) || targetFormat
        const filename = generateOutputFilename(fileItem.file.name, actualFormat)

        console.log(
          `[App] Setting file result for ${fileItem.file.name} (${fileItem.id}) - marking as completed`
        )
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

        // Only show toast if it's not a cancellation
        if (!message.includes('cancelled') && !message.includes('aborted')) {
          addToast({
            type: 'error',
            message: `Failed to convert ${fileItem.file.name}: ${message}`,
          })
        }

        return { success: false, fileId: fileItem.id, fileName: fileItem.file.name }
      }
    })

    // Wait for all conversions to complete
    await Promise.allSettled(conversionPromises)

    setIsConverting(false)
    setConversionAbortController(null)

    // Get the fresh state after all updates
    const currentFiles = useConversionStore.getState().files
    const successCount = currentFiles.filter(f => f.status === 'completed').length

    // Mark all files as converted - this will keep the TargetFormatSelector hidden
    // and change the Convert button to "Convert again"
    const allCompleted = currentFiles.every(f => f.status === 'completed')
    if (allCompleted) {
      setAllFilesConverted(true)

      // Auto-download if setting is enabled
      if (autoDownload) {
        const completedFiles = currentFiles.filter(f => f.status === 'completed' && f.result)
        if (completedFiles.length > 0) {
          const allResults = completedFiles.flatMap(f => f.result ?? [])

          try {
            setIsDownloading(true)
            setDownloadProgress(0)

            await downloadFiles(allResults, 'auto', progress => {
              setDownloadProgress(progress)
            })

            addToast({
              type: 'success',
              message: 'Files downloaded successfully',
            })
          } catch (error) {
            addToast({
              type: 'error',
              message: 'Auto-download failed',
            })
          } finally {
            setIsDownloading(false)
            setDownloadProgress(0)
          }
        }
      }
    }

    announceToScreenReader(`Conversion complete. ${successCount} file(s) converted.`)
  }

  // Calculate overall progress for multiple file conversions
  // Ensure completed files always count as 100% (not their stored progress value)
  const overallProgress = (() => {
    if (!isConverting || files.length === 0) return 0

    const fileBreakdown = files.map(f => ({
      name: f.file.name,
      status: f.status,
      progress: f.progress,
      contributedProgress: f.status === 'completed' ? 100 : f.progress || 0,
    }))

    const totalProgress = files.reduce((sum, file) => {
      // Completed files always contribute 100%
      if (file.status === 'completed') return sum + 100
      // Processing/queued files use their current progress
      return sum + (file.progress || 0)
    }, 0)

    const result = totalProgress / files.length

    console.log('[Overall Progress]', {
      result: Math.round(result),
      breakdown: fileBreakdown,
    })

    return result
  })()

  const showProgressBackground = isConverting

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Header />

      <main
        className={`${!hasFiles ? 'md:flex-1 md:flex md:items-center' : 'flex-1'} container mx-auto px-4 ${!hasFiles ? 'py-4 md:py-8' : 'py-8'}`}
      >
        {!hasFiles ? (
          <EmptyState />
        ) : (
          <div className="max-w-[630px] mx-auto space-y-6 pb-24">
            {/* File list with integrated DropZone */}
            <FileList />

            {/* Target format selector with integrated options menu */}
            {/* Hide during conversion and when all files are converted */}
            <div
              className={`
                transition-all duration-300 ease-in-out overflow-hidden
                ${isConverting || allFilesConverted ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}
              `}
            >
              <TargetFormatSelector disabled={isConverting} />
            </div>
          </div>
        )}
      </main>

      {/* Full-width convert button at the bottom */}
      {hasFiles && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <div
            className="absolute inset-0 bg-brand-bg/70 backdrop-blur-md"
            style={{
              maskImage: 'linear-gradient(to top, black 0%, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, black 0%, black 85%, transparent 100%)',
            }}
          />
          <div className="container mx-auto px-4 pt-8 pb-4 max-w-[630px] relative z-10">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (isConverting) {
                    cancelConversion()
                    addToast({
                      type: 'info',
                      message: 'Conversion cancelled',
                    })
                  } else {
                    handleConvert()
                  }
                }}
                onMouseEnter={() => setIsHoveringConvert(true)}
                onMouseLeave={() => setIsHoveringConvert(false)}
                disabled={!canConvert && !isConverting}
                className={`
                  rounded-brand font-semibold text-lg
                  transition-all duration-300 ease-in-out relative overflow-hidden
                  focus:outline-none
                  ${allFilesConverted ? 'px-0 py-0' : 'px-8 py-4'}
                  ${
                    !canConvert && !isConverting
                      ? 'bg-gray-300/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : allFilesConverted
                        ? 'bg-slate-600/50 hover:bg-slate-700/50 dark:bg-slate-700/50 dark:hover:bg-slate-600/50 text-white'
                        : isConverting && isHoveringConvert
                          ? 'bg-gray-300/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-pointer'
                          : isConverting
                            ? 'bg-gray-300/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                            : 'bg-brand-accent hover:bg-brand-accent-hover text-white'
                  }
                `}
                style={{
                  width: allFilesConverted ? '72px' : '100%',
                  height: '72px',
                }}
              >
                {/* Progress background overlay */}
                {showProgressBackground && (
                  <div
                    className="absolute inset-0 bg-gray-700/30 dark:bg-gray-600/30 transition-all duration-300"
                    style={{
                      width: `${overallProgress}%`,
                    }}
                  />
                )}
                {/* Red cancel overlay - shown on hover */}
                {isConverting && isHoveringConvert && (
                  <div className="absolute inset-0 bg-red-500/10 dark:bg-red-600/10 rounded-brand transition-all duration-300" />
                )}
                {isConverting ? (
                  isHoveringConvert ? (
                    <span className="flex items-center justify-center gap-3 relative z-10 text-white font-bold">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </span>
                  ) : (
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
                      Converting... {Math.round(overallProgress)}%
                    </span>
                  )
                ) : (
                  <span
                    className={`flex items-center justify-center relative z-10 ${allFilesConverted ? '' : 'gap-3'}`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    {!allFilesConverted && 'Convert'}
                  </span>
                )}
              </button>

              {/* Download All Button - appears when all files are converted */}
              <button
                onClick={async () => {
                  const completedFiles = files.filter(f => f.status === 'completed' && f.result)
                  if (completedFiles.length === 0) return

                  const allResults = completedFiles.flatMap(f => f.result ?? [])

                  try {
                    setIsDownloading(true)
                    setDownloadProgress(0)

                    await downloadFiles(allResults, 'auto', progress => {
                      setDownloadProgress(progress)
                    })
                  } catch (error) {
                    addToast({
                      type: 'error',
                      message: 'Download failed',
                    })
                  } finally {
                    setIsDownloading(false)
                    setDownloadProgress(0)
                  }
                }}
                disabled={isDownloading || !allFilesConverted}
                className="
                  px-8 py-4 rounded-brand font-semibold text-lg
                  bg-brand-bg-secondary hover:bg-brand-bg-hover
                  text-brand-text border border-brand-border
                  transition-all duration-500 ease-in-out relative overflow-hidden
                  focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{
                  width: allFilesConverted ? 'calc(100% - 84px)' : '0',
                  opacity: allFilesConverted ? 1 : 0,
                  padding: allFilesConverted ? '1rem 2rem' : '1rem 0',
                  height: '72px',
                }}
              >
                {/* Progress background overlay */}
                {isDownloading && (
                  <div
                    className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 transition-all duration-200"
                    style={{
                      width: `${downloadProgress}%`,
                    }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isDownloading ? (
                    <>
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
                      Preparing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      {files.filter(f => f.status === 'completed' && f.result).length === 1
                        ? 'Download'
                        : 'Download All'}
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast />
    </div>
  )
}
