/**
 * File list component
 * Displays loaded files with status and actions
 * Includes compact DropZone as last item
 */

import { useConversionStore } from '../features/state/useConversionStore'
import { formatBytes } from '../utils/bytes'
import { getFormatLabel } from '../features/conversion/formatRegistry'
import { downloadBlob } from '../features/conversion/download'
import { DropZone } from './DropZone'
import { useEffect, useState } from 'react'
import { AnimatedFilename } from './AnimatedFilename'

function FileThumbnail({ file }: { file: File }) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

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

  if (hasError || (!isImage && !isVideo)) {
    // Fallback icon for unsupported types or errors
    return (
      <div className="w-full h-full flex items-center justify-center bg-brand-accent/10">
        <svg
          className="w-6 h-6 text-brand-accent"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    )
  }

  if (isImage) {
    return (
      <img
        src={thumbnailUrl || ''}
        alt=""
        className="w-full h-full object-contain rounded"
        onError={() => setHasError(true)}
      />
    )
  }

  if (isVideo && thumbnailUrl) {
    return (
      <video
        src={thumbnailUrl}
        className="w-full h-full object-contain rounded"
        muted
        onError={() => setHasError(true)}
      />
    )
  }

  return null
}

export function FileList() {
  const files = useConversionStore(state => state.files)
  const removeFile = useConversionStore(state => state.removeFile)
  const clearFiles = useConversionStore(state => state.clearFiles)
  const isConverting = useConversionStore(state => state.isConverting)

  if (files.length === 0) {
    return null
  }

  const handleDownload = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (!file?.result) return

    // Download each result
    file.result.forEach(({ blob, filename }) => {
      downloadBlob(blob, filename)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-brand-text">Files ({files.length})</h3>
        {!isConverting && (
          <button
            onClick={clearFiles}
            className="
              text-sm text-brand-text-secondary hover:text-brand-error
              transition-colors
            "
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {files.map(file => {
          const hasError = file.status === 'error' && file.error

          return (
            <div
              key={file.id}
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
              {/* Progress background overlay - Sanftes Blau */}
              {file.status === 'processing' && (
                <div
                  className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20"
                  style={{
                    width: `${Math.min(100, Math.max(0, file.progress))}%`,
                    transition: 'width 0.3s ease-out',
                  }}
                />
              )}
              {/* Keep progress bar at 100% when completed */}
              {file.status === 'completed' && (
                <div
                  className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/20"
                  style={{ width: '100%' }}
                />
              )}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 relative z-10">
                {/* Thumbnail Preview */}
                <div
                  className={`
                  flex-shrink-0 flex items-center justify-center overflow-hidden
                  ${
                    hasError
                      ? 'w-12 h-12 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900/30 rounded'
                      : 'w-12 h-12 sm:w-20 sm:h-20 bg-brand-accent/5 rounded'
                  }
                `}
                  style={{ maxWidth: '125px', maxHeight: '125px' }}
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
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <AnimatedFilename
                        originalName={file.file.name}
                        convertedName={file.result?.[0]?.filename}
                        isConverted={file.status === 'completed'}
                      />
                      <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-secondary">
                        <span>{formatBytes(file.file.size)}</span>
                        {file.sourceFormat && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded bg-brand-accent/10 text-brand-accent">
                              {getFormatLabel(file.sourceFormat)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {file.status === 'completed' && file.result && (
                        <button
                          onClick={() => handleDownload(file.id)}
                          className="
                            p-3 rounded
                            text-brand-text-secondary hover:text-brand-success
                            transition-colors
                          "
                          aria-label="Download converted file"
                          title="Download"
                        >
                          <svg
                            className="w-7 h-7"
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
                        </button>
                      )}

                      {!isConverting && (
                        <button
                          onClick={() => removeFile(file.id)}
                          className="
                            p-3 rounded
                            text-brand-text-secondary hover:text-brand-error
                            transition-colors
                          "
                          aria-label="Remove file"
                          title="Remove"
                        >
                          <svg
                            className="w-7 h-7"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                      <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                        {file.error}
                      </p>
                    </div>
                  )}

                  {/* Status Message */}
                  {file.status === 'processing' && (
                    <p className="text-xs text-brand-accent font-medium">
                      Converting... {Math.round(file.progress)}%
                    </p>
                  )}
                  {file.status === 'completed' && file.result && (
                    <p className="text-xs text-brand-success font-medium">
                      ✓ Converted {file.result.length} file(s)
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Compact DropZone for adding more files - Always visible, disabled during conversion */}
        <DropZone disabled={isConverting} />
      </div>
    </div>
  )
}
