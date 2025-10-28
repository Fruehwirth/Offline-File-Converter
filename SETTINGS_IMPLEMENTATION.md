# Settings Modal Implementation

## Summary

Replaced the theme toggle button with a settings gear icon that opens a modal with persistent user preferences.

## Changes Made

### 1. New Settings Store (`src/features/state/useSettingsStore.ts`)

- Created a Zustand store for managing user settings
- Stores settings in localStorage for persistence across visits
- Currently manages:
  - `autoDownload`: Automatically download files when conversion is complete

### 2. New Settings Modal Component (`src/components/SettingsModal.tsx`)

- Settings gear icon button in the header
- Click-outside and Escape key support to close modal
- Two toggle switches:
  - **Theme**: Switch between light and dark mode
  - **Download when finished**: Auto-download files after conversion
- Styled to match the existing design system
- Fully accessible with ARIA labels and keyboard navigation

### 3. Updated Header Component (`src/components/Header.tsx`)

- Replaced `ThemeToggle` component with `SettingsModal` component
- Settings gear icon now appears in the top-right corner

### 4. Updated App Component (`src/pages/App.tsx`)

- Imported `useSettingsStore` to access user preferences
- Added auto-download logic after conversion completes
- When `autoDownload` is enabled and all files are converted:
  - Automatically triggers the download
  - Shows success/error toast notifications
  - Maintains the same download progress UI

## Features

### Persistent Storage

All settings are automatically saved to localStorage:

- **Key**: `app-settings`
- **Format**: JSON object
- Settings persist across browser sessions

### Theme Setting

- Previously inline in header, now in settings modal
- Same functionality, better organization
- Settings remain synchronized with `ThemeProvider`

### Auto-Download Setting

- When enabled, files automatically download after conversion
- Uses the existing download infrastructure
- Shows the same progress indicators during download
- Toast notification confirms successful download

## User Experience

1. Click the gear icon in the top-right corner
2. Toggle settings as desired
3. Click outside or press Escape to close
4. Settings are automatically saved
5. Settings persist across sessions

## Technical Details

- Uses Zustand for state management (consistent with existing code)
- localStorage for persistence
- TypeScript for type safety
- Tailwind CSS for styling (matches existing design)
- No breaking changes to existing functionality
