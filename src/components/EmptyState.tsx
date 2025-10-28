/**
 * Empty state component
 * Displayed when no files are loaded
 * Also acts as a drop zone
 */

import { useRef, useState } from 'react'
import { useFileHandler } from '../features/conversion/useFileHandler'

interface EmptyStateProps {
  onSelectFiles?: () => void
  onFileDrop?: (files: FileList) => void
}

export function EmptyState({ onSelectFiles, onFileDrop }: EmptyStateProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { handleFiles } = useFileHandler()

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  return (
    <div className="flex justify-center items-center w-full">
      <div
        className={`
          flex flex-col items-center justify-center min-h-[400px] md:min-h-[400px] text-center px-4
          border-2 border-dashed rounded-brand-lg p-6 md:p-8 transition-colors
          w-full md:max-w-[50%] min-w-[280px]
          ${
            isDragging
              ? 'border-brand-accent bg-brand-accent/5'
              : 'border-brand-border hover:border-brand-accent/50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/avif,image/heic,image/x-icon,audio/mpeg,audio/wav,audio/flac,audio/ogg,audio/aac,audio/mp4,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.avif,.heic,.ico,.mp3,.wav,.flac,.ogg,.aac,.m4a"
          className="sr-only"
          onChange={handleInputChange}
          aria-hidden="true"
        />

        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-accent/10 flex items-center justify-center mb-4 md:mb-6">
          <svg
            className="w-8 h-8 md:w-10 md:h-10 text-brand-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-brand-text mb-2">
          Convert files locally
        </h2>

        <p className="text-sm md:text-base text-brand-text-secondary mb-6 max-w-md">
          Drag & drop any files here or click to select.
          <br />
          100% local processing • No uploads • No tracking
        </p>

        <button
          onClick={e => {
            e.stopPropagation()
            handleClick()
          }}
          className="
          px-6 py-3 rounded-brand
          bg-brand-accent hover:bg-brand-accent-hover
          text-white font-medium
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg
        "
        >
          Select Files
        </button>

        <div className="mt-8 flex items-center gap-2 text-sm text-brand-text-secondary">
          <svg
            className="w-4 h-4 text-brand-success"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Your files never leave your device</span>
        </div>
      </div>
    </div>
  )
}
