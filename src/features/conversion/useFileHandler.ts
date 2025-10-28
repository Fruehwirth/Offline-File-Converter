/**
 * Shared file handling logic
 * Used by both EmptyState and DropZone
 */

import { useConversionStore } from '../state/useConversionStore'
import { detectFormat } from './detectMime'
import { findCommonTargets, buildCompatibilityMessage } from './commonDenominators'
import { exceedsLimit, formatBytes, MAX_FILE_SIZE } from '../../utils/bytes'

export function useFileHandler() {
  const addFiles = useConversionStore(state => state.addFiles)
  const setAvailableTargets = useConversionStore(state => state.setAvailableTargets)
  const addToast = useConversionStore(state => state.addToast)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Check for oversized files
    const oversized = fileArray.filter(f => exceedsLimit(f.size))
    if (oversized.length > 0) {
      addToast({
        type: 'error',
        message: `Some files exceed ${formatBytes(MAX_FILE_SIZE)} limit and were skipped: ${oversized.map(f => f.name).join(', ')}`,
      })

      const validFiles = fileArray.filter(f => !exceedsLimit(f.size))
      if (validFiles.length === 0) return
    }

    const validFiles = fileArray.filter(f => !exceedsLimit(f.size))

    // Detect formats
    const filesWithFormats = await Promise.all(
      validFiles.map(async file => {
        try {
          const { format, confidence } = await detectFormat(file)

          if (!format) {
            addToast({
              type: 'warning',
              message: `Could not detect format for ${file.name}`,
            })
          } else if (confidence === 'low') {
            addToast({
              type: 'info',
              message: `Format detection for ${file.name} is based on file extension only`,
            })
          }

          return { file, sourceFormat: format, error: undefined }
        } catch (error) {
          // Capture file read errors (e.g., deleted files from download manager)
          const errorType = error instanceof Error ? error.constructor.name : 'Error'
          const errorMessage = error instanceof Error ? error.message : String(error)

          return {
            file,
            sourceFormat: null,
            error: `${errorType}: ${errorMessage}`,
          }
        }
      })
    )

    // Separate successful and failed files
    const detectedFiles = filesWithFormats.filter(
      ({ sourceFormat, error }) => sourceFormat !== null && !error
    )
    const failedFiles = filesWithFormats.filter(({ error }) => error !== undefined)

    // Add failed files to store with error status
    if (failedFiles.length > 0) {
      addFiles(failedFiles.map(({ file, sourceFormat }) => ({ file, sourceFormat })))

      // Mark files as error immediately
      setTimeout(() => {
        const updateFileStatus = useConversionStore.getState().updateFileStatus
        filesWithFormats.forEach(({ file, error }) => {
          if (error) {
            const fileItem = useConversionStore.getState().files.find(f => f.file === file)
            if (fileItem) {
              updateFileStatus(fileItem.id, 'error', 0, error)
            }
          }
        })
      }, 0)
    }

    if (detectedFiles.length === 0 && failedFiles.length === 0) {
      addToast({
        type: 'error',
        message: 'No supported files detected',
      })
      return
    }

    // Add successful files to store
    if (detectedFiles.length > 0) {
      addFiles(detectedFiles)

      // Compute available targets
      const sourceFormats = detectedFiles
        .map(({ sourceFormat }) => sourceFormat!)
        .filter((format, index, arr) => arr.indexOf(format) === index)

      const commonTargets = findCommonTargets(sourceFormats)
      setAvailableTargets(commonTargets)

      // Show compatibility message
      const { canConvert, message } = buildCompatibilityMessage(sourceFormats)

      if (!canConvert) {
        addToast({
          type: 'warning',
          message,
        })
      }
    }

    // Show error summary if there were failed files
    if (failedFiles.length > 0 && detectedFiles.length === 0) {
      addToast({
        type: 'error',
        message: `Failed to load ${failedFiles.length} file(s). See details below.`,
      })
    }
  }

  return { handleFiles }
}
