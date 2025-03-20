/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  distDir: 'dist',
  outputFileTracingIncludes: {},
  outputFileTracingExcludes: { '*': true },
}

module.exports = nextConfig 