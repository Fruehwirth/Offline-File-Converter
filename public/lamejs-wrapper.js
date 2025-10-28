// Wrapper for lamejs to make it work in Web Workers
// This file sets up a CommonJS environment and loads lame.all.js

;(function () {
  // Create a CommonJS environment
  var module = { exports: {} }
  var exports = module.exports

  // Load the actual lamejs code
  // We'll inline it or use fetch

  // For now, define a global lamejs that will be populated
  self.lamejs = null

  // Function to load the actual library
  fetch('/lame.all.js')
    .then(response => response.text())
    .then(code => {
      // Create a function scope with module and exports
      var fn = new Function('module', 'exports', code + '\nreturn module.exports;')
      var result = fn(module, exports)

      // Make it globally available
      self.lamejs = result

      // Dispatch event to signal loading is complete
      self.dispatchEvent(new Event('lamejs-loaded'))
    })
    .catch(error => {
      console.error('Failed to load lamejs:', error)
    })
})()
