import type { Order } from '@/types/member'
import { campaignIso } from '@/lib/format'
import { maskPhone } from '@/lib/phone'

/** Klasemen rows: Lunas orders inside the campaign window, grouped by buyer phone (or laundry). */
export interface KlasemenRow { key: string; laundry: string; pic: string; phone: string; spend: number; orders: number; accountId?: string; crmCustomerId?: string; rank: number; label: string }

/** Staging GET /member/klasemen: Lunas orders inside the campaign window (ISO datetimes), grouped per customer / account / guest,
    label = "Laundry - PIC (0812****247)" (PIC only when showPic; the phone is always masked). */
export function klasemen(orders: Order[], start: string, end: string, showPic = true): KlasemenRow[] {
  const s = new Date(campaignIso(start, false)).getTime(), e = new Date(campaignIso(end, true)).getTime()
  const inWin = (iso: string) => { const t = new Date(iso).getTime(); return t >= s && t <= e }
  const m = new Map<string, { key: string; laundry: string; pic: string; phone: string; spend: number; orders: number; accountId?: string; crmCustomerId?: string }>()
  orders.filter(o => o.status === 'PAID' && inWin(o.createdAt)).forEach(o => {
    const key = o.crmCustomerId || o.accountId || o.buyer.phone || o.buyer.laundry.toLowerCase()
    const cur = m.get(key) || { key, laundry: o.buyer.laundry, pic: o.buyer.name, phone: o.buyer.phone, spend: 0, orders: 0, accountId: o.accountId, crmCustomerId: o.crmCustomerId }
    cur.spend += o.total; cur.orders += 1
    if (!cur.accountId && o.accountId) cur.accountId = o.accountId
    m.set(key, cur)
  })
  return [...m.values()].sort((a, b) => b.spend - a.spend || a.laundry.localeCompare(b.laundry))
    .map((r, i) => ({ ...r, rank: i + 1, label: `${showPic ? `${r.laundry} - ${r.pic}` : r.laundry} (${maskPhone(r.phone)})` }))
}

/** staging isYou: same CRM customer, same account, or (guest row) the same name + laundry + phone as the signed-in member */
export function klasemenIsYou(r: KlasemenRow, acc: { id: string; crmCustomerId?: string; pic: string; laundry: string; phone: string } | null | undefined): boolean {
  if (!acc) return false
  return (!!r.crmCustomerId && r.crmCustomerId === acc.crmCustomerId) || (!!r.accountId && r.accountId === acc.id)
    || (!r.crmCustomerId && !r.accountId && r.pic === acc.pic && r.laundry === acc.laundry && r.phone === acc.phone)
}
