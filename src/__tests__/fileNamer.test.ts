/**
 * Unit tests for file naming utilities
 */

import { describe, it, expect } from 'vitest'
import {
  sanitizeFilename,
  getBaseName,
  getExtension,
  generateOutputFilename,
  makeUniqueFilename,
  generateUniqueFilenames,
} from '../features/conversion/fileNamer'

describe('fileNamer', () => {
  describe('sanitizeFilename', () => {
    it('should remove unsafe characters', () => {
      const result = sanitizeFilename('file<name>.png')
      expect(result).toBe('file_name_.png')
    })

    it('should handle colons and slashes', () => {
      const result = sanitizeFilename('path/to:file.png')
      expect(result).toBe('path_to_file.png')
    })

    it('should trim whitespace', () => {
      const result = sanitizeFilename('  file.png  ')
      expect(result).toBe('file.png')
    })
  })

  describe('getBaseName', () => {
    it('should extract base name without extension', () => {
      const result = getBaseName('image.png')
      expect(result).toBe('image')
    })

    it('should handle multiple dots', () => {
      const result = getBaseName('my.image.file.png')
      expect(result).toBe('my.image.file')
    })

    it('should return full name if no extension', () => {
      const result = getBaseName('noextension')
      expect(result).toBe('noextension')
    })
  })

  describe('getExtension', () => {
    it('should extract extension with dot', () => {
      const result = getExtension('image.png')
      expect(result).toBe('.png')
    })

    it('should return empty string if no extension', () => {
      const result = getExtension('noextension')
      expect(result).toBe('')
    })
  })

  describe('generateOutputFilename', () => {
    it('should generate PNG to ICO filename', () => {
      const result = generateOutputFilename('image.png', 'ico')
      expect(result).toBe('image.ico')
    })

    it('should generate ICO to PNG filename', () => {
      const result = generateOutputFilename('icon.ico', 'png')
      expect(result).toBe('icon.png')
    })

    it('should include dimensions for multi-size output', () => {
      const result = generateOutputFilename('icon.ico', 'png', {
        width: 256,
        height: 256,
      })
      expect(result).toBe('icon_256x256.png')
    })

    it('should include size index', () => {
      const result = generateOutputFilename('icon.ico', 'png', {
        sizeIndex: 0,
      })
      expect(result).toBe('icon_1.png')
    })
  })

  describe('makeUniqueFilename', () => {
    it('should return original if no collision', () => {
      const existing = new Set<string>()
      const result = makeUniqueFilename('file.png', existing)
      expect(result).toBe('file.png')
    })

    it('should append _1 for first collision', () => {
      const existing = new Set(['file.png'])
      const result = makeUniqueFilename('file.png', existing)
      expect(result).toBe('file_1.png')
    })

    it('should increment suffix for multiple collisions', () => {
      const existing = new Set(['file.png', 'file_1.png', 'file_2.png'])
      const result = makeUniqueFilename('file.png', existing)
      expect(result).toBe('file_3.png')
    })
  })

  describe('generateUniqueFilenames', () => {
    it('should handle unique filenames', () => {
      const filenames = ['file1.png', 'file2.png', 'file3.png']
      const result = generateUniqueFilenames(filenames)
      
      expect(result.get('file1.png')).toBe('file1.png')
      expect(result.get('file2.png')).toBe('file2.png')
      expect(result.get('file3.png')).toBe('file3.png')
    })

    it('should resolve collisions', () => {
      const filenames = ['file.png', 'file.png', 'file.png']
      const result = generateUniqueFilenames(filenames)
      
      const values = Array.from(result.values())
      expect(values).toContain('file.png')
      expect(values).toContain('file_1.png')
      expect(values).toContain('file_2.png')
    })
  })
})

