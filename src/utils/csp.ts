/**
 * CSP (Content Security Policy) validation utilities
 */

const EXPECTED_CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'connect-src': ["'self'"], // Allow self for Service Worker to fetch resources
  'img-src': ["'self'", 'blob:', 'data:'],
  'media-src': ["'self'", 'blob:', 'data:'],
  'font-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
}

/**
 * Parse CSP string into directives map
 */
function parseCSP(csp: string): Map<string, string[]> {
  const directives = new Map<string, string[]>()
  
  const parts = csp.split(';').map(p => p.trim()).filter(Boolean)
  
  for (const part of parts) {
    const [directive, ...values] = part.split(/\s+/)
    if (directive) {
      directives.set(directive, values)
    }
  }
  
  return directives
}

/**
 * Validate that CSP meta tag exists and has required directives
 */
export function validateCSP(): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Find CSP meta tag
  const cspMeta = document.querySelector<HTMLMetaElement>('meta[http-equiv="Content-Security-Policy"]')
  
  if (!cspMeta) {
    errors.push('CSP meta tag not found in document')
    return { valid: false, errors }
  }
  
  const cspContent = cspMeta.getAttribute('content')
  
  if (!cspContent) {
    errors.push('CSP meta tag has no content')
    return { valid: false, errors }
  }
  
  // Parse and validate directives
  const directives = parseCSP(cspContent)
  
  for (const [directive, expectedValues] of Object.entries(EXPECTED_CSP_DIRECTIVES)) {
    const actualValues = directives.get(directive)
    
    if (!actualValues) {
      errors.push(`Missing CSP directive: ${directive}`)
      continue
    }
    
    // Check that all expected values are present
    for (const expected of expectedValues) {
      if (!actualValues.includes(expected)) {
        errors.push(`CSP directive ${directive} missing value: ${expected}`)
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Assert CSP is valid (throws in development)
 */
export function assertCSP() {
  const { valid, errors } = validateCSP()
  
  if (!valid) {
    const message = `CSP validation failed:\n${errors.join('\n')}`
    
    if (import.meta.env?.DEV) {
      console.error(message)
      throw new Error(message)
    } else {
      console.warn(message)
    }
  } else {
    console.info('CSP validation passed ✓')
  }
}

/**
 * Get current CSP for debugging
 */
export function getCurrentCSP(): string | null {
  const cspMeta = document.querySelector<HTMLMetaElement>('meta[http-equiv="Content-Security-Policy"]')
  return cspMeta?.getAttribute('content') ?? null
}

