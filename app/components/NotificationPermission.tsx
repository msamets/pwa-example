'use client'

import { useState, useEffect } from 'react'
import { getIOSInfo, NotificationManager } from '../utils/notifications'

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

  useEffect(() => {
    const info = getIOSInfo()
    setIOSInfo(info)

    NotificationManager.checkIOSCompatibility().then(setCompatibilityCheck)
  }, [])

  const requestPermission = async () => {
    setIsRequesting(true)

    try {
      const result = await NotificationManager.ensurePermissionWithIOSSupport()

      if (result.success && result.permission) {
        onPermissionChange(result.permission)

        if (result.permission === 'granted') {
          // Show welcome notification
          await NotificationManager.sendIOSOptimizedNotification({
            title: 'Notifications Enabled! 🎉',
            body: 'You will now receive job alerts and updates.',
            data: { type: 'welcome' }
          })
        }
      } else {
        if (result.needsInstall) {
          alert('Please install this app to your home screen first to enable notifications.')
        } else {
          alert(`Cannot enable notifications: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      alert('Error requesting notification permission. Please try again.')
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

  const { title, message, action } = getPermissionMessage()

  // Show iOS-specific guidance if needed
  if (iosInfo?.isIOS && !iosInfo?.isStandalone) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">📱 iPhone Setup Required</h4>
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
  if (iosInfo?.isIOS && !compatibilityCheck?.canUseNotifications && compatibilityCheck?.reason?.includes('16.4')) {
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

      {/* Benefits */}
      <div className="mt-4 bg-gray-50 rounded-md p-3">
        <h5 className="font-medium text-gray-900 mb-2">Why enable notifications?</h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Get instant alerts for new job matches</li>
          <li>• Receive application status updates</li>
          <li>• Stay informed about interview invitations</li>
          <li>• Never miss important deadlines</li>
        </ul>
      </div>
    </div>
  )
}