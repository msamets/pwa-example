// FCM-Enhanced Notification utility functions for the Job Seeker PWA
import FCMManager, { FCMTokenResult } from '../../lib/firebase'

export interface NotificationData {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  silent?: boolean
  actions?: Array<{action: string, title: string}>
  type?: string
}

export interface FCMNotificationPayload {
  notification?: {
    title: string
    body: string
    icon?: string
    image?: string
  }
  data?: Record<string, string>
  token?: string
  tokens?: string[]
  topic?: string
}

// Enhanced iOS detection and compatibility
export function getIOSInfo() {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isStandalone: false,
      version: null,
      supportsNotifications: false
    }
  }

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
  private static fcmToken: string | null = null
  private static isInitialized = false
  private static healthCheckInterval: NodeJS.Timeout | null = null

  // Reset FCM state (useful for debugging and recovery)
  static reset(): void {
    console.log('🔄 Resetting NotificationManager state...')
    this.fcmToken = null
    this.isInitialized = false

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    FCMManager.reset()
  }

  // Enhanced initialization with double-check mechanism
  static async initialize(): Promise<{success: boolean, token?: string, error?: string}> {
    try {
      console.log('🚀 Initializing FCM NotificationManager with double-check...')

      // Use the enhanced initialization with retry logic
      const initialized = await FCMManager.initializeWithRetry()

      if (!initialized) {
        // Get detailed state for better error reporting
        const state = FCMManager.getState()
        console.error('❌ FCMManager.initializeWithRetry() failed:', state.lastError)

        return {
          success: false,
          error: `FCM initialization failed after ${state.retryCount} attempts: ${state.lastError || 'Unknown error'}`
        }
      }

      console.log('✅ FCM initialization successful, getting validated token...')

      // Get the current validated token
      const token = await FCMManager.getCurrentToken()

      if (token) {
        this.fcmToken = token
        this.isInitialized = true

        console.log('💾 Saving validated token to server...')
        // Save token to server
        await FCMManager.saveTokenToServer(token)

        // Start periodic health checks
        this.startHealthChecks()

        console.log('✅ FCM NotificationManager initialized successfully with validation')
        return { success: true, token: token }
      } else {
        console.error('❌ Failed to get validated FCM token')
        return {
          success: false,
          error: 'Failed to get validated FCM token'
        }
      }
    } catch (error) {
      console.error('💥 Error in NotificationManager.initialize():', error)
      // Reset state on error
      this.fcmToken = null
      this.isInitialized = false
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in NotificationManager.initialize()'
      }
    }
  }

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

  // Enhanced token retrieval with automatic reinitialization
  static async getFCMToken(): Promise<string | null> {
    // First, try to get current validated token
    const currentToken = await FCMManager.getCurrentToken()

    if (currentToken) {
      this.fcmToken = currentToken
      this.isInitialized = true
      return currentToken
    }

    // If no current token, try to initialize
    console.log('🔄 No validated token available, attempting initialization...')
    const result = await this.initialize()
    return result.token || null
  }

  // Double-check token validity and reinitialize if needed
  static async verifyAndRefreshToken(): Promise<{success: boolean, token?: string, error?: string}> {
    try {
      console.log('🔍 Verifying and refreshing FCM token...')

      // Check current FCM state
      const state = FCMManager.getState()
      console.log('📊 Current FCM state:', {
        isInitialized: state.isInitialized,
        tokenValidated: state.tokenValidated,
        retryCount: state.retryCount,
        hasToken: !!state.currentToken
      })

      // If token is not validated or is stale, force refresh
      if (!state.tokenValidated || !state.currentToken) {
        console.log('🔄 Token needs refresh, forcing reinitialization...')
        const success = await FCMManager.forceReinitialize()

        if (success) {
          const newToken = await FCMManager.getCurrentToken()
          if (newToken) {
            this.fcmToken = newToken
            this.isInitialized = true
            return { success: true, token: newToken }
          }
        }

        return { success: false, error: 'Failed to refresh token' }
      }

      // Token appears valid
      this.fcmToken = state.currentToken
      this.isInitialized = true
      return { success: true, token: state.currentToken }

    } catch (error) {
      console.error('💥 Error verifying and refreshing token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Start periodic health checks
  static startHealthChecks(): void {
    // Avoid multiple intervals
    if (this.healthCheckInterval) {
      return
    }

    console.log('🏥 Starting NotificationManager health checks...')

    // Start FCM health checks
    FCMManager.startPeriodicHealthCheck()

    // Additional NotificationManager-specific health checks
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Verify our local state matches FCM state
        const fcmState = FCMManager.getState()

        if (fcmState.isInitialized && fcmState.tokenValidated && fcmState.currentToken) {
          // Update our local state to match
          if (this.fcmToken !== fcmState.currentToken) {
            console.log('🔄 Syncing local token with FCM state...')
            this.fcmToken = fcmState.currentToken
            this.isInitialized = true
          }
        } else if (this.isInitialized) {
          // FCM state is invalid but we think we're initialized
          console.warn('⚠️ FCM state mismatch detected, refreshing...')
          await this.verifyAndRefreshToken()
        }
      } catch (error) {
        console.error('💥 NotificationManager health check error:', error)
      }
    }, 5 * 60 * 1000) // Check every 5 minutes
  }

  // Stop health checks (useful for cleanup)
  static stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      console.log('🏥 NotificationManager health checks stopped')
    }
  }

  // Enhanced initialization that tries multiple approaches
  static async ensureInitialized(): Promise<{success: boolean, token?: string, error?: string}> {
    // Quick check if already properly initialized
    if (this.isInitialized && this.fcmToken) {
      const isValid = await FCMManager.validateToken(this.fcmToken)
      if (isValid) {
        console.log('✅ Already initialized with valid token')
        return { success: true, token: this.fcmToken }
      }
    }

    console.log('🚀 Ensuring FCM initialization...')

    // Try normal initialization first
    let result = await this.initialize()
    if (result.success) {
      return result
    }

    console.log('🔄 Normal initialization failed, trying token verification...')

    // Try verification and refresh
    result = await this.verifyAndRefreshToken()
    if (result.success) {
      return result
    }

    console.log('🔄 Token verification failed, trying force reinitialization...')

    // Last resort: force complete reinitialization
    try {
      const success = await FCMManager.forceReinitialize()
      if (success) {
        const token = await FCMManager.getCurrentToken()
        if (token) {
          this.fcmToken = token
          this.isInitialized = true
          this.startHealthChecks()
          return { success: true, token }
        }
      }
    } catch (error) {
      console.error('💥 Force reinitialization failed:', error)
    }

    return {
      success: false,
      error: 'All initialization attempts failed. Check console for detailed logs.'
    }
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

  // Send FCM notification via server with enhanced token handling
  static async sendFCMNotification(
    notificationData: NotificationData,
    targetToken?: string,
    topic?: string
  ): Promise<boolean> {
    try {
      console.log('📤 Sending FCM notification via server:', notificationData)

      const payload: FCMNotificationPayload = {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          icon: notificationData.icon || '/icon-192x192.png',
          image: notificationData.data?.image
        },
        data: {
          ...notificationData.data,
          type: notificationData.type || 'general',
          tag: notificationData.tag || 'job-seeker-notification',
          requireInteraction: notificationData.requireInteraction?.toString() || 'true',
          silent: notificationData.silent?.toString() || 'false',
          actions: notificationData.actions ? JSON.stringify(notificationData.actions) : '[]'
        }
      }

      // Add target (token or topic)
      if (targetToken) {
        payload.token = targetToken
      } else if (topic) {
        payload.topic = topic
      } else {
        // Use current user's token with enhanced validation
        console.log('🔍 Getting validated FCM token for notification...')

        // Try to ensure we have a valid token
        const tokenResult = await this.ensureInitialized()

        if (tokenResult.success && tokenResult.token) {
          payload.token = tokenResult.token
          console.log('✅ Using validated token for notification')
        } else {
          console.error('❌ No valid FCM token available for notification:', tokenResult.error)

          // Try one more time with getFCMToken as fallback
          const fallbackToken = await this.getFCMToken()
          if (fallbackToken) {
            console.log('🔄 Using fallback token')
            payload.token = fallbackToken
          } else {
            console.error('❌ All token retrieval methods failed')
            return false
          }
        }
      }

      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ FCM notification sent successfully')
        return true
      } else {
        console.error('❌ Failed to send FCM notification:', result.error)

        // If token-related error, try to refresh token
        if (result.error && (
          result.error.includes('invalid') ||
          result.error.includes('not-registered') ||
          result.error.includes('token')
        )) {
          console.log('🔄 Token error detected, attempting token refresh...')
          const refreshResult = await this.verifyAndRefreshToken()

          if (refreshResult.success) {
            console.log('✅ Token refreshed, you may retry the notification')
          }
        }

        return false
      }
    } catch (error) {
      console.error('💥 Error sending FCM notification:', error)
      return false
    }
  }

  // Local notification fallback (for immediate notifications)
  static async sendLocalNotification(data: NotificationData): Promise<boolean> {
    console.log('📤 Sending local notification:', data)

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
        ...(data.actions && { actions: data.actions })
      }

      console.log('📱 Showing local notification via service worker')
      await registration.showNotification(data.title, options)
      console.log('✅ Local notification sent successfully')
      return true
    } catch (error) {
      console.error('💥 Error sending local notification:', error)
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

    // On iOS, prefer local notification for immediate display
    if (iosInfo.isIOS && iosInfo.isStandalone) {
      console.log('🍎 Using local notification for iOS')
      const success = await this.sendLocalNotification(data)
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
      // Fallback to local notification if regular API fails
      console.log('🔄 Falling back to local notification method')
      const success = await this.sendLocalNotification(data)
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
let notificationHandlerRegistered = false

export function setupNotificationClickHandlers() {
  // Prevent multiple registrations
  if (notificationHandlerRegistered) {
    console.log('🔄 Notification handlers already registered')
    return
  }

  const iosInfo = getIOSInfo()
  console.log('📱 Setting up notification handlers for:', iosInfo.isIOS ? 'iOS' : 'Desktop')

  // Listen for service worker navigation messages
  if ('serviceWorker' in navigator) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'navigate') {
        console.log('🔗 Navigation handler triggered:', event.data)
        const { url, notificationData } = event.data

        // Navigate to the specified URL
        if (url) {
          console.log('🚀 Attempting navigation to:', url)

          if (iosInfo.isIOS && iosInfo.isStandalone) {
            // iOS PWA: Use more robust navigation methods
            console.log('🍎 iOS PWA navigation')

            try {
              // For iOS PWA, try multiple methods in sequence
              if (window.location.pathname !== new URL(url, window.location.origin).pathname) {
                // Method 1: Use history API for SPA navigation
                window.history.pushState(null, '', url)
                window.dispatchEvent(new PopStateEvent('popstate'))
                console.log('✅ iOS navigation via history API')
              } else {
                console.log('🔄 Already on target page')
              }
            } catch (historyError) {
              console.error('❌ History API failed:', historyError)

              try {
                // Method 2: Direct assignment
                window.location.href = url
                console.log('✅ iOS navigation via location.href')
              } catch (locationError) {
                console.error('❌ iOS navigation failed:', locationError)
              }
            }
          } else {
            // Desktop/Android: Use standard navigation
            try {
              // Method 1: Direct assignment
              window.location.href = url
              console.log('✅ Navigation method 1 attempted')
            } catch (error) {
              console.error('❌ Navigation method 1 failed:', error)

              try {
                // Method 2: Using replace
                window.location.replace(url)
                console.log('✅ Navigation method 2 attempted')
              } catch (error2) {
                console.error('❌ Navigation method 2 failed:', error2)

                try {
                  // Method 3: Using assign
                  window.location.assign(url)
                  console.log('✅ Navigation method 3 attempted')
                } catch (error3) {
                  console.error('❌ All navigation methods failed:', error3)
                }
              }
            }
          }
        } else {
          console.log('❌ No URL provided for navigation')
        }

        // Handle any additional data
        if (notificationData) {
          console.log('📦 Notification data received:', notificationData)
          // You can dispatch custom events here if needed
          window.dispatchEvent(new CustomEvent('notificationNavigation', {
            detail: notificationData
          }))
        }
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    notificationHandlerRegistered = true
    console.log('✅ Notification click handlers initialized')
  } else {
    console.log('❌ Service Worker not supported')
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