/**
 * File list component
 * Displays loaded files with status and actions
 * Includes compact DropZone as last item
 */

import { useConversionStore } from '../features/state/useConversionStore'
import { formatBytes } from '../utils/bytes'
import { downloadBlob } from '../features/conversion/download'
import { DropZone } from './DropZone'
import { useEffect, useState, useRef } from 'react'
import { AnimatedFilename } from './AnimatedFilename'
import { FileTypeIcon } from './FileTypeIcon'
import { AudioPreviewIcon } from './AudioPreviewIcon'

/**
 * Custom hook for smooth progress animation
 * Ensures progress always animates smoothly, even when jumping to 100%
 */
function useSmoothProgress(targetProgress: number, status: string) {
  const [smoothProgress, setSmoothProgress] = useState(targetProgress)
  const rafRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const startProgressRef = useRef(targetProgress)

  useEffect(() => {
    // When target changes, start smooth animation
    if (smoothProgress !== targetProgress) {
      // If progress goes backward, reset immediately (no animation)
      // This handles when a completed file is reused for sequential conversion
      if (targetProgress < smoothProgress - 5) {
        // Allow 5% tolerance for small variations
        setSmoothProgress(targetProgress)
        return
      }

      startProgressRef.current = smoothProgress
      startTimeRef.current = Date.now()

      const animate = () => {
        const now = Date.now()
        const elapsed = now - (startTimeRef.current || now)

        // Minimum animation duration based on distance
        const distance = Math.abs(targetProgress - startProgressRef.current)
        const minDuration = Math.max(300, distance * 10) // At least 300ms, longer for bigger jumps

        const progress = Math.min(elapsed / minDuration, 1)

        // Ease-out function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3)

        const newProgress =
          startProgressRef.current + (targetProgress - startProgressRef.current) * easeOut

        setSmoothProgress(newProgress)

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate)
        } else {
          setSmoothProgress(targetProgress)
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [targetProgress, smoothProgress])

  // Reset on status change to queued
  useEffect(() => {
    if (status === 'queued') {
      setSmoothProgress(0)
    }
  }, [status])

  return smoothProgress
}

function FileThumbnail({ file }: { file: File }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Create object URL for preview
    const url = URL.createObjectURL(file)
    setThumbnailUrl(url)

    // Cleanup
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  const isAudio = file.type.startsWith('audio/')

  if (hasError || (!isImage && !isVideo)) {
    // Show file type icon with app-like styling
    // Use AudioPreviewIcon for audio files
    return (
      <div className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden">
        {isAudio ? <AudioPreviewIcon file={file} /> : <FileTypeIcon file={file} />}
      </div>
    )
  }

  if (isImage) {
    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-accent/10 rounded-lg">
            <svg
              className="animate-spin h-6 w-6 text-brand-accent"
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
          </div>
        )}
        <img
          src={thumbnailUrl || ''}
          alt=""
          className="w-full h-full object-cover rounded-lg"
          onError={() => setHasError(true)}
          onLoad={() => setIsLoading(false)}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </>
    )
  }

  if (isVideo && thumbnailUrl) {
    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-accent/10 rounded-lg">
            <svg
              className="animate-spin h-6 w-6 text-brand-accent"
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
          </div>
        )}
        <video
          src={thumbnailUrl}
          className="w-full h-full object-cover rounded-lg"
          muted
          onError={() => setHasError(true)}
          onLoadedData={() => setIsLoading(false)}
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </>
    )
  }

  return null
}

