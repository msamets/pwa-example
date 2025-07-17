'use client'

import { useEffect, useState } from 'react'
import { NotificationManager } from '../utils/notifications'

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  title: 'Frontend Developer',
  experience: '5 years',
  skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Python']
}

// Mock applications data
const mockApplications = [
  {
    id: 1,
    jobTitle: 'Senior Frontend Developer',
    company: 'TechCorp',
    status: 'Interview Scheduled',
    appliedDate: '2024-01-15',
    lastUpdate: '2024-01-18',
    interviewDate: '2024-01-22',
    interviewTime: '2:00 PM',
    statusColor: 'bg-blue-100 text-blue-800',
    isHighlighted: false
  },
  {
    id: 2,
    jobTitle: 'Software Engineer',
    company: 'StartupXYZ',
    status: 'Under Review',
    appliedDate: '2024-01-12',
    lastUpdate: '2024-01-16',
    statusColor: 'bg-yellow-100 text-yellow-800',
    isHighlighted: false
  },
  {
    id: 3,
    jobTitle: 'Full Stack Developer',
    company: 'BigTech Inc',
    status: 'Rejected',
    appliedDate: '2024-01-10',
    lastUpdate: '2024-01-14',
    statusColor: 'bg-red-100 text-red-800',
    isHighlighted: false
  },
  {
    id: 4,
    jobTitle: 'React Developer',
    company: 'WebAgency',
    status: 'Offer Extended',
    appliedDate: '2024-01-08',
    lastUpdate: '2024-01-20',
    statusColor: 'bg-green-100 text-green-800',
    isHighlighted: false
  }
]

