import { rmcClient } from '@/lib/api/client'
import type { Config } from '@/types/member'

/* apique-web-rmc features/landing/api/landing.api.ts. Staging reads prizes, tiers, golden-sale items and the
   campaign separately; the prototype serves them as one config (lib/api/mock/server.ts). */
export const landingApi = {
  /** GET /member/config — tiers, prizes, golden-sale products and packages, site content */
  getConfig: async () => (await rmcClient.get<Config>('/member/config')).data,
}
