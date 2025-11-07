/**
 * File list component
 * Displays loaded files with status and actions
 */

import { useConversionStore } from '../features/state/useConversionStore'
import { formatBytes } from '../utils/bytes'
import { downloadBlob } from '../features/conversion/download'
import { useEffect, useState, useRef, memo } from 'react'
import { AnimatedFilename } from './AnimatedFilename'
import { FileTypeIcon } from './FileTypeIcon'
import { AudioPreviewIcon } from './AudioPreviewIcon'

interface FileListProps {
  onAddFiles?: () => void
}

/**
 * Custom hook for smooth progress animation
 * Ensures progress always animates smoothly, even when jumping to 100%
 */
function useSmoothProgress(targetProgress: number, status: string) {
  const [smoothProgress, setSmoothProgress] = useState(targetProgress)
  const rafRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const startProgressRef = useRef(targetProgress)
  const targetProgressRef = useRef(targetProgress)

  useEffect(() => {
    // Update target ref
    targetProgressRef.current = targetProgress

    // If progress goes backward significantly, reset immediately (no animation)
    // This handles when a completed file is reused for sequential conversion
    if (targetProgress < smoothProgress - 5) {
      // Allow 5% tolerance for small variations
      setSmoothProgress(targetProgress)
      startProgressRef.current = targetProgress
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = undefined
      }
      return
    }

    // If no animation in progress and target changed, start new animation
    if (!rafRef.current && smoothProgress !== targetProgress) {
      startProgressRef.current = smoothProgress
      startTimeRef.current = Date.now()

      const animate = () => {
        const now = Date.now()
        const elapsed = now - (startTimeRef.current || now)

        // Use fixed shorter duration for responsiveness during concurrent conversions
        const duration = 400 // Fixed 400ms animation

        const progress = Math.min(elapsed / duration, 1)

        // Ease-out function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3)

        // Always animate towards the current target (not the original one)
        const currentTarget = targetProgressRef.current
        const newProgress =
          startProgressRef.current + (currentTarget - startProgressRef.current) * easeOut

        setSmoothProgress(newProgress)

        if (progress < 1 && currentTarget > newProgress) {
          rafRef.current = requestAnimationFrame(animate)
        } else {
          // Animation complete, set to exact target and clear animation
          setSmoothProgress(currentTarget)
          rafRef.current = undefined
          startProgressRef.current = currentTarget
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }
  }, [targetProgress, smoothProgress])

  // Reset on status change to queued
  useEffect(() => {
    if (status === 'queued') {
      setSmoothProgress(0)
      startProgressRef.current = 0
      targetProgressRef.current = 0
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = undefined
      }
    }
  }, [status])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

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
          className={`w-full h-full object-cover rounded-lg ${isLoading ? 'thumbnail__image--loading' : 'thumbnail__image'}`}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoading(false)}
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
          className={`w-full h-full object-cover rounded-lg ${isLoading ? 'thumbnail__video--loading' : 'thumbnail__video'}`}
          muted
          onError={() => setHasError(true)}
          onLoadedData={() => setIsLoading(false)}
        />
      </>
    )
  }

  return null
}

export function FileList({ onAddFiles }: FileListProps) {
  const files = useConversionStore(state => state.files)
  const isConverting = useConversionStore(state => state.isConverting)

  if (files.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* File list items */}
      {files.map(file => {
        const hasError = file.status === 'error' && !!file.error
        return <FileListItem key={file.id} file={file} hasError={hasError} />
      })}

      {/* Add More Files Button - at the end of the list */}
      {onAddFiles && (
        <button
          onClick={onAddFiles}
          disabled={isConverting}
          className={`
            w-full p-4 rounded-brand border border-dashed
            transition-all bg-gray-100 dark:bg-black/20
            ${
              isConverting
                ? 'cursor-not-allowed border-transparent opacity-40'
                : 'border-brand-border hover:border-brand-accent/50 hover:bg-gray-200 dark:hover:bg-black/30 cursor-pointer'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-brand-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-text text-left">Add more files</p>
            </div>
          </div>
        </button>
      )}
    </div>
  )
}

const FileListItem = memo(
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
        file-list-item
        p-4 rounded-brand border transition-colors relative overflow-hidden
        ${
          hasError
            ? 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'
            : 'border-brand-border bg-brand-bg-secondary hover:bg-brand-bg-hover'
        }
      `}
    >
      {/* Progress background overlay with smooth animation */}
      {(file.status === 'processing' || file.status === 'completed') && (
        <div
          className="file-list-item__progress"
          style={
            {
              '--progress-width': `${displayProgress}%`,
            } as React.CSSProperties
          }
        />
      )}
      <div className="flex items-center gap-3 relative z-10 min-w-0">
        {/* Thumbnail Preview */}
        <div
          className={`
          thumbnail
          flex-shrink-0 flex items-center justify-center overflow-hidden rounded-lg relative
          ${hasError ? 'w-12 h-12 bg-red-100 dark:bg-red-900/30' : 'w-12 h-12 bg-brand-accent/5'}
        `}
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
                    file-list-item__action-download
                    p-2 rounded
                    text-brand-text-secondary hover:text-brand-success
                    transition-colors
                  "
                  aria-label="Download converted file"
                  title="Download"
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
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    // Only re-render if file properties that affect the UI have changed
    return (
      prevProps.file.id === nextProps.file.id &&
      prevProps.file.status === nextProps.file.status &&
      prevProps.file.progress === nextProps.file.progress &&
      prevProps.file.error === nextProps.file.error &&
      prevProps.file.result === nextProps.file.result &&
      prevProps.hasError === nextProps.hasError
    )
  }
)
