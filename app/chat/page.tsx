'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  user: string
  message: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [userIP, setUserIP] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch messages from the API
  const fetchMessages = async (lastMessageId?: string) => {
    try {
      const url = lastMessageId
        ? `/api/chat/messages?lastMessageId=${lastMessageId}`
        : '/api/chat/messages'

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()

      if (data.userIP && !userIP) {
        setUserIP(data.userIP)
      }

      if (data.messages && data.messages.length > 0) {
        if (lastMessageId) {
          // Append new messages
          setMessages(prev => [...prev, ...data.messages])
        } else {
          // Set initial messages
          setMessages(data.messages)
        }

        // Update the last message ID
        const lastMsg = data.messages[data.messages.length - 1]
        lastMessageIdRef.current = lastMsg.id
      }

      if (!isConnected) {
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setIsConnected(false)
    }
  }

  // Start polling for messages
  useEffect(() => {
    // Initial fetch
    fetchMessages()

    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages(lastMessageIdRef.current || undefined)
    }, 2000) // Poll every 2 seconds

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      if (data.userIP && !userIP) {
        setUserIP(data.userIP)
      }

      // Add the sent message to the list immediately
      if (data.message) {
        setMessages(prev => [...prev, data.message])
        lastMessageIdRef.current = data.message.id
      }

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isMyMessage = (messageUser: string) => {
    return messageUser === userIP
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <h1 className="text-xl font-semibold">Global Chat Room</h1>
          <p className="text-sm opacity-90">
            {isConnected ? (
              <>Connected as: {userIP || 'Loading...'}</>
            ) : (
              'Connecting...'
            )}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${isMyMessage(message.user) ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isMyMessage(message.user)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${
                      isMyMessage(message.user) ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {isMyMessage(message.user) ? 'You' : message.user}
                    </span>
                    <span className={`text-xs ${
                      isMyMessage(message.user) ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="break-words">{message.message}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50">
          <div className="flex space-x-2">
                        <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
              }}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white chat-input"
              disabled={isLoading || !isConnected}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading || !isConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>
              {isConnected ? (
                <span className="text-green-600">● Connected</span>
              ) : (
                <span className="text-red-600">● Disconnected</span>
              )}
            </span>
            <span>{newMessage.length}/500</span>
          </div>
        </form>
      </div>
    </div>
  )
}