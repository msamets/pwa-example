// Firebase Cloud Messaging Service Worker
// This service worker handles FCM push notifications when the app is in the background

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase configuration will be injected here during build
// For development, update these values with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBdlQ043SPZuNfbT4RM3B07JLSxNL9rIsc",
  authDomain: "jobseeker-pwa.firebaseapp.com",
  projectId: "jobseeker-pwa",
  storageBucket: "jobseeker-pwa.firebasestorage.app",
  messagingSenderId: "1011116688933",
  appId: "1:1011116688933:web:bfb8b314d3a81c6b78e1cc"
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging()

console.log('🔥 Firebase Messaging Service Worker initialized')

// Handle background messages (when app is closed or in background)
messaging.onBackgroundMessage((payload) => {
  console.log('📨 Received background message:', payload)

  const { title, body, icon, image } = payload.notification || {}
  const data = payload.data || {}

  // Customize notification options
  const notificationOptions = {
    body: body || 'You have a new notification',
    icon: icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    image: image,
    data: {
      ...data,
      // Add FCM-specific data
      messageId: payload.messageId || Date.now().toString(),
      sentTime: payload.sentTime,
      from: payload.from
    },
    tag: data.tag || 'job-seeker-notification',
    requireInteraction: data.requireInteraction === 'true' || true,
    silent: data.silent === 'true' || false,
    // Action buttons for rich notifications
    actions: []
  }

  // Add contextual action buttons based on notification type
  const notificationType = data.type || 'general'

  switch (notificationType) {
    case 'job-alert':
      notificationOptions.actions = [
        { action: 'view-job', title: '👀 View Job' },
        { action: 'save-job', title: '💾 Save for Later' }
      ]
      break

    case 'interview-reminder':
      notificationOptions.actions = [
        { action: 'view-interview', title: '📅 View Details' },
        { action: 'set-reminder', title: '⏰ Set Reminder' }
      ]
      break

    case 'application-update':
      notificationOptions.actions = [
        { action: 'view-application', title: '📋 View Application' },
        { action: 'reply', title: '↩️ Reply' }
      ]
      break

    case 'chat-message':
      notificationOptions.actions = [
        { action: 'open-chat', title: '💬 Open Chat' },
        { action: 'quick-reply', title: '⚡ Quick Reply' }
      ]
      break

    default:
      notificationOptions.actions = [
        { action: 'open-app', title: '📱 Open App' }
      ]
  }

  // Show the notification
  return self.registration.showNotification(
    title || 'Job Seeker',
    notificationOptions
  )
})

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('👆 FCM Notification click received:', event)
  console.log('🔍 Event details:', {
    action: event.action,
    notificationData: event.notification.data,
    notificationTitle: event.notification.title,
    notificationBody: event.notification.body
  })

  const notification = event.notification
  const action = event.action
  const data = notification.data || {}

  // Close the notification
  notification.close()

  // Handle different actions
  const handleAction = async () => {
    const baseUrl = self.location.origin
    let targetUrl = baseUrl

    // Determine target URL based on action and data
    switch (action) {
      case 'view-job':
        targetUrl = data.jobUrl || `${baseUrl}/jobs/${data.jobId || ''}`
        break

      case 'save-job':
        // Save job and open jobs page
        if (data.jobId) {
          await saveJobForLater(data.jobId)
        }
        targetUrl = `${baseUrl}/jobs?saved=true`
        break

      case 'view-interview':
        targetUrl = data.interviewUrl || `${baseUrl}/profile?tab=interviews`
        break

      case 'view-application':
        targetUrl = data.applicationUrl || `${baseUrl}/profile?tab=applications`
        break

      case 'open-chat':
        targetUrl = data.chatUrl || `${baseUrl}/chat`
        break

      case 'quick-reply':
        // Open chat with focus on message input
        targetUrl = `${baseUrl}/chat?focus=true&chatId=${data.chatId || ''}`
        break

      case 'set-reminder':
        // Handle reminder setting
        if (data.interviewId) {
          await setInterviewReminder(data.interviewId)
        }
        targetUrl = `${baseUrl}/profile?tab=interviews&reminder=set`
        break

      case 'reply':
        targetUrl = data.replyUrl || `${baseUrl}/profile?action=reply&appId=${data.applicationId || ''}`
        break

      case 'go-to-profile':
        // Handle the specific deeplink test action
        targetUrl = data.redirectUrl || `${baseUrl}/profile`
        console.log('📍 Go-to-profile action triggered, redirecting to:', targetUrl)
        break

      case 'dismiss':
        // Just close the notification, no navigation
        console.log('❌ Notification dismissed, no navigation')
        return

      default:
        // Default click behavior - open the app at specified URL or home
        targetUrl = data.url || data.redirectUrl || baseUrl
        console.log('🔗 Default case triggered. Data:', {
          url: data.url,
          redirectUrl: data.redirectUrl,
          finalTargetUrl: targetUrl
        })
    }

    // Add notification tracking parameters
    const urlObj = new URL(targetUrl)
    urlObj.searchParams.set('from', 'notification')
    urlObj.searchParams.set('notificationId', data.messageId || 'unknown')
    if (data.type) {
      urlObj.searchParams.set('type', data.type)
    }

    console.log('🔗 Opening URL:', urlObj.toString())

    // Focus existing window or open new one
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })

    // Check if app is already open
    for (const client of clients) {
      if (client.url.startsWith(baseUrl) && 'focus' in client) {
        await client.focus()
        // Navigate to target URL
        if ('navigate' in client) {
          return client.navigate(urlObj.toString())
        } else {
          // Fallback: send message to client to navigate
          client.postMessage({
            type: 'navigate',
            url: urlObj.toString(),
            notificationData: data
          })
          return
        }
      }
    }

    // No existing window found, open new one
    return self.clients.openWindow(urlObj.toString())
  }

  event.waitUntil(handleAction())
})

