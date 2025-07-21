// Firebase Admin SDK for server-side operations
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

let adminApp: any = null

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (adminApp) {
    return adminApp
  }

  // Check if already initialized
  const existingApps = getApps()
  if (existingApps.length > 0) {
    adminApp = existingApps[0]
    return adminApp
  }

  try {
    // Get environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const projectId = process.env.FIREBASE_PROJECT_ID

    if (!privateKey || !clientEmail || !projectId) {
      console.error('❌ Missing Firebase Admin credentials in environment variables')
      throw new Error('Missing Firebase Admin credentials')
    }

    console.log('🔧 Initializing Firebase Admin SDK...')

    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      }),
      projectId
    })

    console.log('✅ Firebase Admin SDK initialized successfully')
    return adminApp
  } catch (error) {
    console.error('💥 Error initializing Firebase Admin SDK:', error)
    throw error
  }
}

// Get messaging instance
export function getAdminMessaging() {
  try {
    if (!adminApp) {
      initializeFirebaseAdmin()
    }
    return getMessaging(adminApp)
  } catch (error) {
    console.error('💥 Error getting admin messaging:', error)
    throw error
  }
}

// FCM token storage (in-memory for now, should be database in production)
const fcmTokens = new Map<string, {
  token: string
  userId: string
  timestamp: string
  userAgent?: string
  isActive: boolean
}>()

export class FCMAdmin {
  // Save FCM token
  static saveToken(token: string, userId: string, userAgent?: string): boolean {
    try {
      fcmTokens.set(token, {
        token,
        userId,
        timestamp: new Date().toISOString(),
        userAgent,
        isActive: true
      })

      console.log(`💾 FCM token saved for user ${userId}`)
      return true
    } catch (error) {
      console.error('❌ Error saving FCM token:', error)
      return false
    }
  }

    // Get tokens for a user
  static getTokensForUser(userId: string): string[] {
    const userTokens: string[] = []

    fcmTokens.forEach((data, token) => {
      if (data.userId === userId && data.isActive) {
        userTokens.push(token)
      }
    })

    return userTokens
  }

  // Get all active tokens
  static getAllActiveTokens(): string[] {
    const activeTokens: string[] = []

    fcmTokens.forEach((data, token) => {
      if (data.isActive) {
        activeTokens.push(token)
      }
    })

    return activeTokens
  }

  // Mark token as inactive
  static deactivateToken(token: string): boolean {
    const tokenData = fcmTokens.get(token)
    if (tokenData) {
      tokenData.isActive = false
      fcmTokens.set(token, tokenData)
      console.log(`🔴 FCM token deactivated: ${token.substring(0, 20)}...`)
      return true
    }
    return false
  }

