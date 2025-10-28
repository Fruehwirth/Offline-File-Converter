/**
 * Zustand store for conversion state management
 * Manages file queue, conversion progress, and user selections
 */

import { create } from 'zustand'
import type { FormatId } from '../conversion/formatRegistry'

export type ConversionStatus = 'queued' | 'processing' | 'completed' | 'error'

export interface FileItem {
  id: string
  file: File
  sourceFormat: FormatId | null
  status: ConversionStatus
  progress: number
  error?: string
  result?: {
    blob: Blob
    filename: string
    width?: number
    height?: number
  }[]
}

export interface ConversionOptions {
  // Future conversion options can be added here
}

export interface ToastMessage {
  id: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  duration?: number
}

interface ConversionStore {
  // File queue
  files: FileItem[]
  selectedTargetFormat: FormatId | null
  availableTargets: FormatId[]

  // Options
  options: ConversionOptions

  // UI state
  toasts: ToastMessage[]
  isConverting: boolean
  allFilesConverted: boolean
  conversionAbortController: AbortController | null

  // Actions - File management
  addFiles: (files: Array<{ file: File; sourceFormat: FormatId | null }>) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  updateFileStatus: (
    id: string,
    status: ConversionStatus,
    progress?: number,
    error?: string
  ) => void
  setFileResult: (id: string, result: FileItem['result']) => void
  replaceFileWithResult: (id: string) => void

  // Actions - Target selection
  setAvailableTargets: (targets: FormatId[]) => void
  setSelectedTargetFormat: (format: FormatId | null) => void

  // Actions - Options
  updateOptions: (updates: Partial<ConversionOptions>) => void

  // Actions - Conversion
  setIsConverting: (isConverting: boolean) => void
  setAllFilesConverted: (allFilesConverted: boolean) => void
  resetConversionStatus: () => void
  cancelConversion: () => void
  setConversionAbortController: (controller: AbortController | null) => void

  // Actions - Toasts
  addToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

export const useConversionStore = create<ConversionStore>((set, get) => ({
  // Initial state
  files: [],
  selectedTargetFormat: null,
  availableTargets: [],

  options: {},

  toasts: [],
  isConverting: false,
  allFilesConverted: false,
  conversionAbortController: null,

  // File management
  addFiles: filesData => {
    set(state => {
      const newFiles: FileItem[] = filesData.map(({ file, sourceFormat }) => ({
        id: crypto.randomUUID(),
        file,
        sourceFormat,
        status: 'queued' as const,
        progress: 0,
      }))

      return {
        files: [...state.files, ...newFiles],
        allFilesConverted: false,
      }
    })
  },

  removeFile: id => {
    set(state => {
      const updatedFiles = state.files.filter(f => f.id !== id)

      // If no files left, reset everything
      if (updatedFiles.length === 0) {
        return {
          files: [],
          availableTargets: [],
          selectedTargetFormat: null,
          allFilesConverted: false,
        }
      }

      return {
        files: updatedFiles,
      }
    })

    // Recalculate available targets after file removal
    // Need to import this at the top of the file
    setTimeout(() => {
      const currentFiles = get().files

      if (currentFiles.length === 0) {
        return // Already handled above
      }

      // Import findCommonTargets dynamically to avoid circular dependency
      import('../conversion/commonDenominators').then(({ findCommonTargets }) => {
        const allSourceFormats = currentFiles
          .map(f => f.sourceFormat)
          .filter((format): format is FormatId => format !== null)
          .filter((format, index, arr) => arr.indexOf(format) === index)

        const commonTargets = findCommonTargets(allSourceFormats)
        get().setAvailableTargets(commonTargets)
      })
    }, 0)
  },

  clearFiles: () => {
    set({ files: [], selectedTargetFormat: null, availableTargets: [], allFilesConverted: false })
  },

  updateFileStatus: (id, status, progress, error) => {
    set(state => ({
      files: state.files.map(f =>
        f.id === id
          ? {
              ...f,
              status,
              progress: progress ?? f.progress,
              error,
            }
          : f
      ),
    }))
  },

  setFileResult: (id, result) => {
    set(state => ({
      files: state.files.map(f =>
        f.id === id
          ? {
              ...f,
              result,
              status: 'completed' as const,
              progress: 100,
            }
          : f
      ),
    }))
  },

  replaceFileWithResult: id => {
    set(state => {
      const fileItem = state.files.find(f => f.id === id)
      if (!fileItem?.result?.[0]) return state

      const { blob, filename } = fileItem.result[0]

      // Extract new format from filename extension
      const extensionMatch = filename.match(/\.([^.]+)$/)
      const newFormat = extensionMatch ? (extensionMatch[1].toLowerCase() as FormatId) : null

      // Create a new File object from the converted blob
      const newFile = new File([blob], filename, { type: blob.type })

      return {
        files: state.files.map(f =>
          f.id === id
            ? {
                ...f,
                file: newFile,
                sourceFormat: newFormat,
                status: 'queued' as const,
                progress: 0,
                result: undefined,
                error: undefined,
              }
            : f
        ),
      }
    })
  },

  // Target selection
  setAvailableTargets: targets => {
    set(state => {
      // Keep current selection if still valid, otherwise set to null
      const newTargetFormat =
        state.selectedTargetFormat && targets.includes(state.selectedTargetFormat)
          ? state.selectedTargetFormat
          : null

      return {
        availableTargets: targets,
        selectedTargetFormat: newTargetFormat,
      }
    })
  },

  setSelectedTargetFormat: format => {
    set({ selectedTargetFormat: format })
  },

  // Options
  updateOptions: updates => {
    set(state => ({
      options: {
        ...state.options,
        ...updates,
      },
    }))
  },

  // Conversion
  setIsConverting: isConverting => {
    set({ isConverting })
  },

  setAllFilesConverted: allFilesConverted => {
    set({ allFilesConverted })
  },

  resetConversionStatus: () => {
    set(state => ({
      files: state.files.map(f => ({
        ...f,
        status: 'queued' as const,
        progress: 0,
        error: undefined,
        result: undefined,
      })),
    }))
  },

  cancelConversion: () => {
    const state = get()
    if (state.conversionAbortController) {
      state.conversionAbortController.abort()
      set({ isConverting: false, conversionAbortController: null })
    }
  },

  setConversionAbortController: controller => {
    set({ conversionAbortController: controller })
  },

  // Toasts
  addToast: toast => {
    const id = crypto.randomUUID()
    const newToast = { ...toast, id }

    set(state => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, toast.duration ?? 5000)
    }
  },

  removeToast: id => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }))
  },
}))
