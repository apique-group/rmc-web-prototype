import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Kota, Order, OrderLine, OrderStatus } from '@/model/types'
import { SEED_ORDERS } from '@/data/seed-orders'
import { persistOpts, syncAcrossTabs } from './persist'
import { nextOrderNo } from '@/lib/id'
import { nowISO } from '@/lib/format'
import { normalizePhone } from '@/model/phone'
import { useAccounts } from './accounts'
import { useCrm } from './crm'
import { useInbox } from './inbox'
import { cfg } from './config'

export interface CheckoutInput {
  name: string
  laundry: string
  phone: string
  email: string
  /** "Saya bersedia untuk dihubungi tim Resique lebih lanjut terkait transaksi ini" */
  consent: boolean
  mode: 'PICKUP' | 'DELIVERY'
  outlet?: Kota
  address?: string
  lines: OrderLine[]
  method: 'QRIS' | 'VA' | 'EWALLET'
  note?: string
  /** guest answered the identity-match dialog (staging buyer.matchDecision) */
  matchDecision?: { customerId: string; confirmed: boolean }
}

/** staging orderLimiter: too many orders from one buyer in a short window are refused */
const RATE_LIMIT = { max: 5, windowMs: 60_000 }

interface OrdersState {
  orders: Order[]
  create: (input: CheckoutInput) => Order
  uploadProof: (orderId: string, file: { name: string; type: string; dataUrl: string }) => Order | undefined
  setStatus: (orderId: string, status: OrderStatus, reason?: string) => void
  expireStale: () => number
  importRows: (rows: Order[]) => number
  reset: () => void
}

