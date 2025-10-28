/**
 * Compact drop zone component
 * Displayed as last item in file list for adding more files
 */

import { useRef, useState } from 'react'
import { useFileHandler } from '../features/conversion/useFileHandler'

interface DropZoneProps {
  disabled?: boolean
}

export function DropZone({ disabled = false }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { handleFiles } = useFileHandler()

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFiles(files)
  }

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    handleFiles(e.target.files)
  }

  return (
    <>
      <div
        className={`
          p-4 rounded-brand border-2 border-dashed
          transition-all relative
          ${
            disabled
              ? 'cursor-not-allowed border-brand-border'
              : isDragging
                ? 'border-brand-accent bg-brand-accent/5 cursor-pointer'
                : 'border-brand-border hover:border-brand-accent/50 hover:bg-brand-bg-hover cursor-pointer'
          }
        `}
        style={disabled ? { borderColor: 'transparent' } : undefined}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={
          disabled
            ? 'Add more files (disabled during conversion)'
            : 'Drop more files or click to add'
        }
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.avif,.heic,.ico,.mp3,.wav,.flac,.ogg,.aac,.m4a"
          className="sr-only"
          onChange={handleInputChange}
          aria-hidden="true"
          disabled={disabled}
        />

        {/* Faded border overlay when disabled */}
        {disabled && (
          <div
            className="absolute inset-0 border-2 border-dashed rounded-brand pointer-events-none"
            style={{
              borderColor: 'var(--color-border, #e5e7eb)',
              opacity: 0.3,
            }}
          />
        )}

        <div
          className={`flex items-center gap-4 pointer-events-none transition-opacity relative z-10 ${disabled ? 'opacity-40' : 'opacity-100'}`}
        >
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
            <p className="text-sm font-medium text-brand-text">Add more files</p>
          </div>
        </div>
      </div>
    </>
  )
}
