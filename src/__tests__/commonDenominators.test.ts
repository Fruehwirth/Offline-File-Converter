/**
 * Unit tests for common denominators logic
 */

import { describe, it, expect } from 'vitest'
import {
  findCommonTargets,
  canConvertToTarget,
  getIncompatibleFormats,
  buildCompatibilityMessage,
} from '../features/conversion/commonDenominators'

describe('commonDenominators', () => {
  describe('findCommonTargets', () => {
    it('should return targets for single format', () => {
      const targets = findCommonTargets(['png'])
      expect(targets).toEqual(['ico'])
    })

    it('should return intersection of targets', () => {
      const targets = findCommonTargets(['png', 'ico'])
      // PNG can convert to ICO, ICO can convert to PNG
      // No common target between them
      expect(targets).toEqual([])
    })

    it('should return empty array for empty input', () => {
      const targets = findCommonTargets([])
      expect(targets).toEqual([])
    })

    it('should handle multiple files of same format', () => {
      const targets = findCommonTargets(['png', 'png', 'png'])
      expect(targets).toEqual(['ico'])
    })
  })

  describe('canConvertToTarget', () => {
    it('should return true when all sources can convert to target', () => {
      const canConvert = canConvertToTarget(['png'], 'ico')
      expect(canConvert).toBe(true)
    })

    it('should return false when not all sources can convert', () => {
      const canConvert = canConvertToTarget(['ico', 'png'], 'png')
      expect(canConvert).toBe(false)
    })
  })

  describe('getIncompatibleFormats', () => {
    it('should return formats that cannot convert to target', () => {
      const incompatible = getIncompatibleFormats(['png', 'ico'], 'ico')
      expect(incompatible).toContain('ico')
      expect(incompatible).not.toContain('png')
    })

    it('should return empty array when all formats are compatible', () => {
      const incompatible = getIncompatibleFormats(['png'], 'ico')
      expect(incompatible).toEqual([])
    })
  })

  describe('buildCompatibilityMessage', () => {
    it('should return error message for empty selection', () => {
      const result = buildCompatibilityMessage([])
      expect(result.canConvert).toBe(false)
      expect(result.message).toContain('No files')
    })

    it('should return success message for compatible formats', () => {
      const result = buildCompatibilityMessage(['png'])
      expect(result.canConvert).toBe(true)
      expect(result.targets).toEqual(['ico'])
    })

    it('should return error message for incompatible formats', () => {
      const result = buildCompatibilityMessage(['png', 'ico'])
      expect(result.canConvert).toBe(false)
      expect(result.message).toContain('no common conversion target')
    })
  })
})

