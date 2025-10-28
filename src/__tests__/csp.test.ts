/**
 * Unit tests for CSP validation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { validateCSP, getCurrentCSP } from '../utils/csp'

describe('csp', () => {
  beforeEach(() => {
    // Clean up any existing CSP meta tags
    document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]').forEach(el => {
      el.remove()
    })
  })

  describe('validateCSP', () => {
    it('should fail if no CSP meta tag exists', () => {
      const result = validateCSP()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('CSP meta tag not found in document')
    })

    it('should fail if CSP meta tag has no content', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('http-equiv', 'Content-Security-Policy')
      document.head.appendChild(meta)

      const result = validateCSP()
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should pass with valid CSP', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('http-equiv', 'Content-Security-Policy')
      meta.setAttribute(
        'content',
        "default-src 'self'; connect-src 'none'; img-src 'self' blob: data:; media-src 'self' blob: data:; font-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
      )
      document.head.appendChild(meta)

      const result = validateCSP()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail if connect-src allows network', () => {
      const meta = document.createElement('meta')
      meta.setAttribute('http-equiv', 'Content-Security-Policy')
      meta.setAttribute(
        'content',
        "default-src 'self'; connect-src 'self'; img-src 'self' blob: data:;"
      )
      document.head.appendChild(meta)

      const result = validateCSP()
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes("connect-src"))).toBe(true)
    })
  })

  describe('getCurrentCSP', () => {
    it('should return null if no CSP exists', () => {
      const csp = getCurrentCSP()
      expect(csp).toBeNull()
    })

    it('should return CSP content if exists', () => {
      const expectedCSP = "default-src 'self';"
      const meta = document.createElement('meta')
      meta.setAttribute('http-equiv', 'Content-Security-Policy')
      meta.setAttribute('content', expectedCSP)
      document.head.appendChild(meta)

      const csp = getCurrentCSP()
      expect(csp).toBe(expectedCSP)
    })
  })
})

