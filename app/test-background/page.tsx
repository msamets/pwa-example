'use client'

import { useState, useEffect } from 'react'

export default function TestBackgroundPage() {
  const [testStep, setTestStep] = useState(0)
  const [lastNotification, setLastNotification] = useState('')
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const testSteps = [
    'Install the PWA to your home screen (if not already done)',
    'Grant notification permission',
    'Send a message from another device/browser',
    'Hide the PWA (go to home screen or switch apps)',
    'Send another message from another device/browser',
    'You should receive a notification!'
  ]

  useEffect(() => {
    gatherDebugInfo()
  }, [])

  const gatherDebugInfo = async () => {
    const info = {
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'undefined',
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      serviceWorkerReady: false,
      backgroundSyncSupported: false,
      periodicSyncSupported: false,
      userAgent: navigator.userAgent
    }

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        info.serviceWorkerReady = !!registration.active
        info.backgroundSyncSupported = 'sync' in registration
        info.periodicSyncSupported = 'periodicSync' in registration
      } catch (error) {
        console.error('Service worker check failed:', error)
      }
    }

    setDebugInfo(info)
  }

  const testNotification = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('Test Background Notification', {
          body: 'If you see this while the app is hidden, background notifications are working!',
          icon: '/icon-192x192.png',
          requireInteraction: true,
          tag: 'background-test'
        })
        setLastNotification('Test notification sent!')
      } catch (error) {
        setLastNotification(`Error: ${error}`)
      }
    }
  }

  const requestPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      setLastNotification(`Permission: ${permission}`)
      gatherDebugInfo()
    }
  }

  const isStepComplete = (step: number) => {
    if (!debugInfo) return false

    switch (step) {
      case 0: return debugInfo.isInstalled
      case 1: return debugInfo.notificationPermission === 'granted'
      default: return false
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Background Notification Test</h1>

        {/* Test Steps */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Test Steps:</h2>
          <div className="space-y-3">
            {testSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-lg border ${
                  isStepComplete(index)
                    ? 'bg-green-50 border-green-200'
                    : index === testStep
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                  isStepComplete(index)
                    ? 'bg-green-500 text-white'
                    : index === testStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {isStepComplete(index) ? '✓' : index + 1}
                </div>
                <span className="flex-1">{step}</span>
                {index === 1 && debugInfo?.notificationPermission !== 'granted' && (
                  <button
                    onClick={requestPermission}
                    className="ml-3 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Grant Permission
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions:</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testNotification}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Send Test Notification
            </button>
            <button
              onClick={() => window.open('/chat', '_blank')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Open Chat in New Tab
            </button>
            <button
              onClick={gatherDebugInfo}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh Debug Info
            </button>
          </div>
        </div>

        {/* Debug Information */}
        {debugInfo && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">System Information:</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">PWA Installed:</span>
                  <span className={`ml-2 ${debugInfo.isInstalled ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.isInstalled ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Notifications:</span>
                  <span className={`ml-2 ${debugInfo.notificationPermission === 'granted' ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.notificationPermission}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Service Worker:</span>
                  <span className={`ml-2 ${debugInfo.serviceWorkerReady ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.serviceWorkerReady ? 'Ready' : 'Not Ready'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Background Sync:</span>
                  <span className={`ml-2 ${debugInfo.backgroundSyncSupported ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.backgroundSyncSupported ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Periodic Sync:</span>
                  <span className={`ml-2 ${debugInfo.periodicSyncSupported ? 'text-green-600' : 'text-red-600'}`}>
                    {debugInfo.periodicSyncSupported ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">HTTPS:</span>
                  <span className={`ml-2 ${window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? 'text-green-600' : 'text-red-600'}`}>
                    {window.location.protocol === 'https:' || window.location.hostname === 'localhost' ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600">
                <span className="font-medium">User Agent:</span>
                <div className="mt-1 break-all">{debugInfo.userAgent}</div>
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Troubleshooting Background Notifications:</h2>
          <div className="space-y-4">
            {/* HTTPS Check */}
            <div className={`p-4 rounded-lg border ${
              (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <h3 className="font-medium mb-2">
                {(window.location.protocol === 'https:' || window.location.hostname === 'localhost') ? '✅' : '❌'}
                {' '}HTTPS Required
              </h3>
              <p className="text-sm text-gray-700">
                {(window.location.protocol === 'https:' || window.location.hostname === 'localhost')
                  ? 'Site is served over HTTPS - Background Sync can work!'
                  : 'Background Sync requires HTTPS. Please use https:// or serve from localhost for development.'
                }
              </p>
            </div>

            {/* PWA Installation Check */}
            <div className={`p-4 rounded-lg border ${
              debugInfo?.isInstalled
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-medium mb-2">
                {debugInfo?.isInstalled ? '✅' : '⚠️'}
                {' '}PWA Installation
              </h3>
              <p className="text-sm text-gray-700 mb-2">
                {debugInfo?.isInstalled
                  ? 'PWA is installed to home screen - Background Sync should work!'
                  : 'PWA may not be installed. Background Sync often requires the app to be installed to the home screen.'
                }
              </p>
              {!debugInfo?.isInstalled && (
                <div className="text-xs text-gray-600">
                  <strong>To install:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li><strong>Chrome/Edge:</strong> Click the install button in the address bar or browser menu</li>
                    <li><strong>Safari iOS:</strong> Tap Share → Add to Home Screen</li>
                    <li><strong>Firefox:</strong> Look for "Install" option in the menu</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Background Sync Support */}
            <div className={`p-4 rounded-lg border ${
              debugInfo?.backgroundSyncSupported
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <h3 className="font-medium mb-2">
                {debugInfo?.backgroundSyncSupported ? '✅' : '❌'}
                {' '}Background Sync API
              </h3>
              <p className="text-sm text-gray-700">
                {debugInfo?.backgroundSyncSupported
                  ? 'Background Sync API is supported by your browser!'
                  : 'Background Sync API is not supported by your browser. The app will use fallback methods (which may be throttled).'
                }
              </p>
              {!debugInfo?.backgroundSyncSupported && (
                <div className="text-xs text-gray-600 mt-2">
                  <strong>Browsers with Background Sync support:</strong> Chrome, Edge, Opera
                </div>
              )}
            </div>

            {/* Permission Issues */}
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <h3 className="font-medium mb-2">🔒 If you see "Permission denied" errors:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Most common causes:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>App is not installed to home screen (install it first)</li>
                  <li>Browser has background sync disabled in settings</li>
                  <li>Site is not served over HTTPS</li>
                  <li>Browser doesn't support Background Sync API</li>
                </ul>
                <p className="mt-2"><strong>Solution:</strong> The app will automatically fall back to alternative notification methods that work without Background Sync permissions.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {lastNotification && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-blue-800">{lastNotification}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Important Notes:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Background notifications only work when the PWA is installed to home screen</li>
            <li>• Make sure to grant notification permission</li>
            <li>• Test by hiding the app completely (not just minimizing the browser)</li>
            <li>• On iOS, the app must be added to home screen and opened from there</li>
            <li>• Some browsers may still throttle background activity to save battery</li>
          </ul>
        </div>
      </div>
    </div>
  )
}