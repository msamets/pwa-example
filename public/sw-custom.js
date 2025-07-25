// Custom Service Worker for Job Seeker PWA
// This service worker handles caching, offline functionality, and FCM integration

const CACHE_NAME = 'job-seeker-v2-fcm'
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
let fcmIntegrationEnabled = false

// Import Firebase for FCM handling
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdlQ043SPZuNfbT4RM3B07JLSxNL9rIsc",
  authDomain: "jobseeker-pwa.firebaseapp.com",
  projectId: "jobseeker-pwa",
  storageBucket: "jobseeker-pwa.firebasestorage.app",
  messagingSenderId: "1011116688933",
  appId: "1:1011116688933:web:bfb8b314d3a81c6b78e1cc"
}

// Initialize Firebase in service worker
firebase.initializeApp(firebaseConfig)
const messaging = firebase.messaging()

console.log('🔥 Custom Service Worker with FCM integration initialized')

// Handle FCM background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📨 FCM Background message received:', payload)

  const { title, body, icon, image } = payload.notification || {}
  const data = payload.data || {}

  // Show notification with proper data structure
  const notificationOptions = {
    body: body || 'You have a new notification',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: image,
    data: {
      ...data,
      messageId: payload.messageId || Date.now().toString(),
      sentTime: payload.sentTime,
      from: payload.from,
      // Ensure redirectUrl is preserved
      redirectUrl: data.redirectUrl || data.url
    },
    tag: data.tag || 'job-seeker-notification',
    requireInteraction: data.requireInteraction === 'true' || true,
    silent: data.silent === 'true' || false,
    actions: data.actions ? JSON.parse(data.actions) : []
  }

  console.log('🔔 Showing FCM notification with data:', notificationOptions.data)
  console.log('🍎 iOS detection in SW:', isIOSPWA())

  return self.registration.showNotification(title || 'Job Seeker', notificationOptions)
})

// Import FCM functionality
// Note: FCM background handling is now integrated into this service worker

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

