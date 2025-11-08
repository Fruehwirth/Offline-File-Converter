/**
 * Throttle function to limit how often a callback can be called
 * Ensures smooth animations by preventing excessive re-renders
 */

export interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel: () => void
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ThrottledFunction<T> {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttled = function throttled(...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    // Clear any pending call
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (timeSinceLastCall >= delay) {
      // Enough time has passed, call immediately
      lastCall = now
      fn(...args)
    } else {
      // Schedule a call for when the delay has passed
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        fn(...args)
        timeoutId = null
      }, delay - timeSinceLastCall)
    }
  }

  // Add cancel method to clear any pending calls
  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return throttled as ThrottledFunction<T>
}

/**
 * Creates a throttled progress callback
 * Useful for conversion progress updates to avoid UI jank
 */
export function createThrottledProgress(
  callback: (progress: any) => void,
  intervalMs: number = 100 // Default: max 10 updates per second
): (progress: any) => void {
  const throttled = throttle((progress: any) => {
    callback(progress)
  }, intervalMs)

  // Return wrapper that always captures 100% completion immediately
  return (progress: any) => {
    // Always report 100% immediately (no throttling for completion)
    if (progress.percent === 100 || progress.percent >= 99.9) {
      // Cancel any pending throttled updates to prevent them from overwriting 100%
      throttled.cancel()
      callback(progress)
    } else {
      throttled(progress)
    }
  }
}
