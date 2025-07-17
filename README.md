# Job Seeker PWA

A modern Progressive Web App (PWA) built with Next.js, React, and TypeScript for job seekers. This app provides a mobile-first experience with offline capabilities and can be installed like a native app.

## Features

- 📱 **Mobile-First Design**: Optimized for mobile devices with responsive design
- 🔄 **Offline Support**: Works even when you're not connected to the internet
- ⚡ **Lightning Fast**: Built with Next.js for optimal performance
- 📦 **Installable**: Can be installed on devices like a native app
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS

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

## PWA Features

This app includes:

- **Web App Manifest**: Allows installation on devices
- **Service Worker**: Enables offline functionality and caching
- **Responsive Design**: Works on all screen sizes
- **Fast Loading**: Optimized for performance

## Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa plugin
- **Icons**: Custom icon set

## Project Structure

```
job-seeker-pwa/
├── app/                 # Next.js 13+ App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── public/             # Static assets
│   ├── manifest.json   # PWA manifest
│   └── icons/          # App icons
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Adding Icons

To replace the placeholder icons, add PNG files to the `public/` directory with the following sizes:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).