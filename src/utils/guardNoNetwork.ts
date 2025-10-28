/**
 * Network guard - patches network APIs to prevent accidental usage
 * Used in development and tests to enforce offline-first design
 */

const BLOCKED_MESSAGE = 'Network calls are forbidden. This app must work 100% offline.'

let guardsInstalled = false

/**
 * Install guards that throw when network APIs are called
 */
export function installNetworkGuards() {
  if (guardsInstalled) return
  
  // Guard fetch
  window.fetch = ((...args: Parameters<typeof fetch>) => {
    console.error('Blocked fetch call:', args)
    throw new Error(BLOCKED_MESSAGE)
  }) as typeof fetch
  
  // Guard XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest
  window.XMLHttpRequest = class BlockedXHR {
    open(...args: unknown[]) {
      console.error('Blocked XMLHttpRequest:', args)
      throw new Error(BLOCKED_MESSAGE)
    }
    // Implement other required methods as no-ops
    send() { throw new Error(BLOCKED_MESSAGE) }
    abort() {}
    setRequestHeader() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return false }
  } as unknown as typeof XMLHttpRequest
  
  // Guard WebSocket
  window.WebSocket = class BlockedWebSocket {
    constructor(...args: unknown[]) {
      console.error('Blocked WebSocket:', args)
      throw new Error(BLOCKED_MESSAGE)
    }
  } as unknown as typeof WebSocket
  
  // Guard sendBeacon
  if (navigator.sendBeacon) {
    navigator.sendBeacon = ((...args: unknown[]) => {
      console.error('Blocked sendBeacon:', args)
      throw new Error(BLOCKED_MESSAGE)
    }) as typeof navigator.sendBeacon
  }
  
  guardsInstalled = true
  console.info('Network guards installed - all network APIs are blocked')
}

/**
 * Check if guards are installed
 */
export function areGuardsInstalled(): boolean {
  return guardsInstalled
}

/**
 * Install guards in development mode
 */
export function installInDev() {
  if (import.meta.env?.DEV) {
    installNetworkGuards()
  }
}

