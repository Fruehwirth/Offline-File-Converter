/**
 * PWA Install Button Component
 * Shows install prompt for Progressive Web App
 * Only visible when app is installable and not already installed
 */

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      const installed = isStandalone || isIOSStandalone
      setIsInstalled(installed)
      console.log('PWA Install Check:', { isStandalone, isIOSStandalone, installed })
    }

    checkInstalled()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired!')
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('App installed!')
      setDeferredPrompt(null)
      setIsInstallable(false)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    console.log('InstallButton: Listeners attached, waiting for beforeinstallprompt...')

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    // Clear the deferredPrompt so it can only be used once
    setDeferredPrompt(null)
    setIsInstallable(false)
  }

  // Show button state for debugging
  console.log('InstallButton render:', { isInstalled, isInstallable, hasDeferredPrompt: !!deferredPrompt })

  // Don't show button if app is already installed or not installable
  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <button
      onClick={handleInstallClick}
      className="
        flex items-center gap-2
        px-3 py-2 rounded-brand
        bg-brand-bg-secondary hover:bg-brand-bg-hover
        border border-brand-border
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-brand-accent
      "
      aria-label="Install app"
      title="Install app"
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
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span className="text-sm font-medium text-brand-text">Install</span>
    </button>
  )
}

