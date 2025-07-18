// Notification utility functions for the Job Seeker PWA

export interface NotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
}

// Enhanced iOS detection and compatibility
export function getIOSInfo() {
  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true

  // Get iOS version if available
  const match = userAgent.match(/os (\d+)_(\d+)_?(\d+)?/)
  const version = match ? `${match[1]}.${match[2]}` : null

  console.log('🔍 iOS Info:', {
    isIOS,
    isStandalone,
    version,
    userAgent: userAgent.substring(0, 100) + '...',
    supportsNotifications: isIOS && isStandalone && version && parseFloat(version) >= 16.4
  })

  return {
    isIOS,
    isStandalone,
    version,
    supportsNotifications: isIOS && isStandalone && version && parseFloat(version) >= 16.4
  }
}

export class NotificationManager {
  static async checkPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported in this browser')
      throw new Error('Notifications not supported')
    }

    const permission = Notification.permission
    console.log('🔔 Current notification permission:', permission)
    return permission
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported in this browser')
      throw new Error('Notifications not supported')
    }

    console.log('📱 Requesting notification permission...')
    const permission = await Notification.requestPermission()
    console.log('📱 Permission result:', permission)
    return permission
  }

  static async ensurePermission(): Promise<boolean> {
    const permission = await this.checkPermission()

    if (permission === 'granted') {
      console.log('✅ Permission already granted')
      return true
    }

    if (permission === 'default') {
      console.log('⏳ Requesting permission...')
      const newPermission = await this.requestPermission()
      const granted = newPermission === 'granted'
      console.log(granted ? '✅ Permission granted!' : '❌ Permission denied')
      return granted
    }

    console.log('❌ Permission denied')
    return false
  }

  static async checkIOSCompatibility(): Promise<{
    canUseNotifications: boolean,
    reason?: string,
    instructions?: string[]
  }> {
    const iosInfo = getIOSInfo()

    console.log('🔍 Checking iOS compatibility...', iosInfo)

    if (!iosInfo.isIOS) {
      console.log('✅ Not iOS - notifications should work normally')
      return { canUseNotifications: true }
    }

    if (!iosInfo.isStandalone) {
      console.log('❌ iOS app not installed to home screen')
      return {
        canUseNotifications: false,
        reason: 'App must be installed to home screen',
        instructions: [
          'Tap the Share button at the bottom of Safari',
          'Select "Add to Home Screen"',
          'Tap "Add" to confirm',
          'Open the app from your home screen'
        ]
      }
    }

    if (!iosInfo.supportsNotifications) {
      console.log('❌ iOS version too old or other compatibility issue')
      return {
        canUseNotifications: false,
        reason: 'iOS 16.4 or later required',
        instructions: ['Update your iPhone to iOS 16.4 or later']
      }
    }

    console.log('✅ iOS compatibility check passed')
    return { canUseNotifications: true }
  }

  static async ensurePermissionWithIOSSupport(): Promise<{
    success: boolean,
    permission?: NotificationPermission,
    error?: string,
    needsInstall?: boolean
  }> {
    console.log('🚀 Starting iOS-compatible permission flow...')

    const iosCheck = await this.checkIOSCompatibility()

    if (!iosCheck.canUseNotifications) {
      console.log('❌ iOS compatibility check failed:', iosCheck.reason)
      return {
        success: false,
        error: iosCheck.reason,
        needsInstall: iosCheck.reason?.includes('home screen')
      }
    }

    try {
      console.log('🔄 Attempting to ensure permissions...')
      const hasPermission = await this.ensurePermission()
      const permission = await this.checkPermission()

      console.log('📊 Permission flow result:', { hasPermission, permission })

      return {
        success: hasPermission,
        permission: permission
      }
    } catch (error) {
      console.error('💥 Error in permission flow:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // iOS-compatible notification method using service worker
  static async sendNotificationViaServiceWorker(data: NotificationData): Promise<boolean> {
    console.log('📤 Sending notification via service worker:', data)

    if (!('serviceWorker' in navigator)) {
      console.error('❌ Service Worker not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready

      if (!registration) {
        console.error('❌ Service Worker not ready')
        return false
      }

      const options: NotificationOptions = {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: data.badge || '/icon-192x192.png',
        tag: data.tag,
        data: data.data,
        requireInteraction: data.requireInteraction,
        silent: data.silent,
      }

      console.log('📱 Showing notification via service worker with options:', options)

            // Use MessageChannel for better iOS compatibility
      if (registration.active) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel()

          messageChannel.port1.onmessage = (event) => {
            console.log('📨 Service worker response:', event.data)
            resolve(event.data.success || false)
          }

          registration.active!.postMessage({
            type: 'show-notification',
            title: data.title,
            options: options
          }, [messageChannel.port2])

          console.log('✅ Service worker notification message sent with MessageChannel')

          // Fallback timeout in case no response
          setTimeout(() => {
            console.log('⏰ Service worker response timeout, assuming success')
            resolve(true)
          }, 3000)
        })
      } else {
        // Fallback to direct registration method
        await registration.showNotification(data.title, options)
        console.log('✅ Service worker notification sent successfully (direct)')
        return true
      }
    } catch (error) {
      console.error('💥 Error sending notification via service worker:', error)
      return false
    }
  }

  static async sendNotification(data: NotificationData): Promise<Notification | null> {
    console.log('📤 Sending notification:', data)

    // First check if notifications are supported
    if (!('Notification' in window)) {
      console.error('❌ Notifications not supported in this browser')
      return null
    }

    // Check current permission status
    const currentPermission = Notification.permission
    console.log('🔍 Current permission status:', currentPermission)

    if (currentPermission === 'denied') {
      console.warn('⚠️ Notification permission denied')
      return null
    }

    if (currentPermission === 'default') {
      console.log('📋 Permission not yet granted, requesting...')
      const newPermission = await Notification.requestPermission()
      if (newPermission !== 'granted') {
        console.warn('⚠️ Notification permission not granted after request')
        return null
      }
      console.log('✅ Permission granted!')
    }

    const iosInfo = getIOSInfo()

    // On iOS, always use service worker for better compatibility
    if (iosInfo.isIOS && iosInfo.isStandalone) {
      console.log('🍎 Using service worker for iOS notification')
      const success = await this.sendNotificationViaServiceWorker(data)
      return success ? {} as Notification : null // Return a dummy notification object for compatibility
    }

    // Use regular Notification API for other platforms
    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      tag: data.tag,
      data: data.data,
      requireInteraction: data.requireInteraction,
      silent: data.silent,
    }

    console.log('📱 Creating notification with options:', options)

    try {
      const notification = new Notification(data.title, options)

      console.log('✅ Notification created successfully')

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!data.requireInteraction) {
        setTimeout(() => {
          console.log('⏰ Auto-closing notification')
          notification.close()
        }, 5000)
      }

      // Add click handler
      notification.onclick = () => {
        console.log('👆 Notification clicked')
        window.focus()
        if (data.data?.redirectUrl) {
          window.location.href = data.data.redirectUrl
        }
        notification.close()
      }

      return notification
    } catch (error) {
      console.error('💥 Error creating notification:', error)
      // Fallback to service worker if regular API fails
      console.log('🔄 Falling back to service worker method')
      const success = await this.sendNotificationViaServiceWorker(data)
      return success ? {} as Notification : null
    }
  }

  // iOS-optimized notification method
  static async sendIOSOptimizedNotification(data: NotificationData): Promise<Notification | null> {
    const iosInfo = getIOSInfo()

    console.log('🍎 Sending iOS-optimized notification...', iosInfo)

    // On iOS, simplify the notification options due to limited support
    if (iosInfo.isIOS && iosInfo.isStandalone) {
      console.log('📱 Using iOS-optimized settings')
      const simplifiedData: NotificationData = {
        title: data.title,
        body: data.body,
        // Remove unsupported properties on iOS
        tag: data.tag, // Keep tag for iOS
        requireInteraction: true, // Always require interaction on iOS
        silent: false, // iOS doesn't support silent notifications reliably
        data: data.data,
        icon: '/icon-192x192.png' // Use PNG icon for iOS
      }
      return this.sendNotification(simplifiedData)
    }

    // Use full features on other platforms
    console.log('🖥️ Using full-featured notification')
    return this.sendNotification(data)
  }

  // Pre-defined notification types for job seeker app with redirect URLs
  static async sendJobAlert(jobTitle: string, company: string, salary?: string, jobId?: number): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'New Job Match! 💼',
      body: `${jobTitle} at ${company}${salary ? ` - ${salary}` : ''}`,
      tag: 'job-alert',
      requireInteraction: true,
      data: {
        type: 'job-alert',
        jobId,
        jobTitle,
        company,
        salary,
        redirectUrl: `/jobs?from=notification${jobId ? `&jobId=${jobId}` : ''}`
      }
    })
  }

  static async sendInterviewReminder(company: string, timeLeft: string, appId?: number): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'Interview Reminder 📅',
      body: `Your interview with ${company} is ${timeLeft}`,
      tag: 'interview-reminder',
      requireInteraction: true,
      data: {
        type: 'interview-reminder',
        appId,
        company,
        timeLeft,
        redirectUrl: `/profile?from=notification${appId ? `&appId=${appId}` : ''}&action=interview`
      }
    })
  }

  static async sendInterviewScheduled(company: string, jobTitle: string, dateTime: string, appId?: number): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'Interview Scheduled! 📅',
      body: `Interview for ${jobTitle} at ${company} on ${dateTime}`,
      tag: 'interview-scheduled',
      requireInteraction: true,
      data: {
        type: 'interview-scheduled',
        appId,
        company,
        jobTitle,
        dateTime,
        redirectUrl: `/profile?from=notification${appId ? `&appId=${appId}` : ''}&action=interview`
      }
    })
  }

  static async sendApplicationUpdate(company: string, status: string, appId?: number): Promise<Notification | null> {
    const statusEmoji = status.toLowerCase().includes('accepted') ? '🎉' :
                       status.toLowerCase().includes('rejected') ? '📄' : '📋'

    return this.sendIOSOptimizedNotification({
      title: `Application Update ${statusEmoji}`,
      body: `Your application with ${company} has been ${status}`,
      tag: 'application-update',
      data: {
        type: 'application-update',
        appId,
        company,
        status,
        redirectUrl: `/profile?from=notification${appId ? `&appId=${appId}` : ''}&action=application`
      }
    })
  }

  static async sendJobOffer(company: string, jobTitle: string, appId?: number): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'Job Offer Received! 🎉',
      body: `Congratulations! You received an offer for ${jobTitle} from ${company}`,
      tag: 'job-offer',
      requireInteraction: true,
      data: {
        type: 'job-offer',
        appId,
        company,
        jobTitle,
        redirectUrl: `/profile?from=notification${appId ? `&appId=${appId}` : ''}&action=offer`
      }
    })
  }

  static async sendWelcomeNotification(): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'Welcome to Job Seeker! 🎉',
      body: 'You will now receive job alerts and important updates.',
      tag: 'welcome',
      data: {
        type: 'welcome',
        redirectUrl: '/?from=notification'
      }
    })
  }

  static async sendWelcomeBackNotification(): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'Welcome Back! 🏠',
      body: 'Check out new job matches we found for you',
      tag: 'welcome-back',
      data: {
        type: 'welcome-back',
        redirectUrl: '/?from=notification'
      }
    })
  }

  static async sendNotificationSettingsReminder(): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'Notification Settings 🔔',
      body: 'Manage your notification preferences',
      tag: 'notification-settings',
      data: {
        type: 'notification-settings',
        redirectUrl: '/notifications?from=notification'
      }
    })
  }

  static async sendTestNotification(): Promise<Notification | null> {
    return this.sendIOSOptimizedNotification({
      title: 'Test Notification 🧪',
      body: 'This is a test notification to verify everything is working.',
      tag: 'test',
      data: {
        type: 'test',
        redirectUrl: '/notifications?from=notification'
      }
    })
  }

  static async sendChatMessage(senderName: string, message: string, messageId?: string): Promise<Notification | null> {
    // Truncate long messages for notification display
    const truncatedMessage = message.length > 100 ? message.substring(0, 100) + '...' : message

    return this.sendIOSOptimizedNotification({
      title: `💬 New message from ${senderName}`,
      body: truncatedMessage,
      tag: 'chat-message', // This will replace previous chat notifications
      requireInteraction: false, // Allow auto-dismiss for chat messages
      data: {
        type: 'chat-message',
        messageId,
        senderName,
        fullMessage: message,
        redirectUrl: '/chat?from=notification'
      }
    })
  }
}

