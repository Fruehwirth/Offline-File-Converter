/**
 * Application entry point
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './pages/App'
import { ThemeProvider } from './features/theming/ThemeProvider'
import { installInDev } from './utils/guardNoNetwork'
import { assertCSP } from './utils/csp'
import './index.css'

// Install network guards in development
installInDev()

// Validate CSP on startup
try {
  assertCSP()
} catch (error) {
  console.error('CSP validation failed:', error)
}

// Register Service Worker for COOP/COEP headers (required for GitHub Pages)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register('/Offline-File-Converter/sw.js')
    .then(() => console.log('Service Worker registered for COOP/COEP support'))
    .catch(error => console.error('Service Worker registration failed:', error))
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)
