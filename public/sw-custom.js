// Custom Service Worker enhancements for Job Seeker PWA
// This file enhances the auto-generated service worker from next-pwa

// Handle notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification.data)

  event.notification.close()

  // Handle different notification types
  const data = event.notification.data || {}
  const type = data.type

  let urlToOpen = '/'

  switch (type) {
    case 'job-alert':
      urlToOpen = `/jobs?from=notification&jobId=${data.jobId || ''}`
      break
    case 'interview-reminder':
      urlToOpen = `/profile?from=notification&appId=${data.appId || ''}&action=interview`
      break
    case 'interview-scheduled':
      urlToOpen = `/profile?from=notification&appId=${data.appId || ''}&action=interview`
      break
    case 'application-update':
      urlToOpen = `/profile?from=notification&appId=${data.appId || ''}&action=application`
      break
    case 'job-offer':
      urlToOpen = `/profile?from=notification&appId=${data.appId || ''}&action=offer`
      break
    case 'welcome-back':
      urlToOpen = '/?from=notification'
      break
    case 'notification-settings':
      urlToOpen = '/notifications?from=notification'
      break
    case 'test':
      urlToOpen = '/notifications?from=notification'
      break
    default:
      urlToOpen = data.redirectUrl || '/'
  }

  // Open the app or focus it if already open
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the appropriate page
          client.postMessage({
            type: 'navigate',
            url: urlToOpen,
            notificationData: data
          })
          return client.focus()
        }
      }

      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle notification close events
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification.data)

  // Track notification dismissals for analytics if needed
  const data = event.notification.data || {}

  // You could send analytics data here
  // analytics.track('notification_dismissed', data)
})

// Handle background sync for scheduled notifications
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-notification') {
    event.waitUntil(
      // Handle background notification logic
      console.log('Background sync for notifications')
    )
  }
})

// Handle push events (for server-sent notifications)
self.addEventListener('push', function(event) {
  console.log('Push event received:', event)

  if (event.data) {
    const data = event.data.json()

    const options = {
      body: data.body,
      icon: data.icon || '/icon.svg',
      badge: '/icon.svg',
      tag: data.tag,
      data: data.data,
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || []
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Message handler for communication with the main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'schedule-notification') {
    // Handle scheduled notifications
    const { notification, delay } = event.data

    setTimeout(() => {
      self.registration.showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.tag,
        data: notification.data
      })
    }, delay)
  }
})

// Utility function to get all active notifications
async function getActiveNotifications() {
  return await self.registration.getNotifications()
}

// Utility function to close notifications by tag
async function closeNotificationsByTag(tag) {
  const notifications = await self.registration.getNotifications({ tag })
  notifications.forEach(notification => notification.close())
}

console.log('Custom service worker enhancements loaded')