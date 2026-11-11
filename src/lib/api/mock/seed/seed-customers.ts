import type { CrmCustomer, Kota } from '@/types/member'
import { KOTA_DIGIT } from '@/types/member'

/* Mocked CRM Resique customer master. First 6 rows come from crm-apique data.jsx CUSTOMERS
   (kota remapped to the six Resique outlet cities); the rest are synthesized so that every
   matching path has a fixture:
     - phone present            → path 1 (phone exact)
     - NO phone + RSL card      → path 2 (card + name, phone backfilled)
     - name typo / no phone     → path 3 (fuzzy ≥ 0.8 → PENDING)
     - similar-name pair        → fuzzy false-positive guard
   RSL id rule: RSL + digit (0 Mitra APM, 1 Jakarta … 6 Pontianak) + 4-digit serial. */

function rsl(kota: Kota, mitra: boolean, serial: number) {
  return `RSL${mitra ? 0 : KOTA_DIGIT[kota]}${String(serial).padStart(4, '0')}`
}

/** monthly spend generator (yyyy-mm → Rp) for Jan–Sep 2026 */
function months(base: number, growth = 1.06, from = 1, to = 9): Record<string, number> {
  const out: Record<string, number> = {}
  let v = base
  for (let m = from; m <= to; m++) { out[`2026-${String(m).padStart(2, '0')}`] = Math.round(v / 1000) * 1000; v *= growth }
  return out
}

type Row = Omit<CrmCustomer, 'rsl' | 'priorSpend6'> & { serial: number }

const rows: Row[] = [
  { id: 'C-2026-0028', outlet: 'Fresh Laundry Kemang',    pic: 'Maya Anggraini',  hp: '0812-3345-8891', email: 'maya@freshlaundry.id',  kota: 'Jakarta',   mitra: false, member: true,  priorPointsEarned: 0, monthly: months(2_400_000), serial: 12 },
  { id: 'C-2026-0025', outlet: 'Prima Laundry Palembang', pic: 'Rendra Hidayat',  hp: '0813-9921-0042', email: 'rendra@primalaundry.id', kota: 'Palembang', mitra: false, member: true,  priorPointsEarned: 0, monthly: months(5_800_000), serial: 7 },
  { id: 'C-2026-0022', outlet: 'Bandung Kiloan Pro',      pic: 'Sari Dewi',       hp: '0857-2210-7734', email: 'sari@kiloanpro.id',     kota: 'Bandung',   mitra: false, member: false, priorPointsEarned: 0, monthly: months(1_900_000), serial: 31 },
  { id: 'C-2026-0019', outlet: 'Sparkle Laundry Co',      pic: 'Farhan Lubis',    hp: '0811-6070-1188', email: 'farhan@sparkle.co.id',  kota: 'Jakarta',   mitra: true,  member: true,  priorPointsEarned: 0, monthly: months(11_500_000, 1.04), serial: 3 },
  { id: 'C-2026-0015', outlet: 'Karpet Bersih Bandung',   pic: 'Tono Prabowo',    hp: undefined,        email: undefined,               kota: 'Bandung',   mitra: false, member: true,  priorPointsEarned: 0, monthly: months(1_200_000), serial: 18 },
  { id: 'C-2026-0011', outlet: 'Wash Center Palu',        pic: 'Putu Ariani',     hp: undefined,        email: 'putu@washcenter.id',    kota: 'Palu',      mitra: true,  member: true,  priorPointsEarned: 0, monthly: months(9_800_000, 1.05), serial: 4 },
  // synthesized
  { id: 'C-2026-0041', outlet: 'Jambi Laundry Express',   pic: 'Dewi Lestari',    hp: '0821-4455-6677', email: 'dewi@jambilaundry.id',  kota: 'Jambi',     mitra: false, member: true,  priorPointsEarned: 0, monthly: months(3_300_000), serial: 5 },
  { id: 'C-2026-0042', outlet: 'Khatulistiwa Laundry',    pic: 'Andi Saputra',    hp: '0852-1122-3344', email: 'andi@khatulistiwa.id',  kota: 'Pontianak', mitra: false, member: true,  priorPointsEarned: 0, monthly: months(4_100_000), serial: 2 },
  { id: 'C-2026-0043', outlet: 'Laundry Bunda Palembang', pic: 'Rina Marlina',    hp: undefined,        email: undefined,               kota: 'Palembang', mitra: false, member: true,  priorPointsEarned: 0, monthly: months(2_100_000), serial: 9 },
  { id: 'C-2026-0044', outlet: 'Laundry Bunda Jaya',      pic: 'Rini Marlina',    hp: '0878-9900-1122', email: 'rini@bundajaya.id',     kota: 'Palembang', mitra: false, member: true,  priorPointsEarned: 0, monthly: months(1_600_000), serial: 10 },
  { id: 'C-2026-0045', outlet: 'Mitra Wangi Laundry',     pic: 'Budi Santoso',    hp: undefined,        email: 'budi@mitrawangi.id',    kota: 'Jakarta',   mitra: true,  member: true,  priorPointsEarned: 0, monthly: months(7_200_000), serial: 6 },
  { id: 'C-2026-0046', outlet: 'Cuci Kilat Palu',         pic: 'Hendra Wijaya',   hp: '0819-2233-4455', email: 'hendra@cucikilat.id',   kota: 'Palu',      mitra: false, member: true,  priorPointsEarned: 0, monthly: months(2_800_000), serial: 11 },
  { id: 'C-2026-0047', outlet: 'Pontianak Fresh & Clean', pic: 'Siti Rahayu',     hp: '0813-5566-7788', email: 'siti@freshclean.id',    kota: 'Pontianak', mitra: false, member: true,  priorPointsEarned: 0, monthly: months(6_400_000), serial: 8 },
  { id: 'C-2026-0048', outlet: 'Bersih Sentosa Laundry',  pic: 'Agus Prasetyo',   hp: undefined,        email: undefined,               kota: 'Bandung',   mitra: false, member: true,  priorPointsEarned: 0, monthly: months(3_900_000), serial: 22 },
  { id: 'C-2026-0049', outlet: 'Laundry 24 Jam Kuningan', pic: 'Yuni Astuti',     hp: '0856-6677-8899', email: 'yuni@laundry24.id',     kota: 'Jakarta',   mitra: false, member: true,  priorPointsEarned: 0, monthly: months(15_000_000, 1.03), serial: 14 },
  { id: 'C-2026-0050', outlet: 'Laundry Ceria Jambi',     pic: 'Fajar Nugroho',   hp: '0822-3344-5566', email: 'fajar@ceria.id',        kota: 'Jambi',     mitra: false, member: true,  priorPointsEarned: 0, monthly: months(1_100_000), serial: 6 },
]

export const SEED_CUSTOMERS: CrmCustomer[] = rows.map(({ serial, ...r }) => {
  const priorSpend6 = Object.entries(r.monthly).filter(([k]) => k >= '2026-07' && k <= '2026-12').reduce((s, [, v]) => s + v, 0)
  return { ...r, rsl: rsl(r.kota, r.mitra, serial), priorSpend6 }
})
