/**
 * Tests for audio format utilities
 * Tests lossy/lossless detection and transcoding warnings
 */

import { describe, it, expect } from 'vitest'
import {
  isLossyFormat,
  isLosslessFormat,
  isLossyToLossyTranscode,
  getTranscodingWarning,
  getFileTranscodingInfo,
  LOSSY_AUDIO_FORMATS,
  LOSSLESS_AUDIO_FORMATS,
} from '../features/conversion/audioFormatUtils'

describe('audioFormatUtils', () => {
  describe('isLossyFormat', () => {
    it('should identify lossy formats correctly', () => {
      expect(isLossyFormat('mp3')).toBe(true)
      expect(isLossyFormat('aac')).toBe(true)
      expect(isLossyFormat('m4a')).toBe(true)
      expect(isLossyFormat('ogg')).toBe(true)
    })

    it('should return false for lossless formats', () => {
      expect(isLossyFormat('wav')).toBe(false)
      expect(isLossyFormat('flac')).toBe(false)
    })
  })

  describe('isLosslessFormat', () => {
    it('should identify lossless formats correctly', () => {
      expect(isLosslessFormat('wav')).toBe(true)
      expect(isLosslessFormat('flac')).toBe(true)
    })

    it('should return false for lossy formats', () => {
      expect(isLosslessFormat('mp3')).toBe(false)
      expect(isLosslessFormat('aac')).toBe(false)
      expect(isLosslessFormat('m4a')).toBe(false)
      expect(isLosslessFormat('ogg')).toBe(false)
    })
  })

  describe('isLossyToLossyTranscode', () => {
    it('should detect lossy-to-lossy transcoding', () => {
      expect(isLossyToLossyTranscode('mp3', 'm4a')).toBe(true)
      expect(isLossyToLossyTranscode('aac', 'mp3')).toBe(true)
      expect(isLossyToLossyTranscode('ogg', 'm4a')).toBe(true)
    })

    it('should return false for same format', () => {
      expect(isLossyToLossyTranscode('mp3', 'mp3')).toBe(false)
      expect(isLossyToLossyTranscode('m4a', 'm4a')).toBe(false)
    })

    it('should return false for lossless to lossy', () => {
      expect(isLossyToLossyTranscode('wav', 'mp3')).toBe(false)
      expect(isLossyToLossyTranscode('flac', 'm4a')).toBe(false)
    })

    it('should return false for lossy to lossless', () => {
      expect(isLossyToLossyTranscode('mp3', 'wav')).toBe(false)
      expect(isLossyToLossyTranscode('aac', 'flac')).toBe(false)
    })

    it('should return false for lossless to lossless', () => {
      expect(isLossyToLossyTranscode('wav', 'flac')).toBe(false)
      expect(isLossyToLossyTranscode('flac', 'wav')).toBe(false)
    })
  })

  describe('getTranscodingWarning', () => {
    it('should return warning for lossy-to-lossy transcoding', () => {
      const warning = getTranscodingWarning(['mp3', 'aac'], 'm4a')
      expect(warning).toBeTruthy()
      expect(warning).toContain('Quality loss')
      expect(warning).toContain('lossy-to-lossy')
    })

    it('should return null when no lossy-to-lossy transcoding', () => {
      expect(getTranscodingWarning(['wav'], 'mp3')).toBeNull()
      expect(getTranscodingWarning(['flac'], 'm4a')).toBeNull()
      expect(getTranscodingWarning(['mp3'], 'mp3')).toBeNull()
    })

    it('should return null for lossless sources', () => {
      expect(getTranscodingWarning(['wav', 'flac'], 'mp3')).toBeNull()
    })

    it('should handle mixed sources correctly', () => {
      const warning = getTranscodingWarning(['wav', 'mp3'], 'm4a')
      expect(warning).toBeTruthy()
      expect(warning).toContain('MP3')
    })
  })

  describe('getFileTranscodingInfo', () => {
    it('should return no warning for same format', () => {
      const info = getFileTranscodingInfo('mp3', 'mp3')
      expect(info.hasWarning).toBe(false)
      expect(info.severity).toBe('info')
    })

    it('should return warning for lossy-to-lossy', () => {
      const info = getFileTranscodingInfo('mp3', 'm4a')
      expect(info.hasWarning).toBe(true)
      expect(info.severity).toBe('warning')
      expect(info.message).toContain('lossy-to-lossy')
      expect(info.message).toContain('quality')
    })

    it('should return info for lossless-to-lossy', () => {
      const info = getFileTranscodingInfo('wav', 'mp3')
      expect(info.hasWarning).toBe(true)
      expect(info.severity).toBe('info')
      expect(info.message).toContain('lossless')
      expect(info.message).toContain('compressed')
    })

    it('should return info for lossy-to-lossless', () => {
      const info = getFileTranscodingInfo('mp3', 'wav')
      expect(info.hasWarning).toBe(true)
      expect(info.severity).toBe('info')
      expect(info.message).toContain('improve quality')
    })

    it('should return no warning for lossless-to-lossless', () => {
      const info = getFileTranscodingInfo('wav', 'flac')
      expect(info.hasWarning).toBe(false)
      expect(info.severity).toBe('info')
    })
  })

  describe('format constants', () => {
    it('should have correct lossy formats', () => {
      expect(LOSSY_AUDIO_FORMATS).toEqual(['mp3', 'aac', 'm4a', 'ogg'])
    })

    it('should have correct lossless formats', () => {
      expect(LOSSLESS_AUDIO_FORMATS).toEqual(['wav', 'flac'])
    })

    it('should not have overlapping formats', () => {
      const overlap = LOSSY_AUDIO_FORMATS.filter(f => LOSSLESS_AUDIO_FORMATS.includes(f))
      expect(overlap).toHaveLength(0)
    })
  })
})
