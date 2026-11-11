import { rmcClient } from '@/lib/api/client'
import type { Redemption } from '@/types/member'

export const profileApi = {
  /** POST /member/redemptions — swap points for a prize; the prize stock goes down by one. */
  redeemPrize: async (input: { accountId: string; prizeId: string; balanceAfter: number }) => (await rmcClient.post<Redemption>('/member/redemptions', input)).data,
}
