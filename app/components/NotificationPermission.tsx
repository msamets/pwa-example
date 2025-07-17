'use client'

import { useState } from 'react'

interface NotificationPermissionProps {
  currentPermission: NotificationPermission
  onPermissionChange: (permission: NotificationPermission) => void
}

export default function NotificationPermission({
  currentPermission,
  onPermissionChange
}: NotificationPermissionProps) {
  const [isRequesting, setIsRequesting] = useState(false)

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications')
      return
    }

    setIsRequesting(true)

    try {
      const permission = await Notification.requestPermission()
      onPermissionChange(permission)

      if (permission === 'granted') {
        // Show a welcome notification
        new Notification('Notifications Enabled! 🎉', {
          body: 'You will now receive job alerts and updates.',
          icon: '/icon.svg',
          badge: '/icon.svg',
          tag: 'welcome'
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
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