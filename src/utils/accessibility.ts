/**
 * Accessibility utilities
 */

/**
 * Announce message to screen readers via aria-live region
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Check if element is keyboard focusable
 */
export function isFocusable(element: Element): boolean {
  const tagName = element.tagName.toLowerCase()
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea']
  
  if (focusableTags.includes(tagName)) {
    return !(element as HTMLButtonElement).disabled
  }
  
  return element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1'
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') return

  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  if (event.shiftKey) {
    if (document.activeElement === firstElement) {
      lastElement?.focus()
      event.preventDefault()
    }
  } else {
    if (document.activeElement === lastElement) {
      firstElement?.focus()
      event.preventDefault()
    }
  }
}

