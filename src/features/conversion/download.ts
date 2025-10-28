/**
 * Download utilities for single files, batches, and ZIP archives
 */

import JSZip from 'jszip'
import { generateUniqueFilenames } from './fileNamer'

/**
 * Trigger download of a Blob with specified filename
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Download multiple files as individual downloads
 */
export function downloadMultiple(files: Array<{ blob: Blob; filename: string }>): void {
  files.forEach(({ blob, filename }, index) => {
    // Stagger downloads slightly to avoid browser blocking
    setTimeout(() => {
      downloadBlob(blob, filename)
    }, index * 100)
  })
}

/**
 * Create a ZIP archive from multiple files
 */
export async function createZipArchive(
  files: Array<{ blob: Blob; filename: string }>
): Promise<Blob> {
  const zip = new JSZip()

  // Ensure unique filenames within the ZIP
  const filenames = files.map(f => f.filename)
  const uniqueNames = generateUniqueFilenames(filenames)

  // Add files to ZIP
  files.forEach(({ blob, filename }) => {
    const uniqueName = uniqueNames.get(filename) ?? filename
    zip.file(uniqueName, blob)
  })

  // Generate ZIP blob
  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6,
    },
  })
}

/**
 * Download multiple files as a ZIP archive
 */
export async function downloadAsZip(
  files: Array<{ blob: Blob; filename: string }>,
  zipFilename = 'converted-files.zip'
): Promise<void> {
  const zipBlob = await createZipArchive(files)
  downloadBlob(zipBlob, zipFilename)
}

/**
 * Determine best download strategy based on file count
 */
export async function downloadFiles(
  files: Array<{ blob: Blob; filename: string }>,
  strategy: 'single' | 'multiple' | 'zip' | 'auto' = 'auto'
): Promise<void> {
  if (files.length === 0) {
    throw new Error('No files to download')
  }

  // Auto-select strategy
  if (strategy === 'auto') {
    if (files.length === 1) {
      strategy = 'single'
    } else {
      strategy = 'zip'
    }
  }

  switch (strategy) {
    case 'single':
      if (files.length > 0) {
        downloadBlob(files[0].blob, files[0].filename)
      }
      break
    
    case 'multiple':
      downloadMultiple(files)
      break
    
    case 'zip':
      await downloadAsZip(files)
      break
  }
}

