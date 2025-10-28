/**
 * Toast notification component
 * Displays temporary messages to the user
 */

import { useEffect } from 'react'
import { useConversionStore } from '../features/state/useConversionStore'

const ICONS = {
  info: 'ℹ️',
  success: '✓',
  error: '✕',
  warning: '⚠',
}

const STYLES = {
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  success: 'bg-green-500/10 border-green-500/20 text-green-400',
  error: 'bg-red-500/10 border-red-500/20 text-red-400',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
}

export function Toast() {
  const toasts = useConversionStore(state => state.toasts)
  const removeToast = useConversionStore(state => state.removeToast)

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            px-4 py-3 rounded-brand border backdrop-blur-sm
            shadow-lg animate-slide-in
            ${STYLES[toast.type]}
          `}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
              {ICONS[toast.type]}
            </span>
            <p className="flex-1 text-sm">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

