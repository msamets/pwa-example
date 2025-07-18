'use client'

import { useState, useEffect } from 'react'
import { getIOSInfo, NotificationManager, getNotificationFeatures } from '../utils/notifications'

export default function IOSDebugInfo() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  const gatherDebugInfo = async () => {
    const iosInfo = getIOSInfo()
    const notificationFeatures = getNotificationFeatures()
    const compatibility = await NotificationManager.checkIOSCompatibility()

    let permission = 'unknown'
    let serviceWorkerStatus = 'unknown'

    try {
      permission = Notification.permission
    } catch (e: unknown) {
      permission = 'error: ' + (e instanceof Error ? e.message : 'Unknown error')
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        serviceWorkerStatus = registration ? 'registered' : 'not registered'
      } else {
        serviceWorkerStatus = 'not supported'
      }
    } catch (e: unknown) {
      serviceWorkerStatus = 'error: ' + (e instanceof Error ? e.message : 'Unknown error')
    }

    const info = {
      ...iosInfo,
      compatibility,
      permission,
      serviceWorkerStatus,
      notificationFeatures,
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      isSecure: window.location.protocol === 'https:',
      timestamp: new Date().toISOString()
    }

    setDebugInfo(info)
    console.log('🔍 Debug Info Collected:', info)
  }

  useEffect(() => {
    gatherDebugInfo()
  }, [])

  const testNotification = async () => {
    console.log('🧪 Testing notification...')
    try {
      const result = await NotificationManager.ensurePermissionWithIOSSupport()
      console.log('🔔 Permission result:', result)

      if (result.success) {
        const notification = await NotificationManager.sendTestNotification()
        console.log('📱 Notification sent:', notification)
        alert('Notification test initiated! Check the console for details.')
      } else {
        alert(`Notification test failed: ${result.error}`)
      }
    } catch (error: unknown) {
      console.error('💥 Notification test error:', error)
      alert(`Notification test error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  if (!debugInfo) {
    return <div className="text-gray-500">Loading debug info...</div>
  }

  return (
    <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">🔍 iOS Notification Debug</h3>
        <div className="flex gap-2">
          <button
            onClick={testNotification}
            className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
          >
            Test Notification
          </button>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-3 py-1 bg-gray-700 text-white rounded text-xs"
          >
            {showDebug ? 'Hide' : 'Show'} Details
          </button>
        </div>
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-gray-400">iOS Device:</div>
          <div className={debugInfo.isIOS ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.isIOS ? '✅ Yes' : '❌ No'}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Installed as PWA:</div>
          <div className={debugInfo.isStandalone ? 'text-green-400' : 'text-red-400'}>
            {debugInfo.isStandalone ? '✅ Yes' : '❌ No'}
          </div>
        </div>
        <div>
          <div className="text-gray-400">iOS Version:</div>
          <div className={debugInfo.version && parseFloat(debugInfo.version) >= 16.4 ? 'text-green-400' : 'text-yellow-400'}>
            {debugInfo.version || 'Unknown'}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Notification Permission:</div>
          <div className={
            debugInfo.permission === 'granted' ? 'text-green-400' :
            debugInfo.permission === 'denied' ? 'text-red-400' : 'text-yellow-400'
          }>
            {debugInfo.permission}
          </div>
        </div>
      </div>

      {/* Compatibility Check */}
      <div className="mb-4">
        <div className="text-gray-400 mb-1">Can Use Notifications:</div>
        <div className={debugInfo.compatibility.canUseNotifications ? 'text-green-400' : 'text-red-400'}>
          {debugInfo.compatibility.canUseNotifications ? '✅ Yes' : '❌ No'}
        </div>
        {debugInfo.compatibility.reason && (
          <div className="text-yellow-400 mt-1">Reason: {debugInfo.compatibility.reason}</div>
        )}
      </div>

      {showDebug && (
        <div className="space-y-3">
          <div>
            <div className="text-gray-400 mb-1">Service Worker:</div>
            <div className="text-blue-400">{debugInfo.serviceWorkerStatus}</div>
          </div>

          <div>
            <div className="text-gray-400 mb-1">Current URL:</div>
            <div className="text-blue-400 break-all">{debugInfo.currentUrl}</div>
          </div>

          <div>
            <div className="text-gray-400 mb-1">HTTPS:</div>
            <div className={debugInfo.isSecure ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.isSecure ? '✅ Secure' : '❌ Not Secure'}
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-1">User Agent:</div>
            <div className="text-blue-400 break-all text-xs">{debugInfo.userAgent}</div>
          </div>

          <div>
            <div className="text-gray-400 mb-1">Notification Features:</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(debugInfo.notificationFeatures).map(([feature, supported]) => (
                <div key={feature} className={supported ? 'text-green-400' : 'text-red-400'}>
                  {feature}: {supported ? '✅' : '❌'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-gray-400 mb-1">Instructions:</div>
            {debugInfo.compatibility.instructions?.map((instruction: string, i: number) => (
              <div key={i} className="text-yellow-400 text-xs">
                {i + 1}. {instruction}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-500">
        Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
      </div>
    </div>
  )
}