  // Send notification to specific token
  static async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    options?: {
      icon?: string
      image?: string
      tag?: string
      requireInteraction?: boolean
      actions?: Array<{action: string, title: string}>
    }
  ): Promise<{success: boolean, messageId?: string, error?: string}> {
    try {
      const messaging = getAdminMessaging()

      const message = {
        token,
        data: {
          ...data,
          ...(options?.tag && { tag: options.tag }),
          ...(options?.requireInteraction && { requireInteraction: 'true' }),
          ...(options?.actions && { actions: JSON.stringify(options.actions) })
        },
        webpush: {
          headers: {
            'Urgency': 'high'
          },
          notification: {
            title,
            body,
            icon: options?.icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            ...(options?.image && { image: options.image }),
            tag: options?.tag || 'job-seeker-notification',
            requireInteraction: options?.requireInteraction !== false,
            ...(options?.actions && { actions: options.actions })
          }
        }
      }

      const response = await messaging.send(message)
      console.log('✅ FCM notification sent successfully:', response)

      return {
        success: true,
        messageId: response
      }
    } catch (error: any) {
      console.error('❌ Error sending FCM notification:', error)

      // Handle token errors
      if (error.code === 'messaging/registration-token-not-registered' ||
          error.code === 'messaging/invalid-registration-token') {
        console.log('🔴 Invalid token, deactivating:', token.substring(0, 20) + '...')
        this.deactivateToken(token)
      }

      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  // Send notification to multiple tokens
  static async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
    options?: {
      icon?: string
      image?: string
      tag?: string
      requireInteraction?: boolean
      actions?: Array<{action: string, title: string}>
    }
  ): Promise<{success: boolean, successCount: number, failureCount: number, results: any[]}> {
    try {
      const messaging = getAdminMessaging()

      const message = {
        data: {
          ...data,
          ...(options?.tag && { tag: options.tag }),
          ...(options?.requireInteraction && { requireInteraction: 'true' }),
          ...(options?.actions && { actions: JSON.stringify(options.actions) })
        },
        webpush: {
          headers: {
            'Urgency': 'high'
          },
          notification: {
            title,
            body,
            icon: options?.icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            ...(options?.image && { image: options.image }),
            tag: options?.tag || 'job-seeker-notification',
            requireInteraction: options?.requireInteraction !== false,
            ...(options?.actions && { actions: options.actions })
          }
        },
        tokens
      }

      const response = await messaging.sendEachForMulticast(message)
      console.log(`✅ FCM multicast sent: ${response.successCount}/${tokens.length} successful`)

      // Handle failed tokens
      response.responses.forEach((result, index) => {
        if (!result.success && result.error) {
          const token = tokens[index]
          const error = result.error

          if (error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-registration-token') {
            console.log('🔴 Invalid token, deactivating:', token.substring(0, 20) + '...')
            this.deactivateToken(token)
          }
        }
      })

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        results: response.responses
      }
    } catch (error: any) {
      console.error('❌ Error sending FCM multicast:', error)
      return {
        success: false,
        successCount: 0,
        failureCount: tokens.length,
        results: []
      }
    }
  }

  // Send notification to topic
  static async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
    options?: {
      icon?: string
      image?: string
      tag?: string
      requireInteraction?: boolean
      actions?: Array<{action: string, title: string}>
    }
  ): Promise<{success: boolean, messageId?: string, error?: string}> {
    try {
      const messaging = getAdminMessaging()

      const message = {
        topic,
        data: {
          ...data,
          ...(options?.tag && { tag: options.tag }),
          ...(options?.requireInteraction && { requireInteraction: 'true' }),
          ...(options?.actions && { actions: JSON.stringify(options.actions) })
        },
        webpush: {
          headers: {
            'Urgency': 'high'
          },
          notification: {
            title,
            body,
            icon: options?.icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            ...(options?.image && { image: options.image }),
            tag: options?.tag || 'job-seeker-notification',
            requireInteraction: options?.requireInteraction !== false,
            ...(options?.actions && { actions: options.actions })
          }
        }
      }

      const response = await messaging.send(message)
      console.log('✅ FCM topic notification sent successfully:', response)

      return {
        success: true,
        messageId: response
      }
    } catch (error: any) {
      console.error('❌ Error sending FCM topic notification:', error)
      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  // Subscribe token to topic
  static async subscribeToTopic(token: string, topic: string): Promise<{success: boolean, error?: string}> {
    try {
      const messaging = getAdminMessaging()
      await messaging.subscribeToTopic([token], topic)

      console.log(`✅ Token subscribed to topic ${topic}`)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Error subscribing to topic:', error)
      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  // Unsubscribe token from topic
  static async unsubscribeFromTopic(token: string, topic: string): Promise<{success: boolean, error?: string}> {
    try {
      const messaging = getAdminMessaging()
      await messaging.unsubscribeFromTopic([token], topic)

      console.log(`✅ Token unsubscribed from topic ${topic}`)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Error unsubscribing from topic:', error)
      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  // Get token statistics
  static getTokenStats(): {
    total: number
    active: number
    inactive: number
    byUser: Record<string, number>
  } {
    const stats = {
      total: fcmTokens.size,
      active: 0,
      inactive: 0,
      byUser: {} as Record<string, number>
    }

    fcmTokens.forEach((data) => {
      if (data.isActive) {
        stats.active++
      } else {
        stats.inactive++
      }

      stats.byUser[data.userId] = (stats.byUser[data.userId] || 0) + 1
    })

    return stats
  }
}

export default FCMAdmin