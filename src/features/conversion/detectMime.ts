/**
 * Robust MIME type detection using magic number signatures
 * Falls back to browser-reported type, then file extension
 */

import { FORMATS, type FormatId } from './formatRegistry'

/**
 * Check if buffer matches a format signature
 */
function matchesSignature(
  buffer: ArrayBuffer,
  signature: { offset: number; bytes: number[] }
): boolean {
  const view = new Uint8Array(buffer)

  // Check if buffer is large enough
  if (view.length < signature.offset + signature.bytes.length) {
    return false
  }

  // Check each byte in the signature
  for (let i = 0; i < signature.bytes.length; i++) {
    if (view[signature.offset + i] !== signature.bytes[i]) {
      return false
    }
  }

  return true
}

/**
 * Detect format from file buffer using magic numbers
 */
export function detectFormatFromBuffer(buffer: ArrayBuffer): FormatId | null {
  for (const format of FORMATS) {
    for (const signature of format.signatures) {
      if (matchesSignature(buffer, signature)) {
        return format.id
      }
    }
  }
  return null
}

/**
 * Detect format from file extension
 */
function detectFormatFromExtension(filename: string): FormatId | null {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'png') return 'png'
  if (ext === 'ico') return 'ico'

  return null
}

/**
 * Detect format from MIME type string
 */
function detectFormatFromMime(mimeType: string): FormatId | null {
  const normalized = mimeType.toLowerCase()

  for (const format of FORMATS) {
    if (format.mime.some(mime => mime.toLowerCase() === normalized)) {
      return format.id
    }
  }

  return null
}

/**
 * Main detection function: tries magic numbers first, then MIME type, then extension
 */
export async function detectFormat(file: File): Promise<{
  format: FormatId | null
  confidence: 'high' | 'medium' | 'low' | 'unknown'
}> {
  // Strategy 1: Read magic numbers (most reliable)
  try {
    const buffer = await file.arrayBuffer()
    const magicFormat = detectFormatFromBuffer(buffer)

    if (magicFormat) {
      return { format: magicFormat, confidence: 'high' }
    }
  } catch (error) {
    console.error('Failed to read file buffer:', error)
    // Re-throw the error so it can be caught by the caller
    // This handles cases like deleted files from download managers
    throw error
  }

  // Strategy 2: Browser-reported MIME type (medium reliability)
  if (file.type) {
    const mimeFormat = detectFormatFromMime(file.type)
    if (mimeFormat) {
      return { format: mimeFormat, confidence: 'medium' }
    }
  }

  // Strategy 3: File extension (least reliable, can be spoofed)
  const extFormat = detectFormatFromExtension(file.name)
  if (extFormat) {
    return { format: extFormat, confidence: 'low' }
  }

  return { format: null, confidence: 'unknown' }
}

/**
 * Batch detect formats for multiple files
 */
export async function detectFormats(files: File[]): Promise<Map<File, FormatId | null>> {
  const results = new Map<File, FormatId | null>()

  await Promise.all(
    files.map(async file => {
      const { format } = await detectFormat(file)
      results.set(file, format)
    })
  )

  return results
}