// Service Worker notification handler (for background notifications)
export function setupNotificationHandlers() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'notification') {
        NotificationManager.sendNotification(event.data.notification)
      }
    })
  }
}

// Utility function to schedule a notification
export function scheduleNotification(data: NotificationData, delayMs: number): void {
  setTimeout(() => {
    NotificationManager.sendNotification(data)
  }, delayMs)
}

// Utility function to send a 10-second delayed notification (great for background testing)
export async function send10SecondDelayedNotification(
  title: string = '10-Second Delayed Notification ⏰',
  body: string = 'Perfect timing! This notification appeared after 10 seconds.',
  redirectUrl: string = '/notifications?from=notification&test=10s-delay'
): Promise<void> {
  console.log('⏰ 10-second delayed notification scheduled...')

  setTimeout(async () => {
    const notification = await NotificationManager.sendIOSOptimizedNotification({
      title,
      body,
      tag: 'delayed-10s',
      requireInteraction: true,
      data: {
        type: 'delayed-test',
        redirectUrl,
        delay: '10s'
      }
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        window.location.href = redirectUrl
        notification.close()
      }
    }
  }, 10000)
}

// Enhanced notification click handler
export function setupNotificationClickHandlers() {
  // Listen for service worker navigation messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'navigate') {
        const { url, notificationData } = event.data

        // Navigate to the specified URL
        if (url) {
          window.location.href = url
        }

        // Handle any additional data
        if (notificationData) {
          console.log('Notification data received:', notificationData)
          // You can dispatch custom events here if needed
          window.dispatchEvent(new CustomEvent('notificationNavigation', {
            detail: notificationData
          }))
        }
      }
    })
  }
}

// Check if browser supports specific notification features
export function getNotificationFeatures() {
  if (!('Notification' in window)) {
    return { supported: false }
  }

  const features = {
    supported: true,
    actions: 'actions' in Notification.prototype,
    badge: 'badge' in Notification.prototype,
    data: 'data' in Notification.prototype,
    image: 'image' in Notification.prototype,
    renotify: 'renotify' in Notification.prototype,
    requireInteraction: 'requireInteraction' in Notification.prototype,
    silent: 'silent' in Notification.prototype,
    tag: 'tag' in Notification.prototype,
    vibrate: 'vibrate' in Notification.prototype,
  }

  console.log('🔍 Notification features:', features)
  return features
}

// Utility to create notifications with automatic click-to-redirect
export async function createRedirectNotification(
  title: string,
  body: string,
  redirectUrl: string,
  options: Partial<NotificationData> = {}
): Promise<Notification | null> {
  const notification = await NotificationManager.sendIOSOptimizedNotification({
    title,
    body,
    ...options,
    data: {
      ...options.data,
      redirectUrl,
      type: options.data?.type || 'redirect'
    }
  })

  if (notification) {
    notification.onclick = () => {
      window.focus()
      window.location.href = redirectUrl
      notification.close()
    }
  }

  return notification
}