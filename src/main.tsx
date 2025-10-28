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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)

