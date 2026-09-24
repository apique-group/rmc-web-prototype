/* Test bridge, exposes store actions + pure model functions on window.__rmcweb so the Playwright
   gates (test/*.cjs) can seed state and assert model math without a Node TS toolchain.
   Harmless in production: nothing reads it, no data leaves the page. */
import { useAccounts } from '@/store/accounts'
import { useOrders } from '@/store/orders'
import { useCrm } from '@/store/crm'
import { useConfig } from '@/store/config'
import { normalizePhone } from '@/model/phone'
import { dice, normName } from '@/model/similarity'
import { matchRegistration } from '@/model/match'
import { checkPassword, genTempPassword } from '@/model/password'
import { currentWindow, tierForSpend, rmcFor, ledgerFor, toProfileRmc } from '@/model/rmc'
import { klasemen, klasemenIsYou } from '@/store/orders'
import { maskPhone } from '@/model/phone'
import { SEED_CUSTOMERS } from '@/data/seed-customers'
import { DEFAULT_CONFIG } from '@/data/seed-config'
import { parseActor } from '@/model/access'

declare global {
  interface Window { __rmcweb?: Record<string, unknown> }
}

window.__rmcweb = {
  register: (form: Parameters<ReturnType<typeof useAccounts.getState>['register']>[0]) => useAccounts.getState().register(form),
  createOrder: (input: Parameters<ReturnType<typeof useOrders.getState>['create']>[0]) => useOrders.getState().create(input),
  setStatus: (id: string, s: Parameters<ReturnType<typeof useOrders.getState>['setStatus']>[1]) => useOrders.getState().setStatus(id, s),
  crm: () => useCrm.getState(),
  orders: () => useOrders.getState().orders,
  config: () => useConfig.getState().config,
  invite: (customerId: string) => useCrm.getState().generateInvites([customerId], 'gate')[0]?.token,
  access: () => parseActor(new URLSearchParams(location.hash.split('?')[1] || '')),
  /** R.054 — staging-shaped reads */
  profileRmc: (accountId: string) => {
    const acc = useAccounts.getState().accounts.find(a => a.id === accountId); if (!acc) return null
    if (acc.link !== 'LINKED') return { linked: false, link: acc.link }
    const cust = useCrm.getState().customers.find(c => c.id === acc.crmCustomerId) || null
    const isMitra = acc.isMitra || !!cust?.mitra
    return toProfileRmc(rmcFor(useConfig.getState().config, cust, useOrders.getState().orders, useAccounts.getState().redemptions, acc.id, isMitra), acc, cust, isMitra)
  },
  ledger: (accountId: string) => {
    const acc = useAccounts.getState().accounts.find(a => a.id === accountId); if (!acc) return []
    const cust = useCrm.getState().customers.find(c => c.id === acc.crmCustomerId) || null
    return ledgerFor(useConfig.getState().config, cust, useOrders.getState().orders, useAccounts.getState().redemptions, acc.id)
  },
  klasemen: (accountId?: string) => {
    const cfg = useConfig.getState().config
    const acc = accountId ? useAccounts.getState().accounts.find(a => a.id === accountId) : null
    return klasemen(useOrders.getState().orders, cfg.campaign.start, cfg.campaign.end, cfg.klasemen.showPic).map(r => ({ rank: r.rank, label: r.label, spend: r.spend, isYou: klasemenIsYou(r, acc) }))
  },
  model: {
    normalizePhone, maskPhone, dice, normName, matchRegistration, checkPassword, genTempPassword, currentWindow, tierForSpend, rmcFor,
    tiers: DEFAULT_CONFIG.tiers, seedCustomers: SEED_CUSTOMERS,
  },
}
