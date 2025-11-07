/**
 * FileTypeIcon component
 * Displays appropriate icon based on file type
 * Uses SVG icons with consistent app-like styling
 */

import { memo } from 'react'
import audioIcon from '../assets/icons/audio.svg'
import videoIcon from '../assets/icons/video.svg'
import imageIcon from '../assets/icons/image.svg'
import archiveIcon from '../assets/icons/archive.svg'
import documentIcon from '../assets/icons/document.svg'
import fileIcon from '../assets/icons/file.svg'

export type FileCategory = 'audio' | 'video' | 'image' | 'archive' | 'document' | 'unknown'

interface FileTypeIconProps {
  file: File
  className?: string
}

/**
 * Determine the category of a file based on its MIME type
 */
function getFileCategory(file: File): FileCategory {
  const type = file.type.toLowerCase()

  if (type.startsWith('audio/')) {
    return 'audio'
  }

  if (type.startsWith('video/')) {
    return 'video'
  }

  if (type.startsWith('image/')) {
    return 'image'
  }

  // Archive types
  if (
    type.includes('zip') ||
    type.includes('rar') ||
    type.includes('7z') ||
    type.includes('tar') ||
    type.includes('gz') ||
    type.includes('archive')
  ) {
    return 'archive'
  }

  // Document types
  if (
    type.includes('pdf') ||
    type.includes('document') ||
    type.includes('word') ||
    type.includes('text') ||
    type.includes('msword') ||
    type.includes('officedocument')
  ) {
    return 'document'
  }

  return 'unknown'
}

/**
 * Get the appropriate icon for a file category
 */
function getCategoryIcon(category: FileCategory): string {
  switch (category) {
    case 'audio':
      return audioIcon
    case 'video':
      return videoIcon
    case 'image':
      return imageIcon
    case 'archive':
      return archiveIcon
    case 'document':
      return documentIcon
    default:
      return fileIcon
  }
}

export const FileTypeIcon = memo(function FileTypeIcon({
  file,
  className = '',
}: FileTypeIconProps) {
  const category = getFileCategory(file)
  const iconSrc = getCategoryIcon(category)

  return (
    <img src={iconSrc} alt={`${category} file icon`} className={`file-type-icon ${className}`} />
  )
})

/**
 * Export the helper function for use in other components
 */
export { getFileCategory }
