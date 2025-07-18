// Custom Service Worker for Job Seeker PWA
// This service worker handles caching, offline functionality, and most importantly - notifications

const CACHE_NAME = 'job-seeker-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/jobs',
  '/profile',
  '/notifications',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...')

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone response for caching
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/')
        }
      })
  )
})

// ✨ NOTIFICATION HANDLING - This is the key missing piece! ✨
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting phase...')
    self.skipWaiting()
    return
  }

  if (event.data && event.data.type === 'show-notification') {
    console.log('🔔 Showing notification:', event.data.title, event.data.options)

    // Show the notification
    self.registration.showNotification(event.data.title, event.data.options)
      .then(() => {
        console.log('✅ Notification shown successfully')
        // Send success response back to client
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true })
        }
      })
      .catch((error) => {
        console.error('❌ Error showing notification:', error)
        // Send error response back to client
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message })
        }
      })
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.notification)

  // Close the notification
  event.notification.close()

  // Get redirect URL from notification data
  const redirectUrl = event.notification.data?.redirectUrl || '/'

  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            console.log('🔍 Found existing client, focusing and navigating')
            client.focus()
            client.navigate(redirectUrl)
            return
          }
        }

        // If app is not open, open it
        console.log('🚀 Opening new client window')
        return clients.openWindow(redirectUrl)
      })
      .catch((error) => {
        console.error('❌ Error handling notification click:', error)
      })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed:', event.notification)
})

// Handle push events (for server-sent notifications)
self.addEventListener('push', (event) => {
  console.log('📨 Push message received:', event)

  if (event.data) {
    try {
      const data = event.data.json()

      const options = {
        body: data.body || 'You have a new notification',
        icon: data.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: data.tag || 'push-notification',
        data: data.data || {},
        requireInteraction: data.requireInteraction || true,
        actions: data.actions || []
      }

      event.waitUntil(
        self.registration.showNotification(data.title || 'Job Seeker', options)
      )
    } catch (error) {
      console.error('❌ Error parsing push data:', error)

      // Show generic notification if parsing fails
      event.waitUntil(
        self.registration.showNotification('Job Seeker', {
          body: 'You have a new notification',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        })
      )
    }
  }
})

console.log('🚀 Custom Service Worker loaded and ready!')
