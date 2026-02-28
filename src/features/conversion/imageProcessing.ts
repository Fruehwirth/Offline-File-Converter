/**
 * Image Processing Conversion
 * Wrapper for the image processing worker
 */

import type { FormatId } from './formatRegistry'
import ImageProcessingWorker from '../workers/imageProcessing.worker?worker'
import type {
  ImageConversionMessage,
  ImageConversionResponse,
} from '../workers/imageProcessing.worker'

export interface ImageProcessingOptions {
  quality?: number // 0-1 for lossy formats
  width?: number
  height?: number
}

export interface ConversionProgress {
  percent: number
  message?: string
}

/**
 * Convert image using the image processing worker
 */
export async function convertImage(
  file: File,
  targetFormat: FormatId,
  options: ImageProcessingOptions = {},
  onProgress?: (progress: ConversionProgress) => void,
  abortSignal?: AbortSignal
): Promise<Blob> {
  // Check if already aborted
  if (abortSignal?.aborted) {
    throw new Error('User manually cancelled')
  }

  // Read file as ArrayBuffer
  let fileData = await file.arrayBuffer()

  // Determine source format from file
  let sourceFormat = file.type.split('/')[1] || 'png'

  // HEIC/HEIF is not supported natively by browsers — decode to PNG first
  const isHeic =
    sourceFormat === 'heic' ||
    sourceFormat === 'heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  if (isHeic) {
    const { default: heic2any } = await import('heic2any')
    const heicBlob = new Blob([fileData], { type: 'image/heic' })
    const decoded = await heic2any({ blob: heicBlob, toType: 'image/png' })
    const pngBlob = Array.isArray(decoded) ? decoded[0] : decoded
    fileData = await pngBlob.arrayBuffer()
    sourceFormat = 'png'
  }

  return new Promise((resolve, reject) => {
    // Create worker
    const worker = new ImageProcessingWorker()

    // Handle abort signal
    const onAbort = () => {
      worker.terminate()
      reject(new Error('User manually cancelled'))
    }

    if (abortSignal) {
      if (abortSignal.aborted) {
        onAbort()
        return
      }
      abortSignal.addEventListener('abort', onAbort)
    }

    // Handle worker messages
    worker.onmessage = (event: MessageEvent<ImageConversionResponse>) => {
      const { type, data, error, progress } = event.data

      if (type === 'progress' && progress !== undefined) {
        onProgress?.({ percent: progress })
      } else if (type === 'success' && data) {
        // Convert ArrayBuffer to Blob
        const mimeType = `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`
        const blob = new Blob([data], { type: mimeType })
        worker.terminate()
        abortSignal?.removeEventListener('abort', onAbort)
        onProgress?.({ percent: 100 })
        resolve(blob)
      } else if (type === 'error') {
        worker.terminate()
        abortSignal?.removeEventListener('abort', onAbort)
        reject(new Error(error || 'Conversion failed'))
      }
    }

    worker.onerror = error => {
      worker.terminate()
      abortSignal?.removeEventListener('abort', onAbort)
      reject(new Error(`Worker error: ${error.message}`))
    }

    // Send conversion request
    const message: ImageConversionMessage = {
      type: 'convert',
      fileData,
      sourceFormat,
      targetFormat,
      options,
    }
    worker.postMessage(message)
  })
}

/**
 * Check if browser supports required features
 */
export function isImageProcessingSupported(): boolean {
  try {
    return typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined'
  } catch {
    return false
  }
}
