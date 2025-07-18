'use client'

import { useState, useEffect } from 'react'
import { getIOSInfo, getNotificationFeatures } from '../utils/notifications'

export default function IOSDebugInfo() {
  const [iosInfo, setIOSInfo] = useState<any>(null)
  const [notificationFeatures, setNotificationFeatures] = useState<any>(null)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const info = getIOSInfo()
      const features = getNotificationFeatures()
      setIOSInfo(info)
      setNotificationFeatures(features)

      console.log('🔍 IOSDebugInfo - iOS Info:', info)
      console.log('🔍 IOSDebugInfo - Notification Features:', features)
    }
  }, [])

  if (!iosInfo) {
    return <div className="text-gray-500">Loading iOS debug info...</div>
  }

  const getStatusColor = (condition: boolean) => condition ? 'text-green-600' : 'text-red-600'
  const getStatusIcon = (condition: boolean) => condition ? '✅' : '❌'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">🍎 iOS Notification Status</h3>
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
        </button>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Device Compatibility</h4>
          <div className="space-y-1 text-sm">
            <div className={getStatusColor(iosInfo.isIOS)}>
              {getStatusIcon(iosInfo.isIOS)} iOS Device: {iosInfo.isIOS ? 'Yes' : 'No'}
            </div>
            <div className={getStatusColor(iosInfo.isStandalone)}>
              {getStatusIcon(iosInfo.isStandalone)} Installed as PWA: {iosInfo.isStandalone ? 'Yes' : 'No'}
            </div>
            <div className={getStatusColor(iosInfo.supportsNotifications)}>
              {getStatusIcon(iosInfo.supportsNotifications)} Notifications Ready: {iosInfo.supportsNotifications ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-gray-800">Browser Support</h4>
          <div className="space-y-1 text-sm">
            <div className={getStatusColor(notificationFeatures?.supported)}>
              {getStatusIcon(notificationFeatures?.supported)} Notification API: {notificationFeatures?.supported ? 'Available' : 'Not Available'}
            </div>
            <div className={getStatusColor('serviceWorker' in navigator)}>
              {getStatusIcon('serviceWorker' in navigator)} Service Worker: {'serviceWorker' in navigator ? 'Available' : 'Not Available'}
            </div>
            <div className="text-gray-600">
              📱 iOS Version: {iosInfo.version || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-gray-50 rounded-md p-4">
        <h4 className="font-medium text-gray-800 mb-2">💡 Recommendations</h4>

        {!iosInfo.isIOS && (
          <div className="text-sm text-gray-600">
            You're not on an iOS device. Notifications should work normally in supported browsers.
          </div>
        )}

        {iosInfo.isIOS && !iosInfo.isStandalone && (
          <div className="space-y-2">
            <div className="text-sm text-amber-800 bg-amber-50 p-3 rounded border border-amber-200">
              <strong>📱 Install Required:</strong> To receive notifications on iOS, you must install this app to your home screen:
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Tap the Share button (📤) at the bottom of Safari</li>
                <li>Scroll down and select "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
                <li>Open the app from your home screen</li>
              </ol>
            </div>
          </div>
        )}

        {iosInfo.isIOS && iosInfo.isStandalone && !iosInfo.supportsNotifications && (
          <div className="text-sm text-red-800 bg-red-50 p-3 rounded border border-red-200">
            <strong>⚠️ iOS Update Needed:</strong> Web notifications require iOS 16.4 or later. Please update your iPhone in Settings → General → Software Update.
          </div>
        )}

        {iosInfo.isIOS && iosInfo.isStandalone && iosInfo.supportsNotifications && (
          <div className="text-sm text-green-800 bg-green-50 p-3 rounded border border-green-200">
            <strong>✅ Ready for Notifications:</strong> Your device is properly configured. You can now enable notifications and they should work correctly.
          </div>
        )}
      </div>

      {/* Expected Feature Support */}
      {iosInfo.isIOS && (
        <div className="bg-blue-50 rounded-md p-4">
          <h4 className="font-medium text-blue-800 mb-2">📋 iOS Safari Notification Limitations</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div>The limited feature support you're seeing is <strong>normal</strong> for iOS Safari:</div>
            <ul className="mt-2 space-y-1 list-disc list-inside ml-4">
              <li>Basic Notifications: ✅ Supported</li>
              <li>Actions Support: ❌ Not supported in Safari</li>
              <li>Badge Support: ❌ Limited support</li>
              <li>Data Support: ✅ Supported</li>
              <li>Image Support: ❌ Not supported in Safari</li>
              <li>Silent Support: ✅ Basic support</li>
              <li>Tag Support: ✅ Supported</li>
            </ul>
            <div className="mt-2 font-medium">This is expected behavior - iOS Safari intentionally limits web notification features for security and battery life reasons.</div>
          </div>
        </div>
      )}

      {/* Technical Details */}
      {showTechnicalDetails && (
        <div className="bg-gray-900 text-green-400 rounded-md p-4 font-mono text-xs">
          <h4 className="text-white mb-2">🔧 Technical Details</h4>
          <div className="space-y-1">
            <div>User Agent: {navigator.userAgent.substring(0, 100)}...</div>
            <div>Is iOS: {String(iosInfo.isIOS)}</div>
            <div>Is Standalone: {String(iosInfo.isStandalone)}</div>
            <div>iOS Version: {iosInfo.version || 'unknown'}</div>
            <div>Supports Notifications: {String(iosInfo.supportsNotifications)}</div>
            <div>ServiceWorker Support: {String('serviceWorker' in navigator)}</div>
            <div>Notification Permission: {typeof Notification !== 'undefined' ? Notification.permission : 'undefined'}</div>
            <div>Display Mode: {window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'}</div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-indigo-50 rounded-md p-4">
        <h4 className="font-medium text-indigo-800 mb-2">🚀 Next Steps</h4>
        <div className="text-sm text-indigo-700">
          {!iosInfo.isIOS && "Try the notification tests below - they should work normally on your device."}
          {iosInfo.isIOS && !iosInfo.isStandalone && "Install the app to your home screen first, then return to test notifications."}
          {iosInfo.isIOS && iosInfo.isStandalone && !iosInfo.supportsNotifications && "Update your iOS version to 16.4 or later for notification support."}
          {iosInfo.isIOS && iosInfo.isStandalone && iosInfo.supportsNotifications && "Grant notification permission below, then test the basic notification features."}
        </div>
      </div>
    </div>
  )
}