import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GoldenSaleItem, GoldenSalePackage, OrderLine } from '@/model/types'
import { persistOpts } from './persist'

/* Cart = two independent key spaces, like staging (rmcweb cart store): `qty` per item id and `pkgQty`
   per package id. A package is capped by its own maxPerCustomer; its contents never count toward the
   per-item caps (staging orders.routes.ts). */
interface CartState {
  qty: Record<string, number>
  pkgQty: Record<string, number>
  set: (itemId: string, qty: number) => void
  inc: (itemId: string, max?: number) => void
  dec: (itemId: string) => void
  setPkg: (packageId: string, qty: number) => void
  incPkg: (packageId: string, max?: number) => void
  decPkg: (packageId: string) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      qty: {},
      pkgQty: {},
      set: (id, q) => { const qty = { ...get().qty }; if (q <= 0) delete qty[id]; else qty[id] = q; set({ qty }) },
      inc: (id, max) => { const cur = get().qty[id] || 0; if (max && max > 0 && cur >= max) return; get().set(id, cur + 1) },
      dec: id => get().set(id, (get().qty[id] || 0) - 1),
      setPkg: (id, q) => { const pkgQty = { ...get().pkgQty }; if (q <= 0) delete pkgQty[id]; else pkgQty[id] = q; set({ pkgQty }) },
      incPkg: (id, max) => { const cur = get().pkgQty[id] || 0; if (max && max > 0 && cur >= max) return; get().setPkg(id, cur + 1) },
      decPkg: id => get().setPkg(id, (get().pkgQty[id] || 0) - 1),
      clear: () => set({ qty: {}, pkgQty: {} }),
    }),
    persistOpts<CartState>('cart'),
  ),
)

export function cartLines(qty: Record<string, number>, items: GoldenSaleItem[]): OrderLine[] {
  return Object.entries(qty)
    .map(([id, q]): OrderLine | null => { const it = items.find(i => i.id === id); return it && q > 0 ? { itemId: it.id, code: it.code, name: it.name, qty: q, promoPrice: it.promoPrice, realPrice: it.realPrice } : null })
    .filter((x): x is OrderLine => x !== null)
}
export function cartPackageLines(pkgQty: Record<string, number>, packages: GoldenSalePackage[]): OrderLine[] {
  return Object.entries(pkgQty || {})
    .map(([id, q]): OrderLine | null => { const p = packages.find(x => x.id === id); return p && q > 0 ? { packageId: p.id, code: p.code, name: p.name, qty: q, promoPrice: p.promoPrice, realPrice: p.realPrice } : null })
    .filter((x): x is OrderLine => x !== null)
}
export const isPackageLine = (l: OrderLine) => !!l.packageId
export const lineKey = (l: OrderLine) => l.packageId ? `p:${l.packageId}` : `i:${l.itemId}`
export const cartTotal = (lines: OrderLine[]) => lines.reduce((s, l) => s + l.qty * l.promoPrice, 0)
export const cartCount = (lines: OrderLine[]) => lines.reduce((s, l) => s + l.qty, 0)
export const cartSavings = (lines: OrderLine[]) => lines.reduce((s, l) => s + l.qty * (l.realPrice - l.promoPrice), 0)

type OrderLike = { status: string; lines: OrderLine[]; buyer?: { phone: string } }
const live = (o: OrderLike) => o.status !== 'Ditolak' && o.status !== 'Kedaluwarsa' && o.status !== 'Dibatalkan'

/** Units of an item already in this phone's live orders (Menunggu / Bukti / Lunas), for maxPerCustomer.
    Package contents do not count here (a package has its own cap). */
export function boughtQty(orders: OrderLike[], phone: string | null, itemId: string) {
  if (!phone) return 0
  return orders.filter(o => o.buyer?.phone === phone && live(o))
    .reduce((s, o) => s + o.lines.filter(l => l.itemId === itemId).reduce((t, l) => t + l.qty, 0), 0)
}
export function boughtPkgQty(orders: OrderLike[], phone: string | null, packageId: string) {
  if (!phone) return 0
  return orders.filter(o => o.buyer?.phone === phone && live(o))
    .reduce((s, o) => s + o.lines.filter(l => l.packageId === packageId).reduce((t, l) => t + l.qty, 0), 0)
}

/** Units of an item taken by live orders across everyone: direct item lines PLUS the item's share inside
    every package line (contents × package qty). This is the live "remaining quota" counter of staging,
    which is decremented when an order is created and restored when it is rejected or expires. */
export function soldQty(orders: OrderLike[], itemId: string, packages: GoldenSalePackage[] = []) {
  return orders.filter(live).reduce((s, o) => s + o.lines.reduce((t, l) => {
    if (l.itemId === itemId) return t + l.qty
    if (l.packageId) { const p = packages.find(x => x.id === l.packageId); const c = p?.items.find(x => x.itemId === itemId); return c ? t + c.qty * l.qty : t }
    return t
  }, 0), 0)
}
/** Remaining units of an item (Infinity when quota is unlimited / null). */
export function itemLeft(it: GoldenSaleItem, orders: OrderLike[], packages: GoldenSalePackage[] = []) {
  return it.quota === null || it.quota === undefined ? Infinity : Math.max(0, it.quota - soldQty(orders, it.id, packages))
}
/** Remaining sets of a package = min over its contents of floor(item left ÷ qty); Infinity when every
    content item is unlimited; 0 when a content item is missing or inactive. */
export function packageRemaining(p: GoldenSalePackage, items: GoldenSaleItem[], orders: OrderLike[], packages: GoldenSalePackage[]) {
  let left = Infinity
  for (const c of p.items) {
    const it = items.find(i => i.id === c.itemId)
    if (!it || !it.active) return 0
    const l = itemLeft(it, orders, packages)
    if (Number.isFinite(l)) left = Math.min(left, Math.floor(l / Math.max(1, c.qty)))
  }
  return left
}
