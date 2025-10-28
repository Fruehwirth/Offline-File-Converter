/**
 * Settings modal component
 * Provides user preferences for theme and auto-download
 */

import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../features/theming/ThemeProvider'
import { useSettingsStore } from '../features/state/useSettingsStore'

export function SettingsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { theme, setTheme } = useTheme()
  const settings = useSettingsStore(state => state.settings)
  const toggleAutoDownload = useSettingsStore(state => state.toggleAutoDownload)

  // Close modal when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    // Use capture phase to ensure we catch the event
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [isOpen])

  // Close modal on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div className="relative">
      {/* Settings Gear Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="
          p-2 rounded-brand
          bg-brand-bg-secondary hover:bg-brand-bg-hover
          border border-brand-border
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-brand-accent
        "
        aria-label="Open settings"
        aria-expanded={isOpen}
        title="Settings"
      >
        <svg
          className="w-5 h-5 text-brand-text"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div
          ref={modalRef}
          className="
            absolute right-0 top-full mt-2
            w-72 p-4
            bg-brand-bg border border-brand-border
            rounded-brand shadow-2xl
            z-50
          "
          role="dialog"
          aria-label="Settings"
        >
          <h2 className="text-lg font-semibold text-brand-text mb-4">Settings</h2>

          <div className="space-y-4">
            {/* Theme Setting */}
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="theme-toggle" className="text-sm font-medium text-brand-text">
                  Theme
                </label>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>

              <button
                id="theme-toggle"
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg
                  ${theme === 'dark' ? 'bg-brand-accent' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Auto-Download Setting */}
            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              <div>
                <label
                  htmlFor="auto-download-toggle"
                  className="text-sm font-medium text-brand-text"
                >
                  Download when finished
                </label>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Auto-download after conversion
                </p>
              </div>

              <button
                id="auto-download-toggle"
                role="switch"
                aria-checked={settings.autoDownload}
                onClick={toggleAutoDownload}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-bg
                  ${settings.autoDownload ? 'bg-brand-accent' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${settings.autoDownload ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
