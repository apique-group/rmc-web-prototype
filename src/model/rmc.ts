/* ---------------------------------------------------------------------------
   RMC model, TypeScript port of crm-apique src/rmc.jsx (X.104/X.108), parameterized by config.
   Tier = fixed 6-month window (H1 Jan–Jun / H2 Jul–Des) spend; points = yearly spend ÷ earnPerRp.
   Source policy: Kebijakan Program RMC v2.0 (RSQ-RMC-001).
   --------------------------------------------------------------------------- */
import type { Account, Config, CrmCustomer, LedgerEntry, Order, Redemption, Tier } from './types'

export interface Window6 { label: string; start: string; end: string; year: number; half: 'H1' | 'H2' }

export function currentWindow(today: Date = new Date()): Window6 {
  const y = today.getFullYear()
  const h1 = today.getMonth() <= 5
  return h1
    ? { label: `H1 ${y} · Jan–Jun`, start: `${y}-01-01`, end: `${y}-06-30`, year: y, half: 'H1' }
    : { label: `H2 ${y} · Jul–Des`, start: `${y}-07-01`, end: `${y}-12-31`, year: y, half: 'H2' }
}

export function tierForSpend(tiers: Tier[], spend6: number): Tier {
  for (let i = tiers.length - 1; i >= 0; i--) if (spend6 >= tiers[i].min) return tiers[i]
  return tiers[0]
}
export function nextTier(tiers: Tier[], tier: Tier): Tier | null {
  const i = tiers.findIndex(t => t.key === tier.key)
  return i >= 0 && i < tiers.length - 1 ? tiers[i + 1] : null
}
export const pointsFromSpend = (spend: number, earnPerRp: number) => Math.floor(Math.max(0, spend) / (earnPerRp || 1000))

/** Mitra Apique Management: floor discount applies while tier is below the first tier that beats it. */
export function effectiveDiscount(cfg: Config, tier: Tier, isMitra: boolean): number {
  return isMitra ? Math.max(cfg.mitraFloorDiscount, tier.discount) : tier.discount
}

export interface RmcSummary {
  win: Window6
  spend6: number
  rerata: number
  tier: Tier
  next: Tier | null
  toNext: number
  progress: number
  pointsEarned: number
  pointsRedeemed: number
  points: number
  discount: number
  monthly: { ym: string; spend: number; points: number }[]
}

const ym = (iso: string) => iso.slice(0, 7)

/** Everything the profile needs. Ledger = seeded CRM monthly spend + Lunas Golden Sale orders. */
export function rmcFor(
  cfg: Config,
  cust: CrmCustomer | null,
  orders: Order[],
  redemptions: Redemption[],
  accountId: string,
  isMitra: boolean,
  today: Date = new Date(),
): RmcSummary {
  const win = currentWindow(today)
  const monthlyMap: Record<string, number> = { ...(cust?.monthly || {}) }
  orders
    .filter(o => o.status === 'PAID' && (o.accountId === accountId || (cust && o.crmCustomerId === cust.id)))
    .forEach(o => { const k = ym(o.createdAt); monthlyMap[k] = (monthlyMap[k] || 0) + o.total })

  const inWin = (k: string) => k >= win.start.slice(0, 7) && k <= win.end.slice(0, 7)
  const spend6 = Object.entries(monthlyMap).filter(([k]) => inWin(k)).reduce((s, [, v]) => s + v, 0)

  const tier = tierForSpend(cfg.tiers, spend6)
  const next = nextTier(cfg.tiers, tier)
  const toNext = next ? Math.max(0, next.min - spend6) : 0
  // staging: progress = round(spend6 / next.min × 100), capped at 100 (0..1 here, the UI multiplies)
  const progress = next ? (next.min > 0 ? Math.min(1, Math.round((spend6 / next.min) * 100) / 100) : 1) : 1

  // staging sums ledger rows (each earn row floored on its own); here a row = a month of spend, so the year's points = Σ floor(month / earnPerRp)
  const yearPoints = Object.entries(monthlyMap).filter(([k]) => k.startsWith(String(win.year))).reduce((s, [, v]) => s + pointsFromSpend(v, cfg.rules.earnPerRp), 0)
  const pointsEarned = yearPoints + (cust?.priorPointsEarned || 0)
  const pointsRedeemed = redemptions.filter(r => r.accountId === accountId).reduce((s, r) => s + r.points, 0)
  const points = Math.max(0, pointsEarned - pointsRedeemed)

  // last 12 months, oldest → newest
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthly = months.map(k => ({ ym: k, spend: monthlyMap[k] || 0, points: pointsFromSpend(monthlyMap[k] || 0, cfg.rules.earnPerRp) }))

  return { win, spend6, rerata: Math.round(spend6 / 6), tier, next, toNext, progress, pointsEarned, pointsRedeemed, points, discount: effectiveDiscount(cfg, tier, isMitra), monthly }
}

