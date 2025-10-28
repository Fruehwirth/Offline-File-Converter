/**
 * Zustand store for user settings
 * Manages persistent user preferences
 */

import { create } from 'zustand'

export interface Settings {
  autoDownload: boolean
}

interface SettingsStore {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  toggleAutoDownload: () => void
}

const SETTINGS_STORAGE_KEY = 'app-settings'

/**
 * Get initial settings from localStorage
 */
function getInitialSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        autoDownload: parsed.autoDownload ?? false,
      }
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error)
  }

  return {
    autoDownload: false,
  }
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error)
  }
}

export const useSettingsStore = create<SettingsStore>(set => ({
  settings: getInitialSettings(),

  updateSettings: updates => {
    set(state => {
      const newSettings = {
        ...state.settings,
        ...updates,
      }
      saveSettings(newSettings)
      return { settings: newSettings }
    })
  },

  toggleAutoDownload: () => {
    set(state => {
      const newSettings = {
        ...state.settings,
        autoDownload: !state.settings.autoDownload,
      }
      saveSettings(newSettings)
      return { settings: newSettings }
    })
  },
}))