// Helper function to save job for later
async function saveJobForLater(jobId) {
  try {
    console.log('💾 Saving job for later:', jobId)

    const response = await fetch(`${self.location.origin}/api/jobs/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobId })
    })

    const result = await response.json()
    console.log('💾 Save job result:', result)

    return result.success
  } catch (error) {
    console.error('❌ Error saving job:', error)
    return false
  }
}

// Helper function to set interview reminder
async function setInterviewReminder(interviewId) {
  try {
    console.log('⏰ Setting interview reminder:', interviewId)

    const response = await fetch(`${self.location.origin}/api/interviews/reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        interviewId,
        reminderTime: 'default' // 1 hour before
      })
    })

    const result = await response.json()
    console.log('⏰ Reminder result:', result)

    return result.success
  } catch (error) {
    console.error('❌ Error setting reminder:', error)
    return false
  }
}

// Handle push events (additional backup handler)
self.addEventListener('push', (event) => {
  console.log('📨 Push event received:', event)

  if (!event.data) {
    console.log('📭 Push event but no data')
    return
  }

  try {
    const payload = event.data.json()
    console.log('📨 Push payload:', payload)

    // This will be handled by Firebase's onBackgroundMessage
    // This is just a backup handler
  } catch (error) {
    console.error('❌ Error parsing push data:', error)
  }
})

// Service worker installation and activation
self.addEventListener('install', (event) => {
  console.log('🔧 Firebase Messaging Service Worker installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('✅ Firebase Messaging Service Worker activated')
  event.waitUntil(self.clients.claim())
})

// Background sync for offline actions (optional)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync event:', event.tag)

  if (event.tag === 'save-job') {
    event.waitUntil(syncSavedJobs())
  } else if (event.tag === 'send-message') {
    event.waitUntil(syncPendingMessages())
  }
})

// Sync saved jobs when back online
async function syncSavedJobs() {
  try {
    console.log('🔄 Syncing saved jobs...')
    // Implementation would sync any offline-saved jobs
  } catch (error) {
    console.error('❌ Error syncing saved jobs:', error)
  }
}

// Sync pending messages when back online
async function syncPendingMessages() {
  try {
    console.log('🔄 Syncing pending messages...')
    // Implementation would sync any offline messages
  } catch (error) {
    console.error('❌ Error syncing messages:', error)
  }
}