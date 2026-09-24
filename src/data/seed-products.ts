import type { GoldenSaleItem, GoldenSalePackage } from '@/model/types'
import { CATALOG } from './catalog'

/* Golden Sale items: chemical & shoes-care lines from the Resique catalog (src/data/catalog.ts).
   Promo ≈ 85% of list price rounded to Rp500. Quota null = unlimited, maxPerCustomer 0 = unlimited
   (the staging admin's input format: Quota left blank = unlimited, Max per Customer 0 = tanpa batas). */
const promo = (p: number) => Math.round((p * 0.85) / 500) * 500
const SALE_CODES = ['000004', '000031', '000122', '000148', '000244', '000305', '000553', '000202', '000401', '000226', '000448', '000216']

export const SEED_ITEMS: GoldenSaleItem[] = SALE_CODES.map(code => {
  const p = CATALOG.find(c => c.code === code)!
  return {
    id: `gs-${code}`,
    code,
    name: p.name,
    cat: p.cat,
    unit: p.unit,
    realPrice: p.price,
    promoPrice: promo(p.price),
    image: `/img/product-${code}.jpg`, // real photo per product (Lurd rule 5); admin can replace it
    quota: null,
    maxPerCustomer: 0,
    active: true,
  }
})

/* R.051 — Golden Sale packages follow the staging model (GET /member/packages): a package is a bundle
   of Golden Sale ITEMS with a quantity each, sold at one price. It has no stock of its own: how many
   are left is derived from the contents (min over items of floor(item remaining ÷ qty)). The four
   seeds bundle the promo lines above; photos are laundromat placeholders (public/img/CREDITS.md). */
const item = (code: string) => SEED_ITEMS.find(i => i.code === code)!
function pkg(n: number, code: string, name: string, desc: string, contents: [string, number][], extraOff = 0.05, maxPerCustomer = 0): GoldenSalePackage {
  const realPrice = contents.reduce((s, [c, q]) => s + item(c).realPrice * q, 0)
  const promoSum = contents.reduce((s, [c, q]) => s + item(c).promoPrice * q, 0)
  return {
    id: `gsp-${code}`,
    code,
    name,
    desc,
    image: `/img/paket-PKG-00${n}.jpg`,
    realPrice,
    promoPrice: Math.round((promoSum * (1 - extraOff)) / 500) * 500,
    maxPerCustomer,
    active: true,
    items: contents.map(([c, q]) => ({ itemId: item(c).id, qty: q })),
  }
}
export const SEED_PACKAGES: GoldenSalePackage[] = [
  pkg(1, 'GS-PKG-01', 'Paket Hemat Deterjen', 'Stok deterjen sebulan untuk outlet kecil.', [['000004', 3], ['000122', 2]]),
  pkg(2, 'GS-PKG-02', 'Paket Wangi Lengkap', 'Parfum finishing premium dan softener wangi tahan lama.', [['000031', 2], ['000148', 1], ['000244', 1]], 0.05, 2),
  pkg(3, 'GS-PKG-03', 'Paket Perawatan Sepatu', 'Semua yang dibutuhkan untuk membuka layanan cuci sepatu.', [['000202', 2], ['000401', 2], ['000226', 1]]),
  pkg(4, 'GS-PKG-04', 'Paket Starter Laundry', 'Deterjen cair, deterjen matic, dan timbangan digital untuk outlet baru.', [['000553', 3], ['000305', 4], ['000216', 1]]),
]
