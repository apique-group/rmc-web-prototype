import type { GoldenSaleItem } from '@/model/types'

/* Subset of crm-apique RESIQUE_PRODUCTS (data.jsx:482+), chemical & shoes-care lines.
   Promo ≈ 85% of list price rounded to Rp500. Quota/limit 🟣 configurable (0 = unlimited). */
const promo = (p: number) => Math.round((p * 0.85) / 500) * 500

const raw: Omit<GoldenSaleItem, 'id' | 'promoPrice' | 'image' | 'quota' | 'maxPerCustomer' | 'active'>[] = [
  { code: '000004', name: 'Duta Deterjen 5L',                          cat: 'Perlengkapan Pakaian', unit: 'L',   realPrice: 70_000 },
  { code: '000031', name: 'Molto Parfum Laundry Purple Delight 5L',    cat: 'Perlengkapan Pakaian', unit: 'L',   realPrice: 165_000 },
  { code: '000122', name: 'So Klin Detergent Matic Professional 5L',   cat: 'Perlengkapan Pakaian', unit: 'L',   realPrice: 68_000 },
  { code: '000148', name: 'Whiff Fresh Parfum Finishing Elegant 5L',   cat: 'Perlengkapan Pakaian', unit: 'L',   realPrice: 255_000 },
  { code: '000244', name: 'Greendome Parfum Downy Black 5L',           cat: 'Perlengkapan Pakaian', unit: 'L',   realPrice: 210_000 },
  { code: '000305', name: 'Rinso Matic Profesional 1.65L',             cat: 'Perlengkapan Pakaian', unit: 'L',   realPrice: 28_500 },
  { code: '000553', name: 'Xtra Bersih Detergent Cair 5L',             cat: 'Perlengkapan Pakaian', unit: 'L',   realPrice: 80_000 },
  { code: '000202', name: 'BARA Premium Apparel Cleaner 250ML',        cat: 'Shoes',                unit: 'pcs', realPrice: 125_000 },
  { code: '000401', name: 'KAME Natural Shoes & Apparel Cleaner 250ML', cat: 'Shoes',               unit: 'pcs', realPrice: 99_000 },
  { code: '000226', name: 'Glad Cleaner & Conditioner 1000ML',         cat: 'Shoes',                unit: 'pcs', realPrice: 140_000 },
  { code: '000448', name: 'KAME Paket Sepatu',                         cat: 'Shoes',                unit: 'set', realPrice: 750_000 },
  { code: '000216', name: 'Daijin Timbangan Digital 30KG',             cat: 'HouseHold',            unit: 'pcs', realPrice: 470_000 },
]

/* R.050 — Paket Usaha: the four bundles of crm-apique RESIQUE_PACKAGES (data.jsx X.216), sold at ONE price for the set.
   Promo = 10% off the package price, rounded to Rp1.000. Contents summarised in `desc`; photos are laundromat placeholders (see public/img/CREDITS.md). */
const promoPkg = (p: number) => Math.round((p * 0.9) / 1000) * 1000
const rawPkg: { code: string; name: string; realPrice: number; desc: string }[] = [
  { code: 'PKG-001', name: 'Paket Usaha 1', realPrice: 24_999_000, desc: '1 dryer konversi + 1 washer 8,5 kg, boiler, meja & kepala setrika, timbangan, rak, plastik, chemical 5L (parfum, deterjen, softener), brosur & banner.' },
  { code: 'PKG-002', name: 'Paket Usaha 2', realPrice: 39_999_000, desc: '2 dryer konversi + 2 washer 8,5 kg untuk volume harian tinggi, boiler, meja & kepala setrika, timbangan, rak, plastik, chemical 5L, brosur & banner.' },
  { code: 'PKG-003', name: 'Paket Usaha 3', realPrice: 39_999_000, desc: 'LG Washer Home 20 kg + LG Dryer Giant Max, boiler, meja & kepala setrika, timbangan, rak, plastik, chemical 5L, brosur & banner.' },
  { code: 'PKG-004', name: 'Paket Usaha 4', realPrice: 69_999_000, desc: '2 LG Washer Home 20 kg + 2 Dryer Giant Max untuk outlet skala penuh, boiler, meja & kepala setrika, timbangan, rak, plastik, chemical 5L, brosur & banner.' },
]
export const SEED_PACKAGES: GoldenSaleItem[] = rawPkg.map(r => ({
  id: `gs-${r.code}`,
  kind: 'paket',
  code: r.code,
  name: r.name,
  cat: 'Paket Usaha',
  unit: 'paket',
  realPrice: r.realPrice,
  promoPrice: promoPkg(r.realPrice),
  desc: r.desc,
  image: `/img/paket-${r.code}.jpg`,
  quota: 0,
  maxPerCustomer: 0,
  active: true,
}))

export const SEED_PRODUCTS: GoldenSaleItem[] = raw.map(r => ({
  id: `gs-${r.code}`,
  ...r,
  promoPrice: promo(r.realPrice),
  image: `/img/product-${r.code}.jpg`, // real photo per product (Lurd rule 5); admin can replace it
  quota: 0,
  maxPerCustomer: 0,
  active: true,
}))

/** Golden Sale catalogue: packages first (the landing shows "Diskon Paket" above "Diskon Item"), then items. */
export const SEED_ITEMS: GoldenSaleItem[] = [...SEED_PACKAGES, ...SEED_PRODUCTS]
