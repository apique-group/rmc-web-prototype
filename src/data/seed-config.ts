import type { Config, Tier, Benefit, HeroPrize, Prize } from '@/model/types'
import { SEED_ITEMS, SEED_PACKAGES } from './seed-products'

/* Tiers per "Kebijakan Program RMC" RSQ-RMC-001 v2.0 (Drive 1g2OJQFKHG5zp1E4JKNfvllhaL3YSZ1tQ), the canonical source.
   Gratis ongkir: belanja ≥ Rp500.000 (Starter–Intermediate) / ≥ Rp350.000 (Winner–Ultimate). Konsultasi = sesi per BULAN,
   1 sesi = 1 jam bersama trainer Apique Academy (Winner ke atas). Bands are INCLUSIVE both ends: Starter 0–8.999.999, Beginner
   starts sharp at 9.000.000 (Lurd, 4 Sep). NOT the crm-apique prototype seed (it drifted). */
export const SEED_TIERS: Tier[] = [
  { key: 'starter',      name: 'Starter',      sw: '#6B7280', fg: '#6F7878', min: 0,           max: 8_999_999,   perMonth: '< Rp1,5 jt', discount: 0, freeDelivMin: 500_000, consult: 0, benefitCopy: 'Belum ada diskon. Gratis ongkir untuk belanja min. Rp500 rb. Poin tetap dapat: Rp1.000 = 1 poin.' },
  { key: 'beginner',     name: 'Beginner',     sw: '#56A02A', fg: '#56A02A', min: 9_000_000,   max: 17_999_999,  perMonth: 'Rp1,5–3 jt', discount: 1, freeDelivMin: 500_000, consult: 0, benefitCopy: 'Diskon 1% langsung saat transaksi. Gratis ongkir untuk belanja min. Rp500 rb.' },
  { key: 'intermediate', name: 'Intermediate', sw: '#1F6E3C', fg: '#1F6E3C', min: 18_000_000,  max: 29_999_999,  perMonth: 'Rp3–5 jt',   discount: 2, freeDelivMin: 500_000, consult: 0, benefitCopy: 'Diskon 2% langsung saat transaksi. Gratis ongkir untuk belanja min. Rp500 rb.' },
  { key: 'winner',       name: 'Winner',       sw: '#2c5282', fg: '#2c5282', min: 30_000_000,  max: 59_999_999,  perMonth: 'Rp5–10 jt',  discount: 3, freeDelivMin: 350_000, consult: 1, benefitCopy: 'Diskon 3%, gratis ongkir min. Rp350 rb, konsultasi bisnis 1 sesi per bulan.' },
  { key: 'champion',     name: 'Champion',     sw: '#5B4BD6', fg: '#5B4BD6', min: 60_000_000,  max: 119_999_999, perMonth: 'Rp10–20 jt', discount: 4, freeDelivMin: 350_000, consult: 1, benefitCopy: 'Diskon 4%, gratis ongkir min. Rp350 rb, konsultasi bisnis 1 sesi per bulan.' },
  { key: 'ultimate',     name: 'Ultimate',     sw: '#211A5A', fg: '#8A6A00', min: 120_000_000, max: null,        perMonth: '> Rp20 jt',  discount: 5, freeDelivMin: 350_000, consult: 2, benefitCopy: 'Diskon 5%, gratis ongkir min. Rp350 rb, konsultasi bisnis 2 sesi per bulan.' },
]

export const SEED_BENEFITS: Benefit[] = [
  /* R.026 (11 Sep): the four benefits of the RGP UI mock, wording verbatim (the stakeholder keeps the PDF as the landing page). */
  { id: 'b-diskon',     icon: 'BadgePercent',   title: 'Diskon Belanja',            desc: 'Langsung dipotong saat transaksi' },
  { id: 'b-ongkir',     icon: 'Truck',          title: 'Gratis Ongkir',             desc: 'Sesuai minimum pembelian' },
  { id: 'b-poin',       icon: 'Star',           title: 'Reward Point',              desc: 'Setiap transaksi menghasilkan poin untuk ditukarkan voucher belanja.' },
  { id: 'b-konsultasi', icon: 'Headset',        title: 'Konsultasi Bisnis Laundry', desc: 'Bersama trainer Apique Academy untuk level Winner ke atas' },
]

export const SEED_HERO: HeroPrize[] = [
  { id: 'h1', image: '/img/prize-phone.jpg',    label: 'Smartphone' },
  { id: 'h2', image: '/img/prize-laptop.jpg',   label: 'Laptop' },
  { id: 'h3', image: '/img/prize-voucher.jpg',  label: 'Voucher Belanja' },
  { id: 'h4', image: '/img/prize-parfum.jpg',   label: 'Parfum Laundry 5L' },
  { id: 'h5', image: '/img/prize-tablet.jpg',   label: 'Tablet' },
  { id: 'h6', image: '/img/prize-dinner.jpg',   label: 'Gala Dinner' },
]

