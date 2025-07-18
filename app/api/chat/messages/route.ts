import { NextRequest, NextResponse } from 'next/server'

interface Message {
  id: string
  user: string
  message: string
  timestamp: Date
}

// In-memory storage for messages (in production, use a database)
let messages: Message[] = []

function getClientIP(req: NextRequest) {
  // Try to get IP from various headers (for proxy/load balancer scenarios)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const clientIP = req.headers.get('x-client-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (clientIP) {
    return clientIP
  }

  return 'Unknown'
}

// GET - Retrieve messages
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const lastMessageId = searchParams.get('lastMessageId')

    let messagesToReturn = messages

    // If lastMessageId is provided, only return newer messages
    if (lastMessageId) {
      const lastIndex = messages.findIndex(msg => msg.id === lastMessageId)
      if (lastIndex !== -1) {
        messagesToReturn = messages.slice(lastIndex + 1)
      }
    }

    return NextResponse.json({
      messages: messagesToReturn,
      userIP: getClientIP(req)
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST - Send a new message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message: messageText } = body

    if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (messageText.length > 500) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const clientIP = getClientIP(req)

    const message: Message = {
      id: `${Date.now()}-${Math.random()}`,
      user: clientIP,
      message: messageText.trim(),
      timestamp: new Date()
    }

    messages.push(message)

    // Keep only last 100 messages
    if (messages.length > 100) {
      messages = messages.slice(-100)
    }

    console.log('New message:', message)

    return NextResponse.json({
      success: true,
      message,
      userIP: clientIP
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}