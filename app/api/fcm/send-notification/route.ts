import { NextRequest, NextResponse } from 'next/server'
import FCMAdmin from '../../../../lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { notification, data, token, tokens, topic } = body

    // Validate notification data
    if (!notification || !notification.title || !notification.body) {
      return NextResponse.json({
        success: false,
        error: 'Notification title and body are required'
      }, { status: 400 })
    }

    // Validate target (token, tokens, or topic)
    if (!token && !tokens && !topic) {
      return NextResponse.json({
        success: false,
        error: 'Target token, tokens array, or topic is required'
      }, { status: 400 })
    }

    const { title, body: notificationBody, icon, image } = notification
    const notificationData = data || {}

    console.log('📤 Sending FCM notification:', {
      title,
      body: notificationBody.substring(0, 50) + (notificationBody.length > 50 ? '...' : ''),
      target: token ? 'single-token' : tokens ? `${tokens.length}-tokens` : `topic-${topic}`
    })

    // Prepare options
    const options = {
      icon: icon || '/icon-192x192.png',
      image,
      tag: notificationData.tag || 'job-seeker-notification',
      requireInteraction: notificationData.requireInteraction !== 'false',
      actions: notificationData.actions ? JSON.parse(notificationData.actions) : undefined
    }

    let result

    if (token) {
      // Send to single token
      result = await FCMAdmin.sendToToken(
        token,
        title,
        notificationBody,
        notificationData,
        options
      )
    } else if (tokens && Array.isArray(tokens)) {
      // Send to multiple tokens
      if (tokens.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Tokens array cannot be empty'
        }, { status: 400 })
      }

      if (tokens.length > 500) {
        return NextResponse.json({
          success: false,
          error: 'Cannot send to more than 500 tokens at once'
        }, { status: 400 })
      }

      result = await FCMAdmin.sendToTokens(
        tokens,
        title,
        notificationBody,
        notificationData,
        options
      )
    } else if (topic) {
      // Send to topic
      if (typeof topic !== 'string' || topic.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Topic must be a non-empty string'
        }, { status: 400 })
      }

      result = await FCMAdmin.sendToTopic(
        topic,
        title,
        notificationBody,
        notificationData,
        options
      )
    }

        if (result?.success) {
      console.log('✅ FCM notification sent successfully')

      const responseData: any = {
        success: true,
        message: 'Notification sent successfully'
      }

      // Check if it's a single token result (has messageId)
      if ('messageId' in result && result.messageId) {
        responseData.messageId = result.messageId
      }

      // Check if it's a multicast result (has successCount)
      if ('successCount' in result) {
        responseData.successCount = result.successCount
        responseData.failureCount = result.failureCount
      }

      return NextResponse.json(responseData)
    } else {
      const errorMessage = 'error' in result! ? result.error : 'Failed to send notification'
      console.error('❌ Failed to send FCM notification:', errorMessage)
      return NextResponse.json({
        success: false,
        error: errorMessage || 'Failed to send notification'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Error in send-notification API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Note: Job notification helper functions are available in the FCMAdmin class
// Use FCMAdmin.sendToToken() with predefined job notification templates