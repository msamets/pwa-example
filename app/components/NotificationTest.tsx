'use client'

import { useState } from 'react'

export default function NotificationTest() {
  const [lastNotification, setLastNotification] = useState<string | null>(null)

  const showBasicNotification = () => {
    const notification = new Notification('Basic Notification', {
      body: 'This is a simple notification with just text.',
      icon: '/icon.svg',
      tag: 'basic-test'
    })

    setLastNotification('Basic notification sent')

    notification.onclick = () => {
      console.log('Basic notification clicked')
      window.focus()
      notification.close()
    }
  }

  const showJobAlertNotification = () => {
    const notification = new Notification('New Job Match! 💼', {
      body: 'Senior Frontend Developer at TechCorp - $120k-$150k',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'job-alert',
      requireInteraction: true,
      // Note: actions property may not be fully supported in all browsers
    } as any)

    setLastNotification('Job alert notification sent')

    notification.onclick = () => {
      console.log('Job notification clicked')
      window.focus()
    }
  }

  const showInterviewNotification = () => {
    const notification = new Notification('Interview Reminder 📅', {
      body: 'Your interview with ABC Company is in 1 hour',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'interview-reminder',
      requireInteraction: true,
      // Note: vibrate property may not be fully supported in all browsers
    } as any)

    setLastNotification('Interview reminder sent')

    notification.onclick = () => {
      console.log('Interview notification clicked')
      window.focus()
    }
  }

  const showApplicationUpdateNotification = () => {
    const notification = new Notification('Application Update 📋', {
      body: 'Your application for Software Engineer has been reviewed',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'application-update',
      data: { applicationId: '123', status: 'reviewed' }
    })

    setLastNotification('Application update sent')

    notification.onclick = () => {
      console.log('Application update clicked', notification.data)
      window.focus()
    }
  }

  const showSilentNotification = () => {
    const notification = new Notification('Silent Update', {
      body: 'This notification is silent (no sound)',
      icon: '/icon-192x192.png',
      silent: true,
      tag: 'silent-update'
    })

    setLastNotification('Silent notification sent')
  }

    const showDelayedNotification = () => {
    setLastNotification('Notification will appear in 3 seconds...')

    setTimeout(() => {
      const notification = new Notification('Delayed Notification ⏰', {
        body: 'This notification was sent with a 3-second delay',
        icon: '/icon-192x192.png',
        tag: 'delayed-test'
      })

      setLastNotification('Delayed notification sent')
    }, 3000)
  }

  const show10SecondDelayedNotification = () => {
    setLastNotification('Notification will appear in 10 seconds... Switch to another tab to test background notifications!')

    setTimeout(() => {
      const notification = new Notification('10-Second Delayed Notification ⏰', {
        body: 'Perfect timing! This notification appeared after 10 seconds. Great for testing background behavior.',
        icon: '/icon-192x192.png',
        tag: 'delayed-10s-test',
        requireInteraction: true,
        data: {
          type: 'delayed-test',
          redirectUrl: '/notifications?from=notification&test=10s-delay'
        }
      })

      setLastNotification('10-second delayed notification sent')

      notification.onclick = () => {
        console.log('10-second delayed notification clicked')
        window.focus()
        window.location.href = '/notifications?from=notification&test=10s-delay'
        notification.close()
      }
    }, 10000)
  }

    const showPersistentNotification = () => {
    const notification = new Notification('Persistent Notification 📌', {
      body: 'This notification requires interaction to dismiss',
      icon: '/icon-192x192.png',
      requireInteraction: true,
      tag: 'persistent-test'
    })

    setLastNotification('Persistent notification sent')

    notification.onclick = () => {
      console.log('Persistent notification clicked')
      notification.close()
    }
  }

  const showJobOfferNotification = () => {
    const notification = new Notification('Job Offer Received! 🎉', {
      body: 'Congratulations! You received an offer from TechCorp',
      icon: '/icon-192x192.png',
      tag: 'job-offer',
      requireInteraction: true,
      data: { type: 'job-offer', company: 'TechCorp', redirectUrl: '/profile?from=notification&action=offer' }
    })

    setLastNotification('Job offer notification sent')

    notification.onclick = () => {
      console.log('Job offer notification clicked')
      window.open('/profile?from=notification&action=offer', '_blank')
      notification.close()
    }
  }

  const showHomeRedirectNotification = () => {
    const notification = new Notification('Welcome Back! 🏠', {
      body: 'Check out new job matches we found for you',
      icon: '/icon-192x192.png',
      tag: 'welcome-back',
      data: { type: 'welcome-back', redirectUrl: '/?from=notification' }
    })

    setLastNotification('Welcome notification sent')

    notification.onclick = () => {
      console.log('Welcome notification clicked')
      window.open('/?from=notification', '_blank')
      notification.close()
    }
  }

  const showNotificationsRedirectNotification = () => {
    const notification = new Notification('Notification Settings 🔔', {
      body: 'Manage your notification preferences here',
      icon: '/icon-192x192.png',
      tag: 'notification-settings',
      data: { type: 'notification-settings', redirectUrl: '/notifications?from=notification' }
    })

    setLastNotification('Settings notification sent')

    notification.onclick = () => {
      console.log('Settings notification clicked')
      window.open('/notifications?from=notification', '_blank')
      notification.close()
    }
  }

  const clearNotifications = () => {
    // Close all notifications with known tags
    const tags = ['basic-test', 'job-alert', 'interview-reminder', 'application-update', 'silent-update', 'delayed-test', 'persistent-test']

    // Note: There's no direct way to clear all notifications, but we can close them if we have references
    setLastNotification('Attempted to clear notifications')
  }

  const testNotificationFeatures = () => {
    if (!('Notification' in window)) {
      alert('Notifications not supported')
      return
    }

    const features = {
      'Basic Notifications': 'Notification' in window,
      'Actions Support': 'actions' in Notification.prototype,
      'Badge Support': 'badge' in Notification.prototype,
      'Data Support': 'data' in Notification.prototype,
      'Image Support': 'image' in Notification.prototype,
      'Renotify Support': 'renotify' in Notification.prototype,
      'RequireInteraction Support': 'requireInteraction' in Notification.prototype,
      'Silent Support': 'silent' in Notification.prototype,
      'Tag Support': 'tag' in Notification.prototype,
      'Vibrate Support': 'vibrate' in Notification.prototype,
    }

    const supportedFeatures = Object.entries(features)
      .map(([feature, supported]) => `${feature}: ${supported ? '✅' : '❌'}`)
      .join('\n')

    alert(`Notification Feature Support:\n\n${supportedFeatures}`)
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      {lastNotification && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-800 text-sm">
            ✅ {lastNotification}
          </p>
        </div>
      )}

      {/* Basic Tests */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Basic Notifications</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={showBasicNotification}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            📝 Basic Notification
          </button>
          <button
            onClick={showSilentNotification}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            🔇 Silent Notification
          </button>
        </div>
      </div>

      {/* Job-Specific Tests with Redirects */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Job Seeker Scenarios (with Page Redirects)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={showJobAlertNotification}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            💼 Job Alert → Jobs
          </button>
          <button
            onClick={showInterviewNotification}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            📅 Interview → Profile
          </button>
          <button
            onClick={showApplicationUpdateNotification}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            📋 Application → Profile
          </button>
          <button
            onClick={showJobOfferNotification}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
          >
            🎉 Job Offer → Profile
          </button>
          <button
            onClick={showHomeRedirectNotification}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            🏠 Welcome → Home
          </button>
          <button
            onClick={showNotificationsRedirectNotification}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            🔔 Settings → Notifications
          </button>
        </div>
      </div>

      {/* Advanced Tests */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Advanced Features</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button
            onClick={showDelayedNotification}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            ⏰ Delayed (3s)
          </button>
          <button
            onClick={show10SecondDelayedNotification}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            ⏰ Delayed (10s)
          </button>
          <button
            onClick={showPersistentNotification}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            📌 Persistent
          </button>
        </div>
      </div>

      {/* Utility Actions */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Utilities</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={testNotificationFeatures}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            🔍 Check Features
          </button>
          <button
            onClick={clearNotifications}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 rounded-md p-4">
        <h5 className="font-medium text-blue-900 mb-2">💡 Testing Tips</h5>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>10-second delay:</strong> Perfect for testing background notifications - click the button, then switch to another tab/app</li>
          <li>• Try notifications while the app is in the background</li>
          <li>• Test on different devices and browsers</li>
          <li>• Check notification behavior in Do Not Disturb mode</li>
          <li>• Verify notification persistence across page reloads</li>
          <li>• Test click actions and deep linking with redirect URLs</li>
          <li>• Use delayed notifications to simulate real-world timing scenarios</li>
        </ul>
      </div>
    </div>
  )
}