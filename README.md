# Job Seeker PWA

A modern Progressive Web App (PWA) built with Next.js, React, and TypeScript for job seekers. This app provides a mobile-first experience with offline capabilities and can be installed like a native app.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive design
- 🔄 **Offline Support**: Works even when you're not connected to the internet
- ⚡ **Lightning Fast**: Built with Next.js for optimal performance
- 📦 **Installable**: Can be installed on devices like a native app
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS
- 🔔 **Push Notifications**: Full notification support including iOS Safari
- 🍎 **iOS Compatible**: Works seamlessly on iPhone with proper PWA installation

## iOS Notification Support

This PWA includes full support for notifications on iOS Safari:

### Requirements
- iOS 16.4 or later
- Must be installed to home screen (PWA requirement)
- User must grant notification permissions

### How it works
1. **Detection**: Automatically detects iOS devices and shows installation prompts
2. **Installation**: Guides users through the "Add to Home Screen" process
3. **Permissions**: Requests notification permissions after installation
4. **Testing**: Includes comprehensive debugging tools

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd job-seeker-pwa
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel Deployment

This project is optimized for Vercel deployment:

1. Connect your repository to Vercel
2. Vercel will automatically detect Next.js and use the correct build settings
3. The app includes `.vercelignore` and `vercel.json` for optimal deployment

#### Troubleshooting Vercel Deployment

If you encounter build trace collection errors:
1. Make sure `sharp` is in `devDependencies` (not dependencies)
2. The `scripts/` directory is excluded via `.vercelignore`
3. PWA configuration is optimized for serverless deployment

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Digital Ocean App Platform
- Self-hosted with PM2

## PWA Features

This app includes:

- **Web App Manifest**: Allows installation on devices
- **Service Worker**: Enables offline functionality and caching
- **Responsive Design**: Works on all screen sizes
- **Fast Loading**: Optimized for performance
- **Push Notifications**: Cross-platform notification support
- **iOS Compatibility**: Special handling for iOS Safari limitations

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa plugin
- **Icons**: Custom icon set with maskable support
- **Notifications**: Custom notification manager with iOS support

## Project Structure

```
job-seeker-pwa/
├── app/                     # Next.js 13+ App Router
│   ├── components/          # React components
│   │   ├── IOSDebugInfo.tsx        # iOS debugging component
│   │   ├── IOSInstallPrompt.tsx    # iOS install prompt
│   │   ├── NotificationPermission.tsx  # Permission management
│   │   └── NotificationTest.tsx    # Notification testing
│   ├── utils/              # Utility functions
│   │   └── notifications.ts # Notification manager
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── public/                 # Static assets
│   ├── manifest.json       # PWA manifest
│   ├── sw-custom.js        # Custom service worker
│   └── icon-*.png          # App icons (various sizes)
├── scripts/                # Build scripts (excluded from deployment)
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vercel.json             # Vercel deployment config
└── tsconfig.json           # TypeScript configuration
```

## Testing Notifications

### Desktop Testing
1. Open the app in Chrome/Firefox/Safari
2. Go to `/notifications` page
3. Enable permissions and test different notification types

### iOS Testing
1. Open in Safari on iPhone (iOS 16.4+)
2. Install to home screen via share menu
3. Open from home screen icon
4. Navigate to notifications page
5. Enable permissions and test

### Debug Information
- The app includes comprehensive debugging tools
- Check browser console for detailed logs
- Use the debug panels in the notification components

## Icon Generation

The app includes scripts to generate icons from SVG:

```bash
# Generate regular icons
node scripts/generate-icons.js

# Generate maskable icons (with padding)
node scripts/generate-maskable-icons.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both desktop and mobile
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).