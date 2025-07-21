'use client'

import { useEffect } from 'react'
import { setupNotificationClickHandlers } from './utils/notifications'

export default function Home() {
  useEffect(() => {
    // Initialize notification click handlers for deeplink navigation
    setupNotificationClickHandlers()
  }, [])

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Find Your Dream Job
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Your mobile-first job search companion. Works offline, installs like an app.
        </p>

        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Job title or keywords"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">
              Search Jobs
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              📱
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mobile First</h3>
            <p className="text-gray-600">
              Optimized for mobile devices with a responsive design that works on any screen size.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              🔄
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Works Offline</h3>
            <p className="text-gray-600">
              Browse saved jobs and update your profile even when you're not connected to the internet.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              ⚡
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">
              Built with Next.js for optimal performance and instant page loads.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Install as App</h3>
          <p className="text-gray-600 mb-4">
            Add this app to your home screen for quick access. It works just like a native app!
          </p>
          <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">
            Install App
          </button>
        </div>

                <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Notifications 📱</h3>
          <p className="text-gray-600 mb-4">
            Try out push notifications and see how they work in your PWA!
          </p>
          <div className="flex gap-2 flex-wrap">
            <a
              href="/notifications"
              className="inline-block bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition duration-200"
            >
              Test Notifications
            </a>
            <button
              onClick={() => {
                import('./utils/notifications').then(({ send10SecondDelayedNotification }) => {
                  send10SecondDelayedNotification(
                    'Background Test ⏰',
                    'Switch to another tab and wait for this notification!',
                    '/?from=notification&test=background'
                  )
                })
              }}
              className="bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition duration-200"
            >
              ⏰ 10s Test
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}