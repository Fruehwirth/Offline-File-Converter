/**
 * Application entry point
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './pages/App'
import { ThemeProvider } from './features/theming/ThemeProvider'
import { installInDev } from './utils/guardNoNetwork'
import { assertCSP } from './utils/csp'
import './css/main.css'

// Install network guards in development
installInDev()

// Validate CSP on startup
try {
  assertCSP()
} catch (error) {
  console.error('CSP validation failed:', error)
}

// Register Service Worker for COOP/COEP headers
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Check if Service Worker is controlling the page
  if (!navigator.serviceWorker.controller) {
    // First visit - need to register SW and reload
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered. Reloading page for COOP/COEP headers...')
      // Wait for SW to activate, then reload
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            window.location.reload()
          }
        })
      })
      // If already activated, reload immediately
      if (registration.active) {
        window.location.reload()
      }
    })
  } else {
    console.log('Service Worker is active and controlling the page')
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
