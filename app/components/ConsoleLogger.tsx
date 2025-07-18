'use client'

import { useState, useEffect, useRef } from 'react'

interface LogEntry {
  timestamp: string
  level: 'log' | 'error' | 'warn' | 'info'
  message: string
}

export default function ConsoleLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isCapturing, setIsCapturing] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const originalConsole = useRef<any>({})

  useEffect(() => {
    // Store original console methods
    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }

    const addLogEntry = (level: LogEntry['level'], args: any[]) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')

      const timestamp = new Date().toLocaleTimeString()

      setLogs(prevLogs => {
        const newLogs = [...prevLogs, { timestamp, level, message }]
        // Keep only last 100 entries to prevent memory issues
        return newLogs.slice(-100)
      })
    }

        // Override console methods
    const setupConsoleOverride = () => {
      // Store reference to avoid recursion
      const originalLog = originalConsole.current.log
      const originalError = originalConsole.current.error
      const originalWarn = originalConsole.current.warn
      const originalInfo = originalConsole.current.info

      console.log = (...args) => {
        originalLog.apply(console, args)
        addLogEntry('log', args)
      }

      console.error = (...args) => {
        originalError.apply(console, args)
        addLogEntry('error', args)
      }

      console.warn = (...args) => {
        originalWarn.apply(console, args)
        addLogEntry('warn', args)
      }

      console.info = (...args) => {
        originalInfo.apply(console, args)
        addLogEntry('info', args)
      }
    }

    if (isCapturing) {
      setupConsoleOverride()

      // Add initial log
      addLogEntry('info', ['📱 Console Logger started - capturing logs for mobile debugging'])
    }

    return () => {
      // Restore original console methods on cleanup
      if (originalConsole.current.log) {
        console.log = originalConsole.current.log
        console.error = originalConsole.current.error
        console.warn = originalConsole.current.warn
        console.info = originalConsole.current.info
      }
    }
  }, [isCapturing])

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current && isExpanded) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, isExpanded])

  const clearLogs = () => {
    setLogs([])
    console.log('📱 Console logs cleared')
  }

  const downloadLogs = () => {
    const logText = logs.map(log =>
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n')

    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `console-logs-${new Date().toISOString().slice(0, 19)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400'
      case 'warn': return 'text-yellow-400'
      case 'info': return 'text-blue-400'
      default: return 'text-green-400'
    }
  }

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '❌'
      case 'warn': return '⚠️'
      case 'info': return 'ℹ️'
      default: return '📝'
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md">
      {/* Header */}
      <div className="flex justify-between items-center p-3 bg-gray-100 rounded-t-md">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-800">📱 Mobile Console</h4>
          <span className={`text-xs px-2 py-1 rounded ${isCapturing ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isCapturing ? '🟢 Capturing' : '🔴 Paused'}
          </span>
          <span className="text-xs text-gray-500">({logs.length} logs)</span>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setIsCapturing(!isCapturing)}
            className={`px-2 py-1 text-xs rounded ${
              isCapturing
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isCapturing ? '⏸️ Pause' : '▶️ Resume'}
          </button>

          <button
            onClick={clearLogs}
            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🗑️ Clear
          </button>

          <button
            onClick={downloadLogs}
            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            💾 Download
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isExpanded ? '📄 Collapse' : '📋 Expand'}
          </button>
        </div>
      </div>

      {/* Compact View */}
      {!isExpanded && logs.length > 0 && (
        <div className="p-3">
          <div className="text-xs text-gray-600 mb-2">Latest logs (click Expand to see all):</div>
          <div className="space-y-1">
            {logs.slice(-3).map((log, index) => (
              <div key={index} className="text-xs font-mono">
                <span className="text-gray-500">[{log.timestamp}]</span>
                <span className={`ml-2 ${getLogColor(log.level)}`}>
                  {getLogIcon(log.level)} {log.message.slice(0, 80)}{log.message.length > 80 ? '...' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div
          ref={logContainerRef}
          className="h-64 overflow-y-auto bg-gray-900 text-green-400 p-3 font-mono text-xs"
          style={{ fontFamily: 'Monaco, Consolas, monospace' }}
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center mt-8">
              📱 No logs captured yet.<br/>
              Start testing notifications to see debug output here.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 break-words">
                <span className="text-gray-400">[{log.timestamp}]</span>
                <span className={`ml-2 ${getLogColor(log.level)}`}>
                  {getLogIcon(log.level)} {log.level.toUpperCase()}:
                </span>
                <span className="ml-2">{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="p-3 bg-blue-50 text-xs text-blue-700 rounded-b-md">
        💡 <strong>Usage:</strong> This captures all console.log messages for mobile debugging.
        Run any notification tests above and watch the logs appear here in real-time.
        Use "Download" to save logs for sharing.
      </div>
    </div>
  )
}