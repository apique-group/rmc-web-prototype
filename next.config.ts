import type { NextConfig } from 'next'

/* The config surface (/admin) is embedded by the CRM prototype (Member Card (RMC) → Golden Privilege). */
const FRAME_ANCESTORS = "frame-ancestors 'self' https://crm-apique.vercel.app http://localhost:8080 http://localhost:8081"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: FRAME_ANCESTORS }] }]
  },
}

export default nextConfig
