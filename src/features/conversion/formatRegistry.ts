/**
 * Declarative format registry
 * Defines all supported formats and their conversion capabilities
 */

export type FormatId =
  // Image formats (use native browser APIs via Canvas/ImageBitmap)
  | 'png'
  | 'ico'
  | 'jpeg'
  | 'jpg'
  | 'webp'
  | 'gif'
  | 'bmp'
  | 'tiff'
  | 'avif'
  | 'heic'
  // Audio formats (use bundled encoding libraries)
  | 'mp3'
  | 'wav'
  | 'flac'
  | 'ogg'
  | 'aac'
  | 'm4a'

export interface FormatSignature {
  offset: number
  bytes: number[]
}

export interface Capability {
  id: FormatId
  label: string
  mime: string[]
  signatures: FormatSignature[]
  canConvertTo: FormatId[]
  category: 'icon' | 'photo' | 'vector' | 'document' | 'audio'
}

// All image formats that can be converted to each other
const ALL_IMAGE_FORMATS: FormatId[] = [
  'png',
  'ico',
  'jpeg',
  'jpg',
  'webp',
  'gif',
  'bmp',
  'tiff',
  'avif',
  'heic',
]

export const FORMATS: Capability[] = [
  // Icon formats
  {
    id: 'png',
    label: 'PNG Image',
    mime: ['image/png'],
    signatures: [
      {
        offset: 0,
        bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'png'),
    category: 'photo',
  },
  {
    id: 'ico',
    label: 'Windows Icon (ICO)',
    mime: ['image/x-icon', 'image/vnd.microsoft.icon'],
    signatures: [
      {
        offset: 0,
        bytes: [0x00, 0x00, 0x01, 0x00],
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'ico'),
    category: 'icon',
  },

  // Photo formats (use native browser APIs)
  {
    id: 'jpeg',
    label: 'JPEG Image',
    mime: ['image/jpeg'],
    signatures: [
      {
        offset: 0,
        bytes: [0xff, 0xd8, 0xff],
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'jpeg'),
    category: 'photo',
  },
  {
    id: 'jpg',
    label: 'JPG Image',
    mime: ['image/jpeg'],
    signatures: [
      {
        offset: 0,
        bytes: [0xff, 0xd8, 0xff],
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'jpg'),
    category: 'photo',
  },
  {
    id: 'webp',
    label: 'WebP Image',
    mime: ['image/webp'],
    signatures: [
      {
        offset: 8,
        bytes: [0x57, 0x45, 0x42, 0x50], // "WEBP"
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'webp'),
    category: 'photo',
  },
  {
    id: 'gif',
    label: 'GIF Image',
    mime: ['image/gif'],
    signatures: [
      {
        offset: 0,
        bytes: [0x47, 0x49, 0x46, 0x38], // "GIF8"
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'gif'),
    category: 'photo',
  },
  {
    id: 'bmp',
    label: 'BMP Image',
    mime: ['image/bmp', 'image/x-bmp'],
    signatures: [
      {
        offset: 0,
        bytes: [0x42, 0x4d], // "BM"
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'bmp'),
    category: 'photo',
  },
  {
    id: 'tiff',
    label: 'TIFF Image',
    mime: ['image/tiff'],
    signatures: [
      {
        offset: 0,
        bytes: [0x49, 0x49, 0x2a, 0x00], // Little-endian
      },
      {
        offset: 0,
        bytes: [0x4d, 0x4d, 0x00, 0x2a], // Big-endian
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'tiff'),
    category: 'photo',
  },
  {
    id: 'avif',
    label: 'AVIF Image',
    mime: ['image/avif'],
    signatures: [
      {
        offset: 4,
        bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], // "ftypavif"
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'avif'),
    category: 'photo',
  },
  {
    id: 'heic',
    label: 'HEIC Image',
    mime: ['image/heic', 'image/heif'],
    signatures: [
      {
        offset: 4,
        bytes: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // "ftypheic"
      },
    ],
    canConvertTo: ALL_IMAGE_FORMATS.filter(f => f !== 'heic'),
    category: 'photo',
  },

  // Audio formats (use bundled encoding libraries and browser APIs)
  {
    id: 'mp3',
    label: 'MP3 Audio',
    mime: ['audio/mpeg', 'audio/mp3'],
    signatures: [
      {
        offset: 0,
        bytes: [0xff, 0xfb], // MP3 frame sync
      },
      {
        offset: 0,
        bytes: [0xff, 0xf3], // MP3 frame sync (alternative)
      },
      {
        offset: 0,
        bytes: [0x49, 0x44, 0x33], // ID3 tag "ID3"
      },
    ],
    canConvertTo: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    category: 'audio',
  },
  {
    id: 'wav',
    label: 'WAV Audio',
    mime: ['audio/wav', 'audio/wave', 'audio/x-wav'],
    signatures: [
      {
        offset: 0,
        bytes: [0x52, 0x49, 0x46, 0x46], // "RIFF"
      },
    ],
    canConvertTo: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    category: 'audio',
  },
  {
    id: 'flac',
    label: 'FLAC Audio',
    mime: ['audio/flac', 'audio/x-flac'],
    signatures: [
      {
        offset: 0,
        bytes: [0x66, 0x4c, 0x61, 0x43], // "fLaC"
      },
    ],
    canConvertTo: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    category: 'audio',
  },
  {
    id: 'ogg',
    label: 'OGG Vorbis',
    mime: ['audio/ogg', 'audio/vorbis'],
    signatures: [
      {
        offset: 0,
        bytes: [0x4f, 0x67, 0x67, 0x53], // "OggS"
      },
    ],
    canConvertTo: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    category: 'audio',
  },
  {
    id: 'aac',
    label: 'AAC Audio',
    mime: ['audio/aac', 'audio/aacp'],
    signatures: [
      {
        offset: 0,
        bytes: [0xff, 0xf1], // ADTS header
      },
      {
        offset: 0,
        bytes: [0xff, 0xf9], // ADTS header (alternative)
      },
    ],
    canConvertTo: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    category: 'audio',
  },
  {
    id: 'm4a',
    label: 'M4A Audio',
    mime: ['audio/mp4', 'audio/x-m4a'],
    signatures: [
      {
        offset: 4,
        bytes: [0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41], // "ftypM4A"
      },
    ],
    canConvertTo: ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'],
    category: 'audio',
  },
]

/**
 * Get format by ID
 */
export function getFormat(id: FormatId): Capability | undefined {
  return FORMATS.find(f => f.id === id)
}

/**
 * Get all format IDs
 */
export function getAllFormatIds(): FormatId[] {
  return FORMATS.map(f => f.id)
}

/**
 * Get label for a format ID
 */
export function getFormatLabel(id: FormatId): string {
  return getFormat(id)?.label ?? id.toUpperCase()
}

/**
 * Get formats by category
 */
export function getFormatsByCategory(category: Capability['category']): Capability[] {
  return FORMATS.filter(f => f.category === category)
}
