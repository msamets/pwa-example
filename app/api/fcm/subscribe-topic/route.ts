import { NextRequest, NextResponse } from 'next/server'
import FCMAdmin from '../../../../lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, topic, action = 'subscribe' } = body

    // Validate required fields
    if (!token || typeof token !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'FCM token is required and must be a string'
      }, { status: 400 })
    }

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Topic is required and must be a string'
      }, { status: 400 })
    }

    // Validate topic format (Firebase topic restrictions)
    const topicRegex = /^[a-zA-Z0-9-_.~%]+$/
    if (!topicRegex.test(topic)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid topic format. Topic can only contain letters, numbers, dashes, underscores, dots, tildes, and percent signs'
      }, { status: 400 })
    }

    console.log(`📋 ${action === 'subscribe' ? 'Subscribing' : 'Unsubscribing'} token to topic: ${topic}`)

    let result
    if (action === 'subscribe') {
      result = await FCMAdmin.subscribeToTopic(token, topic)
    } else if (action === 'unsubscribe') {
      result = await FCMAdmin.unsubscribeFromTopic(token, topic)
    } else {
      return NextResponse.json({
        success: false,
        error: 'Action must be either "subscribe" or "unsubscribe"'
      }, { status: 400 })
    }

    if (result.success) {
      console.log(`✅ Token ${action}d to topic successfully`)
      return NextResponse.json({
        success: true,
        message: `Token ${action}d to topic "${topic}" successfully`
      })
    } else {
      console.error(`❌ Failed to ${action} token to topic:`, result.error)
      return NextResponse.json({
        success: false,
        error: result.error || `Failed to ${action} token to topic`
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Error in subscribe-topic API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET method to get available topics (for now, return predefined topics)
export async function GET(req: NextRequest) {
  try {
    // In a real application, you might fetch topics from a database
    const availableTopics = [
      {
        name: 'job-alerts',
        displayName: 'Job Alerts',
        description: 'Get notified about new job opportunities matching your profile'
      },
      {
        name: 'interview-reminders',
        displayName: 'Interview Reminders',
        description: 'Reminders for upcoming interviews'
      },
      {
        name: 'application-updates',
        displayName: 'Application Updates',
        description: 'Updates on your job applications'
      },
      {
        name: 'company-news',
        displayName: 'Company News',
        description: 'News and updates from companies you follow'
      },
      {
        name: 'industry-trends',
        displayName: 'Industry Trends',
        description: 'Latest trends and insights in your industry'
      },
      {
        name: 'general-announcements',
        displayName: 'General Announcements',
        description: 'Important announcements and platform updates'
      }
    ]

    return NextResponse.json({
      success: true,
      topics: availableTopics
    })
  } catch (error) {
    console.error('💥 Error getting topics:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}