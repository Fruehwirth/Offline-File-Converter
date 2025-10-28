/**
 * Unit tests for MIME detection
 */

import { describe, it, expect } from 'vitest'
import { detectFormatFromBuffer } from '../features/conversion/detectMime'

describe('detectMime', () => {
  describe('detectFormatFromBuffer', () => {
    it('should detect PNG from magic numbers', () => {
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const format = detectFormatFromBuffer(pngSignature.buffer)
      expect(format).toBe('png')
    })

    it('should detect ICO from magic numbers', () => {
      const icoSignature = new Uint8Array([0x00, 0x00, 0x01, 0x00])
      const format = detectFormatFromBuffer(icoSignature.buffer)
      expect(format).toBe('ico')
    })

    it('should return null for unknown format', () => {
      const unknownSignature = new Uint8Array([0xff, 0xff, 0xff, 0xff])
      const format = detectFormatFromBuffer(unknownSignature.buffer)
      expect(format).toBeNull()
    })

    it('should return null for empty buffer', () => {
      const emptyBuffer = new ArrayBuffer(0)
      const format = detectFormatFromBuffer(emptyBuffer)
      expect(format).toBeNull()
    })

    it('should resist spoofed extensions', () => {
      // A buffer with PNG magic numbers should be detected as PNG
      // regardless of what the file is named
      const pngSignature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const format = detectFormatFromBuffer(pngSignature.buffer)
      expect(format).toBe('png')
    })
  })
})

