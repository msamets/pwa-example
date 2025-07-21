import { NextRequest, NextResponse } from 'next/server'
import FCMAdmin from '../../../../lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, userId, userAgent, validationCheck = false } = body

    // Validate required fields
    if (!token || typeof token !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'FCM token is required and must be a string'
      }, { status: 400 })
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'User ID is required and must be a string'
      }, { status: 400 })
    }

    // Validate token format (basic validation)
    if (token.length < 100) {
      return NextResponse.json({
        success: false,
        error: 'Invalid FCM token format'
      }, { status: 400 })
    }

    // Enhanced logging for validation checks
    if (validationCheck) {
      console.log(`🔍 FCM Token validation check for: ${userId}`)
      console.log(`🔑 Token preview: ${token.substring(0, 20)}...`)
      console.log(`📱 User agent: ${userAgent?.substring(0, 50)}...`)
    } else {
      console.log(`💾 Saving FCM token for user: ${userId}`)
      console.log(`🔑 Token preview: ${token.substring(0, 20)}...`)
    }

    // Save the token
    const saved = FCMAdmin.saveToken(token, userId, userAgent)

    if (saved) {
      if (validationCheck) {
        console.log('✅ FCM token validation successful')
      } else {
        console.log('✅ FCM token saved successfully')
      }

      // Get token statistics
      const stats = FCMAdmin.getTokenStats()

      return NextResponse.json({
        success: true,
        message: validationCheck ? 'FCM token validation successful' : 'FCM token saved successfully',
        stats: {
          totalTokens: stats.total,
          activeTokens: stats.active
        },
        validation: validationCheck ? {
          tokenValid: true,
          timestamp: new Date().toISOString(),
          tokenPreview: token.substring(0, 20) + '...'
        } : undefined
      })
    } else {
      const errorMessage = validationCheck ? 'Token validation failed' : 'Failed to save FCM token'
      console.error(`❌ ${errorMessage}`)
      return NextResponse.json({
        success: false,
        error: errorMessage
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Error in save-token API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Add GET method for token statistics (useful for debugging)
export async function GET(req: NextRequest) {
  try {
    const stats = FCMAdmin.getTokenStats()

    return NextResponse.json({
      success: true,
      stats: {
        totalTokens: stats.total,
        activeTokens: stats.active
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('💥 Error getting token stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get token statistics'
    }, { status: 500 })
  }
}