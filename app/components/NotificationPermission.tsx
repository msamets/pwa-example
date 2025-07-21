'use client'

import { useState, useEffect } from 'react'
import { getIOSInfo, NotificationManager } from '../utils/notifications'
import FCMManager from '../../lib/firebase'

interface NotificationPermissionProps {
  currentPermission: NotificationPermission
  onPermissionChange: (permission: NotificationPermission) => void
}

export default function NotificationPermission({
  currentPermission,
  onPermissionChange
}: NotificationPermissionProps) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [iosInfo, setIOSInfo] = useState<any>(null)
  const [compatibilityCheck, setCompatibilityCheck] = useState<any>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [fcmStatus, setFcmStatus] = useState<{
    initialized: boolean
    token: string | null
    error: string | null
  }>({
    initialized: false,
    token: null,
    error: null
  })

  useEffect(() => {
    // Only run iOS detection on the client side
    if (typeof window !== 'undefined') {
      const info = getIOSInfo()
      setIOSInfo(info)

      console.log('🔍 NotificationPermission iOS Info:', info)

      // Initialize FCM and compatibility check
      const initializeFCM = async () => {
        try {
          // Check compatibility
          const compatibility = await NotificationManager.checkIOSCompatibility()
          setCompatibilityCheck(compatibility)
          console.log('🔍 NotificationPermission Compatibility:', compatibility)

          // Initialize FCM if compatible
          if (compatibility.canUseNotifications) {
            console.log('🚀 Initializing FCM in NotificationPermission...')
            const result = await NotificationManager.initialize()

            setFcmStatus({
              initialized: result.success,
              token: result.token || null,
              error: result.error || null
            })

            if (result.success) {
              console.log('✅ FCM initialized successfully in NotificationPermission')
            } else {
              console.warn('⚠️ FCM initialization failed:', result.error)
            }
          } else {
            console.log('⏭️ Skipping FCM initialization due to compatibility issues')
          }
        } catch (error) {
          console.error('💥 Error during FCM initialization:', error)
          setFcmStatus({
            initialized: false,
            token: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      initializeFCM()
    }
  }, [])

  const requestPermission = async () => {
    setIsRequesting(true)

    try {
      console.log('📱 Requesting FCM permission and token...')

      // Initialize FCM and get token
      const result = await NotificationManager.initialize()

      if (result.success && result.token) {
        // Update FCM status
        setFcmStatus({
          initialized: true,
          token: result.token,
          error: null
        })

        // Update permission status
        const permission = await NotificationManager.checkPermission()
        onPermissionChange(permission)

        console.log('✅ FCM token obtained and saved')

        // Show welcome notification using FCM
        if (permission === 'granted') {
          // Send via FCM server (background notification)
          await NotificationManager.sendFCMNotification({
            title: 'FCM Notifications Enabled! 🎉',
            body: 'You will now receive job alerts and updates even when the app is closed.',
            type: 'welcome',
            data: {
              type: 'welcome',
              url: '/notifications?from=fcm-welcome'
            }
          })

          // Also show immediate local notification
          await NotificationManager.sendLocalNotification({
            title: 'Welcome to Job Seeker! 🎯',
            body: 'Push notifications are now active. You\'ll get alerts for new jobs, interviews, and more!',
            type: 'welcome',
            data: { type: 'welcome' },
            actions: [
              { action: 'explore', title: '🔍 Explore Jobs' },
              { action: 'settings', title: '⚙️ Settings' }
            ]
          })
        }
      } else {
        console.error('❌ Failed to get FCM token:', result.error)

        setFcmStatus({
          initialized: false,
          token: null,
          error: result.error || 'Failed to initialize FCM'
        })

        // Fallback to standard permission request
        const fallbackResult = await NotificationManager.ensurePermissionWithIOSSupport()

        if (fallbackResult.success && fallbackResult.permission) {
          onPermissionChange(fallbackResult.permission)

          if (fallbackResult.needsInstall) {
            alert('Please install this app to your home screen first to enable notifications.')
          }
        } else {
          alert(`Cannot enable notifications: ${fallbackResult.error}`)
        }
      }
    } catch (error: unknown) {
      console.error('💥 Error requesting FCM permission:', error)

      setFcmStatus({
        initialized: false,
        token: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      alert('Error enabling notifications. Please check your browser settings and try again.')
    } finally {
      setIsRequesting(false)
    }
  }

  const getPermissionMessage = () => {
    switch (currentPermission) {
      case 'granted':
        return {
          title: 'Notifications Enabled',
          message: 'You will receive job alerts and important updates.',
          action: null
        }
      case 'denied':
        return {
          title: 'Notifications Blocked',
          message: 'Please enable notifications in your browser settings to receive job alerts.',
          action: 'Learn How'
        }
      case 'default':
        return {
          title: 'Enable Notifications',
          message: 'Get notified about new job opportunities and application updates.',
          action: 'Enable Notifications'
        }
    }
  }

  const showInstructions = () => {
    const instructions = `To enable notifications:

1. Click the lock icon (🔒) in your address bar
2. Set "Notifications" to "Allow"
3. Refresh the page

Or:
1. Go to browser Settings
2. Find Site Settings or Permissions
3. Allow notifications for this site`

    alert(instructions)
  }

  // Don't render anything until iOS info is loaded
  if (!iosInfo) {
    return <div className="text-gray-500">Loading...</div>
  }

  const { title, message, action } = getPermissionMessage()

  // Show iOS-specific guidance ONLY if we're actually on an iOS device
  const isActuallyIOS = iosInfo.isIOS === true
  const needsInstallation = isActuallyIOS && !iosInfo.isStandalone

  console.log('🔍 iOS Check:', {
    isActuallyIOS,
    needsInstallation,
    iosInfo,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent.substring(0, 50) : 'N/A'
  })

  if (needsInstallation) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-blue-900">📱 iPhone Setup Required</h4>
          {debugMode && (
            <button
              onClick={() => setDebugMode(false)}
              className="text-xs text-blue-600 underline"
            >
              Hide Debug
            </button>
          )}
          {!debugMode && (
            <button
              onClick={() => setDebugMode(true)}
              className="text-xs text-blue-600 underline"
            >
              Debug
            </button>
          )}
        </div>

        {debugMode && (
          <div className="mb-4 p-2 bg-gray-900 text-green-400 rounded text-xs font-mono">
            <div>isIOS: {String(iosInfo.isIOS)}</div>
            <div>isStandalone: {String(iosInfo.isStandalone)}</div>
            <div>version: {iosInfo.version || 'unknown'}</div>
            <div>UA: {typeof window !== 'undefined' ? navigator.userAgent.substring(0, 100) : 'N/A'}</div>
          </div>
        )}

        <p className="text-blue-800 mb-4">
          To receive notifications on iPhone, you need to install this app to your home screen first.
        </p>

        <div className="bg-white rounded-md p-3 mb-4">
          <h5 className="font-medium text-blue-900 mb-2">Installation Steps:</h5>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Tap the Share button (📤) at the bottom of Safari</li>
            <li>Scroll down and select "Add to Home Screen"</li>
            <li>Tap "Add" to confirm</li>
            <li>Open the app from your home screen</li>
            <li>Return to this page to enable notifications</li>
          </ol>
        </div>

        <div className="bg-yellow-50 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This is an iOS requirement. Once installed, notifications will work just like any other app!
          </p>
        </div>
      </div>
    )
  }

  // Show compatibility warning if iOS version too old
  if (isActuallyIOS && !compatibilityCheck?.canUseNotifications && compatibilityCheck?.reason?.includes('16.4')) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-orange-50 border-orange-200">
        <h4 className="font-medium text-orange-900 mb-2">⚠️ iOS Update Required</h4>
        <p className="text-orange-800 mb-2">
          Web notifications require iOS 16.4 or later.
        </p>
        <p className="text-sm text-orange-700">
          Please update your iPhone in Settings → General → Software Update
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 border rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 mb-4">{message}</p>

      {action && (
        <div className="flex gap-2">
          {currentPermission === 'default' && (
            <button
              onClick={requestPermission}
              disabled={isRequesting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? 'Requesting...' : action}
            </button>
          )}

          {currentPermission === 'denied' && (
            <button
              onClick={showInstructions}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              {action}
            </button>
          )}
        </div>
      )}

      {/* FCM Status (Debug Info) */}
      {debugMode && (
        <div className="mt-4 p-3 bg-gray-900 text-green-400 rounded text-xs font-mono">
          <div>FCM Initialized: {String(fcmStatus.initialized)}</div>
          <div>FCM Token: {fcmStatus.token ? fcmStatus.token.substring(0, 20) + '...' : 'None'}</div>
          <div>FCM Error: {fcmStatus.error || 'None'}</div>
          <div>Permission: {currentPermission}</div>
        </div>
      )}

      {/* FCM Status Indicator */}
      {currentPermission === 'granted' && (
        <div className={`mt-4 p-3 rounded-md ${
          fcmStatus.initialized
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            <span className="text-lg mr-2">
              {fcmStatus.initialized ? '✅' : '⚠️'}
            </span>
            <div>
              <h5 className={`font-medium ${
                fcmStatus.initialized ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {fcmStatus.initialized ? 'FCM Active' : 'FCM Setup Needed'}
              </h5>
              <p className={`text-sm ${
                fcmStatus.initialized ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {fcmStatus.initialized
                  ? 'You\'ll receive notifications even when the app is closed'
                  : fcmStatus.error || 'Cloud messaging setup incomplete'
                }
              </p>
            </div>
          </div>

          {!fcmStatus.initialized && (
            <button
              onClick={requestPermission}
              disabled={isRequesting}
              className="mt-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {isRequesting ? 'Setting up...' : 'Setup FCM'}
            </button>
          )}
        </div>
      )}

      {/* Benefits */}
      <div className="mt-4 bg-gray-50 rounded-md p-3">
        <h5 className="font-medium text-gray-900 mb-2">
          {fcmStatus.initialized ? 'FCM Notifications Active 🚀' : 'Why enable notifications?'}
        </h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Get instant alerts for new job matches</li>
          <li>• Receive application status updates</li>
          <li>• Stay informed about interview invitations</li>
          <li>• Never miss important deadlines</li>
          {fcmStatus.initialized && (
            <li className="text-green-600 font-medium">• ✨ Works even when app is closed!</li>
          )}
        </ul>
      </div>
    </div>
  )
}