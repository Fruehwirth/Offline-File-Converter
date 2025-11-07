/**
 * Throttle function to limit how often a callback can be called
 * Ensures smooth animations by preventing excessive re-renders
 */

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function throttled(...args: Parameters<T>) {
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
}

/**
 * Creates a throttled progress callback
 * Useful for conversion progress updates to avoid UI jank
 */
export function createThrottledProgress(
  callback: (progress: any) => void,
  intervalMs: number = 100 // Default: max 10 updates per second
): (progress: any) => void {
  let lastProgress: any = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const throttled = throttle((progress: any) => {
    lastProgress = progress
    callback(progress)
  }, intervalMs)

  // Return wrapper that always captures 100% completion immediately
  return (progress: any) => {
    lastProgress = progress

    // Always report 100% immediately (no throttling for completion)
    if (progress.percent === 100 || progress.percent >= 99.9) {
      // Cancel any pending throttled update
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      callback(progress)
    } else {
      throttled(progress)
    }
  }
}
