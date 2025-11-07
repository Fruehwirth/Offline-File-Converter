/**
 * Empty state component
 * Displayed when no files are loaded
 * Also acts as a drop zone
 */

import { useRef, useState } from 'react'
import { useFileHandler } from '../features/conversion/useFileHandler'
import { FORMATS } from '../features/conversion/formatRegistry'
import imageIcon from '../assets/icons/image.svg'
import audioIcon from '../assets/icons/audio.svg'

export function EmptyState() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [hoveredIcon, setHoveredIcon] = useState<'image' | 'audio' | null>(null)
  const { handleFiles } = useFileHandler()

  // Get image and audio formats
  const imageFormats = FORMATS.filter(f => f.category === 'photo' || f.category === 'icon').map(
    f => `.${f.id}`
  )
  const audioFormats = FORMATS.filter(f => f.category === 'audio').map(f => `.${f.id}`)

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
          drop-zone
          flex flex-col items-center justify-center min-h-[400px] text-center px-4
          md:border-2 md:border-dashed md:rounded-brand-lg md:p-8 transition-colors
          w-full min-w-[280px] max-w-[700px]
          md:bg-gray-100 md:dark:bg-black/20 md:hover:bg-[#eef0f2] md:dark:hover:bg-black/30
          ${
            isDragging
              ? 'md:border-brand-accent md:bg-brand-accent/5'
              : 'md:border-brand-border md:hover:border-brand-accent/50'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.avif,.heic,.ico,.mp3,.wav,.flac,.ogg,.aac,.m4a"
          className="sr-only"
          onChange={handleInputChange}
          aria-hidden="true"
        />

        {/* Format Icons with Tooltips */}
        <div className="flex gap-8 mb-8 justify-center">
          {/* Image Icon */}
          <div
            className="relative flex flex-col items-center"
            onMouseEnter={() => setHoveredIcon('image')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className="w-20 h-20 flex items-center justify-center transition-transform hover:scale-110">
              <img
                src={imageIcon}
                alt="Image formats"
                className="w-full h-full object-contain format-tooltip__icon"
              />
            </div>
            {/* Tooltip */}
            {hoveredIcon === 'image' && (
              <div className="format-tooltip">
                <div className="flex flex-wrap gap-1">
                  {imageFormats.map(format => (
                    <div
                      key={format}
                      className="text-sm font-medium text-brand-text px-2 py-1 flex-1 min-w-[60px] text-center"
                    >
                      {format}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Audio Icon */}
          <div
            className="relative flex flex-col items-center"
            onMouseEnter={() => setHoveredIcon('audio')}
            onMouseLeave={() => setHoveredIcon(null)}
          >
            <div className="w-20 h-20 flex items-center justify-center transition-transform hover:scale-110">
              <img
                src={audioIcon}
                alt="Audio formats"
                className="w-full h-full object-contain format-tooltip__icon"
              />
            </div>
            {/* Tooltip */}
            {hoveredIcon === 'audio' && (
              <div className="format-tooltip">
                <div className="flex flex-wrap gap-1">
                  {audioFormats.map(format => (
                    <div
                      key={format}
                      className="text-sm font-medium text-brand-text px-2 py-1 flex-1 min-w-[60px] text-center"
                    >
                      {format}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-brand-text mb-2">Convert any files locally</h2>

        <p className="text-base text-brand-text-secondary mb-6 max-w-md">
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
          flex items-center gap-2
        "
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
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
