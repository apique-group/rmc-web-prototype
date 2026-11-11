import axios, { type AxiosInstance } from 'axios'
import { mockAdapter } from '@/lib/api/mock/server'

/* Same shape as apique-web-rmc/src/lib/api/client.ts. The prototype has no backend yet: with no
   NEXT_PUBLIC_RMC_API_URL every request is answered in this browser by lib/api/mock/server.ts
   (stand-in for crm-rsq-service). Setting the URL sends the same calls to the real service. */
export function createApiClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
    adapter: baseURL ? undefined : mockAdapter,
  })
}

/** One client for the member plane (/member/…) and the config surface (/admin/…). */
export const rmcClient = createApiClient(process.env.NEXT_PUBLIC_RMC_API_URL || '')
