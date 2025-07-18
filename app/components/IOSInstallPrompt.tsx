'use client'

import { useState, useEffect } from 'react'

export default function IOSInstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIOSDevice)

    // Check if already installed as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true
    setIsInstalled(isStandalone)

    // Show prompt if iOS and not installed
    if (isIOSDevice && !isStandalone) {
      setShowPrompt(true)
    }
  }, [])

  if (!isIOS || isInstalled || !showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold mb-2">📱 Enable Notifications on iPhone</h4>
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