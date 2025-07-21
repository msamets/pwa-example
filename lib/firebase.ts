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
}

export class FCMManager {
  private static messaging: any = null
  private static isInitialized = false

  // Reset FCM state (useful for debugging and recovery)
  static reset(): void {
    console.log('🔄 Resetting FCM state...')
    this.messaging = null
    this.isInitialized = false
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
        if (this.isInitialized && this.messaging) {
          console.log('✅ FCM already properly initialized, reusing existing messaging instance')
          return true
        }

        console.log('🚀 Initializing Firebase Messaging...')

        this.messaging = getMessaging(firebaseApp)
        console.log('✅ getMessaging() successful')

        this.isInitialized = true
        console.log('✅ FCM marked as initialized')

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

      // Reset state on error to allow retry
      this.reset()
      return false
    }
  }

  static async getToken(): Promise<FCMTokenResult> {
    try {
      if (!this.messaging) {
        const initialized = await this.initialize()
        if (!initialized) {
          return {
            success: false,
            error: 'Firebase Messaging not supported or failed to initialize'
          }
        }
      }

      // Check notification permission
      if (!('Notification' in window)) {
        return {
          success: false,
          error: 'Notifications not supported in this browser'
        }
      }

      const permission = Notification.permission
      console.log('🔍 Current notification permission:', permission)

      if (permission === 'denied') {
        return {
          success: false,
          error: 'Notification permission denied',
          needsPermission: false
        }
      }

      if (permission === 'default') {
        return {
          success: false,
          error: 'Notification permission not granted',
          needsPermission: true
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
        return {
          success: true,
          token: currentToken
        }
      } else {
        console.warn('⚠️ No registration token available')
        return {
          success: false,
          error: 'No registration token available. Permission may not be granted or app may not be in focus.'
        }
      }
    } catch (error) {
      console.error('💥 Error getting FCM token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
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
          needsPermission: permission === 'default'
        }
      }

      // Now get the token
      return await this.getToken()
    } catch (error) {
      console.error('💥 Error requesting permission and getting token:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
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