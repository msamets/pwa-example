import type { Metadata, Viewport } from 'next'
import './globals.css'
import InstallPrompt from './components/InstallPrompt'
import IOSInstallPrompt from './components/IOSInstallPrompt'

export const metadata: Metadata = {
  title: 'Job Seeker PWA',
  description: 'A Progressive Web App for job seekers',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
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
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#000000" />
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