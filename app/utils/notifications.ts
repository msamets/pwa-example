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
      throw new Error('Notifications not supported')
    }
    return Notification.permission
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported')
    }
    return await Notification.requestPermission()
  }

  static async ensurePermission(): Promise<boolean> {
    const permission = await this.checkPermission()

    if (permission === 'granted') {
      return true
    }

    if (permission === 'default') {
      const newPermission = await this.requestPermission()
      return newPermission === 'granted'
    }

    return false
  }

  static async checkIOSCompatibility(): Promise<{
    canUseNotifications: boolean,
    reason?: string,
    instructions?: string[]
  }> {
    const iosInfo = getIOSInfo()

    if (!iosInfo.isIOS) {
      return { canUseNotifications: true }
    }

    if (!iosInfo.isStandalone) {
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
      return {
        canUseNotifications: false,
        reason: 'iOS 16.4 or later required',
        instructions: ['Update your iPhone to iOS 16.4 or later']
      }
    }

    return { canUseNotifications: true }
  }

  static async ensurePermissionWithIOSSupport(): Promise<{
    success: boolean,
    permission?: NotificationPermission,
    error?: string,
    needsInstall?: boolean
  }> {
    const iosCheck = await this.checkIOSCompatibility()

    if (!iosCheck.canUseNotifications) {
      return {
        success: false,
        error: iosCheck.reason,
        needsInstall: iosCheck.reason?.includes('home screen')
      }
    }

    try {
      const hasPermission = await this.ensurePermission()
      return {
        success: hasPermission,
        permission: await this.checkPermission()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  static async sendNotification(data: NotificationData): Promise<Notification | null> {
    const hasPermission = await this.ensurePermission()

    if (!hasPermission) {
      console.warn('Notification permission not granted')
      return null
    }

    const options: NotificationOptions = {
      body: data.body,
      icon: data.icon || '/icon.svg',
      badge: data.badge || '/icon.svg',
      tag: data.tag,
      data: data.data,
      requireInteraction: data.requireInteraction,
      silent: data.silent,
    }

    const notification = new Notification(data.title, options)

    // Auto-close after 5 seconds unless requireInteraction is true
    if (!data.requireInteraction) {
      setTimeout(() => {
        notification.close()
      }, 5000)
    }

    return notification
  }

  // iOS-optimized notification method
  static async sendIOSOptimizedNotification(data: NotificationData): Promise<Notification | null> {
    const iosInfo = getIOSInfo()

    // On iOS, simplify the notification options due to limited support
    if (iosInfo.isIOS && iosInfo.isStandalone) {
      const simplifiedData: NotificationData = {
        title: data.title,
        body: data.body,
        // Remove unsupported properties on iOS
        tag: undefined, // iOS doesn't support updating notifications
        requireInteraction: true, // Always require interaction on iOS
        silent: false, // iOS doesn't support silent notifications reliably
        data: data.data
      }
      return this.sendNotification(simplifiedData)
    }

    // Use full features on other platforms
    return this.sendNotification(data)
  }

  // Pre-defined notification types for job seeker app with redirect URLs
  static async sendJobAlert(jobTitle: string, company: string, salary?: string, jobId?: number): Promise<Notification | null> {
    return this.sendNotification({
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
    return this.sendNotification({
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
    return this.sendNotification({
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

    return this.sendNotification({
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
    return this.sendNotification({
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
    return this.sendNotification({
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
    return this.sendNotification({
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
    return this.sendNotification({
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
    return this.sendNotification({
      title: 'Test Notification 🧪',
      body: 'This is a test notification to verify everything is working.',
      tag: 'test',
      data: {
        type: 'test',
        redirectUrl: '/notifications?from=notification'
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
  console.log('10-second delayed notification scheduled...')

  setTimeout(async () => {
    const notification = await NotificationManager.sendNotification({
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

  return {
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
}

// Utility to create notifications with automatic click-to-redirect
export async function createRedirectNotification(
  title: string,
  body: string,
  redirectUrl: string,
  options: Partial<NotificationData> = {}
): Promise<Notification | null> {
  const notification = await NotificationManager.sendNotification({
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