/**
 * File naming utilities with collision-safe suffixing
 */

import type { FormatId } from './formatRegistry'

/**
 * Normalize unsafe characters in filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/^\.+/, '')
    .trim()
}

/**
 * Get base name without extension
 */
export function getBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === 0) {
    return filename
  }
  return filename.substring(0, lastDot)
}

/**
 * Get file extension
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === 0) {
    return ''
  }
  return filename.substring(lastDot)
}

/**
 * Generate output filename for conversion
 * 
 * Rules:
 * - PNG → ICO: originalName.ico
 * - ICO → PNG (single size): originalName.png
 * - ICO → PNG (specific size): originalName_WxH.png
 */
export function generateOutputFilename(
  originalFilename: string,
  targetFormat: FormatId,
  options?: {
    width?: number
    height?: number
    sizeIndex?: number
  }
): string {
  const baseName = sanitizeFilename(getBaseName(originalFilename))
  
  // Add dimension suffix if specified (for multi-size ICO → PNG)
  let finalName = baseName
  if (options?.width && options?.height) {
    finalName = `${baseName}_${options.width}x${options.height}`
  } else if (options?.sizeIndex !== undefined) {
    finalName = `${baseName}_${options.sizeIndex + 1}`
  }

  return `${finalName}.${targetFormat}`
}

/**
 * Check if filename exists in collection
 */
export function hasCollision(filename: string, existingNames: Set<string>): boolean {
  return existingNames.has(filename)
}

/**
 * Generate unique filename by appending numeric suffix
 */
export function makeUniqueFilename(filename: string, existingNames: Set<string>): string {
  if (!hasCollision(filename, existingNames)) {
    return filename
  }

  const baseName = getBaseName(filename)
  const ext = getExtension(filename)
  
  let counter = 1
  let uniqueName: string
  
  do {
    uniqueName = `${baseName}_${counter}${ext}`
    counter++
  } while (hasCollision(uniqueName, existingNames))

  return uniqueName
}

/**
 * Generate unique filenames for a batch of files
 */
export function generateUniqueFilenames(filenames: string[]): Map<string, string> {
  const mapping = new Map<string, string>()
  const usedNames = new Set<string>()

  for (const filename of filenames) {
    const uniqueName = makeUniqueFilename(filename, usedNames)
    mapping.set(filename, uniqueName)
    usedNames.add(uniqueName)
  }

  return mapping
}

