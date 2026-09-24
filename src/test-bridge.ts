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
import { currentWindow, tierForSpend, rmcFor } from '@/model/rmc'
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
  model: {
    normalizePhone, dice, normName, matchRegistration, checkPassword, genTempPassword, currentWindow, tierForSpend, rmcFor,
    tiers: DEFAULT_CONFIG.tiers, seedCustomers: SEED_CUSTOMERS,
  },
}