/* ------------------------------------------------------------------ R.054 — staging shapes ------------------------------------------------------------------ */

/** GET /member/profile/rmc (linked) as staging answers it: progress in %, monthly[12] {ym, value = points}. */
export function toProfileRmc(r: RmcSummary, account: Account, cust: CrmCustomer | null, isMitra: boolean) {
  return {
    linked: true as const,
    tier: r.tier.key, tierName: r.tier.name, discount: r.discount, points: r.points, spend6: r.spend6,
    rsl: cust?.rsl || account.rsl || null,
    next: r.next ? r.next.key : null, toNext: r.toNext, progress: Math.round(r.progress * 100),
    monthly: r.monthly.map(m => ({ ym: m.ym, value: m.points })),
    isMitra,
  }
}

/** GET /member/profile/ledger, derived: one earn row per month of outlet spend (seeded CRM), one per Lunas Golden Sale order,
    a bonus row for the opening balance, a redeem row per prize redemption; newest first, balanceAfter runs from the oldest row. */
export function ledgerFor(cfg: Config, cust: CrmCustomer | null, orders: Order[], redemptions: Redemption[], accountId: string): LedgerEntry[] {
  const earn = cfg.rules.earnPerRp || 1000
  const rows: Omit<LedgerEntry, 'balanceAfter'>[] = []
  const monthly = { ...(cust?.monthly || {}) }
  const mine = orders.filter(o => o.status === 'PAID' && (o.accountId === accountId || (cust && o.crmCustomerId === cust.id)))
  // Golden Sale orders are their own rows; the seeded monthly spend stays a per-month row
  mine.forEach(o => rows.push({ id: `L-${o.id}`, type: 'earn', points: pointsFromSpend(o.total, earn), at: o.createdAt, note: `Belanja Golden Sale ${o.id}`, refType: 'golden_sale' }))
  Object.entries(monthly).forEach(([ym, v]) => {
    if (v <= 0) return
    const [y, mo] = ym.split('-').map(Number)
    const last = new Date(y, mo, 0)
    const at = last.getTime() > Date.now() ? new Date().toISOString() : `${ym}-${String(last.getDate()).padStart(2, '0')}T12:00:00.000Z`
    rows.push({ id: `L-${ym}`, type: 'earn', points: pointsFromSpend(v, earn), at, note: `Belanja outlet ${last.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`, refType: 'pos' })
  })
  if (cust?.priorPointsEarned) rows.push({ id: 'L-opening', type: 'bonus', points: cust.priorPointsEarned, at: `${new Date().getFullYear()}-01-01T00:00:00.000Z`, note: 'Saldo poin awal (sebelum RMC Web)', refType: 'opening' })
  redemptions.filter(r => r.accountId === accountId).forEach(r => rows.push({ id: `L-${r.id}`, type: 'redeem', points: -r.points, at: r.at, note: `${r.prizeName} · ${r.code || r.id}`, refType: 'redemption' }))
  rows.sort((a, b) => a.at.localeCompare(b.at))
  let bal = 0
  const out: LedgerEntry[] = rows.map(r => { bal = Math.max(0, bal + r.points); return { ...r, balanceAfter: bal } })
  return out.reverse()
}
