/**
 * Compute common target formats across multiple source formats
 * Finds the intersection of possible conversions
 */

import { FORMATS, type FormatId } from './formatRegistry'

/**
 * Get possible target formats for a source format
 */
export function getTargetsForFormat(sourceFormat: FormatId): FormatId[] {
  const format = FORMATS.find(f => f.id === sourceFormat)
  return format?.canConvertTo ?? []
}

/**
 * Find intersection of conversion targets across multiple source formats
 * Returns formats that ALL sources can convert to
 */
export function findCommonTargets(sourceFormats: FormatId[]): FormatId[] {
  if (sourceFormats.length === 0) {
    return []
  }

  // Start with targets from the first format
  const [first, ...rest] = sourceFormats
  let commonTargets = getTargetsForFormat(first)

  // Intersect with targets from remaining formats
  for (const sourceFormat of rest) {
    const targets = getTargetsForFormat(sourceFormat)
    commonTargets = commonTargets.filter(target => targets.includes(target))
  }

  return commonTargets
}

/**
 * Check if a set of formats can all convert to a specific target
 */
export function canConvertToTarget(sourceFormats: FormatId[], targetFormat: FormatId): boolean {
  return sourceFormats.every(source => {
    const targets = getTargetsForFormat(source)
    return targets.includes(targetFormat)
  })
}

/**
 * Get incompatible files when a target is selected
 * Returns source formats that cannot convert to the target
 */
export function getIncompatibleFormats(
  sourceFormats: FormatId[],
  targetFormat: FormatId
): FormatId[] {
  return sourceFormats.filter(source => {
    const targets = getTargetsForFormat(source)
    return !targets.includes(targetFormat)
  })
}

/**
 * Build a human-readable message about conversion compatibility
 */
export function buildCompatibilityMessage(sourceFormats: FormatId[]): {
  canConvert: boolean
  message: string
  targets: FormatId[]
} {
  if (sourceFormats.length === 0) {
    return {
      canConvert: false,
      message: 'No files selected',
      targets: [],
    }
  }

  const commonTargets = findCommonTargets(sourceFormats)

  if (commonTargets.length === 0) {
    const uniqueFormats = Array.from(new Set(sourceFormats))
    return {
      canConvert: false,
      message: `These file types (${uniqueFormats.join(', ').toUpperCase()}) have no common conversion target. Remove incompatible files to continue.`,
      targets: [],
    }
  }

  return {
    canConvert: true,
    message: `Can convert to: ${commonTargets.map(t => t.toUpperCase()).join(', ')}`,
    targets: commonTargets,
  }
}

