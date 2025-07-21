'use client'

import { useState, useEffect } from 'react'
import { NotificationManager } from '../utils/notifications'
import FCMManager from '../../lib/firebase'

interface FCMState {
  isInitialized: boolean
  lastAttempt: number
  retryCount: number
  lastError?: string
  tokenValidated: boolean
  lastTokenRefresh: number
  currentToken: string | null
}

export default function FCMDebugger() {
  const [fcmState, setFcmState] = useState<FCMState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]) // Keep last 20 logs
  }

  const clearLogs = () => {
    setLogs([])
  }

  const loadFCMState = async () => {
    try {
      const state = FCMManager.getState()
      setFcmState(state)
      addLog(`📊 FCM State loaded: ${JSON.stringify({
        initialized: state.isInitialized,
        validated: state.tokenValidated,
        retries: state.retryCount,
        hasToken: !!state.currentToken
      })}`)
    } catch (error) {
      addLog(`💥 Error loading FCM state: ${error}`)
    }
  }

  useEffect(() => {
    loadFCMState()

    if (autoRefresh) {
      const interval = setInterval(loadFCMState, 5000) // Refresh every 5 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const testInitialization = async () => {
    setIsLoading(true)
    try {
      addLog('🚀 Testing FCM initialization...')
      const result = await NotificationManager.initialize()

      if (result.success) {
        addLog(`✅ Initialization successful: ${result.token?.substring(0, 20)}...`)
      } else {
        addLog(`❌ Initialization failed: ${result.error}`)
      }

      await loadFCMState()
    } catch (error) {
      addLog(`💥 Initialization test error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testTokenValidation = async () => {
    setIsLoading(true)
    try {
      addLog('🔍 Testing token validation...')
      const token = await NotificationManager.getFCMToken()

      if (token) {
        const isValid = await FCMManager.validateToken(token)
        addLog(`🔍 Token validation result: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
      } else {
        addLog('❌ No token available to validate')
      }

      await loadFCMState()
    } catch (error) {
      addLog(`💥 Token validation error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testDoubleCheck = async () => {
    setIsLoading(true)
    try {
      addLog('🔄 Testing double-check mechanism...')
      const result = await NotificationManager.ensureInitialized()

      if (result.success) {
        addLog(`✅ Double-check successful: ${result.token?.substring(0, 20)}...`)
      } else {
        addLog(`❌ Double-check failed: ${result.error}`)
      }

      await loadFCMState()
    } catch (error) {
      addLog(`💥 Double-check error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testTokenRefresh = async () => {
    setIsLoading(true)
    try {
      addLog('🔄 Testing token refresh...')
      const result = await NotificationManager.verifyAndRefreshToken()

      if (result.success) {
        addLog(`✅ Token refresh successful: ${result.token?.substring(0, 20)}...`)
      } else {
        addLog(`❌ Token refresh failed: ${result.error}`)
      }

      await loadFCMState()
    } catch (error) {
      addLog(`💥 Token refresh error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const forceReinitialize = async () => {
    setIsLoading(true)
    try {
      addLog('🔄 Forcing complete reinitialization...')
      const success = await FCMManager.forceReinitialize()

      if (success) {
        addLog('✅ Force reinitialization successful')
      } else {
        addLog('❌ Force reinitialization failed')
      }

      await loadFCMState()
    } catch (error) {
      addLog(`💥 Force reinitialization error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const resetFCM = async () => {
    try {
      addLog('🔄 Resetting FCM state...')
      NotificationManager.reset()
      await loadFCMState()
      addLog('✅ FCM state reset complete')
    } catch (error) {
      addLog(`💥 Reset error: ${error}`)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  const formatAge = (timestamp: number) => {
    if (!timestamp) return 'N/A'
    const ageMs = Date.now() - timestamp
    const ageMinutes = Math.floor(ageMs / (60 * 1000))
    const ageSeconds = Math.floor((ageMs % (60 * 1000)) / 1000)
    return `${ageMinutes}m ${ageSeconds}s ago`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">🔧 FCM Double-Check Debugger</h2>
        <div className="flex items-center space-x-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Auto refresh</span>
          </label>
        </div>
      </div>

      {/* FCM State Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">📊 FCM State</h3>
          {fcmState ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Initialized:</span>
                <span className={fcmState.isInitialized ? 'text-green-600' : 'text-red-600'}>
                  {fcmState.isInitialized ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Token Validated:</span>
                <span className={fcmState.tokenValidated ? 'text-green-600' : 'text-red-600'}>
                  {fcmState.tokenValidated ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Retry Count:</span>
                <span className={fcmState.retryCount > 0 ? 'text-orange-600' : 'text-green-600'}>
                  {fcmState.retryCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Has Token:</span>
                <span className={fcmState.currentToken ? 'text-green-600' : 'text-red-600'}>
                  {fcmState.currentToken ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Attempt:</span>
                <span className="text-gray-600 text-xs">
                  {formatAge(fcmState.lastAttempt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Refresh:</span>
                <span className="text-gray-600 text-xs">
                  {formatAge(fcmState.lastTokenRefresh)}
                </span>
              </div>
              {fcmState.lastError && (
                <div className="pt-2 border-t">
                  <span className="text-red-600 text-xs">
                    Error: {fcmState.lastError}
                  </span>
                </div>
              )}
              {fcmState.currentToken && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-gray-500">
                    Token: {fcmState.currentToken.substring(0, 30)}...
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Loading FCM state...</div>
          )}
        </div>

        {/* Control Panel */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">🎛️ Controls</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={testInitialization}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
            >
              🚀 Initialize
            </button>
            <button
              onClick={testTokenValidation}
              disabled={isLoading}
              className="px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
            >
              🔍 Validate
            </button>
            <button
              onClick={testDoubleCheck}
              disabled={isLoading}
              className="px-3 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 disabled:opacity-50"
            >
              🔄 Double-Check
            </button>
            <button
              onClick={testTokenRefresh}
              disabled={isLoading}
              className="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
            >
              ♻️ Refresh
            </button>
            <button
              onClick={forceReinitialize}
              disabled={isLoading}
              className="px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
            >
              💪 Force Init
            </button>
            <button
              onClick={resetFCM}
              disabled={isLoading}
              className="px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 disabled:opacity-50"
            >
              🗑️ Reset
            </button>
          </div>
          <div className="mt-3 pt-3 border-t">
            <button
              onClick={loadFCMState}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600 disabled:opacity-50"
            >
              📊 Refresh State
            </button>
          </div>
        </div>
      </div>

      {/* Debug Logs */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">📝 Debug Logs</h3>
          <button
            onClick={clearLogs}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        <div className="bg-black text-green-400 rounded p-3 h-60 overflow-y-auto font-mono text-xs">
          {logs.length > 0 ? (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          ) : (
            <div className="text-gray-500">No logs yet. Run some tests to see output here.</div>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Double-Check Testing Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Initialize:</strong> Basic FCM setup with retry logic</li>
          <li>• <strong>Validate:</strong> Check if current token is valid</li>
          <li>• <strong>Double-Check:</strong> Full validation with multiple fallback attempts</li>
          <li>• <strong>Refresh:</strong> Force token refresh and validation</li>
          <li>• <strong>Force Init:</strong> Complete reset and reinitialization</li>
          <li>• Watch the state changes and retry counts to see the double-check mechanism in action</li>
        </ul>
      </div>
    </div>
  )
}