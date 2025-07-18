import type { Metadata, Viewport } from 'next'
import './globals.css'
import InstallPrompt from './components/InstallPrompt'
import IOSInstallPrompt from './components/IOSInstallPrompt'

export const metadata: Metadata = {
  title: 'Job Seeker PWA',
  description: 'A Progressive Web App for job seekers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Job Seeker',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="96x96" href="/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icon-384x384.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512x512.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Job Seeker" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h1 className="text-2xl font-bold text-gray-900">Job Seeker</h1>
                <nav className="flex space-x-4">
                  <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                  <a href="/jobs" className="text-gray-600 hover:text-gray-900">Jobs</a>
                  <a href="/notifications" className="text-gray-600 hover:text-gray-900">Notifications</a>
                  <a href="/profile" className="text-gray-600 hover:text-gray-900">Profile</a>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <InstallPrompt />
          <IOSInstallPrompt />
        </div>
      </body>
    </html>
  )
}