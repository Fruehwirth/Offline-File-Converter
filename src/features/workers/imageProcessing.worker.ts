/**
 * Image Processing Worker
 * Handles all photo format conversions using HTML5 Canvas
 * Works entirely in the browser without external dependencies
 */

export interface ImageConversionMessage {
  type: 'convert'
  fileData: ArrayBuffer
  sourceFormat: string
  targetFormat: string
  options?: {
    quality?: number // 0-1 for JPEG/WEBP
    width?: number
    height?: number
  }
}

export interface ImageConversionResponse {
  type: 'success' | 'error' | 'progress'
  data?: ArrayBuffer
  error?: string
  progress?: number
}

/**
 * Handle incoming messages
 */
self.onmessage = async (event: MessageEvent<ImageConversionMessage>) => {
  const { type, fileData, sourceFormat, targetFormat, options } = event.data

  if (type === 'convert') {
    try {
      // Report progress
      postProgress(10)

      // Convert ArrayBuffer to Blob
      const blob = new Blob([fileData], { type: `image/${sourceFormat}` })
      postProgress(20)

      // Create ImageBitmap from blob
      const imageBitmap = await createImageBitmap(blob)
      postProgress(40)

      // Determine dimensions
      const width = options?.width || imageBitmap.width
      const height = options?.height || imageBitmap.height
      postProgress(50)

      // Create OffscreenCanvas
      const canvas = new OffscreenCanvas(width, height)
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Draw image onto canvas
      ctx.drawImage(imageBitmap, 0, 0, width, height)
      postProgress(70)

      // Convert to target format
      const outputMimeType = getMimeType(targetFormat)
      const quality = options?.quality ?? 0.92

      const outputBlob = await canvas.convertToBlob({
        type: outputMimeType,
        quality:
          outputMimeType.includes('jpeg') || outputMimeType.includes('webp') ? quality : undefined,
      })
      postProgress(90)

      // Convert blob to ArrayBuffer
      const outputBuffer = await outputBlob.arrayBuffer()
      postProgress(100)

      // Send success response
      self.postMessage({
        type: 'success',
        data: outputBuffer,
      } as ImageConversionResponse)
    } catch (error) {
      // Send error response
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Conversion failed',
      } as ImageConversionResponse)
    }
  }
}

/**
 * Post progress update
 */
function postProgress(progress: number) {
  self.postMessage({
    type: 'progress',
    progress,
  } as ImageConversionResponse)
}

/**
 * Get MIME type for format
 */
function getMimeType(format: string): string {
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    avif: 'image/avif',
    heic: 'image/heic',
  }

  return mimeMap[format.toLowerCase()] || 'image/png'
}