export const SEED_PRIZE_TYPES = ['Voucher', 'Produk Resique', 'Elektronik', 'Layanan', 'Lainnya']

/* Demo catalog only, production starts empty; name/type/point cost/stock are all admin-defined (🟣). */
export const SEED_PRIZES: Prize[] = [
  { id: 'p1', name: 'Voucher Belanja Resique Rp100.000', type: 'Voucher', image: '/img/prize-voucher.jpg', pointCost: 5_000,   stock: 100, active: true, desc: 'Potongan Rp100.000 di belanja berikutnya.' },
  { id: 'p2', name: 'Parfum Laundry Premium 5L',         type: 'Produk Resique', image: '/img/prize-parfum.jpg',  pointCost: 9_000,   stock: 40,  active: true, desc: 'Whiff Fresh Elegant / Greendome Downy Black.' },
  { id: 'p3', name: 'Paket Chemical 1 Bulan',            type: 'Produk Resique', image: '/img/prize-chemical.jpg', pointCost: 25_000, stock: 20,  active: true, desc: 'Deterjen matic 5L ×4 + parfum 5L ×2.' },
  { id: 'p4', name: 'Tablet 10"',                        type: 'Elektronik', image: '/img/prize-tablet.jpg',  pointCost: 60_000,  stock: 5,   active: true, desc: 'Untuk kasir & pencatatan outlet.' },
  { id: 'p5', name: 'Smartphone Flagship',               type: 'Elektronik', image: '/img/prize-phone.jpg',   pointCost: 150_000, stock: 3,   active: true, desc: 'Samsung Galaxy S-series / setara.' },
  { id: 'p6', name: 'Laptop Bisnis',                     type: 'Elektronik', image: '/img/prize-laptop.jpg',  pointCost: 250_000, stock: 2,   active: true, desc: 'Apple MacBook Air M-series / setara.' },
]

export const DEFAULT_CONFIG: Config = {
  copy: {
    hook: 'Sekarang Turun Harga!',
    hookSub: '+ Banyak Bonusnya!',
    tagline: 'Tingkatkan Transaksi dan Dapatkan Hadiahnya!',
    taglineSub: 'Belanja di Resique untuk dapatkan Hadiahnya, TANPA DIUNDI!',
    benefitTitle: 'Benefit Tak Terbatas dari Resique Member Card',
    benefitSub: 'Memberikan berbagai keuntungan eksklusif untuk setiap pembelian kebutuhan laundry Anda semakin menguntungkan.',
    tierTitle: 'Terus naik tingkat & nikmati keuntungan yang lebih besar lagi!',
    tierSub: 'Tier dihitung dari total belanja 6 bulan (Jan–Jun / Jul–Des).',
    ctaPoints: 'Daftar RMC Sekarang!',
    ctaPointsSub: 'Mulai nikmati seluruh keuntungan Member Resique mulai dari transaksi pertama',
    saleTitle: 'Golden Sale!!',
    saleSub: 'Harga spesial khusus Member Resique, diskon hingga {pct}% untuk semua produk',
    salePaketTitle: 'Diskon Paket',
    saleItemTitle: 'Diskon Item',
    klasemenTitle: 'Klasemen Golden Privilege',
    klasemenSub: 'Urutan total belanja dari pesanan Lunas. Belanja terbanyak dapat hadiah utama.',
    snapDesktop: false,
  },
  assets: { heroPrizes: SEED_HERO, logo: '/img/resique-logo.png', logoWhite: '/img/resique-logo-white.png', mark: '/img/resique-mark.png', qrisImage: '/img/qris-resique.png' },
  benefits: SEED_BENEFITS,
  tiers: SEED_TIERS,
  mitraFloorDiscount: 3,
  rules: { earnPerRp: 1000, poinToRp: 20, minRedeem: 500, expiry: '20 Des' },
  campaign: { start: '2026-09-01', end: '2026-10-31', label: 'Golden Privilege Sep–Okt 2026' },
  items: SEED_ITEMS,
  packages: SEED_PACKAGES,
  prizes: SEED_PRIZES,
  prizeTypes: SEED_PRIZE_TYPES,
  payment: {
    qrisMerchant: 'Resique Jakarta',
    qrisNmid: 'ID2023263339905',
    qrTimeoutSec: 300,
    uploadDelaySec: 30,
    vaEnabled: false,
    ewalletEnabled: false,
    ewallets: ['GoPay', 'ShopeePay', 'OVO', 'DANA'],
    vaBanks: ['BCA', 'BNI', 'Mandiri', 'BRI'],
  },
  klasemen: { topN: 10, showPic: true },
  outlets: ['Jakarta', 'Palembang', 'Jambi', 'Bandung', 'Palu', 'Pontianak'],
  matching: { fuzzyThreshold: 0.8 },
  password: { minLength: 9 },
}
