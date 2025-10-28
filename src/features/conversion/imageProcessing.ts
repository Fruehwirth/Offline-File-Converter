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
  onProgress?: (progress: ConversionProgress) => void
): Promise<Blob> {
  // Read file as ArrayBuffer
  const fileData = await file.arrayBuffer()

  // Determine source format from file
  const sourceFormat = file.type.split('/')[1] || 'png'

  return new Promise((resolve, reject) => {
    // Create worker
    const worker = new ImageProcessingWorker()

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
        resolve(blob)
      } else if (type === 'error') {
        worker.terminate()
        reject(new Error(error || 'Conversion failed'))
      }
    }

    worker.onerror = error => {
      worker.terminate()
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

