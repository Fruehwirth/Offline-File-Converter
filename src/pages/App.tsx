/**
 * Main application component
 * Orchestrates the entire conversion workflow
 */

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
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
import { useFileHandler } from '../features/conversion/useFileHandler'
import { createThrottledProgress } from '../utils/throttle'

// Button animation configuration - smooth width sliding
const BUTTON_HEIGHT = '72px'

const layoutTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 35,
  mass: 0.8,
}

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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get file handler
  const { handleFiles } = useFileHandler()

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

  // Close drawer when format is selected
  useEffect(() => {
    if (selectedTargetFormat) {
      setIsDrawerOpen(false)
    }
  }, [selectedTargetFormat])

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
          // Throttle progress updates to avoid UI jank (max 10 updates/second)
          const throttledProgress = createThrottledProgress(progress => {
            console.log(`[App] Updating file ${fileItem.file.name}:`, {
              id: fileItem.id,
              percent: progress.percent,
              message: progress.message,
            })
            updateFileStatus(fileItem.id, 'processing', progress.percent, progress.message)
          }, 100) // 100ms = max 10 updates per second

          blob = await convertAudio(
            fileItem.file,
            targetFormat,
            { bitrate: 192 },
            throttledProgress,
            abortController.signal
          )
        } else {
          // Use image processing for image conversions
          // Throttle progress updates to avoid UI jank (max 10 updates/second)
          const throttledProgress = createThrottledProgress(progress => {
            updateFileStatus(fileItem.id, 'processing', progress.percent)
          }, 100) // 100ms = max 10 updates per second

          blob = await convertImage(
            fileItem.file,
            targetFormat,
            { quality: 0.92 },
            throttledProgress,
            abortController.signal
          )
        }

        // Detect actual format from blob (in case of fallback)
        const actualFormat = detectFormatFromMime(blob.type) || targetFormat
        const filename = generateOutputFilename(fileItem.file.name, actualFormat)

        // Explicitly set progress to 100% before marking as completed
        // This ensures the progress bar visually reaches 100% even with throttled updates
        updateFileStatus(fileItem.id, 'processing', 100)

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
    <div className="app-main">
      {/* Header with integrated files header */}
      <Header showFilesHeader={hasFiles} />

      {!hasFiles ? (
        <main className="app-main-centered app-main-centered--md">
          <EmptyState />
        </main>
      ) : (
        <>
          {/* Scrollable content area - extends under header */}
          <div className="app-content-scrollable">
            <div className="app-container">
              {/* Spacer to account for sticky header */}
              <div className="app-header-spacer" />

              {/* File List */}
              <div className="file-list__content">
                <FileList onAddFiles={() => fileInputRef.current?.click()} />

                {/* Deadspace equal to button height so last item is always visible */}
                <div className="app-button-spacer" />
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.avif,.heic,.ico,.mp3,.wav,.flac,.ogg,.aac,.m4a"
            className="app-file-input"
            onChange={e => handleFiles(e.target.files)}
            aria-hidden="true"
            disabled={isConverting}
          />
        </>
      )}

      {/* Fixed Bottom Section - Floating Button & Drawer */}
      <div className={`bottom-section ${!hasFiles ? 'bottom-section--hidden' : ''}`}>
        {/* Frosted glass backdrop with blur gradient - theme-aware */}
        <div className="bottom-section__backdrop" />

        <div className="bottom-section__container">
          {/* Drawer Container - Behind buttons, grows upward with animation */}
          <div
            className={`drawer ${isDrawerOpen && !selectedTargetFormat && availableTargets.length > 0 ? 'drawer--open' : 'drawer--closed'}`}
          >
            <div className="drawer__content">
              <TargetFormatSelector disabled={isConverting} />
            </div>
          </div>

          {/* Dynamic Button Container with smooth width sliding */}
          <div className="button-container">
            {/* Main Convert/Convert Again Button - Morphs from full width to circular */}
            <motion.button
              layout
              animate={{
                width: allFilesConverted ? BUTTON_HEIGHT : '100%',
                paddingLeft: allFilesConverted ? 0 : '1rem',
                paddingRight: allFilesConverted ? 0 : '1rem',
                paddingTop: allFilesConverted ? 0 : 0,
                paddingBottom: allFilesConverted ? 0 : 0,
                borderWidth: allFilesConverted ? 1 : 0,
                gap: allFilesConverted ? 0 : '0.75rem',
              }}
              transition={layoutTransition}
              onClick={() => {
                if (isConverting) {
                  cancelConversion()
                  addToast({
                    type: 'info',
                    message: 'Conversion cancelled',
                  })
                } else if (allFilesConverted) {
                  // Convert again action
                  handleConvert()
                } else if (!selectedTargetFormat && availableTargets.length > 0) {
                  setIsDrawerOpen(!isDrawerOpen)
                } else {
                  handleConvert()
                  setIsDrawerOpen(false)
                }
              }}
              disabled={availableTargets.length === 0 && !isConverting}
              className={`app-convert-btn ${
                allFilesConverted
                  ? 'app-convert-btn--morphed'
                  : availableTargets.length === 0 && !isConverting
                    ? ''
                    : isConverting
                      ? 'btn-converting'
                      : 'btn-primary'
              }`}
            >
              {showProgressBackground && (
                <motion.div
                  className="btn-progress-bg btn-progress-bg--converting"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ 
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1] // Custom ease-out curve for smooth motion
                  }}
                />
              )}
              
              {/* Icon - always visible */}
              {isConverting ? (
                <svg
                  className="btn-icon animate-spin"
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
              ) : allFilesConverted || selectedTargetFormat ? (
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <svg
                  className="btn-icon"
                  fill="currentColor"
                  viewBox="0 -960 960 960"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M480-480ZM202-65l-56-57 118-118h-90v-80h226v226h-80v-89L202-65Zm278-15v-80h240v-440H520v-200H240v400h-80v-400q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H480Z" />
                </svg>
              )}
              
              {/* Text content - fades out when morphing, removed from DOM when morphed */}
              {!allFilesConverted && (
                <motion.span
                  className="btn-text"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={layoutTransition}
                >
                  {isConverting
                    ? `Converting... ${Math.round(overallProgress)}%`
                    : selectedTargetFormat
                      ? 'Convert'
                      : 'Pick filetype'}
                </motion.span>
              )}
            </motion.button>

            {/* Download Button - Slides in from right when files completed */}
            <motion.button
              layout
              animate={{
                width: allFilesConverted ? 'auto' : 0,
                flexGrow: allFilesConverted ? 1 : 0,
                opacity: allFilesConverted ? 1 : 0,
                paddingLeft: allFilesConverted ? '1rem' : 0,
                paddingRight: allFilesConverted ? '1rem' : 0,
                paddingTop: allFilesConverted ? '1rem' : 0,
                paddingBottom: allFilesConverted ? '1rem' : 0,
                borderWidth: allFilesConverted ? 1 : 0,
                marginLeft: allFilesConverted ? '0.75rem' : 0,
                marginRight: 0,
              }}
              transition={layoutTransition}
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
              disabled={isDownloading}
              className={`btn-download app-download-btn ${allFilesConverted ? 'app-download-btn--visible' : 'app-download-btn--hidden'}`}
            >
              {isDownloading && (
                <motion.div
                  className="btn-progress-bg btn-progress-bg--downloading"
                  initial={{ width: 0 }}
                  animate={{ width: `${downloadProgress}%` }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className="btn-content">
                {isDownloading ? (
                  <>
                    <svg
                      className="btn-icon animate-spin"
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
                    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </motion.button>
          </div>
        </div>
      </div>

      <Toast />
    </div>
  )
}
