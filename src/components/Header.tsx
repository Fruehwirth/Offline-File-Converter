/**
 * Application header
 * Contains branding, settings, and file list header
 */

import { SettingsModal } from './SettingsModal'
import { useConversionStore } from '../features/state/useConversionStore'

interface HeaderProps {
  showFilesHeader?: boolean
}

export function Header({ showFilesHeader = false }: HeaderProps) {
  const files = useConversionStore(state => state.files)
  const clearFiles = useConversionStore(state => state.clearFiles)
  const isConverting = useConversionStore(state => state.isConverting)

  // Count files by status for concurrent processing indicator
  const processingCount = files.filter(f => f.status === 'processing').length

  return (
    <header className="header">
      {/* Frosted glass background with fade-out - theme-aware */}
      <div className="header__backdrop" />

      {/* Content - using same container system as rest of app */}
      <div className="header__content app-container">
        {/* Main header */}
        <div className="header__main">
          <div className="header__branding">
            <div className="header__logo">
              <svg
                className="header__logo-icon"
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
            <div>
              <h1 className="header__title">LocalConvert</h1>
              <p className="header__subtitle">100% local, privacy-first</p>
            </div>
          </div>

          <div className="header__actions">
            <SettingsModal />
          </div>
        </div>

        {/* Files header - when files are loaded */}
        {showFilesHeader && (
          <div className="header__files">
            <div className="header__files-info">
              <h3 className="header__files-title">Files ({files.length})</h3>
              {isConverting && processingCount > 0 && (
                <span className="header__processing-badge">
                  <svg
                    className="header__processing-icon animate-spin"
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
              <button onClick={clearFiles} className="header__clear-btn">
                Clear all
                <svg
                  className="header__clear-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
        )}
      </div>
    </header>
  )
}
