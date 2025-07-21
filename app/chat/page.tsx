'use client'

import { useState, useEffect, useRef } from 'react'
import { NotificationManager } from '../utils/notifications'
import NotificationPermission from '../components/NotificationPermission'
import BackgroundSyncDebug from '../components/BackgroundSyncDebug'

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
  const [isPageVisible, setIsPageVisible] = useState(true)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [isBackgroundSyncActive, setIsBackgroundSyncActive] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageIdRef = useRef<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }
  }, [])

  // Setup service worker message listener
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleServiceWorkerMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'new-messages') {
          console.log('📨 Received new messages from service worker:', event.data.messages)

          setMessages(prev => {
            const newMessages = event.data.messages

            // Update last message ID
            if (newMessages.length > 0) {
              const lastMsg = newMessages[newMessages.length - 1]
              lastMessageIdRef.current = lastMsg.id
            }

            return [...prev, ...newMessages]
          })
        }
      }

      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage)
      }
    }
  }, [])

  // Service worker communication functions
  const startBackgroundSync = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({
          type: 'start-background-sync',
          lastMessageId: lastMessageIdRef.current,
          userIP: userIP
        })
        setIsBackgroundSyncActive(true)
        console.log('🔄 Started background sync via service worker')
      }
    }
  }

  const stopBackgroundSync = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({
          type: 'stop-background-sync'
        })
        setIsBackgroundSyncActive(false)
        console.log('⏹️ Stopped background sync via service worker')
      }
    }
  }

  const updateSyncState = async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({
          type: 'update-sync-state',
          lastMessageId: lastMessageIdRef.current,
          userIP: userIP
        })
      }
    }
  }

  // Page visibility detection with service worker integration
  useEffect(() => {
    const handleVisibilityChange = async () => {
      const isVisible = !document.hidden
      setIsPageVisible(isVisible)
      console.log('📄 Page visibility changed:', isVisible, 'at', new Date().toISOString())

      if (isVisible) {
        // Page became visible - stop background sync and start regular polling
        await stopBackgroundSync()
        console.log('👀 Page visible: starting regular polling')
      } else {
        // Page went to background - start background sync if notifications are enabled
        if (notificationPermission === 'granted') {
          await startBackgroundSync()
          console.log('🌙 Page hidden: started background sync')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also listen for focus/blur events for additional accuracy
    const handleFocus = async () => {
      setIsPageVisible(true)
      await stopBackgroundSync()
    }

    const handleBlur = async () => {
      setIsPageVisible(false)
      if (notificationPermission === 'granted') {
        await startBackgroundSync()
      }
    }

    // Additional beforeunload event for when user navigates away
    const handleBeforeUnload = async () => {
      console.log('🚪 Page unloading, ensuring background sync is active')
      if (notificationPermission === 'granted') {
        await startBackgroundSync()
      }
    }

    // Pagehide event for better mobile support
    const handlePageHide = async () => {
      console.log('👻 Page hidden via pagehide event')
      if (notificationPermission === 'granted') {
        await startBackgroundSync()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [notificationPermission, userIP])

  // Handle notification permission changes
  useEffect(() => {
    const updateBackgroundSync = async () => {
      if (!isPageVisible) {
        if (notificationPermission === 'granted') {
          await startBackgroundSync()
        } else {
          await stopBackgroundSync()
        }
      }
    }

    updateBackgroundSync()
  }, [notificationPermission, isPageVisible])

  // Auto-start background sync when user IP is available and page is hidden
  useEffect(() => {
    if (userIP && !isPageVisible && notificationPermission === 'granted' && !isBackgroundSyncActive) {
      console.log('🔄 Auto-starting background sync for user:', userIP)
      startBackgroundSync()
    }
  }, [userIP, isPageVisible, notificationPermission, isBackgroundSyncActive])

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
        const newMessages = data.messages

        if (lastMessageId) {
          // Append new messages and check for notifications only if page is visible
          setMessages(prev => {
            const updatedMessages = [...prev, ...newMessages]

            // Only send notifications from main app if page is visible (otherwise service worker handles it)
            if (isPageVisible && notificationPermission === 'granted') {
              newMessages.forEach((message: Message) => {
                // Don't notify for own messages
                if (message.user !== userIP) {
                  console.log('📨 Sending notification for new message from:', message.user)
                  NotificationManager.sendChatMessage(
                    message.user === userIP ? 'You' : message.user,
                    message.message,
                    message.id
                  ).catch(error => {
                    console.error('Failed to send notification:', error)
                  })
                }
              })
            }

            return updatedMessages
          })
        } else {
          // Set initial messages
          setMessages(data.messages)
        }

        // Update the last message ID
        const lastMsg = data.messages[data.messages.length - 1]
        lastMessageIdRef.current = lastMsg.id

        // Update service worker state
        await updateSyncState()
      }

      if (!isConnected) {
        setIsConnected(true)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setIsConnected(false)
    }
  }

  // Start polling for messages - only when page is visible
  useEffect(() => {
    // Initial fetch
    fetchMessages()

    // Set up polling only when page is visible
    if (isPageVisible) {
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(lastMessageIdRef.current || undefined)
      }, 3000) // Poll every 3 seconds when visible (reduced frequency since service worker handles background)
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [isPageVisible, userIP]) // Re-run when visibility changes

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

        // Update service worker state with new message
        await updateSyncState()
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

  const testNotification = async () => {
    try {
      await NotificationManager.sendChatMessage('Test User', 'This is a test notification to check if chat notifications are working properly!')
    } catch (error) {
      console.error('Failed to send test notification:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold">Global Chat Room</h1>
              <p className="text-sm opacity-90">
                {isConnected ? (
                  <>Connected as: {userIP || 'Loading...'}</>
                ) : (
                  'Connecting...'
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Page visibility indicator */}
              <div className={`w-2 h-2 rounded-full ${isPageVisible ? 'bg-green-400' : 'bg-yellow-400'}`}
                   title={isPageVisible ? 'Page is active' : 'Page is in background'}></div>

              {/* Background sync indicator */}
              <div className={`w-2 h-2 rounded-full ${isBackgroundSyncActive ? 'bg-blue-400' : 'bg-gray-400'}`}
                   title={isBackgroundSyncActive ? 'Background sync active' : 'Background sync inactive'}></div>

              {/* Notification status indicator */}
              <div
                className={`w-2 h-2 rounded-full ${
                  notificationPermission === 'granted' ? 'bg-green-400' :
                  notificationPermission === 'denied' ? 'bg-red-400' : 'bg-gray-400'
                }`}
                title={`Notifications: ${notificationPermission}`}
              ></div>

              {/* Settings button */}
              <button
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="text-blue-100 hover:text-white text-sm underline"
              >
                {showNotificationSettings ? 'Hide' : 'Notifications'}
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings Panel */}
        {showNotificationSettings && (
          <div className="border-b bg-gray-50 p-4">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Background Notifications</h3>
              <p className="text-sm text-gray-600 mb-3">
                Get notified when new messages arrive while you're not actively viewing this page.
                Background sync runs via service worker for reliable notifications.
              </p>

              <div className="flex items-center justify-between text-sm mb-2">
                <span>Page Status: {isPageVisible ?
                  <span className="text-green-600">Active (regular polling)</span> :
                  <span className="text-blue-600">Background (service worker sync)</span>
                }</span>

                <button
                  onClick={testNotification}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-xs"
                >
                  Test Notification
                </button>
              </div>

              <div className="text-xs text-gray-500">
                Background Sync: {isBackgroundSyncActive ?
                  <span className="text-blue-600">🔄 Active</span> :
                  <span className="text-gray-600">⏸️ Inactive</span>
                }
              </div>
            </div>

            <NotificationPermission
              currentPermission={notificationPermission}
              onPermissionChange={setNotificationPermission}
            />
          </div>
        )}

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
              {notificationPermission === 'granted' && (
                <span className="text-blue-600 ml-2">
                  🔔 {isPageVisible ? 'Ready' : (isBackgroundSyncActive ? 'Background sync' : 'Disabled')}
                </span>
              )}
            </span>
            <span>{newMessage.length}/500</span>
          </div>
        </form>
      </div>

      {/* Debug Component */}
      {/* <BackgroundSyncDebug
        isBackgroundSyncActive={isBackgroundSyncActive}
        isPageVisible={isPageVisible}
        notificationPermission={notificationPermission}
        lastMessageId={lastMessageIdRef.current}
        userIP={userIP}
      /> */}
    </div>
  )
}