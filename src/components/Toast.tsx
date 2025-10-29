/**
 * Toast notification component
 * Displays temporary messages to the user
 */

import { useConversionStore } from '../features/state/useConversionStore'

const ICONS = {
  info: 'ℹ️',
  success: '✓',
  error: '✕',
  warning: '⚠',
}

export function Toast() {
  const toasts = useConversionStore(state => state.toasts)
  const removeToast = useConversionStore(state => state.removeToast)

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast--${toast.type}`} role="alert">
          <div className="toast__content">
            <span className="toast__icon" aria-hidden="true">
              {ICONS[toast.type]}
            </span>
            <p className="toast__message">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast__close"
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
