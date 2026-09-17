import type { Order } from '@/model/types'
import { SEED_ITEMS } from './seed-products'
import { SEED_CUSTOMERS } from './seed-customers'
import { normalizePhone } from '@/model/phone'

/* Verified (Lunas) Golden Sale orders inside the campaign window so Klasemen is populated on first load. */
const item = (code: string) => SEED_ITEMS.find(i => i.code === code)!
const line = (code: string, qty: number) => { const it = item(code); return { itemId: it.id, code: it.code, name: it.name, qty, promoPrice: it.promoPrice, realPrice: it.realPrice } }
const cust = (id: string) => SEED_CUSTOMERS.find(c => c.id === id)!

function mk(n: number, custId: string, day: number, lines: ReturnType<typeof line>[], status: Order['status'] = 'Lunas'): Order {
  const c = cust(custId)
  const total = lines.reduce((s, l) => s + l.qty * l.promoPrice, 0)
  const savings = lines.reduce((s, l) => s + l.qty * (l.realPrice - l.promoPrice), 0)
  const createdAt = `2026-09-${String(day).padStart(2, '0')}T10:${String(10 + n).padStart(2, '0')}:00.000Z`
  return {
    id: `GS-202609-${String(n).padStart(4, '0')}`,
    createdAt,
    expiresAt: createdAt,
    status,
    buyer: { name: c.pic, laundry: c.outlet, phone: normalizePhone(c.hp) || '', email: c.email },
    crmCustomerId: c.id,
    fulfil: { mode: n % 3 === 0 ? 'kirim' : 'ambil', outlet: c.kota, address: n % 3 === 0 ? `Jl. Contoh No. ${n}, ${c.kota}` : undefined },
    payment: { method: 'QRIS', proofName: status === 'Menunggu Pembayaran' ? undefined : 'bukti-transfer.jpg', uploadedAt: status === 'Menunggu Pembayaran' ? undefined : createdAt },
    lines, total, savings,
    consentAt: createdAt,
    verifiedAt: status === 'Lunas' ? createdAt : undefined,
  }
}

export const SEED_ORDERS: Order[] = [
  mk(1, 'C-2026-0049', 1, [line('000148', 6), line('000244', 4), line('000031', 3)]),
  mk(2, 'C-2026-0019', 1, [line('000004', 10), line('000122', 10)]),
  mk(3, 'C-2026-0025', 2, [line('000448', 1), line('000202', 2)]),
  mk(4, 'C-2026-0047', 2, [line('000148', 3), line('000553', 5)]),
  mk(5, 'C-2026-0041', 3, [line('000031', 2), line('000305', 12)]),
  mk(6, 'C-2026-0028', 3, [line('000216', 1), line('000004', 4)]),
  mk(7, 'C-2026-0042', 4, [line('000244', 2), line('000401', 1)]),
  mk(8, 'C-2026-0011', 4, [line('000122', 8), line('000148', 2)]),
  mk(9, 'C-2026-0046', 4, [line('000553', 3)]),
  mk(10, 'C-2026-0050', 4, [line('000305', 4)]),
  mk(11, 'C-2026-0044', 4, [line('000004', 2)], 'Bukti Diunggah'),
  mk(12, 'C-2026-0022', 4, [line('000226', 1)], 'Ditolak'),
]
