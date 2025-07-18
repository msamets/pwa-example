'use client'

import { useState, useEffect } from 'react'

interface BackgroundSyncDebugProps {
  isBackgroundSyncActive: boolean
  isPageVisible: boolean
  notificationPermission: NotificationPermission
  lastMessageId: string | null
  userIP: string
}

export default function BackgroundSyncDebug({
  isBackgroundSyncActive,
  isPageVisible,
  notificationPermission,
  lastMessageId,
  userIP
}: BackgroundSyncDebugProps) {
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('Checking...')
  const [debugLogs, setDebugLogs] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [backgroundSyncSupport, setBackgroundSyncSupport] = useState<{
    sync: boolean,
    periodicSync: boolean,
    isSecure: boolean,
    isInstalled: boolean,
    error?: string
  }>({ sync: false, periodicSync: false, isSecure: false, isInstalled: false })

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]) // Keep only last 10 logs
  }

  useEffect(() => {
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready
          if (registration.active) {
            setServiceWorkerStatus('Active and Ready')
            addLog('Service Worker is active and ready')

            // Check Background Sync API support
            const syncSupport = 'sync' in registration
            const periodicSyncSupport = 'periodicSync' in registration
            const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
            const isInstalled = window.matchMedia('(display-mode: standalone)').matches

            setBackgroundSyncSupport({
              sync: syncSupport,
              periodicSync: periodicSyncSupport,
              isSecure,
              isInstalled
            })

            addLog(`Background Sync: ${syncSupport ? 'Supported' : 'Not supported'}`)
            addLog(`Periodic Sync: ${periodicSyncSupport ? 'Supported' : 'Not supported'}`)
            addLog(`HTTPS: ${isSecure ? 'Yes' : 'No (required for background sync)'}`)
            addLog(`PWA Installed: ${isInstalled ? 'Yes' : 'No (may be required for background sync)'}`)
          } else {
            setServiceWorkerStatus('Registered but not active')
            addLog('Service Worker registered but not active')
          }
        } catch (error) {
          setServiceWorkerStatus('Error')
          addLog(`Service Worker error: ${error}`)
        }
      } else {
        setServiceWorkerStatus('Not Supported')
        addLog('Service Worker not supported')
      }
    }

    checkServiceWorker()
  }, [])

  useEffect(() => {
    addLog(`Page visibility changed: ${isPageVisible ? 'visible' : 'hidden'}`)
  }, [isPageVisible])

  useEffect(() => {
    addLog(`Background sync: ${isBackgroundSyncActive ? 'started' : 'stopped'}`)
  }, [isBackgroundSyncActive])

  useEffect(() => {
    addLog(`Notification permission: ${notificationPermission}`)
  }, [notificationPermission])

  const testServiceWorkerMessage = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration.active) {
          registration.active.postMessage({
            type: 'test-message',
            timestamp: Date.now()
          })
          addLog('Test message sent to service worker')
        }
      } catch (error) {
        addLog(`Error sending test message: ${error}`)
      }
    }
  }

  const forceBackgroundCheck = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration.active) {
          registration.active.postMessage({
            type: 'force-check-messages'
          })
          addLog('Forced background message check')
        }
      } catch (error) {
        addLog(`Error forcing background check: ${error}`)
      }
    }
  }

  const testBackgroundSync = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        // Check if sync is available (with proper type casting)
        if ('sync' in registration) {
          await (registration as any).sync.register('test-sync')
          addLog('Test background sync registered')
        } else {
          addLog('Background Sync API not supported')
        }
      } catch (error) {
        addLog(`Error testing background sync: ${error}`)
      }
    }
  }

  const testNotification = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        await registration.showNotification('Test Notification', {
          body: 'This is a test notification from the debug panel',
          icon: '/icon-192x192.png',
          tag: 'debug-test'
        })
        addLog('Test notification sent')
      } catch (error) {
        addLog(`Error sending test notification: ${error}`)
      }
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm hover:bg-blue-700"
        >
          🔧 Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Background Sync Debug</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium">SW Status:</span>
            <div className={`text-xs ${serviceWorkerStatus.includes('Active') ? 'text-green-600' : 'text-red-600'}`}>
              {serviceWorkerStatus}
            </div>
          </div>
          <div>
            <span className="font-medium">Page:</span>
            <div className={`text-xs ${isPageVisible ? 'text-green-600' : 'text-blue-600'}`}>
              {isPageVisible ? 'Visible' : 'Hidden'}
            </div>
          </div>
          <div>
            <span className="font-medium">Sync:</span>
            <div className={`text-xs ${isBackgroundSyncActive ? 'text-blue-600' : 'text-gray-600'}`}>
              {isBackgroundSyncActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div>
            <span className="font-medium">Notifications:</span>
            <div className={`text-xs ${notificationPermission === 'granted' ? 'text-green-600' : 'text-red-600'}`}>
              {notificationPermission}
            </div>
          </div>
        </div>

        {/* Background Sync API Support */}
        <div className="border-t pt-2">
          <div className="font-medium text-xs mb-1">API Support:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div>
              <span>Sync:</span>
              <span className={`ml-1 ${backgroundSyncSupport.sync ? 'text-green-600' : 'text-red-600'}`}>
                {backgroundSyncSupport.sync ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span>Periodic:</span>
              <span className={`ml-1 ${backgroundSyncSupport.periodicSync ? 'text-green-600' : 'text-red-600'}`}>
                {backgroundSyncSupport.periodicSync ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span>HTTPS:</span>
              <span className={`ml-1 ${backgroundSyncSupport.isSecure ? 'text-green-600' : 'text-red-600'}`}>
                {backgroundSyncSupport.isSecure ? '✓' : '✗'}
              </span>
            </div>
            <div>
              <span>PWA Installed:</span>
              <span className={`ml-1 ${backgroundSyncSupport.isInstalled ? 'text-green-600' : 'text-red-600'}`}>
                {backgroundSyncSupport.isInstalled ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs">
          <span className="font-medium">User IP:</span> {userIP || 'Not set'}
        </div>
        <div className="text-xs">
          <span className="font-medium">Last Message ID:</span> {lastMessageId || 'None'}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          <button
            onClick={testServiceWorkerMessage}
            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
          >
            Test SW
          </button>
          <button
            onClick={forceBackgroundCheck}
            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
          >
            Force Check
          </button>
          <button
            onClick={testBackgroundSync}
            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
          >
            Test Sync
          </button>
          <button
            onClick={testNotification}
            className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200"
          >
            Test Notif
          </button>
        </div>

        <div className="mt-3">
          <div className="font-medium text-xs mb-1">Recent Activity:</div>
          <div className="bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
            {debugLogs.length === 0 ? (
              <div className="text-gray-500 text-xs">No activity yet</div>
            ) : (
              debugLogs.map((log, index) => (
                <div key={index} className="text-xs text-gray-700 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}