// Enhanced message handling
self.addEventListener('message', async (event) => {
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

    // Try to register background sync with proper error handling
    await tryRegisterBackgroundSync()

    // Keep service worker alive regardless of background sync support
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

// New function to safely try registering background sync
async function tryRegisterBackgroundSync() {
  try {
    // Check if we're in a secure context (HTTPS required)
    if (!self.isSecureContext) {
      console.log('⚠️ Background Sync requires HTTPS - using fallback')
      startFallbackBackgroundChecking()
      return
    }

    // Check if Background Sync API is available
    if (!('sync' in self.registration)) {
      console.log('⚠️ Background Sync API not supported - using fallback')
      startFallbackBackgroundChecking()
      return
    }

    // Check if the app is installed (background sync often requires this)
    const clients = await self.clients.matchAll()
    const hasStandaloneClient = clients.some(client =>
      client.url.includes('utm_source=web_app_manifest') ||
      client.url.includes('display-mode=standalone')
    )

    if (!hasStandaloneClient) {
      console.log('⚠️ App may not be installed - background sync might not work reliably')
    }

    // Attempt to register background sync
    console.log('🔄 Attempting to register background sync...')
    await self.registration.sync.register('check-messages')
    console.log('✅ Background sync registered successfully')

    // Start the scheduling cycle
    scheduleNextBackgroundCheck()

  } catch (error) {
    console.log('❌ Background sync registration failed:', error.message)

    // Analyze the error and provide specific fallbacks
    if (error.name === 'NotAllowedError') {
      console.log('🔒 Background sync permission denied - this usually means:')
      console.log('   • App is not installed to home screen, or')
      console.log('   • Browser has background sync disabled, or')
      console.log('   • Site is not served over HTTPS')
      console.log('   • Using fallback notification method')
    } else if (error.name === 'AbortError') {
      console.log('⚠️ Background sync aborted - browser may not support it for this site')
    } else if (error.name === 'InvalidStateError') {
      console.log('⚠️ Service worker in invalid state for background sync')
    }

    // Always fall back to alternative method
    console.log('🔄 Starting fallback background checking...')
    startFallbackBackgroundChecking()
  }
}

// Enhanced fallback background checking with better reliability
function startFallbackBackgroundChecking() {
  console.log('🔄 Starting enhanced fallback background checking...')

  let checkCount = 0
  let lastCheckTime = Date.now()

  const fallbackCheck = async () => {
    if (!isBackgroundSyncEnabled) {
      console.log('⏹️ Background sync disabled, stopping fallback checks')
      return
    }

    checkCount++
    const now = Date.now()
    const timeSinceLastCheck = now - lastCheckTime
    lastCheckTime = now

    console.log(`🔍 Fallback check #${checkCount} (${timeSinceLastCheck}ms since last)`)

    try {
      const hasNewMessages = await checkForNewMessages()

      if (hasNewMessages) {
        console.log('📬 New messages found via fallback method')
      }

      // Adaptive timing - check more frequently if we found messages recently
      const nextCheckDelay = hasNewMessages ? 15000 : 30000 // 15s or 30s

      if (isBackgroundSyncEnabled) {
        setTimeout(fallbackCheck, nextCheckDelay)
      }
    } catch (error) {
      console.error('❌ Fallback check failed:', error)

      // Still schedule next check even if this one failed
      if (isBackgroundSyncEnabled) {
        setTimeout(fallbackCheck, 60000) // Check again in 1 minute
      }
    }
  }

  // Start the fallback cycle immediately
  fallbackCheck()
}

// Enhanced schedule function with better error handling
function scheduleNextBackgroundCheck() {
  if (!isBackgroundSyncEnabled) {
    return
  }

  if (!('sync' in self.registration)) {
    console.log('⚠️ Background Sync not available for scheduling')
    return
  }

  // Use a timeout to register sync after a delay
  setTimeout(async () => {
    if (isBackgroundSyncEnabled) {
      try {
        await self.registration.sync.register('check-messages')
        console.log('⏰ Scheduled next background message check')
      } catch (error) {
        console.log('❌ Failed to schedule background check:', error.message)
        // If scheduling fails, fall back to direct timeout
        setTimeout(() => {
          if (isBackgroundSyncEnabled) {
            checkForNewMessages()
            scheduleNextBackgroundCheck()
          }
        }, 30000)
      }
    }
  }, 5000) // Schedule next check in 5 seconds
}

// Keep service worker alive with periodic tasks
function keepServiceWorkerAlive() {
  setInterval(() => {
    console.log('💓 Service Worker heartbeat:', new Date().toISOString())
  }, 30000) // Every 30 seconds
}

// Handle notification clicks (unified for both FCM and local notifications)
self.addEventListener('notificationclick', (event) => {
  console.log('👆 UNIFIED SW Notification clicked:', event.notification)
  console.log('🔍 Action:', event.action)
  console.log('🔍 Notification data:', event.notification.data)

  // Close the notification
  event.notification.close()

  const data = event.notification.data || {}
  const action = event.action
  const baseUrl = self.location.origin

  // Handle specific actions first
  if (action === 'go-to-profile') {
    const targetUrl = data.redirectUrl || `${baseUrl}/profile`
    console.log('📍 Go-to-profile action triggered, redirecting to:', targetUrl)
    return event.waitUntil(handleNavigation(targetUrl, data))
  }

  if (action === 'dismiss') {
    console.log('❌ Notification dismissed, no navigation')
    return
  }

  // Default click behavior - get redirect URL from notification data
  const redirectUrl = data.redirectUrl || data.url || '/'
  const fullUrl = new URL(redirectUrl, self.location.origin).href

  console.log('🔗 Default navigation - Redirect URL:', redirectUrl, 'Full URL:', fullUrl)

  // Focus or open the app
  event.waitUntil(handleNavigation(fullUrl, data))

// Helper function to detect iOS PWA from service worker
function isIOSPWA() {
  // Service worker doesn't have access to window, so we detect iOS differently
  const userAgent = self.navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)

  // For service workers, we assume if it's iOS and we're handling notifications,
  // it's likely a PWA (since notifications work better in PWAs)
  return isIOS
}

// Helper function to handle navigation
async function handleNavigation(targetUrl, notificationData) {
  try {
    console.log('🚀 Handling navigation to:', targetUrl)

    const isIOS = isIOSPWA()
    console.log('📱 iOS PWA detected:', isIOS)

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    // If app is already open
    for (const client of clients) {
      if (client.url.includes(self.location.origin)) {
        console.log('🔍 Found existing client')

        if (isIOS) {
          // iOS PWA: Use openWindow even when app is open for reliable navigation
          console.log('🍎 iOS PWA: Using openWindow for reliable navigation')
          return self.clients.openWindow(targetUrl)
        } else {
          // Desktop/Android: Use focus + postMessage
          console.log('🖥️ Desktop: Using focus + postMessage')
          await client.focus()

          client.postMessage({
            type: 'navigate',
            url: targetUrl,
            notificationData: notificationData
          })
          return
        }
      }
    }

    // If app is not open, open it
    console.log('🚀 Opening new client window:', targetUrl)
    return self.clients.openWindow(targetUrl)
  } catch (error) {
    console.error('❌ Error handling navigation:', error)

    // Fallback: always try openWindow if other methods fail
    try {
      console.log('🔄 Fallback: Attempting openWindow')
      return self.clients.openWindow(targetUrl)
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError)
    }
  }
}
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
