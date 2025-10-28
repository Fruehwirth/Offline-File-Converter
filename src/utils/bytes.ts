/**
 * Byte formatting utilities
 */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${UNITS[i]}`
}

/**
 * Soft limit for file size (can be configured)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Check if file exceeds size limit
 */
export function exceedsLimit(bytes: number): boolean {
  return bytes > MAX_FILE_SIZE
}

