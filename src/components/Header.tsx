/**
 * Application header
 * Contains branding and settings
 */

import { SettingsModal } from './SettingsModal'

export function Header() {
  return (
    <header className="sticky top-0 z-40 relative">
      <div
        className="absolute inset-0 bg-brand-bg/70 backdrop-blur-md"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 60%, transparent 100%)',
        }}
      />
      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-brand bg-brand-accent flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
            <h1 className="text-lg font-semibold text-brand-text">LocalConvert</h1>
            <p className="text-xs text-brand-text-secondary">100% local, privacy-first</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SettingsModal />
        </div>
      </div>
    </header>
  )
}
