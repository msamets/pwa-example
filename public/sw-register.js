// Service Worker Registration for Job Seeker PWA with FCM
// This registers both the custom SW and Firebase messaging SW

(function() {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      console.log('🔧 Registering service workers...')

      // Register main custom service worker
      navigator.serviceWorker.register('/sw-custom.js', {
        scope: '/'
      })
      .then(function(registration) {
        console.log('✅ Custom Service Worker registered successfully:', registration.scope)

        // FCM handling is now integrated into the main custom service worker
        console.log('✅ Using unified service worker approach for FCM and custom functionality')
        return registration
      })
      .then(function(registration) {
        console.log('✅ Unified Service Worker ready for offline use and FCM')

        // Check for updates on main service worker
        const mainRegistration = registration
        mainRegistration.addEventListener('updatefound', function() {
          const newWorker = mainRegistration.installing
          console.log('🔄 New service worker found, installing...')

          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('📱 New service worker available, will refresh when ready')
                // Optionally show update notification
                showUpdateNotification()
              } else {
                console.log('🎉 Service workers ready for offline use and FCM')
              }
            }
          })
        })

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', function(event) {
          console.log('📨 Message from service worker:', event.data)
        })

      })
      .catch(function(error) {
        console.error('❌ Service Worker registration failed:', error)
      })
    })
  } else {
    console.warn('⚠️ Service Worker not supported in this browser')
  }

  function showUpdateNotification() {
    // Simple update notification - can be enhanced with a proper UI
    if (confirm('A new version of the app is available. Refresh to update?')) {
      window.location.reload()
    }
  }

  // Export for manual registration if needed
  window.registerServiceWorker = function() {
    if ('serviceWorker' in navigator) {
      return navigator.serviceWorker.register('/sw-custom.js', { scope: '/' })
    }
    return Promise.reject(new Error('Service Worker not supported'))
  }
})();