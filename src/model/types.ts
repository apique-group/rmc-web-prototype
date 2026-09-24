/* ---------------------------------------------------------------------------
   Domain types, mirrors PRD §5C (Skema Field per Entitas).
   --------------------------------------------------------------------------- */

export type Kota = 'Jakarta' | 'Palembang' | 'Jambi' | 'Bandung' | 'Palu' | 'Pontianak'
export const KOTA_LIST: Kota[] = ['Jakarta', 'Palembang', 'Jambi', 'Bandung', 'Palu', 'Pontianak']
/** RSL digit after the prefix: 0 = Mitra Apique Management, 1..6 = home outlet. */
export const KOTA_DIGIT: Record<Kota, number> = { Jakarta: 1, Palembang: 2, Jambi: 3, Bandung: 4, Palu: 5, Pontianak: 6 }

export interface Tier {
  key: string
  name: string
  /** swatch: badge fill, accent bar */
  sw: string
  /** text-safe colour on white for the tier's figure (≥ 3:1 at 36px bold); falls back to sw */
  fg?: string
  /** 6-month spend band (Rp), min inclusive; max null = no ceiling */
  min: number
  max: number | null
  perMonth: string
  discount: number
  freeDelivMin: number | null
  consult: number
  benefitCopy: string
}

/* figure/figureNote = the big number that leads the card (e.g. "0–5%" / "diskon belanja"); admin-defined */
export interface Benefit { id: string; icon: string; title: string; desc: string; figure?: string; figureNote?: string }
export interface HeroPrize { id: string; image: string; label: string }

export interface GoldenSaleItem {
  id: string
  code: string
  name: string
  cat: string
  unit: string
  realPrice: number
  promoPrice: number
  image: string
  /** null = unlimited (admin leaves Kuota blank); a number is the live counter that order creation consumes (R.051, staging model) */
  quota: number | null
  /** 0 = unlimited */
  maxPerCustomer: number
  active: boolean
}

/** R.051 — a Golden Sale package: a bundle of Golden Sale ITEMS (contents with qty) sold at one price. No stock of its own:
    how many sets are left is derived from the contents (min over items of floor(item remaining ÷ qty)). Own maxPerCustomer;
    its contents never count toward the per-item caps. Mirrors GET /member/packages on staging. */
export interface GoldenSalePackage {
  id: string
  code: string
  name: string
  desc?: string
  image: string
  realPrice: number
  promoPrice: number
  /** 0 = unlimited */
  maxPerCustomer: number
  active: boolean
  items: { itemId: string; qty: number }[]
}

/** type = admin-defined label from Config.prizeTypes (🟣). */
export interface Prize { id: string; name: string; type: string; image: string; pointCost: number; stock: number; active: boolean; desc?: string }

export interface Config {
  copy: {
    hook: string
    hookSub: string
    tagline: string
    taglineSub: string
    benefitTitle: string
    benefitSub: string
    tierTitle: string
    tierSub: string
    ctaPoints: string
    ctaPointsSub: string
    saleTitle: string
    saleSub: string
    /** group titles inside the Golden Sale section (R.050): packages first, then items */
    salePaketTitle: string
    saleItemTitle: string
    klasemenTitle: string
    klasemenSub: string
    snapDesktop: boolean
  }
  /** logo = colour lockup on light surfaces, logoWhite = all-white lockup on navy, mark = the cart alone (small slots) */
  assets: { heroPrizes: HeroPrize[]; logo: string; logoWhite: string; mark: string; qrisImage: string }
  benefits: Benefit[]
  tiers: Tier[]
  mitraFloorDiscount: number
  rules: { earnPerRp: number; poinToRp: number; minRedeem: number; expiry: string }
  campaign: { start: string; end: string; label: string }
  items: GoldenSaleItem[]
  /** R.051 — bundles of items, shown under "Diskon Paket" above the items */
  packages: GoldenSalePackage[]
  prizes: Prize[]
  /** admin-defined prize categories, e.g. Voucher · Produk Resique · Elektronik · Layanan */
  prizeTypes: string[]
  payment: {
    qrisMerchant: string
    qrisNmid: string
    qrTimeoutSec: number
    uploadDelaySec: number
    vaEnabled: boolean
    ewalletEnabled: boolean
    ewallets: string[]
    vaBanks: string[]
  }
  klasemen: { topN: number; showPic: boolean }
  outlets: Kota[]
  matching: { fuzzyThreshold: number }
  password: { minLength: number }
}

export type LinkStatus = 'LINKED' | 'PENDING' | 'LEAD'
export type MatchPath = 1 | 2 | 3 | 4

export interface Account {
  id: string
  phone: string
  email: string
  laundry: string
  pic: string
  /** optional since 4 Sep 2026 (Lurd), helps route the lead to the nearest outlet */
  kota?: Kota
  isMitra: boolean
  hasCard: boolean
  rsl?: string
  referral?: string
  consentAt: string
  /** prototype: plain sha-ish hash, never real security */
  passwordHash: string
  mustChangePassword: boolean
  link: LinkStatus
  crmCustomerId?: string
  matchPath: MatchPath
  matchScore?: number
  createdAt: string
}

export interface CrmCustomer {
  id: string
  rsl?: string
  outlet: string
  pic: string
  hp?: string
  email?: string
  kota: Kota
  mitra: boolean
  member: boolean
  /** seeded 6-month spend so tiers look realistic before Golden Sale orders exist */
  priorSpend6: number
  priorPointsEarned: number
  /** seeded monthly spend (yyyy-mm → Rp) for the progression chart */
  monthly: Record<string, number>
}

export interface Lead {
  id: string
  outlet: string
  pic: string
  hp: string
  email: string
  kota?: Kota
  source: 'Golden Privilege Web'
  referral?: string
  createdAt: string
  accountId: string
}

export interface Claim {
  id: string
  accountId: string
  candidateCustomerId: string
  score: number
  status: 'open' | 'approved' | 'rejected'
  createdAt: string
  decidedAt?: string
}

export interface AuditRow { id: string; t: string; event: string; meta: string }

export interface Redemption { id: string; accountId: string; prizeId: string; prizeName: string; points: number; at: string }

export type OrderStatus = 'Menunggu Pembayaran' | 'Bukti Diunggah' | 'Lunas' | 'Ditolak' | 'Kedaluwarsa'
export const ORDER_STATUSES: OrderStatus[] = ['Menunggu Pembayaran', 'Bukti Diunggah', 'Lunas', 'Ditolak', 'Kedaluwarsa']

/** An order line is either an item (itemId) or a package (packageId) — never both (staging POST /member/orders lines[]). */
export interface OrderLine { itemId?: string; packageId?: string; code: string; name: string; qty: number; promoPrice: number; realPrice: number }

export interface Order {
  id: string
  createdAt: string
  expiresAt: string
  status: OrderStatus
  buyer: { name: string; laundry: string; phone: string; email?: string }
  accountId?: string
  crmCustomerId?: string
  fulfil: { mode: 'ambil' | 'kirim'; outlet?: Kota; address?: string }
  payment: { method: 'QRIS' | 'VA' | 'EWALLET'; proofName?: string; proofDataUrl?: string; proofType?: string; uploadedAt?: string }
  lines: OrderLine[]
  total: number
  savings: number
  verifiedAt?: string
  rejectReason?: string
  note?: string
  /** Stamped when the buyer ticked "bersedia dihubungi" at checkout. Mirrors Account.consentAt. */
  consentAt?: string
}

export interface InboxMail { id: string; to: string; subject: string; body: string; at: string; read: boolean }
