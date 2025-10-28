/**
 * Script to generate test assets programmatically
 * Run this to create test PNG and ICO files for E2E testing
 */

/**
 * Generate a simple test PNG (64x64 blue square with alpha)
 */
export function generateTestPNG(): Blob {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2D context')

  // Draw a blue square with transparency
  ctx.fillStyle = 'rgba(59, 130, 246, 0.8)'
  ctx.fillRect(0, 0, 64, 64)

  // Add a white border
  ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, 60, 60)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      },
      'image/png',
      1.0
    )
  }) as unknown as Blob
}

/**
 * Base64-encoded 16x16 PNG for testing
 * A simple red square
 */
export const TEST_PNG_BASE64_16x16 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAABXSURBVDiNY2AYBaNgFIyCUTAKRgEjAwPDfyIxIwMDQwMDA8N/BgaG/0Rggv5oGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFIyCUTAKRsEoGAwAAHjnAgXPQxJjAAAAAElFTkSuQmCC'

/**
 * Convert base64 to Blob
 */
export function base64ToBlob(base64: string, type = 'image/png'): Blob {
  const byteCharacters = atob(base64)
  const byteArrays: Uint8Array[] = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)
    const byteNumbers = new Array(slice.length)
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    
    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new Blob(byteArrays, { type })
}

/**
 * Get a test PNG as a File object
 */
export function getTestPNGFile(filename = 'test-image.png'): File {
  const blob = base64ToBlob(TEST_PNG_BASE64_16x16)
  return new File([blob], filename, { type: 'image/png' })
}

/**
 * Create PNG signature for testing MIME detection
 */
export function createPNGSignature(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
}

/**
 * Create ICO signature for testing MIME detection
 */
export function createICOSignature(): Uint8Array {
  return new Uint8Array([0x00, 0x00, 0x01, 0x00])
}

