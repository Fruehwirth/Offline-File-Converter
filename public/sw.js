// Service Worker to enable COOP/COEP headers on GitHub Pages
// Required for SharedArrayBuffer support (FFmpeg.wasm)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
  if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response to modify headers
        const newHeaders = new Headers(response.headers)
        newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless')
        newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin')

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        })
      })
      .catch(error => {
        console.error('Service Worker fetch error:', error)
        return new Response('Network error', { status: 408 })
      })
  )
})
