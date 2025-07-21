'use client'

import { useState, useEffect } from 'react'
import { NotificationManager } from '../utils/notifications'

export default function FCMTestPanel() {
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [tokenStats, setTokenStats] = useState<any>(null)
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Test categories
  const [activeTest, setActiveTest] = useState<string>('token')

  useEffect(() => {
    loadFCMToken()
    loadTokenStats()
  }, [])

  const addTestResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setTestResults(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const clearResults = () => {
    setTestResults([])
  }

  const loadFCMToken = async () => {
    try {
      const token = await NotificationManager.getFCMToken()
      setFcmToken(token)
      if (token) {
        addTestResult(`✅ FCM Token loaded: ${token.substring(0, 20)}...`)
      } else {
        addTestResult('❌ No FCM token available')
      }
    } catch (error) {
      addTestResult(`💥 Error loading FCM token: ${error}`)
    }
  }

  const loadTokenStats = async () => {
    try {
      const response = await fetch('/api/fcm/save-token', { method: 'GET' })
      const data = await response.json()
      if (data.success) {
        setTokenStats(data.stats)
        addTestResult(`📊 Token stats loaded: ${data.stats.active} active tokens`)
      }
    } catch (error) {
      addTestResult(`💥 Error loading token stats: ${error}`)
    }
  }

  const initializeFCM = async () => {
    setIsLoading(true)
    try {
      addTestResult('🚀 Initializing FCM...')
      const result = await NotificationManager.initialize()

      if (result.success) {
        setFcmToken(result.token || null)
        addTestResult(`✅ FCM initialized successfully`)
        addTestResult(`🔑 Token: ${result.token?.substring(0, 20)}...`)
        await loadTokenStats()
      } else {
        addTestResult(`❌ FCM initialization failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult(`💥 FCM initialization error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testLocalNotification = async () => {
    setIsLoading(true)
    try {
      addTestResult('📱 Testing local notification...')
      const success = await NotificationManager.sendLocalNotification({
        title: 'FCM Test - Local Notification',
        body: 'This is a local notification test from the FCM test panel',
        type: 'test',
        tag: 'fcm-test-local',
        data: {
          test: 'local',
          url: '/notifications?test=local'
        },
        actions: [
          { action: 'test-action', title: '🧪 Test Action' }
        ]
      })

      if (success) {
        addTestResult('✅ Local notification sent successfully')
      } else {
        addTestResult('❌ Local notification failed')
      }
    } catch (error) {
      addTestResult(`💥 Local notification error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFCMNotification = async () => {
    if (!fcmToken) {
      addTestResult('❌ No FCM token available for testing')
      return
    }

    setIsLoading(true)
    try {
      addTestResult('🌐 Testing FCM server notification...')
      const success = await NotificationManager.sendFCMNotification({
        title: 'FCM Test - Server Push',
        body: 'This notification was sent via FCM server and should work even when the app is closed!',
        type: 'test',
        tag: 'fcm-test-server',
        data: {
          test: 'fcm-server',
          url: '/notifications?test=fcm-server'
        },
        actions: [
          { action: 'view-test', title: '👀 View Test' },
          { action: 'retry-test', title: '🔄 Retry Test' }
        ]
      })

      if (success) {
        addTestResult('✅ FCM server notification sent successfully')
        addTestResult('💡 Check if you received the notification even if the app is in background')
      } else {
        addTestResult('❌ FCM server notification failed')
      }
    } catch (error) {
      addTestResult(`💥 FCM server notification error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testJobAlertNotification = async () => {
    setIsLoading(true)
    try {
      addTestResult('💼 Testing job alert notification...')
      const success = await NotificationManager.sendFCMNotification({
        title: 'New Job Match! 💼',
        body: 'Senior React Developer at TechCorp - $120k-140k (FCM Test)',
        type: 'job-alert',
        tag: 'fcm-test-job',
        data: {
          type: 'job-alert',
          jobId: 'test-123',
          company: 'TechCorp',
          salary: '$120k-140k',
          url: '/jobs/test-123'
        },
        actions: [
          { action: 'view-job', title: '👀 View Job' },
          { action: 'save-job', title: '💾 Save for Later' }
        ]
      })

      if (success) {
        addTestResult('✅ Job alert FCM notification sent')
      } else {
        addTestResult('❌ Job alert FCM notification failed')
      }
    } catch (error) {
      addTestResult(`💥 Job alert notification error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testTopicSubscription = async () => {
    if (!fcmToken) {
      addTestResult('❌ No FCM token available for topic testing')
      return
    }

    setIsLoading(true)
    try {
      addTestResult('📋 Testing topic subscription...')

      // Subscribe to test topic
      const response = await fetch('/api/fcm/subscribe-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: fcmToken,
          topic: 'fcm-test-topic',
          action: 'subscribe'
        })
      })

      const result = await response.json()

      if (result.success) {
        addTestResult('✅ Successfully subscribed to test topic')

        // Send topic notification
        addTestResult('📤 Sending notification to test topic...')

        const topicNotificationResponse = await fetch('/api/fcm/send-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            notification: {
              title: 'FCM Topic Test 📋',
              body: 'This notification was sent to the fcm-test-topic!'
            },
            data: {
              type: 'topic-test',
              topic: 'fcm-test-topic'
            },
            topic: 'fcm-test-topic'
          })
        })

        const topicResult = await topicNotificationResponse.json()

        if (topicResult.success) {
          addTestResult('✅ Topic notification sent successfully')
        } else {
          addTestResult(`❌ Topic notification failed: ${topicResult.error}`)
        }
      } else {
        addTestResult(`❌ Topic subscription failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult(`💥 Topic test error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testDeeplinkNotification = async () => {
    if (!fcmToken) {
      addTestResult('❌ No FCM token available for deeplink testing')
      return
    }

    setIsLoading(true)
    try {
      addTestResult('🔗 Testing deeplink notification...')
      addTestResult(`🔧 Using FCM token: ${fcmToken.substring(0, 20)}...`)

      const success = await NotificationManager.sendFCMNotification({
        title: 'Profile Update Required 👤',
        body: 'Tap to complete your profile and increase your job match rate!',
        type: 'deeplink-test',
        tag: 'fcm-test-deeplink',
        data: {
          type: 'deeplink-test',
          redirectUrl: '/profile',
          url: '/profile', // Add both for compatibility
          action: 'navigate'
        },
        actions: [
          { action: 'go-to-profile', title: '👤 Go to Profile' },
          { action: 'dismiss', title: '❌ Dismiss' }
        ]
      })

      if (success) {
        addTestResult('✅ Deeplink notification sent successfully')
        addTestResult('💡 Click the notification or action button to test deeplink navigation to /profile')
        addTestResult('🔍 Check browser console for service worker debug logs')
      } else {
        addTestResult('❌ Deeplink notification failed')
      }
    } catch (error) {
      addTestResult(`💥 Deeplink notification error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const runFullTest = async () => {
    clearResults()
    addTestResult('🚀 Running comprehensive FCM test...')

    await initializeFCM()
    await new Promise(resolve => setTimeout(resolve, 1000))

    await testLocalNotification()
    await new Promise(resolve => setTimeout(resolve, 2000))

    await testFCMNotification()
    await new Promise(resolve => setTimeout(resolve, 2000))

    await testJobAlertNotification()
    await new Promise(resolve => setTimeout(resolve, 2000))

    await testTopicSubscription()
    await new Promise(resolve => setTimeout(resolve, 2000))
    await testDeeplinkNotification()

    addTestResult('🏁 Comprehensive test completed!')
  }

  const testCategories = [
    { id: 'token', name: 'Token Management', icon: '🔑' },
    { id: 'local', name: 'Local Notifications', icon: '📱' },
    { id: 'fcm', name: 'FCM Push', icon: '🌐' },
    { id: 'jobs', name: 'Job Notifications', icon: '💼' },
    { id: 'topics', name: 'Topic Management', icon: '📋' },
    { id: 'deeplinks', name: 'Deeplink Tests', icon: '🔗' },
    { id: 'full', name: 'Full Test Suite', icon: '🧪' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">FCM Test Panel 🧪</h2>
        <p className="text-gray-600">
          Comprehensive testing for Firebase Cloud Messaging integration
        </p>
      </div>

      {/* FCM Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">FCM Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Token Status:</span>
            <span className={`ml-2 ${fcmToken ? 'text-green-600' : 'text-red-600'}`}>
              {fcmToken ? '✅ Available' : '❌ Not Available'}
            </span>
          </div>
          <div>
            <span className="font-medium">Token Preview:</span>
            <span className="ml-2 font-mono text-xs">
              {fcmToken ? fcmToken.substring(0, 15) + '...' : 'None'}
            </span>
          </div>
          <div>
            <span className="font-medium">Active Tokens:</span>
            <span className="ml-2 text-blue-600">
              {tokenStats?.active || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Test Categories */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Test Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {testCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveTest(category.id)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                activeTest === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-lg mb-1">{category.icon}</div>
              <div>{category.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Test Actions */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
        <div className="flex flex-wrap gap-2">
          {activeTest === 'token' && (
            <>
              <button
                onClick={initializeFCM}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Initializing...' : '🚀 Initialize FCM'}
              </button>
              <button
                onClick={loadTokenStats}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                📊 Load Stats
              </button>
            </>
          )}

          {activeTest === 'local' && (
            <button
              onClick={testLocalNotification}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : '📱 Test Local Notification'}
            </button>
          )}

          {activeTest === 'fcm' && (
            <button
              onClick={testFCMNotification}
              disabled={isLoading || !fcmToken}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : '🌐 Test FCM Push'}
            </button>
          )}

          {activeTest === 'jobs' && (
            <button
              onClick={testJobAlertNotification}
              disabled={isLoading || !fcmToken}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : '💼 Test Job Alert'}
            </button>
          )}

          {activeTest === 'topics' && (
            <button
              onClick={testTopicSubscription}
              disabled={isLoading || !fcmToken}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : '📋 Test Topics'}
            </button>
          )}

          {activeTest === 'deeplinks' && (
            <button
              onClick={testDeeplinkNotification}
              disabled={isLoading || !fcmToken}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : '🔗 Test Deeplinks'}
            </button>
          )}

          {activeTest === 'full' && (
            <button
              onClick={runFullTest}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? 'Running Tests...' : '🧪 Run Full Test Suite'}
            </button>
          )}

          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
          >
            🗑️ Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          Test Results ({testResults.length})
        </h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
          {testResults.length === 0 ? (
            <div className="text-gray-500">No test results yet. Run a test to see output here.</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Testing Instructions</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Start with "Initialize FCM" to set up your token</li>
          <li>• Test local notifications first to verify basic functionality</li>
          <li>• Test FCM push notifications to verify server integration</li>
          <li>• For background testing, minimize or close the app before testing FCM push</li>
          <li>• Check browser DevTools console for detailed logs</li>
          <li>• Ensure you have notification permissions granted</li>
        </ul>
      </div>
    </div>
  )
}