/**
 * Unit tests for network guards
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { installNetworkGuards, areGuardsInstalled } from '../utils/guardNoNetwork'

describe('guardNoNetwork', () => {
  beforeEach(() => {
    // Note: Guards are installed globally and persist across tests
    // This is intentional for this app
  })

  it('should install guards', () => {
    installNetworkGuards()
    expect(areGuardsInstalled()).toBe(true)
  })

  it('should throw when fetch is called', () => {
    installNetworkGuards()
    
    expect(() => {
      window.fetch('https://example.com')
    }).toThrow('Network calls are forbidden')
  })

  it('should throw when XMLHttpRequest is used', () => {
    installNetworkGuards()
    
    expect(() => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', 'https://example.com')
    }).toThrow('Network calls are forbidden')
  })

  it('should throw when WebSocket is used', () => {
    installNetworkGuards()
    
    expect(() => {
      new WebSocket('wss://example.com')
    }).toThrow('Network calls are forbidden')
  })

  it('should throw when sendBeacon is called', () => {
    installNetworkGuards()
    
    expect(() => {
      navigator.sendBeacon('https://example.com', 'data')
    }).toThrow('Network calls are forbidden')
  })
})

