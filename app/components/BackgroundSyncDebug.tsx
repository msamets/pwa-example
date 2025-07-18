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
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
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

        <div className="text-xs">
          <span className="font-medium">User IP:</span> {userIP || 'Not set'}
        </div>
        <div className="text-xs">
          <span className="font-medium">Last Message ID:</span> {lastMessageId || 'None'}
        </div>

        <div className="flex space-x-2 mt-3">
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