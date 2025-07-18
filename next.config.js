/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  sw: 'sw-custom.js', // Use our custom service worker
  // disable: process.env.NODE_ENV === 'development'
})

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = withPWA(nextConfig)