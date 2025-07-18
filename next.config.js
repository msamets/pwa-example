/** @type {import('next').NextConfig} */
// Temporarily disable next-pwa to use manual service worker registration
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   sw: 'sw-custom.js', // Use our custom service worker with notification handling
//   customWorkerDir: 'public',
//   // Runtime caching configuration
//   runtimeCaching: [
//     {
//       urlPattern: /^https?.*/,
//       handler: 'NetworkFirst',
//       options: {
//         cacheName: 'offlineCache',
//         expiration: {
//           maxEntries: 200,
//         },
//       },
//     },
//   ],
//   buildExcludes: [/middleware-manifest\.json$/],
//   // disable: process.env.NODE_ENV === 'development'
// })

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

// Use withPWA(nextConfig) when re-enabling next-pwa
module.exports = nextConfig