'use client'

import { useState, useEffect } from 'react'
import NotificationPermission from '../components/NotificationPermission'
import NotificationTest from '../components/NotificationTest'
import IOSDebugInfo from '../components/IOSDebugInfo'
import ConsoleLogger from '../components/ConsoleLogger'
import { getIOSInfo } from '../utils/notifications'

export default function NotificationsPage() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [showIOSDebug, setShowIOSDebug] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window)

    if ('Notification' in window) {
      setPermission(Notification.permission)
    }

    // Show iOS debug by default on iOS devices
    const iosInfo = getIOSInfo()
    setShowIOSDebug(iosInfo.isIOS)

    // Add initial debug message to console
    console.log('🚀 Notifications page loaded')
    console.log('📱 User Agent:', navigator.userAgent)
    console.log('🔔 Notification support:', 'Notification' in window)
    console.log('🍎 iOS Info:', iosInfo)
    console.log('⚙️ Service Worker support:', 'serviceWorker' in navigator)
    console.log('🔐 Current permission:', 'Notification' in window ? Notification.permission : 'N/A')
  }, [])

  const handlePermissionChange = (newPermission: NotificationPermission) => {
    setPermission(newPermission)
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📱 Notification Testing
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Test and manage push notifications for your PWA
        </p>
      </div>

      {/* iOS Debug Section */}
      {showIOSDebug && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">🍎 iOS Troubleshooting</h2>
            <button
              onClick={() => setShowIOSDebug(!showIOSDebug)}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
            >
              Hide Debug
            </button>
          </div>
          <IOSDebugInfo />
        </div>
      )}

      {/* Show debug toggle for non-iOS devices */}
      {!showIOSDebug && (
        <div className="text-center">
          <button
            onClick={() => setShowIOSDebug(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            🔍 Show Debug Info
          </button>
        </div>
      )}

      {/* Console Logger for Mobile Debugging */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">📱 Mobile Debug Console</h2>
        <ConsoleLogger />
      </div>

      {/* Support Check */}
      <div className={`rounded-lg p-6 ${isSupported ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-3 ${isSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h3 className="text-lg font-semibold text-gray-900">
            Browser Support: {isSupported ? 'Supported ✅' : 'Not Supported ❌'}
          </h3>
        </div>
        <p className="text-gray-600 mt-2">
          {isSupported
            ? 'Your browser supports web notifications!'
            : 'Your browser does not support web notifications.'}
        </p>
      </div>

      {/* Permission Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Permission Status</h2>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          permission === 'granted' ? 'bg-green-100 text-green-800' :
          permission === 'denied' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {permission === 'granted' && '✅ Granted'}
          {permission === 'denied' && '❌ Denied'}
          {permission === 'default' && '⏳ Not Requested'}
        </div>

        {isSupported && (
          <NotificationPermission
            currentPermission={permission}
            onPermissionChange={handlePermissionChange}
          />
        )}
      </div>

      {/* Notification Tests */}
      {isSupported && permission === 'granted' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Test Notifications</h2>
          <NotificationTest />
        </div>
      )}

      {/* Usage Guide */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 How to Use</h3>
        <div className="space-y-2 text-gray-700">
          <p><strong>Step 1:</strong> Check browser support (should show green above)</p>
          <p><strong>Step 2:</strong> Request notification permission</p>
          <p><strong>Step 3:</strong> Test different notification types</p>
          <p><strong>Step 4:</strong> Test notifications while app is in background</p>
        </div>
      </div>

      {/* Technical Info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Technical Details</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900">Supported Features:</h4>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Basic notifications</li>
              <li>Custom icons and images</li>
              <li>Action buttons</li>
              <li>Silent notifications</li>
              <li>Background notifications</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Best Practices:</h4>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
              <li>Request permission contextually</li>
              <li>Provide clear opt-out options</li>
              <li>Use meaningful notification content</li>
              <li>Respect user preferences</li>
              <li>Test on mobile devices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}