'use client'

import { useState, useEffect } from 'react'

export default function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [userAgent, setUserAgent] = useState('')

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Detect iOS with more specific checks
    const ua = window.navigator.userAgent.toLowerCase()
    setUserAgent(ua)

        // More specific iOS detection
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) &&
                       !(window as any).MSStream && // Exclude Windows phones
                       !/windows phone/i.test(ua) && // Exclude Windows phones
                       !/android/i.test(ua) // Exclude Android

    console.log('🔍 IOSInstallPrompt Detection:', {
      userAgent: ua.substring(0, 100),
      isIOSDevice,
      hasIphone: /iphone/.test(ua),
      hasIpad: /ipad/.test(ua),
      hasIpod: /ipod/.test(ua),
      hasAndroid: /android/i.test(ua),
      hasWindows: /windows/i.test(ua)
    })

    setIsIOS(isIOSDevice)

    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true
    setIsInstalled(isStandalone)

    // Show prompt ONLY if iOS and not installed
    if (isIOSDevice && !isStandalone) {
      console.log('✅ Showing iOS install prompt')
      setShowPrompt(true)
    } else {
      console.log('❌ Not showing iOS install prompt:', { isIOSDevice, isStandalone })
      setShowPrompt(false)
    }
  }, [])

  // Don't show if not iOS, already installed, or user dismissed
  if (!isIOS || isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">📱 Enable Notifications on iPhone</h4>
            {!debugMode && (
              <button
                onClick={() => setDebugMode(true)}
                className="text-xs bg-white bg-opacity-20 px-1 rounded"
              >
                ?
              </button>
            )}
          </div>

          {debugMode && (
            <div className="mb-3 p-2 bg-black bg-opacity-30 rounded text-xs">
              <div>iOS: {String(isIOS)}</div>
              <div>Installed: {String(isInstalled)}</div>
              <div>UA: {userAgent.substring(0, 60)}...</div>
              <button
                onClick={() => setDebugMode(false)}
                className="mt-1 text-xs bg-white bg-opacity-20 px-1 rounded"
              >
                Hide
              </button>
            </div>
          )}

          <p className="text-sm mb-3">
            To receive job alerts and notifications, you need to install this app to your home screen:
          </p>
          <ol className="text-sm space-y-1 mb-3">
            <li>1. Tap the Share button <span className="bg-white bg-opacity-20 px-1 rounded">📤</span> at the bottom</li>
            <li>2. Select "Add to Home Screen"</li>
            <li>3. Tap "Add" to confirm</li>
            <li>4. Open the app from your home screen</li>
          </ol>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm"
            >
              Maybe Later
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1 bg-white bg-opacity-20 rounded text-sm"
            >
              I've Done This
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowPrompt(false)}
          className="ml-2 text-white opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}