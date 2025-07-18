// Custom Service Worker for Job Seeker PWA
// This service worker handles caching, offline functionality, and background notifications using Background Sync API

const CACHE_NAME = 'job-seeker-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/jobs',
  '/profile',
  '/notifications',
  '/chat',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Background message checking variables
let lastMessageId = null
let userIP = null
let isBackgroundSyncEnabled = false

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

// Activate event - clean up old caches and setup background sync
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...')

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Claim all clients
      self.clients.claim(),
      // Setup periodic background sync if supported
      setupPeriodicBackgroundSync()
    ])
  )
})

// Setup Periodic Background Sync (for when app is completely closed)
async function setupPeriodicBackgroundSync() {
  try {
    if ('periodicSync' in self.registration) {
      console.log('🔄 Registering periodic background sync...')
      await self.registration.periodicSync.register('check-messages', {
        minInterval: 60000 // Check every minute when app is closed
      })
      console.log('✅ Periodic background sync registered')
    } else {
      console.log('⚠️ Periodic Background Sync not supported')
    }
  } catch (error) {
    console.error('❌ Failed to register periodic sync:', error)
  }
}

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

// Background message checking function
async function checkForNewMessages() {
  try {
    console.log('📡 Checking for new messages...', { lastMessageId, userIP, timestamp: new Date().toISOString() })

    const url = lastMessageId
      ? `${self.location.origin}/api/chat/messages?lastMessageId=${lastMessageId}`
      : `${self.location.origin}/api/chat/messages`

    const response = await fetch(url)
    if (!response.ok) {
      console.error('❌ Failed to fetch messages:', response.status)
      return false
    }

    const data = await response.json()

    // Store user IP if we don't have it
    if (data.userIP && !userIP) {
      userIP = data.userIP
      console.log('👤 Stored user IP:', userIP)
    }

    if (data.messages && data.messages.length > 0) {
      console.log('📬 Found new messages:', data.messages.length)

      // Process new messages
      for (const message of data.messages) {
        // Don't notify for own messages
        if (message.user !== userIP) {
          console.log('🔔 Sending notification for message from:', message.user)

          await self.registration.showNotification(`💬 New message from ${message.user}`, {
            body: message.message.length > 100 ? message.message.substring(0, 100) + '...' : message.message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'chat-message',
            requireInteraction: true, // Keep notification visible
            silent: false,
            data: {
              type: 'chat-message',
              messageId: message.id,
              senderName: message.user,
              fullMessage: message.message,
              redirectUrl: '/chat?from=notification'
            }
          })
        }
      }

      // Update last message ID
      const lastMsg = data.messages[data.messages.length - 1]
      lastMessageId = lastMsg.id
      console.log('📌 Updated last message ID:', lastMessageId)

      // Notify main app about new messages if it's listening
      notifyMainAppOfNewMessages(data.messages)
      return true
    }

    return false
  } catch (error) {
    console.error('❌ Error checking for new messages:', error)
    return false
  }
}

// Notify main app about new messages
function notifyMainAppOfNewMessages(messages) {
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'new-messages',
        messages: messages
      })
    })
  })
}

// Background Sync event - triggered when network connectivity returns
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event triggered:', event.tag)

  if (event.tag === 'check-messages') {
    event.waitUntil(
      checkForNewMessages().then((hasNewMessages) => {
        console.log('📊 Background sync completed, new messages:', hasNewMessages)

        // Schedule another check in a few seconds
        if (isBackgroundSyncEnabled) {
          scheduleNextBackgroundCheck()
        }
      })
    )
  }
})

// Periodic Background Sync event - for regular checks when app is completely closed
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic background sync event triggered:', event.tag)

  if (event.tag === 'check-messages') {
    event.waitUntil(
      checkForNewMessages().then((hasNewMessages) => {
        console.log('📊 Periodic sync completed, new messages:', hasNewMessages)
      })
    )
  }
})

// Schedule the next background check using registration.sync
function scheduleNextBackgroundCheck() {
  if (isBackgroundSyncEnabled && 'sync' in self.registration) {
    // Use a timeout to register sync after a delay
    setTimeout(() => {
      self.registration.sync.register('check-messages').then(() => {
        console.log('⏰ Scheduled next background message check')
      }).catch(error => {
        console.error('❌ Failed to schedule background check:', error)
      })
    }, 5000) // Schedule next check in 5 seconds
  }
}

// Keep service worker alive with periodic tasks
function keepServiceWorkerAlive() {
  setInterval(() => {
    console.log('💓 Service Worker heartbeat:', new Date().toISOString())
  }, 30000) // Every 30 seconds
}

// Enhanced message handling
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

  // Handle background sync control
  if (event.data && event.data.type === 'start-background-sync') {
    console.log('🔄 Starting background sync for chat messages')

    // Store initial state
    if (event.data.lastMessageId) {
      lastMessageId = event.data.lastMessageId
    }
    if (event.data.userIP) {
      userIP = event.data.userIP
    }

    isBackgroundSyncEnabled = true

    // Register background sync immediately
    if ('sync' in self.registration) {
      self.registration.sync.register('check-messages').then(() => {
        console.log('✅ Background sync registered')
        // Start the scheduling cycle
        scheduleNextBackgroundCheck()
      }).catch(error => {
        console.error('❌ Failed to register background sync:', error)
      })
    } else {
      console.log('⚠️ Background Sync API not supported, using fallback')
      // Fallback to periodic checks (will be throttled but better than nothing)
      startFallbackBackgroundChecking()
    }

    // Keep service worker alive
    keepServiceWorkerAlive()
  }

  if (event.data && event.data.type === 'stop-background-sync') {
    console.log('⏹️ Stopping background sync for chat messages')
    isBackgroundSyncEnabled = false
  }

  if (event.data && event.data.type === 'update-sync-state') {
    console.log('📝 Updating sync state')
    if (event.data.lastMessageId) {
      lastMessageId = event.data.lastMessageId
    }
    if (event.data.userIP) {
      userIP = event.data.userIP
    }
  }

  // Debug message handlers
  if (event.data && event.data.type === 'test-message') {
    console.log('🧪 Test message received from main app:', event.data.timestamp)
  }

  if (event.data && event.data.type === 'force-check-messages') {
    console.log('🔍 Forcing message check from debug panel')
    checkForNewMessages()
  }
})

// Fallback background checking for browsers without Background Sync API
function startFallbackBackgroundChecking() {
  console.log('🔄 Starting fallback background checking...')

  const fallbackCheck = () => {
    if (isBackgroundSyncEnabled) {
      checkForNewMessages().then(() => {
        // Schedule next check (will be throttled by browser but still works)
        setTimeout(fallbackCheck, 30000) // Every 30 seconds (browsers may throttle this)
      })
    }
  }

  // Start the fallback cycle
  fallbackCheck()
}

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
            return client.focus().then(() => client.navigate(redirectUrl))
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

// Handle push events (for future server-sent notifications)
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

console.log('🚀 Custom Service Worker with Background Sync loaded and ready!')