export default function ProfilePage() {
  const [applications, setApplications] = useState(mockApplications)
  const [highlightedAppId, setHighlightedAppId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'interviews'>('profile')

  useEffect(() => {
    // Check if we were redirected from a notification
    const urlParams = new URLSearchParams(window.location.search)
    const fromNotification = urlParams.get('from')
    const appId = urlParams.get('appId')
    const action = urlParams.get('action')

    if (fromNotification === 'notification') {
      if (action === 'interview') {
        setActiveTab('interviews')
      } else if (action === 'application') {
        setActiveTab('applications')
      }

      if (appId) {
        setHighlightedAppId(parseInt(appId))
        setTimeout(() => {
          const element = document.getElementById(`app-${appId}`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    }

    // Listen for service worker navigation messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'navigate' && event.data.url.includes('/profile')) {
          const notificationData = event.data.notificationData
          if (notificationData) {
            if (notificationData.type === 'interview-reminder') {
              setActiveTab('interviews')
            } else if (notificationData.type === 'application-update') {
              setActiveTab('applications')
            }
            if (notificationData.appId) {
              setHighlightedAppId(notificationData.appId)
            }
          }
        }
      })
    }
  }, [])

  const sendInterviewReminder = async (app: any) => {
    const notification = await NotificationManager.sendNotification({
      title: 'Interview Reminder 📅',
      body: `Your interview with ${app.company} is tomorrow at ${app.interviewTime}`,
      tag: 'interview-reminder',
      requireInteraction: true,
      data: {
        type: 'interview-reminder',
        appId: app.id,
        company: app.company,
        redirectUrl: `/profile?from=notification&appId=${app.id}&action=interview`
      }
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        window.location.href = `/profile?from=notification&appId=${app.id}&action=interview`
        notification.close()
      }
    }
  }

  const sendApplicationUpdate = async (app: any, newStatus: string) => {
    const notification = await NotificationManager.sendNotification({
      title: 'Application Update 📋',
      body: `Your application with ${app.company} has been ${newStatus}`,
      tag: 'application-update',
      requireInteraction: true,
      data: {
        type: 'application-update',
        appId: app.id,
        company: app.company,
        status: newStatus,
        redirectUrl: `/profile?from=notification&appId=${app.id}&action=application`
      }
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        window.location.href = `/profile?from=notification&appId=${app.id}&action=application`
        notification.close()
      }
    }
  }

  const sendOfferNotification = async (app: any) => {
    const notification = await NotificationManager.sendNotification({
      title: 'Job Offer Received! 🎉',
      body: `Congratulations! You received an offer from ${app.company}`,
      tag: 'job-offer',
      requireInteraction: true,
      data: {
        type: 'job-offer',
        appId: app.id,
        company: app.company,
        redirectUrl: `/profile?from=notification&appId=${app.id}&action=offer`
      }
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        window.location.href = `/profile?from=notification&appId=${app.id}&action=offer`
        notification.close()
      }
    }
  }

  const TabButton = ({ tabKey, label, emoji }: { tabKey: typeof activeTab, label: string, emoji: string }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === tabKey
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {emoji} {label}
    </button>
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            👤 Profile Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage your applications and career progress
          </p>
        </div>

        {/* Test notification buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => sendInterviewReminder(applications[0])}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            🧪 Test Interview
          </button>
          <button
            onClick={() => sendApplicationUpdate(applications[1], 'reviewed')}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
          >
            🧪 Test Update
          </button>
          <button
            onClick={() => sendOfferNotification(applications[3])}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            🧪 Test Offer
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4">
        <TabButton tabKey="profile" label="Profile" emoji="👤" />
        <TabButton tabKey="applications" label="Applications" emoji="📋" />
        <TabButton tabKey="interviews" label="Interviews" emoji="📅" />
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={mockUser.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={mockUser.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={mockUser.phone}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={mockUser.location}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Professional Summary</h3>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">Current Title:</span>
                <span className="ml-2 text-gray-900">{mockUser.title}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Experience:</span>
                <span className="ml-2 text-gray-900">{mockUser.experience}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 block mb-2">Skills:</span>
                <div className="flex flex-wrap gap-2">
                  {mockUser.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Your Applications</h2>
          {applications.map((app) => (
            <div
              key={app.id}
              id={`app-${app.id}`}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition-all duration-500 ${
                highlightedAppId === app.id
                  ? 'border-l-yellow-500 bg-yellow-50 shadow-lg'
                  : 'border-l-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{app.jobTitle}</h3>
                    {highlightedAppId === app.id && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        📱 FROM NOTIFICATION
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-gray-700 mb-2">{app.company}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>📅 Applied: {app.appliedDate}</span>
                    <span>🔄 Updated: {app.lastUpdate}</span>
                    {app.interviewDate && <span>📅 Interview: {app.interviewDate} at {app.interviewTime}</span>}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${app.statusColor}`}>
                    {app.status}
                  </span>
                  <button
                    onClick={() => sendApplicationUpdate(app, 'updated')}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200"
                  >
                    📱 Test Update
                  </button>
                </div>
              </div>

              {app.interviewDate && (
                <div className="bg-blue-50 rounded-md p-3 mt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-blue-900">Upcoming Interview</p>
                      <p className="text-blue-700">{app.interviewDate} at {app.interviewTime}</p>
                    </div>
                    <button
                      onClick={() => sendInterviewReminder(app)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      📱 Test Reminder
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Interviews Tab */}
      {activeTab === 'interviews' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">Upcoming Interviews</h2>

          {applications.filter(app => app.interviewDate).map((app) => (
            <div
              key={app.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 border-l-purple-500 ${
                highlightedAppId === app.id ? 'bg-purple-50 shadow-lg' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{app.jobTitle}</h3>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      INTERVIEW SCHEDULED
                    </span>
                    {highlightedAppId === app.id && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        📱 FROM NOTIFICATION
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-gray-700 mb-3">{app.company}</p>
                  <div className="bg-purple-50 rounded-md p-4">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">📅</div>
                      <div>
                        <p className="font-medium text-purple-900">Interview Date & Time</p>
                        <p className="text-purple-700">{app.interviewDate} at {app.interviewTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => sendInterviewReminder(app)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    📱 Test Reminder
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                    📝 Prepare
                  </button>
                </div>
              </div>
            </div>
          ))}

          {applications.filter(app => app.interviewDate).length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Interviews</h3>
              <p className="text-gray-600">Your scheduled interviews will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Notification Testing Info */}
      <div className="bg-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">📱 Notification Testing</h3>
        <p className="text-purple-800 mb-4">
          Test how different notification types redirect to specific sections of your profile!
        </p>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Interview reminders will switch to the "Interviews" tab</li>
          <li>• Application updates will switch to the "Applications" tab</li>
          <li>• Job offers will highlight the specific application</li>
          <li>• All notifications work in the background when the app is closed</li>
        </ul>
      </div>
    </div>
  )
}