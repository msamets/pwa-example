const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory storage for messages (in production, use a database)
let messages = []

function getClientIP(req) {
  // Try to get IP from various headers (for proxy/load balancer scenarios)
  const forwarded = req.headers['x-forwarded-for']
  const realIP = req.headers['x-real-ip']
  const clientIP = req.headers['x-client-ip']

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (clientIP) {
    return clientIP
  }

  // Fallback to connection IP
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'Unknown'
}

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // Get client IP address
    const clientIP = getClientIP(socket.request)
    console.log('Client IP:', clientIP)

    // Send user IP and previous messages
    socket.emit('user-joined', { userIP: clientIP })
    socket.emit('previous-messages', messages)

    // Handle new messages
    socket.on('send-message', (messageText) => {
      const message = {
        id: `${Date.now()}-${Math.random()}`,
        user: clientIP,
        message: messageText,
        timestamp: new Date()
      }

      messages.push(message)

      // Keep only last 100 messages
      if (messages.length > 100) {
        messages = messages.slice(-100)
      }

      console.log('New message:', message)

      // Broadcast to all connected clients
      io.emit('message', message)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})