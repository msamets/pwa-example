// Firebase configuration for Job Seeker PWA
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  //measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase
let firebaseApp: any
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApps()[0]
}

// FCM VAPID key for web push
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export interface FCMTokenResult {
  success: boolean
  token?: string
  error?: string
  needsPermission?: boolean
  retryable?: boolean
}

export interface FCMInitializationState {
  isInitialized: boolean
  lastAttempt: number
  retryCount: number
  lastError?: string
  tokenValidated: boolean
  lastTokenRefresh: number
}

export class FCMManager {
  private static messaging: any = null
  private static state: FCMInitializationState = {
    isInitialized: false,
    lastAttempt: 0,
    retryCount: 0,
    tokenValidated: false,
    lastTokenRefresh: 0
  }
  private static currentToken: string | null = null
  private static readonly MAX_RETRY_ATTEMPTS = 5
  private static readonly RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000] // Progressive delays in ms
  private static readonly TOKEN_REFRESH_INTERVAL = 60 * 60 * 1000 // 1 hour
  private static readonly TOKEN_VALIDATION_INTERVAL = 10 * 60 * 1000 // 10 minutes

  // Reset FCM state (useful for debugging and recovery)
  static reset(): void {
    console.log('🔄 Resetting FCM state...')
    this.messaging = null
    this.currentToken = null
    this.state = {
      isInitialized: false,
      lastAttempt: 0,
      retryCount: 0,
      tokenValidated: false,
      lastTokenRefresh: 0
    }
  }

  // Validate if current token is still valid
  static async validateToken(token?: string): Promise<boolean> {
    const tokenToValidate = token || this.currentToken
    if (!tokenToValidate) {
      console.log('❌ No token to validate')
      return false
    }

    try {
      console.log('🔍 Validating FCM token...')

      // Test token by trying to save it to server
      const response = await fetch('/api/fcm/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: tokenToValidate,
          userId: 'validation-test',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          validationCheck: true
        })
      })

      const result = await response.json()
      const isValid = result.success

      console.log(`🔍 Token validation result: ${isValid ? '✅ Valid' : '❌ Invalid'}`)

      if (isValid) {
        this.state.tokenValidated = true
        this.state.lastTokenRefresh = Date.now()
      }

      return isValid
    } catch (error) {
      console.error('💥 Token validation failed:', error)
      return false
    }
  }

  // Check if token needs refresh based on age and validation status
  static shouldRefreshToken(): boolean {
    const now = Date.now()
    const tokenAge = now - this.state.lastTokenRefresh
    const needsRefresh = !this.state.tokenValidated || tokenAge > this.TOKEN_REFRESH_INTERVAL

    if (needsRefresh) {
      console.log('🔄 Token refresh needed:', {
        validated: this.state.tokenValidated,
        ageMinutes: Math.round(tokenAge / (60 * 1000)),
        maxAgeMinutes: Math.round(this.TOKEN_REFRESH_INTERVAL / (60 * 1000))
      })
    }

    return needsRefresh
  }

  // Initialize with retry logic and double-check mechanism
  static async initializeWithRetry(forceRetry: boolean = false): Promise<boolean> {
    const now = Date.now()

    // If already initialized and validated, skip unless force retry
    if (this.state.isInitialized && this.state.tokenValidated && !forceRetry && !this.shouldRefreshToken()) {
      console.log('✅ FCM already initialized and validated')
      return true
    }

    // Check if we've exceeded max retries
    if (this.state.retryCount >= this.MAX_RETRY_ATTEMPTS && !forceRetry) {
      console.warn('❌ Max retry attempts exceeded. Use forceRetry=true to override.')
      return false
    }

    // Implement exponential backoff
    if (!forceRetry && this.state.lastAttempt > 0) {
      const timeSinceLastAttempt = now - this.state.lastAttempt
      const requiredDelay = this.RETRY_DELAYS[Math.min(this.state.retryCount, this.RETRY_DELAYS.length - 1)]

      if (timeSinceLastAttempt < requiredDelay) {
        console.log(`⏳ Retry backoff in effect. Wait ${Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000)}s`)
        return false
      }
    }

    console.log(`🚀 FCM initialization attempt ${this.state.retryCount + 1}/${this.MAX_RETRY_ATTEMPTS}`)
    this.state.lastAttempt = now

    try {
      // Step 1: Basic initialization
      const basicInit = await this.initialize()
      if (!basicInit) {
        throw new Error('Basic FCM initialization failed')
      }

      // Step 2: Get token with validation
      const tokenResult = await this.getTokenWithValidation()
      if (!tokenResult.success || !tokenResult.token) {
        throw new Error(`Token acquisition failed: ${tokenResult.error}`)
      }

      // Step 3: Double-check by validating the token
      const isValid = await this.validateToken(tokenResult.token)
      if (!isValid) {
        throw new Error('Token validation failed - token may be invalid or server unreachable')
      }

      // Step 4: Save validated token
      this.currentToken = tokenResult.token
      this.state.isInitialized = true
      this.state.tokenValidated = true
      this.state.lastTokenRefresh = now
      this.state.retryCount = 0 // Reset on success
      this.state.lastError = undefined

      console.log('✅ FCM initialization and validation completed successfully')
      return true

    } catch (error) {
      this.state.retryCount++
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error'

      console.error(`❌ FCM initialization attempt ${this.state.retryCount} failed:`, error)
      console.log(`🔄 Will retry in ${this.RETRY_DELAYS[Math.min(this.state.retryCount, this.RETRY_DELAYS.length - 1)] / 1000}s`)

      // Reset state on failure to allow retry
      this.state.isInitialized = false
      this.state.tokenValidated = false

      return false
    }
  }

  static async initialize(): Promise<boolean> {
    try {
      console.log('🔧 Starting FCM initialization...')

      // Debug Firebase config
      console.log('📋 Firebase Config Check:', {
        hasApiKey: !!firebaseConfig.apiKey,
        hasAuthDomain: !!firebaseConfig.authDomain,
        hasProjectId: !!firebaseConfig.projectId,
        hasStorageBucket: !!firebaseConfig.storageBucket,
        hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
        hasAppId: !!firebaseConfig.appId,
        apiKeyPreview: firebaseConfig.apiKey?.substring(0, 10) + '...',
        projectId: firebaseConfig.projectId
      })

      // Debug VAPID key
      console.log('🔑 VAPID Key Check:', {
        hasVapidKey: !!vapidKey,
        vapidKeyPreview: vapidKey?.substring(0, 10) + '...'
      })

      // Debug Firebase app
      console.log('🔥 Firebase App Check:', {
        hasFirebaseApp: !!firebaseApp,
        appName: firebaseApp?.name || 'unknown'
      })

      // Check if messaging is supported
      console.log('🔍 Checking Firebase Messaging support...')
      const supported = await isSupported()
      console.log('📱 Firebase Messaging supported:', supported)

      if (!supported) {
        console.warn('🚫 Firebase Messaging not supported in this browser')
        return false
      }

      // Initialize messaging
      if (typeof window !== 'undefined') {
        if (this.state.isInitialized && this.messaging) {
          console.log('✅ FCM already properly initialized, reusing existing messaging instance')
          return true
        }

        console.log('🚀 Initializing Firebase Messaging...')

        this.messaging = getMessaging(firebaseApp)
        console.log('✅ getMessaging() successful')

        // Set up foreground message handler
        this.setupForegroundMessageHandler()
        console.log('✅ Foreground message handler set up')

        console.log('✅ Firebase Messaging initialized successfully')
        return true
      } else {
        console.log('⚠️ Window not available')
        return false
      }
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Messaging:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })

      // Don't reset here - let the retry logic handle it
      return false
    }
  }

  // Enhanced token acquisition with validation
  static async getTokenWithValidation(): Promise<FCMTokenResult> {
    try {
      if (!this.messaging) {
        return {
          success: false,
          error: 'Firebase Messaging not initialized',
          retryable: true
        }
      }

      // Check notification permission
      if (!('Notification' in window)) {
        return {
          success: false,
          error: 'Notifications not supported in this browser',
          retryable: false
        }
      }

      const permission = Notification.permission
      console.log('🔍 Current notification permission:', permission)

      if (permission === 'denied') {
        return {
          success: false,
          error: 'Notification permission denied',
          needsPermission: false,
          retryable: false
        }
      }

      if (permission === 'default') {
        return {
          success: false,
          error: 'Notification permission not granted',
          needsPermission: true,
          retryable: true
        }
      }

      // Get FCM registration token
      console.log('🔄 Getting FCM registration token...')
      const currentToken = await getToken(this.messaging, {
        vapidKey: vapidKey
      })

      if (currentToken) {
        console.log('✅ FCM registration token obtained')
        console.log('🔑 Token preview:', currentToken.substring(0, 20) + '...')

        // Perform immediate validation
        const isValid = await this.validateTokenFormat(currentToken)
        if (!isValid) {
          return {
            success: false,
            error: 'Invalid token format received',
            retryable: true
          }
        }

        return {
          success: true,
          token: currentToken
        }
      } else {
        console.warn('⚠️ No registration token available')
        return {
          success: false,
          error: 'No registration token available. Permission may not be granted or app may not be in focus.',
          retryable: true
        }
      }
    } catch (error) {
      console.error('💥 Error getting FCM token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      }
    }
  }

  // Validate token format (basic validation)
  static async validateTokenFormat(token: string): Promise<boolean> {
    if (!token || typeof token !== 'string') {
      console.error('❌ Token is not a valid string')
      return false
    }

    if (token.length < 100) {
      console.error('❌ Token is too short (likely invalid)')
      return false
    }

    // FCM tokens are typically base64-like strings
    const validTokenRegex = /^[A-Za-z0-9_-]+$/
    if (!validTokenRegex.test(token.replace(/[:.]/g, ''))) {
      console.error('❌ Token contains invalid characters')
      return false
    }

    console.log('✅ Token format validation passed')
    return true
  }

  static async getToken(): Promise<FCMTokenResult> {
    // Use the enhanced validation method
    return this.getTokenWithValidation()
  }

  static async requestPermissionAndGetToken(): Promise<FCMTokenResult> {
    try {
      console.log('📱 Requesting notification permission...')

      // Request permission first
      const permission = await Notification.requestPermission()
      console.log('📊 Permission result:', permission)

      if (permission !== 'granted') {
        return {
          success: false,
          error: 'Notification permission not granted',
          needsPermission: permission === 'default',
          retryable: permission === 'default'
        }
      }

      // Now get the token with validation
      return await this.getTokenWithValidation()
    } catch (error) {
      console.error('💥 Error requesting permission and getting token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: true
      }
    }
  }

  // Get current validated token or attempt to refresh
  static async getCurrentToken(): Promise<string | null> {
    // If we have a validated token that's recent, return it
    if (this.currentToken && this.state.tokenValidated && !this.shouldRefreshToken()) {
      return this.currentToken
    }

    // Try to refresh the token
    console.log('🔄 Attempting to refresh token...')
    const success = await this.initializeWithRetry()

    return success ? this.currentToken : null
  }

  // Periodic health check for token validity
  static startPeriodicHealthCheck(): void {
    console.log('🏥 Starting periodic FCM health checks...')

    setInterval(async () => {
      try {
        console.log('🏥 Performing FCM health check...')

        if (!this.state.isInitialized || !this.currentToken) {
          console.log('⚠️ FCM not initialized, attempting initialization...')
          await this.initializeWithRetry()
          return
        }

        // Check if token needs validation
        const now = Date.now()
        const timeSinceValidation = now - this.state.lastTokenRefresh

        if (timeSinceValidation > this.TOKEN_VALIDATION_INTERVAL) {
          console.log('🔍 Token validation due, checking...')
          const isValid = await this.validateToken()

          if (!isValid) {
            console.warn('⚠️ Token validation failed, reinitializing...')
            this.state.tokenValidated = false
            await this.initializeWithRetry(true)
          }
        }
      } catch (error) {
        console.error('💥 Health check error:', error)
      }
    }, this.TOKEN_VALIDATION_INTERVAL)
  }

  private static setupForegroundMessageHandler(): void {
    if (!this.messaging) return

    // Handle messages received while app is in foreground
    onMessage(this.messaging, (payload) => {
      console.log('📨 Message received while app in foreground:', payload)

      // Extract notification data
      const { title, body, icon } = payload.notification || {}
      const data = payload.data || {}

      // Show notification using existing notification system
      if (title && body) {
        // Use service worker to show notification for consistency
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            const notificationOptions: NotificationOptions = {
              body,
              icon: icon || '/icon-192x192.png',
              badge: '/icon-192x192.png',
              data: data,
              tag: data.tag || 'fcm-foreground',
              requireInteraction: true,
              ...(data.actions && { actions: JSON.parse(data.actions) })
            }

            registration.showNotification(title, notificationOptions)
          })
        } else {
          // Fallback to regular notification
          new Notification(title, {
            body,
            icon: icon || '/icon-192x192.png',
            data: data
          })
        }
      }
    })
  }

  static async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      // This would typically be done on the server side
      console.log(`📋 Subscribing token to topic: ${topic}`)

      const response = await fetch('/api/fcm/subscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, topic })
      })

      const result = await response.json()
      return result.success || false
    } catch (error) {
      console.error('💥 Error subscribing to topic:', error)
      return false
    }
  }

  static async saveTokenToServer(token: string, userId?: string): Promise<boolean> {
    try {
      console.log('💾 Saving FCM token to server...')

      const response = await fetch('/api/fcm/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          userId: userId || 'anonymous',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      })

      const result = await response.json()

      if (result.success) {
        console.log('✅ FCM token saved to server successfully')
        return true
      } else {
        console.error('❌ Failed to save FCM token:', result.error)
        return false
      }
    } catch (error) {
      console.error('💥 Error saving FCM token to server:', error)
      return false
    }
  }

  // Get initialization state for debugging
  static getState(): FCMInitializationState & { currentToken: string | null } {
    return {
      ...this.state,
      currentToken: this.currentToken
    }
  }

  // Force a complete reinitialization (useful for error recovery)
  static async forceReinitialize(): Promise<boolean> {
    console.log('🔄 Forcing complete FCM reinitialization...')
    this.reset()
    return await this.initializeWithRetry(true)
  }

  static async checkTokenRefresh(): Promise<void> {
    // Token refresh is handled automatically by Firebase SDK
    // This method can be used for manual refresh if needed
    console.log('🔄 Checking for token refresh...')

    // You can implement custom token refresh logic here if needed
    // For example, periodically getting a new token and updating the server
  }
}

export { firebaseApp }
export default FCMManager