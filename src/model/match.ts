/* ---------------------------------------------------------------------------
   Registration → CRM matching cascade (PRD Fitur 2, BR-2.x). Pure function; side effects
   (email, backfill, claim, lead) are applied by the accounts store.

   1. phone exact                       → LINKED
   2. RSL card no + PIC name ≥ threshold → PENDING (staging autoLinkPath2 = false; sales confirms, phone backfilled on approval)
   3. laundry+PIC fuzzy ≥ threshold     → PENDING (sales confirms via Klaim Akun)
   4. otherwise                         → NEW_CUSTOMER (a new Customer is created in CRM Resique, not a Lead)
   --------------------------------------------------------------------------- */
import type { CrmCustomer, LinkStatus, MatchPath } from './types'
import { normalizePhone } from './phone'
import { dice } from './similarity'

export interface RegistrationInput { phone: string; laundry: string; pic: string; rsl?: string }
export interface MatchResult { path: MatchPath; link: LinkStatus; customer: CrmCustomer | null; score: number; backfillPhone: boolean }

export function scoreCustomer(reg: RegistrationInput, c: CrmCustomer): number {
  return 0.6 * dice(reg.laundry, c.outlet) + 0.4 * dice(reg.pic, c.pic)
}

export function matchRegistration(reg: RegistrationInput, customers: CrmCustomer[], threshold = 0.8): MatchResult {
  const phone = normalizePhone(reg.phone)

  // 1. phone exact
  if (phone) {
    const c = customers.find(x => normalizePhone(x.hp) === phone)
    if (c) return { path: 1, link: 'LINKED', customer: c, score: 1, backfillPhone: false }
  }

  // 2. member card number + PIC name
  const card = (reg.rsl || '').trim().toUpperCase().replace(/[\s-]/g, '')
  if (card) {
    const c = customers.find(x => (x.rsl || '').toUpperCase() === card)
    if (c) {
      const s = dice(reg.pic, c.pic)
      if (s >= threshold) return { path: 2, link: 'PENDING', customer: c, score: s, backfillPhone: !normalizePhone(c.hp) }
    }
  }

  // 3. fuzzy laundry + PIC
  let best: CrmCustomer | null = null, bestScore = 0
  for (const c of customers) {
    const s = scoreCustomer(reg, c)
    if (s > bestScore) { bestScore = s; best = c }
  }
  if (best && bestScore >= threshold) return { path: 3, link: 'PENDING', customer: best, score: bestScore, backfillPhone: false }

  // 4. new lead
  return { path: 4, link: 'NEW_CUSTOMER', customer: null, score: bestScore, backfillPhone: false }
}

/** Checkout identity match for GUESTS (staging matchCheckoutIdentityWithPhone): a CRM customer with the same phone is
    linked silently; otherwise the best laundry-name match ≥ threshold is offered as a candidate the buyer must confirm
    ("Apakah benar Anda terdaftar sebagai outlet berikut?"). Never exposes the candidate's phone or e-mail. */
export interface CheckoutCandidate { id: string; outlet: string; pic: string; kota: string; rsl?: string; score: number }
export function matchCheckoutIdentity(input: { laundry: string; phone: string }, customers: CrmCustomer[], threshold = 0.8): { byPhone: CrmCustomer } | { candidate: CheckoutCandidate } | null {
  const phone = normalizePhone(input.phone)
  const c = phone ? customers.find(x => normalizePhone(x.hp) === phone) : undefined
  if (c) return { byPhone: c }
  let best: CrmCustomer | null = null, bestScore = 0
  for (const x of customers) { const s = dice(input.laundry, x.outlet); if (s > bestScore) { bestScore = s; best = x } }
  if (!best || bestScore < threshold) return null
  return { candidate: { id: best.id, outlet: best.outlet, pic: best.pic, kota: best.kota, rsl: best.rsl, score: bestScore } }
}
