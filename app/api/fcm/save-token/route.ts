import { NextRequest, NextResponse } from 'next/server'
import FCMAdmin from '../../../../lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, userId, userAgent } = body

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

    console.log(`💾 Saving FCM token for user: ${userId}`)
    console.log(`🔑 Token preview: ${token.substring(0, 20)}...`)

    // Save the token
    const saved = FCMAdmin.saveToken(token, userId, userAgent)

    if (saved) {
      console.log('✅ FCM token saved successfully')

      // Get token statistics
      const stats = FCMAdmin.getTokenStats()

      return NextResponse.json({
        success: true,
        message: 'FCM token saved successfully',
        stats: {
          totalTokens: stats.total,
          activeTokens: stats.active
        }
      })
    } else {
      console.error('❌ Failed to save FCM token')
      return NextResponse.json({
        success: false,
        error: 'Failed to save FCM token'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Error in save-token API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET method to retrieve token statistics
export async function GET(req: NextRequest) {
  try {
    const stats = FCMAdmin.getTokenStats()

    return NextResponse.json({
      success: true,
      stats: {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        userCount: Object.keys(stats.byUser).length
      }
    })
  } catch (error) {
    console.error('💥 Error getting token stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}