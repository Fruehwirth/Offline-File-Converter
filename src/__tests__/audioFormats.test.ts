/**
 * Tests for audio format registry and conversions
 */

import { describe, it, expect } from 'vitest'
import { getFormat, getFormatsByCategory } from '../features/conversion/formatRegistry'
import { findCommonTargets, getTargetsForFormat } from '../features/conversion/commonDenominators'

describe('Audio Format Registry', () => {
  it('should recognize all audio formats', () => {
    const audioFormats = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a']

    audioFormats.forEach(formatId => {
      const format = getFormat(formatId as any)
      expect(format).toBeDefined()
      expect(format?.category).toBe('audio')
    })
  })

  it('should have correct category for audio formats', () => {
    const audioFormats = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a']

    audioFormats.forEach(formatId => {
      const format = getFormat(formatId as any)
      expect(format?.category).toBe('audio')
    })
  })

  it('should get audio formats by category', () => {
    const audioFormats = getFormatsByCategory('audio')
    expect(audioFormats.length).toBe(6)
    expect(audioFormats.every(f => f.category === 'audio')).toBe(true)
  })
})

describe('Audio Format Conversions', () => {
  it('MP3 should convert to other audio formats', () => {
    const targets = getTargetsForFormat('mp3')
    expect(targets).toContain('wav')
    expect(targets).toContain('ogg')
    expect(targets).toContain('flac')
    expect(targets).toContain('aac')
    expect(targets).toContain('m4a')
  })

  it('WAV should convert to other audio formats', () => {
    const targets = getTargetsForFormat('wav')
    expect(targets).toContain('mp3')
    expect(targets).toContain('ogg')
    expect(targets).toContain('flac')
    expect(targets).toContain('aac')
    expect(targets).toContain('m4a')
  })

  it('should find common targets for multiple audio files', () => {
    const commonTargets = findCommonTargets(['mp3', 'wav', 'ogg'] as any)

    // All audio formats should be able to convert to each other
    expect(commonTargets).toContain('mp3')
    expect(commonTargets).toContain('wav')
    expect(commonTargets).toContain('flac')
    expect(commonTargets.length).toBeGreaterThan(0)
  })

  it('should have NO common targets between image and audio', () => {
    const commonTargets = findCommonTargets(['png', 'mp3'] as any)

    // PNG can convert to images, MP3 to audio - no overlap
    expect(commonTargets.length).toBe(0)
  })

  it('should find common targets for multiple image files', () => {
    const commonTargets = findCommonTargets(['png', 'jpeg', 'webp'] as any)

    // All images should share some common targets
    expect(commonTargets.length).toBeGreaterThan(0)
    // They should all be able to convert to at least PNG
    expect(commonTargets).toContain('png')
  })
})

describe('Format Category Separation', () => {
  it('audio formats should only convert to audio formats', () => {
    const mp3Targets = getTargetsForFormat('mp3')

    mp3Targets.forEach(target => {
      const format = getFormat(target)
      expect(format?.category).toBe('audio')
    })
  })

  it('image formats should only convert to image formats (except ICO)', () => {
    const pngTargets = getTargetsForFormat('png')

    pngTargets.forEach(target => {
      const format = getFormat(target)
      expect(['icon', 'photo'].includes(format?.category ?? '')).toBe(true)
    })
  })
})
