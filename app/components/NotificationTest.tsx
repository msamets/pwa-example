'use client'

import { useState, useEffect } from 'react'
import { getIOSInfo, NotificationManager } from '../utils/notifications'

export default function NotificationTest() {
  const [lastNotification, setLastNotification] = useState<string | null>(null)
  const [iosInfo, setIOSInfo] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = getIOSInfo()
      setIOSInfo(info)
      setIsIOS(info.isIOS && info.isStandalone)

      // Gather comprehensive debug info
      gatherDebugInfo()
    }
  }, [])

  const gatherDebugInfo = async () => {
    const debugData = {
      notificationSupport: 'Notification' in window,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'undefined',
      serviceWorkerSupport: 'serviceWorker' in navigator,
      serviceWorkerReady: false,
      serviceWorkerRegistration: null as any,
      userAgent: navigator.userAgent,
      isSecure: window.location.protocol === 'https:',
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        debugData.serviceWorkerReady = true
        debugData.serviceWorkerRegistration = {
          scope: registration.scope,
          active: !!registration.active,
          installing: !!registration.installing,
          waiting: !!registration.waiting
        }
      } catch (error) {
        console.error('Service worker check failed:', error)
      }
    }

    setDebugInfo(debugData)
    console.log('🔍 Debug Info:', debugData)
  }

  const testStepByStep = async () => {
    setLastNotification('Starting step-by-step test...')

    // Step 1: Check notification support
    if (!('Notification' in window)) {
      setLastNotification('❌ Step 1 FAILED: Notifications not supported')
      return
    }
    setLastNotification('✅ Step 1 PASSED: Notifications supported')

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 2: Check permission
    const permission = Notification.permission
    setLastNotification(`✅ Step 2: Current permission: ${permission}`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 3: Request permission if needed
    if (permission === 'default') {
      setLastNotification('📋 Step 3: Requesting permission...')
      const newPermission = await Notification.requestPermission()
      setLastNotification(`✅ Step 3: Permission result: ${newPermission}`)

      if (newPermission !== 'granted') {
        setLastNotification('❌ Step 3 FAILED: Permission denied')
        return
      }
    } else if (permission === 'denied') {
      setLastNotification('❌ Step 3 FAILED: Permission already denied')
      return
    } else {
      setLastNotification('✅ Step 3: Permission already granted')
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 4: Test basic notification
    try {
      setLastNotification('📱 Step 4: Creating basic notification...')

      if (isIOS) {
        // Test service worker method for iOS
        const success = await NotificationManager.sendNotificationViaServiceWorker({
          title: 'Step-by-Step Test',
          body: 'This is a test notification created step by step',
          icon: '/icon-192x192.png',
          tag: 'step-test'
        })

        if (success) {
          setLastNotification('✅ Step 4 PASSED: iOS notification sent via service worker')
        } else {
          setLastNotification('❌ Step 4 FAILED: iOS notification failed')
        }
      } else {
        // Test regular notification for other platforms
        const notification = new Notification('Step-by-Step Test', {
          body: 'This is a test notification created step by step',
          icon: '/icon-192x192.png',
          tag: 'step-test'
        })

        notification.onclick = () => {
          console.log('Test notification clicked')
          notification.close()
        }

        setLastNotification('✅ Step 4 PASSED: Regular notification created')
      }
         } catch (error) {
       console.error('Step 4 error:', error)
       setLastNotification(`❌ Step 4 FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`)
     }
  }

  const showBasicNotification = async () => {
    try {
      console.log('🧪 Testing basic notification...')

      if (isIOS) {
        // Use the optimized iOS method
        const notification = await NotificationManager.sendIOSOptimizedNotification({
          title: 'Basic Notification',
          body: 'This is a simple notification with just text.',
          icon: '/icon-192x192.png',
          tag: 'basic-test'
        })
        setLastNotification('Basic notification sent (iOS optimized)')
        console.log('✅ iOS notification result:', notification)
      } else {
        // Regular notification for other platforms
        const notification = new Notification('Basic Notification', {
          body: 'This is a simple notification with just text.',
          icon: '/icon.svg',
          tag: 'basic-test'
        })

        setLastNotification('Basic notification sent')
        console.log('✅ Regular notification created:', notification)

        notification.onclick = () => {
          console.log('Basic notification clicked')
          window.focus()
          notification.close()
        }
      }
    } catch (error) {
      console.error('❌ Error sending basic notification:', error)
      setLastNotification(`Error sending basic notification: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const showJobAlertNotification = async () => {
    try {
      const notification = await NotificationManager.sendJobAlert(
        'Senior Frontend Developer',
        'TechCorp',
        '$120k-$150k',
        123
      )
      setLastNotification('Job alert notification sent')
    } catch (error) {
      console.error('Error sending job alert:', error)
      setLastNotification('Error sending job alert')
    }
  }

  const showInterviewNotification = async () => {
    try {
      const notification = await NotificationManager.sendInterviewReminder(
        'ABC Company',
        'in 1 hour',
        456
      )
      setLastNotification('Interview reminder sent')
    } catch (error) {
      console.error('Error sending interview reminder:', error)
      setLastNotification('Error sending interview reminder')
    }
  }

  const showApplicationUpdateNotification = async () => {
    try {
      const notification = await NotificationManager.sendApplicationUpdate(
        'XYZ Corp',
        'reviewed',
        789
      )
      setLastNotification('Application update sent')
    } catch (error) {
      console.error('Error sending application update:', error)
      setLastNotification('Error sending application update')
    }
  }

  const showSilentNotification = async () => {
    try {
      if (isIOS) {
        // iOS doesn't support silent notifications reliably
        setLastNotification('Silent notifications are not supported on iOS - showing regular notification instead')
        await showBasicNotification()
      } else {
        const notification = new Notification('Silent Update', {
          body: 'This notification is silent (no sound)',
          icon: '/icon-192x192.png',
          silent: true,
          tag: 'silent-update'
        })
        setLastNotification('Silent notification sent')
      }
    } catch (error) {
      console.error('Error sending silent notification:', error)
      setLastNotification('Error sending silent notification')
    }
  }

  const showDelayedNotification = () => {
    setLastNotification('Notification will appear in 3 seconds...')

    setTimeout(async () => {
      try {
        const notification = await NotificationManager.sendIOSOptimizedNotification({
          title: 'Delayed Notification ⏰',
          body: 'This notification was sent with a 3-second delay',
          icon: '/icon-192x192.png',
          tag: 'delayed-test'
        })
        setLastNotification('Delayed notification sent')
      } catch (error) {
        console.error('Error sending delayed notification:', error)
        setLastNotification('Error sending delayed notification')
      }
    }, 3000)
  }

  const show10SecondDelayedNotification = () => {
    setLastNotification('Notification will appear in 10 seconds... Switch to another tab to test background notifications!')

    setTimeout(async () => {
      try {
        const notification = await NotificationManager.sendIOSOptimizedNotification({
          title: '10-Second Delayed Notification ⏰',
          body: 'Perfect timing! This notification appeared after 10 seconds. Great for testing background behavior.',
          icon: '/icon-192x192.png',
          tag: 'delayed-10s-test',
          requireInteraction: true,
          data: {
            type: 'delayed-test',
            redirectUrl: '/notifications?from=notification&test=10s-delay'
          }
        })
        setLastNotification('10-second delayed notification sent')
      } catch (error) {
        console.error('Error sending 10-second delayed notification:', error)
        setLastNotification('Error sending 10-second delayed notification')
      }
    }, 10000)
  }

  const showPersistentNotification = async () => {
    try {
      const notification = await NotificationManager.sendIOSOptimizedNotification({
        title: 'Persistent Notification 📌',
        body: 'This notification requires interaction to dismiss',
        icon: '/icon-192x192.png',
        requireInteraction: true,
        tag: 'persistent-test'
      })
      setLastNotification('Persistent notification sent')
    } catch (error) {
      console.error('Error sending persistent notification:', error)
      setLastNotification('Error sending persistent notification')
    }
  }

  const showJobOfferNotification = async () => {
    try {
      const notification = await NotificationManager.sendJobOffer('TechCorp', 'Senior Developer', 999)
      setLastNotification('Job offer notification sent')
    } catch (error) {
      console.error('Error sending job offer:', error)
      setLastNotification('Error sending job offer')
    }
  }

  const showHomeRedirectNotification = async () => {
    try {
      const notification = await NotificationManager.sendWelcomeBackNotification()
      setLastNotification('Welcome notification sent')
    } catch (error) {
      console.error('Error sending welcome notification:', error)
      setLastNotification('Error sending welcome notification')
    }
  }

  const showNotificationsRedirectNotification = async () => {
    try {
      const notification = await NotificationManager.sendNotificationSettingsReminder()
      setLastNotification('Settings notification sent')
    } catch (error) {
      console.error('Error sending settings notification:', error)
      setLastNotification('Error sending settings notification')
    }
  }

  const clearNotifications = () => {
    // Close all notifications with known tags
    setLastNotification('Attempted to clear notifications')
  }

  const testNotificationFeatures = () => {
    if (!('Notification' in window)) {
      alert('Notifications not supported')
      return
    }

    const features = {
      'Basic Notifications': 'Notification' in window,
      'Actions Support': 'actions' in Notification.prototype,
      'Badge Support': 'badge' in Notification.prototype,
      'Data Support': 'data' in Notification.prototype,
      'Image Support': 'image' in Notification.prototype,
      'Renotify Support': 'renotify' in Notification.prototype,
      'RequireInteraction Support': 'requireInteraction' in Notification.prototype,
      'Silent Support': 'silent' in Notification.prototype,
      'Tag Support': 'tag' in Notification.prototype,
      'Vibrate Support': 'vibrate' in Notification.prototype,
    }

    const supportedFeatures = Object.entries(features)
      .map(([feature, supported]) => `${feature}: ${supported ? '✅' : '❌'}`)
      .join('\n')

    let message = `Notification Feature Support:\n\n${supportedFeatures}`

    if (isIOS) {
      message += '\n\n⚠️ iOS Safari Limitations:\n'
      message += 'The limited support shown above is NORMAL for iOS Safari.\n'
      message += 'Apple intentionally restricts web notification features\n'
      message += 'for security and battery life reasons.'
    }

    alert(message)
  }

  return (
    <div className="space-y-6">
      {/* Debug Panel */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-gray-800">🔧 Debug & Testing</h4>
          <div className="flex gap-2">
            <button
              onClick={testStepByStep}
              className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
            >
              🧪 Step-by-Step Test
            </button>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
            >
              {showDebug ? 'Hide' : 'Show'} Debug Info
            </button>
          </div>
        </div>

        {debugInfo && showDebug && (
          <div className="bg-gray-900 text-green-400 rounded p-3 font-mono text-xs space-y-1">
            <div>🔍 <strong>Support:</strong> {debugInfo.notificationSupport ? '✅' : '❌'} Notifications, {debugInfo.serviceWorkerSupport ? '✅' : '❌'} Service Worker</div>
            <div>🔐 <strong>Permission:</strong> {debugInfo.permission}</div>
            <div>⚙️ <strong>SW Ready:</strong> {debugInfo.serviceWorkerReady ? '✅' : '❌'}</div>
            <div>🔒 <strong>Secure:</strong> {debugInfo.isSecure ? '✅' : '❌'} | <strong>Mode:</strong> {debugInfo.displayMode}</div>
            <div>📱 <strong>UA:</strong> {debugInfo.userAgent.substring(0, 80)}...</div>
            {debugInfo.serviceWorkerRegistration && (
              <div>🔧 <strong>SW:</strong> Active: {debugInfo.serviceWorkerRegistration.active ? '✅' : '❌'}</div>
            )}
          </div>
        )}
      </div>

      {/* iOS-specific guidance */}
      {isIOS && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-800 mb-2">🍎 iOS Testing Notes</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>• All notifications are automatically optimized for iOS Safari</div>
            <div>• Limited feature support is normal and expected on iOS</div>
            <div>• Notifications will appear even with limited features detected</div>
            <div>• Test background notifications by switching to another app after triggering</div>
            <div>• <strong>Use the Step-by-Step Test button above to troubleshoot issues</strong></div>
          </div>
        </div>
      )}

      {/* Status */}
      {lastNotification && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-800 text-sm">
            ℹ️ {lastNotification}
          </p>
        </div>
      )}

      {/* Basic Tests */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">
          Basic Notifications
          {isIOS && <span className="text-sm text-blue-600 ml-2">(iOS Optimized)</span>}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={showBasicNotification}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📝 Basic Notification
          </button>
          <button
            onClick={showSilentNotification}
            className={`px-4 py-2 rounded-md ${
              isIOS
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            disabled={isIOS}
          >
            🔇 Silent Notification {isIOS && '(Not supported on iOS)'}
          </button>
        </div>
      </div>

      {/* Job-Specific Tests with Redirects */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Job Seeker Scenarios (with Page Redirects)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={showJobAlertNotification}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            💼 Job Alert → Jobs
          </button>
          <button
            onClick={showInterviewNotification}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            📅 Interview → Profile
          </button>
          <button
            onClick={showApplicationUpdateNotification}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            📋 Application → Profile
          </button>
          <button
            onClick={showJobOfferNotification}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            🎉 Job Offer → Profile
          </button>
          <button
            onClick={showHomeRedirectNotification}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            🏠 Welcome → Home
          </button>
          <button
            onClick={showNotificationsRedirectNotification}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            🔔 Settings → Notifications
          </button>
        </div>
      </div>

      {/* Advanced Tests */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Advanced Features</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={showDelayedNotification}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            ⏰ Delayed (3s)
          </button>
          <button
            onClick={show10SecondDelayedNotification}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            ⏰ Delayed (10s)
          </button>
          <button
            onClick={showPersistentNotification}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            📌 Persistent
          </button>
        </div>
      </div>

      {/* Utility Actions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Utilities</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={testNotificationFeatures}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            🔍 Check Features
          </button>
          <button
            onClick={clearNotifications}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-md p-4">
        <h5 className="font-medium text-blue-900 mb-2">💡 Testing Tips</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>🧪 Start with Step-by-Step Test:</strong> This will help identify exactly what's failing</li>
          <li>• <strong>10-second delay:</strong> Perfect for testing background notifications - click the button, then switch to another tab/app</li>
          <li>• Try notifications while the app is in the background</li>
          <li>• Test on different devices and browsers</li>
          <li>• Check notification behavior in Do Not Disturb mode</li>
          <li>• Verify notification persistence across page reloads</li>
          <li>• Test click actions and deep linking with redirect URLs</li>
          <li>• Use delayed notifications to simulate real-world timing scenarios</li>
          {isIOS && (
            <>
              <li>• <strong>iOS specific:</strong> Notifications work best when app is in background</li>
              <li>• <strong>iOS specific:</strong> Limited features are normal - basic notifications still work!</li>
            </>
          )}
        </ul>
      </div>

      {/* iOS Feature Explanation */}
      {isIOS && (
        <div className="bg-yellow-50 rounded-md p-4 border border-yellow-200">
          <h5 className="font-medium text-yellow-800 mb-2">📱 Why Limited Features on iOS?</h5>
          <div className="text-sm text-yellow-700 space-y-2">
            <p>
              Apple intentionally restricts web notification features in Safari for:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Battery life preservation</li>
              <li>User privacy and security</li>
              <li>Preventing notification spam</li>
              <li>Encouraging native app development</li>
            </ul>
            <p className="font-medium">
              This is normal behavior - your notifications will still work for basic use cases!
            </p>
          </div>
        </div>
      )}
    </div>
  )
}