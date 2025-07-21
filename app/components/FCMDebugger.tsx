'use client'
import { useState } from 'react'

export default function FCMDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const checkConfiguration = () => {
    const clientConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    }

    const serviceWorkerConfig = {
      apiKey: "AIzaSyBdlQ043SPZuNfbT4RM3B07JLSxNL9rIsc",
      authDomain: "jobseeker-pwa.firebaseapp.com",
      projectId: "jobseeker-pwa",
      storageBucket: "jobseeker-pwa.firebasestorage.app",
      messagingSenderId: "1011116688933",
      appId: "1:1011116688933:web:bfb8b314d3a81c6b78e1cc"
    }

    const comparison = {
      clientConfig,
      serviceWorkerConfig,
      matches: {
        apiKey: clientConfig.apiKey === serviceWorkerConfig.apiKey,
        authDomain: clientConfig.authDomain === serviceWorkerConfig.authDomain,
        projectId: clientConfig.projectId === serviceWorkerConfig.projectId,
        storageBucket: clientConfig.storageBucket === serviceWorkerConfig.storageBucket,
        messagingSenderId: clientConfig.messagingSenderId === serviceWorkerConfig.messagingSenderId,
        appId: clientConfig.appId === serviceWorkerConfig.appId
      }
    }

    console.log('🔍 Firebase Configuration Debug:', comparison)
    setDebugInfo(comparison)
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-blue-800 mb-2">🔧 FCM Configuration Debugger</h3>

      <button
        onClick={checkConfiguration}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
      >
        Check Configuration
      </button>

      {debugInfo && (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800">Configuration Matches:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(debugInfo.matches).map(([key, matches]) => (
                <div key={key} className={`p-2 rounded ${matches ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {key}: {matches ? '✅' : '❌'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800">Client Config (from .env.local):</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(debugInfo.clientConfig, null, 2)}
            </pre>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800">Service Worker Config (hardcoded):</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
              {JSON.stringify(debugInfo.serviceWorkerConfig, null, 2)}
            </pre>
          </div>

          <div className="bg-yellow-100 border border-yellow-300 rounded p-3">
            <h4 className="font-semibold text-yellow-800">⚠️ Next Steps:</h4>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>1. If any config values don't match, update your .env.local</li>
              <li>2. Check your Firebase Console for the correct VAPID key</li>
              <li>3. Ensure Cloud Messaging API is enabled in your Firebase project</li>
              <li>4. Verify your domain is authorized in Firebase Console</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}