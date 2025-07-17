'use client'

import { useEffect, useState } from 'react'
import { NotificationManager } from '../utils/notifications'

// Mock job data
const mockJobs = [
  {
    id: 1,
    title: 'Senior Frontend Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    salary: '$120k - $150k',
    type: 'Full-time',
    posted: '2 days ago',
    description: 'We are looking for a skilled Frontend Developer to join our team...',
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    isNew: true
  },
  {
    id: 2,
    title: 'Software Engineer',
    company: 'StartupXYZ',
    location: 'Remote',
    salary: '$90k - $120k',
    type: 'Full-time',
    posted: '1 day ago',
    description: 'Join our innovative startup and help build the future...',
    skills: ['JavaScript', 'Node.js', 'Python', 'MongoDB'],
    isNew: true
  },
  {
    id: 3,
    title: 'Full Stack Developer',
    company: 'BigTech Inc',
    location: 'New York, NY',
    salary: '$100k - $130k',
    type: 'Full-time',
    posted: '3 days ago',
    description: 'Looking for a versatile developer to work on both frontend and backend...',
    skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
    isNew: false
  },
  {
    id: 4,
    title: 'React Developer',
    company: 'WebAgency',
    location: 'Austin, TX',
    salary: '$80k - $100k',
    type: 'Contract',
    posted: '5 days ago',
    description: 'Contract position for an experienced React developer...',
    skills: ['React', 'Redux', 'JavaScript', 'CSS'],
    isNew: false
  }
]

export default function JobsPage() {
  const [highlightedJobId, setHighlightedJobId] = useState<number | null>(null)

  useEffect(() => {
    // Check if we were redirected from a notification
    const urlParams = new URLSearchParams(window.location.search)
    const fromNotification = urlParams.get('from')
    const jobId = urlParams.get('jobId')

    if (fromNotification === 'notification' && jobId) {
      setHighlightedJobId(parseInt(jobId))
      // Auto-scroll to the highlighted job
      setTimeout(() => {
        const element = document.getElementById(`job-${jobId}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }

    // Listen for service worker navigation messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'navigate' && event.data.url.includes('/jobs')) {
          const notificationData = event.data.notificationData
          if (notificationData && notificationData.jobId) {
            setHighlightedJobId(notificationData.jobId)
          }
        }
      })
    }
  }, [])

  const sendJobNotification = async (job: any) => {
    const notification = await NotificationManager.sendNotification({
      title: 'New Job Match! 💼',
      body: `${job.title} at ${job.company} - ${job.salary}`,
      tag: 'job-alert',
      requireInteraction: true,
      data: {
        type: 'job-alert',
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        redirectUrl: `/jobs?from=notification&jobId=${job.id}`
      }
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        window.location.href = `/jobs?from=notification&jobId=${job.id}`
        notification.close()
      }
    }
  }

  const sendInterviewNotification = async (job: any) => {
    const notification = await NotificationManager.sendNotification({
      title: 'Interview Scheduled! 📅',
      body: `Interview for ${job.title} at ${job.company} tomorrow at 2 PM`,
      tag: 'interview-scheduled',
      requireInteraction: true,
      data: {
        type: 'interview-scheduled',
        jobId: job.id,
        redirectUrl: `/jobs?from=notification&jobId=${job.id}&action=interview`
      }
    })

    if (notification) {
      notification.onclick = () => {
        window.focus()
        window.location.href = `/jobs?from=notification&jobId=${job.id}&action=interview`
        notification.close()
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            💼 Job Opportunities
          </h1>
          <p className="text-xl text-gray-600">
            Find your next career opportunity
          </p>
        </div>

        {/* Test notification buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => sendJobNotification(mockJobs[0])}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            🧪 Test Job Alert
          </button>
          <button
            onClick={() => sendInterviewNotification(mockJobs[0])}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            🧪 Test Interview
          </button>
        </div>
      </div>

      {/* Job Search Bar */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Job title or keywords"
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Location"
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200">
            🔍 Search Jobs
          </button>
        </div>
      </div>

      {/* Job Listings */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Recent Opportunities</h2>

        {mockJobs.map((job) => (
          <div
            key={job.id}
            id={`job-${job.id}`}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition-all duration-500 ${
              highlightedJobId === job.id
                ? 'border-l-yellow-500 bg-yellow-50 shadow-lg'
                : 'border-l-blue-500 hover:shadow-lg'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                  {job.isNew && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      NEW
                    </span>
                  )}
                  {highlightedJobId === job.id && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                      📱 FROM NOTIFICATION
                    </span>
                  )}
                </div>
                <p className="text-lg text-gray-700 mb-2">{job.company}</p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                  <span>📍 {job.location}</span>
                  <span>💰 {job.salary}</span>
                  <span>⏰ {job.type}</span>
                  <span>📅 {job.posted}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => sendJobNotification(job)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200"
                >
                  📱 Test Alert
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Apply Now
                </button>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{job.description}</p>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">Skills:</span>
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">💾</div>
            <div className="font-medium">Save Job Search</div>
            <div className="text-sm text-gray-600">Get notified of new matches</div>
          </button>
          <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">📊</div>
            <div className="font-medium">Salary Insights</div>
            <div className="text-sm text-gray-600">Research market rates</div>
          </button>
          <button className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium">Job Alerts</div>
            <div className="text-sm text-gray-600">Set up custom notifications</div>
          </button>
        </div>
      </div>

      {/* Notification Testing Info */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📱 Notification Testing</h3>
        <p className="text-blue-800 mb-4">
          Click the "Test" buttons to see how notifications redirect you back to specific jobs!
        </p>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Job alerts will highlight the specific job when clicked</li>
          <li>• Interview notifications will navigate to this page with context</li>
          <li>• Background notifications work even when the app is closed</li>
          <li>• Try sending a notification, then go to another tab/app and click it</li>
        </ul>
      </div>
    </div>
  )
}