export function FileList() {
  const files = useConversionStore(state => state.files)
  const clearFiles = useConversionStore(state => state.clearFiles)
  const isConverting = useConversionStore(state => state.isConverting)

  if (files.length === 0) {
    return null
  }

  // Count files by status for concurrent processing indicator
  const processingCount = files.filter(f => f.status === 'processing').length

  // Check if any files are completed or being processed
  const hasCompletedFiles = files.some(f => f.status === 'completed' && f.result)
  const hasProcessingFiles = files.some(f => f.status === 'processing')

  // Calculate dynamic height based on state
  // When converting or any files are completed/processing, we don't show "Add more files" button at bottom
  // So the list can expand more
  const listMaxHeight = isConverting || hasCompletedFiles || hasProcessingFiles ? '260px' : '560px'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-brand-text">Files ({files.length})</h3>
          {isConverting && processingCount > 0 && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
              <svg
                className="animate-spin h-4 w-4"
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
              {processingCount} converting
            </span>
          )}
        </div>
        {!isConverting && (
          <button
            onClick={clearFiles}
            className="
              text-sm text-brand-text-secondary hover:text-brand-error
              transition-colors flex items-center gap-1.5
            "
          >
            Clear all
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Scrollable file list */}
      <div
        className="overflow-y-auto space-y-2 pr-1 transition-all duration-500 ease-in-out"
        style={{ maxHeight: `calc(100vh - ${listMaxHeight})` }}
      >
        {files.map(file => {
          const hasError = file.status === 'error' && !!file.error

          return <FileListItem key={file.id} file={file} hasError={hasError} />
        })}
      </div>

      {/* Compact DropZone for adding more files - Only show before conversion starts */}
      {!isConverting && !hasCompletedFiles && !hasProcessingFiles && <DropZone disabled={false} />}

      <style>{`
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

function FileListItem({ file, hasError }: { file: any; hasError: boolean }) {
  const removeFile = useConversionStore(state => state.removeFile)
  const isConverting = useConversionStore(state => state.isConverting)

  // Use smooth progress animation
  const displayProgress = useSmoothProgress(
    file.status === 'completed' ? 100 : file.progress,
    file.status
  )

  const handleDownload = () => {
    if (!file.result) return
    file.result.forEach(({ blob, filename }: any) => {
      downloadBlob(blob, filename)
    })
  }

  return (
    <div
      className={`
        p-4 rounded-brand border transition-colors relative overflow-hidden
        ${
          hasError
            ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
            : 'border-brand-border bg-brand-bg-secondary hover:bg-brand-bg-hover'
        }
      `}
      style={{ minHeight: '40px' }}
    >
      {/* Progress background overlay with smooth animation */}
      {(file.status === 'processing' || file.status === 'completed') && (
        <div
          className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20 transition-opacity duration-300"
          style={{
            width: `${displayProgress}%`,
            transition: 'none', // We handle animation with React state
          }}
        />
      )}
      <div className="flex items-center gap-3 relative z-10 min-w-0">
        {/* Thumbnail Preview */}
        <div
          className={`
          flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg relative
          ${hasError ? 'w-12 h-12 bg-red-100 dark:bg-red-900/30' : 'w-12 h-12 bg-brand-accent/5'}
        `}
          style={{ maxWidth: '80px', maxHeight: '80px' }}
        >
          {hasError ? (
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <FileThumbnail file={file.file} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="overflow-hidden">
                <AnimatedFilename
                  originalName={file.file.name}
                  convertedName={file.result?.[0]?.filename}
                  isConverted={file.status === 'completed'}
                />
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-secondary flex-wrap">
                <span className="whitespace-nowrap">{formatBytes(file.file.size)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {file.status === 'completed' && file.result && (
                <button
                  onClick={handleDownload}
                  className="
                    p-2 rounded
                    text-brand-text-secondary hover:text-brand-success
                    transition-colors
                    animate-fadeIn
                  "
                  aria-label="Download converted file"
                  title="Download"
                  style={{ animation: 'fadeIn 0.5s ease-in forwards' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>
              )}

              {!isConverting && file.status !== 'completed' && (
                <button
                  onClick={() => removeFile(file.id)}
                  className="
                    p-2 rounded
                    text-brand-text-secondary hover:text-brand-error
                    transition-colors
                  "
                  aria-label="Remove file"
                  title="Remove"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Error Message */}
          {hasError && (
            <div className="mb-2 p-2 rounded bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">{file.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
