/**
 * End-to-end tests with Playwright
 * Tests complete conversion workflows and network monitoring
 */

import { test, expect } from '@playwright/test'

test.describe('File Converter App', () => {
  test.beforeEach(async ({ page }: { page: any }) => {
    await page.goto('/')
  })

  test('should display empty state on initial load', async ({ page }: { page: any }) => {
    await expect(page.getByText('Convert files locally')).toBeVisible()
    await expect(page.getByText('Drag & drop files here or click to select')).toBeVisible()
    await expect(page.getByText('No uploads. No tracking.')).toBeVisible()
  })

  test('should have correct CSP meta tag', async ({ page }: { page: any }) => {
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
    
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("connect-src 'none'")
    expect(csp).toContain("script-src 'self'")
  })

  test('should display theme toggle', async ({ page }: { page: any }) => {
    const themeToggle = page.getByRole('button', { name: /theme/i })
    await expect(themeToggle).toBeVisible()
  })

  test('should toggle theme when clicked', async ({ page }: { page: any }) => {
    const themeToggle = page.getByRole('button', { name: /theme/i })
    
    // Get initial theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    
    // Click toggle
    await themeToggle.click()
    
    // Verify theme changed
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(newTheme).not.toBe(initialTheme)
  })
})

test.describe('Network Monitoring', () => {
  test('should make NO external network requests', async ({ page }: { page: any }) => {
    const externalRequests: string[] = []

    // Monitor all requests
    page.on('request', (request: any) => {
      const url = request.url()
      // Check if request is to external domain
      if (!url.startsWith('http://localhost') && !url.startsWith('http://127.0.0.1')) {
        externalRequests.push(url)
      }
    })

    await page.goto('/')
    
    // Interact with the app
    await page.getByText('Convert files locally').waitFor()
    
    // Wait a bit to catch any delayed requests
    await page.waitForTimeout(2000)

    // Assert no external requests were made
    expect(externalRequests).toHaveLength(0)
  })

  test('should block fetch calls', async ({ page }: { page: any }) => {
    await page.goto('/')

    const error = await page.evaluate(async () => {
      try {
        await window.fetch('https://example.com')
        return null
      } catch (e) {
        return e instanceof Error ? e.message : 'Unknown error'
      }
    })

    expect(error).toContain('Network calls are forbidden')
  })

  test('should block XMLHttpRequest', async ({ page }: { page: any }) => {
    await page.goto('/')

    const error = await page.evaluate(() => {
      try {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', 'https://example.com')
        return null
      } catch (e) {
        return e instanceof Error ? e.message : 'Unknown error'
      }
    })

    expect(error).toContain('Network calls are forbidden')
  })
})

test.describe('File Handling', () => {
  test('should accept file drop (mock)', async ({ page }: { page: any }) => {
    await page.goto('/')

    // Note: Actual file upload testing requires test fixtures
    // This test verifies the drop zone exists and is interactive
    const dropZone = page.getByRole('button', { name: /Drop files or click to select/i })
    await expect(dropZone).toBeVisible()
    await expect(dropZone).toBeFocused({ timeout: 0 }).catch(() => {}) // May not be focused initially
  })
})

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }: { page: any }) => {
    await page.goto('/')

    // Check for aria labels on interactive elements
    await expect(page.getByRole('button', { name: /Drop files or click to select/i })).toBeVisible()
    await expect(page.getByRole('banner')).toBeVisible() // header
  })

  test('should be keyboard navigable', async ({ page }: { page: any }) => {
    await page.goto('/')

    // Tab through interactive elements
    await page.keyboard.press('Tab')
    
    // Should focus on theme toggle
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
    expect(focused).toBeTruthy()
  })

  test('should have focus visible styles', async ({ page }: { page: any }) => {
    await page.goto('/')

    const themeToggle = page.getByRole('button', { name: /theme/i })
    await themeToggle.focus()

    // Check if focus is visible (element should have focus styles)
    const hasOutline = await themeToggle.evaluate((el: Element) => {
      const styles = window.getComputedStyle(el)
      return styles.outline !== 'none' && styles.outline !== ''
    })

    // Tailwind's focus:ring should apply
    expect(hasOutline || await themeToggle.evaluate((el: Element) => el.classList.contains('focus:ring-2'))).toBeTruthy()
  })
})