export const useOrders = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: SEED_ORDERS,

      create: input => {
        const phone = normalizePhone(input.phone) || input.phone
        const recent = get().orders.filter(o => o.buyer.phone === phone && Date.now() - Date.parse(o.createdAt) < RATE_LIMIT.windowMs).length
        if (recent >= RATE_LIMIT.max) throw new Error('Terlalu banyak percobaan order, coba lagi nanti.')
        const acc = useAccounts.getState().byPhone(phone)
        // customer link: the account's customer → a CRM customer with this phone → the identity-match answer (guest, confirmed only)
        const crmCust = acc?.crmCustomerId || useCrm.getState().customers.find(c => normalizePhone(c.hp) === phone)?.id || (input.matchDecision?.confirmed ? input.matchDecision.customerId : undefined)
        const total = input.lines.reduce((s, l) => s + l.qty * l.promoPrice, 0)
        const savings = input.lines.reduce((s, l) => s + l.qty * (l.realPrice - l.promoPrice), 0)
        const now = new Date()
        const order: Order = {
          id: nextOrderNo(get().orders, now),
          createdAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + cfg().payment.qrTimeoutSec * 1000).toISOString(),
          status: 'AWAITING_PAYMENT',
          buyer: { name: input.name.trim(), laundry: input.laundry.trim(), phone, email: input.email.trim().toLowerCase(), matchDecision: input.matchDecision },
          accountId: acc?.id,
          crmCustomerId: crmCust,
          fulfil: { mode: input.mode, outlet: input.outlet, address: input.mode === 'DELIVERY' ? input.address?.trim() : undefined },
          payment: { method: input.method },
          lines: input.lines, total, savings, note: input.note,
          consentAt: input.consent ? now.toISOString() : undefined,
        }
        set({ orders: [order, ...get().orders] })
        useCrm.getState().log('Pesanan Golden Sale dibuat', `${order.id} · ${order.buyer.laundry} · Rp${total.toLocaleString('id-ID')}${acc ? ' · terhubung akun' : crmCust ? ' · terhubung pelanggan CRM' : ' · tamu'}`)
        return order
      },

      // staging: proof is accepted while AWAITING_PAYMENT and also after EXPIRED (a late transfer still has to reach staff for manual verification)
      uploadProof: (orderId, file) => {
        const o = get().orders.find(x => x.id === orderId)
        if (!o || (o.status !== 'AWAITING_PAYMENT' && o.status !== 'EXPIRED')) return undefined
        const late = o.status === 'EXPIRED' || Date.parse(o.expiresAt) < Date.now()
        const row: Order = { ...o, status: 'PROOF_UPLOADED', payment: { ...o.payment, proofName: file.name, proofType: file.type, proofDataUrl: file.dataUrl, uploadedAt: nowISO(), proofLate: late || undefined } }
        set({ orders: get().orders.map(x => x.id === orderId ? row : x) })
        useCrm.getState().log('Bukti pembayaran diunggah', `${orderId} · ${file.name}`)
        return row
      },

      setStatus: (orderId, status, reason) => {
        const o = get().orders.find(x => x.id === orderId)
        if (!o) return
        const row: Order = { ...o, status, verifiedAt: status === 'PAID' ? nowISO() : o.verifiedAt, rejectReason: status === 'REJECTED' ? reason : undefined, cancelReason: status === 'CANCELLED' ? reason : undefined }
        set({ orders: get().orders.map(x => x.id === orderId ? row : x) })
        useCrm.getState().log(`Status pesanan → ${status}`, `${orderId}${reason ? ' · ' + reason : ''}`)
        if (status === 'PAID' || status === 'REJECTED') {
          const acc = o.accountId ? useAccounts.getState().accounts.find(a => a.id === o.accountId) : undefined
          if (acc) useInbox.getState().send(acc.email, status === 'PAID' ? `Pembayaran ${orderId} terverifikasi` : `Pembayaran ${orderId} ditolak`, status === 'PAID' ? `Halo ${acc.pic},\n\nPembayaran pesanan ${orderId} sudah kami verifikasi. Terima kasih sudah belanja di Golden Sale!\n\nTim Resique` : `Halo ${acc.pic},\n\nBukti pembayaran ${orderId} tidak dapat kami verifikasi${reason ? ': ' + reason : ''}. Hubungi sales Resique.\n\nTim Resique`)
        }
      },

      expireStale: () => {
        const now = nowISO()
        let n = 0
        set({ orders: get().orders.map(o => { if (o.status === 'AWAITING_PAYMENT' && o.expiresAt < now) { n++; return { ...o, status: 'EXPIRED' as OrderStatus } } return o }) })
        return n
      },

      importRows: rows => {
        const existing = new Set(get().orders.map(o => o.id))
        const fresh = rows.filter(r => r && r.id && !existing.has(r.id))
        set({ orders: [...fresh, ...get().orders] })
        return fresh.length
      },

      reset: () => set({ orders: SEED_ORDERS }),
    }),
    persistOpts<OrdersState>('orders'),
  ),
)
syncAcrossTabs(useOrders)

/** Klasemen rows: Lunas orders inside the campaign window, grouped by buyer phone (or laundry). */
export function klasemen(orders: Order[], start: string, end: string) {
  const s = start.slice(0, 10), e = end.slice(0, 10) + 'T23:59:59'
  const m = new Map<string, { key: string; laundry: string; pic: string; phone: string; spend: number; orders: number; accountId?: string; crmCustomerId?: string }>()
  orders.filter(o => o.status === 'PAID' && o.createdAt >= s && o.createdAt <= e).forEach(o => {
    const key = o.crmCustomerId || o.accountId || o.buyer.phone || o.buyer.laundry.toLowerCase()
    const cur = m.get(key) || { key, laundry: o.buyer.laundry, pic: o.buyer.name, phone: o.buyer.phone, spend: 0, orders: 0, accountId: o.accountId, crmCustomerId: o.crmCustomerId }
    cur.spend += o.total; cur.orders += 1
    if (!cur.accountId && o.accountId) cur.accountId = o.accountId
    m.set(key, cur)
  })
  return [...m.values()].sort((a, b) => b.spend - a.spend || a.laundry.localeCompare(b.laundry)).map((r, i) => ({ ...r, rank: i + 1 }))
}
