import * as React from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Area, AreaChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from 'recharts'
import { ArrowRight, ArrowUpRight, Clock, Gift, History, LogOut, MessageCircle, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { rupiah, poin, fmtDate, fmtMonth } from '@/lib/format'
import { Reveal } from '@/lib/reveal'
import { rmcFor, type RmcSummary } from '@/model/rmc'
import type { Account, CrmCustomer, Order, Prize, Redemption } from '@/model/types'
import { useConfig } from '@/store/config'
import { CONTACTS } from '@/data/contacts'
import { useCrm } from '@/store/crm'
import { useOrders } from '@/store/orders'
import { useAccounts } from '@/store/accounts'
import { useCurrentAccount, useSession } from '@/store/session'
import { Button } from '@/components/ui/button'
import { Badge, statusVariant } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress, EmptyState } from '@/components/ui/misc'

const TEAL = '#3E8A1E'
const GOLD = '#D4A04E'
const SALES_WA = CONTACTS.wa

/* Profile, PRD Fitur 4 (poin & tier), Fitur 5 (tukar hadiah), Fitur 6 (riwayat). */
export function ProfilePage() {
  const account = useCurrentAccount()
  if (!account) return <Navigate to="/login?redirect=%2Fprofile" replace />
  return <ProfileBody account={account} />
}

function ProfileBody({ account }: { account: Account }) {
  const nav = useNavigate()
  const cfg = useConfig(s => s.config)
  const customers = useCrm(s => s.customers)
  const orders = useOrders(s => s.orders)
  const redemptions = useAccounts(s => s.redemptions)
  const signOut = useSession(s => s.signOut)

  const customer: CrmCustomer | null = account.link === 'LINKED' ? customers.find(c => c.id === account.crmCustomerId) || null : null
  const isMitra = account.isMitra || !!customer?.mitra
  const rmc = React.useMemo(() => rmcFor(cfg, customer, orders, redemptions, account.id, isMitra), [cfg, customer, orders, redemptions, account.id, isMitra])
  const myRedemptions = React.useMemo(() => redemptions.filter(r => r.accountId === account.id).slice(0, 5), [redemptions, account.id])
  const myOrders = React.useMemo(
    () => orders.filter(o => o.accountId === account.id || (account.crmCustomerId && o.crmCustomerId === account.crmCustomerId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, account.id, account.crmCustomerId],
  )

  const linked = account.link === 'LINKED'
  const pending = account.link === 'PENDING'
  const firstName = account.pic.split(' ')[0]

  return (
    <div className="container max-w-5xl pb-20 pt-24 sm:pt-32">
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="t-eyebrow">Profil RMC</p>
            <h1 className="t-h2 mt-1 truncate text-ink">Halo, {firstName}</h1>
          </div>
          <Button variant="outline" className="" onClick={() => { signOut(); toast('Kamu sudah keluar'); nav('/') }}>
            <LogOut className="h-4 w-4" strokeWidth={1.6} /> Keluar
          </Button>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-start lg:gap-8">
        {/* Left column: hero + lists */}
        <div className="space-y-6 lg:col-span-5">
          <Reveal>
            {linked ? (
              <PointsHero account={account} customer={customer} rmc={rmc} isMitra={isMitra} />
            ) : pending ? (
              <PendingHero account={account} rmc={rmc} />
            ) : (
              <LeadCard />
            )}
          </Reveal>
          {linked && myRedemptions.length > 0 && (
            <Reveal delay={60} className="hidden lg:block"><RedemptionList rows={myRedemptions} /></Reveal>
          )}
        </div>

        {/* Right column: chart + prizes + orders */}
        <div className="space-y-6 lg:col-span-7">
          {linked ? (
            <>
              <Reveal delay={40}><PointsChart rmc={rmc} earnPerRp={cfg.rules.earnPerRp} /></Reveal>
              {/* Riwayat pesanan sits right under the transaction graph (Lurd, 10 Sep) */}
              <Reveal delay={60}><OrderList rows={myOrders} /></Reveal>
              <Reveal delay={80}><PrizeGrid account={account} points={rmc.points} /></Reveal>
              {myRedemptions.length > 0 && <Reveal delay={100} className="lg:hidden"><RedemptionList rows={myRedemptions} /></Reveal>}
            </>
          ) : (
            <Reveal delay={40}>
              <Card>
                <CardContent className="flex items-start gap-3 pt-5 sm:pt-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700"><Gift className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
                  <div>
                    <p className="text-[14px] font-bold text-ink">Grafik poin & pilihan hadiah tampil di sini</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">{pending ? 'Setelah sales Resique konfirmasi akun ini milikmu.' : 'Setelah laundry-mu terdaftar di Resique.'}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          )}
          {!linked && <Reveal delay={120}><OrderList rows={myOrders} /></Reveal>}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------- Points hero ------------------------------- */

function HeroShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl bg-navy-700/10 p-1.5 ring-1 ring-black/5', className)}>
      <div className="navy-gradient relative overflow-hidden rounded-xl p-6 text-white sm:p-8">
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}

function PointsHero({ account, customer, rmc, isMitra }: { account: Account; customer: CrmCustomer | null; rmc: RmcSummary; isMitra: boolean }) {
  const cfg = useConfig(s => s.config)
  const floorApplied = isMitra && rmc.discount === cfg.mitraFloorDiscount && rmc.tier.discount < cfg.mitraFloorDiscount
  return (
    <HeroShell>
      <div className="flex items-start justify-between gap-3">
        <p className="t-eyebrow text-gold-200">Poin RMC</p>
        <Badge variant="inverse"><span className="h-2 w-2 rounded-full ring-1 ring-white/60" style={{ background: rmc.tier.sw }} aria-hidden />{rmc.tier.name}</Badge>
      </div>
      <p data-points={rmc.points} className="t-fig t-fig-black mt-3 text-[56px] leading-none sm:text-[64px]">{poin(rmc.points)}</p>
      <p className="mt-2 text-[13px] text-white/80">Berlaku sampai {cfg.rules.expiry} · 1 poin = {rupiah(cfg.rules.poinToRp)}</p>

      <div className="mt-6 border-t border-white/15 pt-5">
        <p className="truncate text-[17px] font-bold">{customer?.outlet || account.laundry}</p>
        <p className="truncate text-[13px] text-white/75">{customer?.pic || account.pic} · {customer?.kota || account.kota}</p>
        {(customer?.rsl || account.rsl) && <p className="mt-1 t-code text-[12px] tracking-wider text-gold-200">{customer?.rsl || account.rsl}</p>}
      </div>

      <div className="mt-6">
        <div className="flex items-end justify-between gap-3 text-[12px]">
          <span className="text-white/75">Belanja {rmc.win.label}: <strong className="t-code text-white">{rupiah(rmc.spend6)}</strong></span>
          <span className="t-code shrink-0 font-semibold text-gold-200">{rmc.next ? `${rupiah(rmc.toNext, { short: true })} lagi ke ${rmc.next.name}` : 'Tier tertinggi'}</span>
        </div>
        <Progress value={rmc.progress * 100} tone="gold" className="mt-2 bg-white/15" aria-label="Progres ke tier berikutnya" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
        <div>
          <p className="text-[12px] font-semibold text-white/70">Diskon aktif</p>
          <p className="t-fig t-fig-black text-[24px] leading-tight">{rmc.discount}%</p>
        </div>
        {floorApplied ? <Badge variant="gold">Min. Mitra</Badge> : isMitra ? <Badge variant="inverse">Mitra Apique</Badge> : null}
      </div>
    </HeroShell>
  )
}

function PendingHero({ account, rmc }: { account: Account; rmc: RmcSummary }) {
  const cfg = useConfig(s => s.config)
  const claimTarget = useCrm(s => s.customers.find(c => c.id === account.crmCustomerId))
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-[6px]">
        <HeroShell>
          <p className="t-eyebrow text-gold-200">Poin RMC</p>
          <p data-points={rmc.points} className="t-fig t-fig-black mt-3 text-[56px] leading-none sm:text-[64px]">{poin(rmc.points)}</p>
          <p className="mt-2 text-[13px] text-white/80">Berlaku sampai {cfg.rules.expiry}</p>
          <div className="mt-6 border-t border-white/15 pt-5"><p className="text-[17px] font-bold">{account.laundry}</p><p className="text-[13px] text-white/75">{account.pic} · {account.kota}</p></div>
          <Progress value={35} tone="gold" className="mt-8 bg-white/15" />
        </HeroShell>
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-xl shadow-3">
          <CardContent className="pt-5 sm:pt-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-50 text-gold-700"><Clock className="h-5 w-5" strokeWidth={1.6} /></span>
            <p className="mt-4 text-[17px] font-bold text-ink">Menunggu verifikasi sales</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
              Datamu mirip dengan pelanggan <strong className="text-ink">{claimTarget?.outlet || 'Resique'}</strong>. Sales Resique memastikan akun ini milikmu (biasanya 1×24 jam) sebelum poin & tier tampil.
            </p>
            <Button asChild variant="secondary" className="mt-4 w-full">
              <a href={`${SALES_WA}?text=${encodeURIComponent(`Halo Sales Resique, mohon verifikasi akun RMC saya: ${account.laundry} (${account.pic}).`)}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" strokeWidth={1.6} /> Hubungi sales
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LeadCard() {
  return (
    <Card className="rounded-xl">
      <CardContent className="pt-5 sm:pt-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700"><MessageCircle className="h-5 w-5" strokeWidth={1.6} /></span>
        <p className="mt-4 text-[17px] font-bold text-ink">Belum terdaftar sebagai pelanggan Resique</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">Tim sales akan menghubungi via WhatsApp untuk mendaftarkan laundry-mu. Setelah itu poin RMC mulai terhitung dari setiap belanja.</p>
        <Button asChild size="lg" variant="gold" className="mt-5 w-full">
          <Link to="/#golden-sale">Belanja Golden Sale<ArrowUpRight className="h-4 w-4" strokeWidth={2} /></Link>
        </Button>
      </CardContent>
    </Card>
  )
}

/* --------------------------------- Chart --------------------------------- */

function PointsTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value ?? 0
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-2">
      <p className="text-[12px] font-semibold text-ink-3">{String(label)}</p>
      <p className="t-fig text-[15px] text-navy-700">{poin(v)} <span className="text-[11px] font-semibold text-ink-3">poin</span></p>
    </div>
  )
}

function PointsChart({ rmc, earnPerRp }: { rmc: RmcSummary; earnPerRp: number }) {
  const data = rmc.monthly.map(m => ({ label: fmtMonth(m.ym), points: m.points }))
  const last = data[data.length - 1]
  return (
    <Card>
      <CardHeader>
        <CardTitle>Poin per bulan</CardTitle>
        <CardDescription>12 bulan terakhir · <span className="t-code">{poin(rmc.pointsEarned)}</span> poin terkumpul tahun ini</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="rmcPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#EEF0F2" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}rb` : String(v))} />
              <Tooltip content={<PointsTooltip />} cursor={{ stroke: '#B7E094', strokeDasharray: '3 3' }} />
              <Area type="monotone" dataKey="points" stroke={TEAL} strokeWidth={2.25} fill="url(#rmcPoints)" dot={false} activeDot={{ r: 5, fill: TEAL, stroke: '#fff', strokeWidth: 2 }} isAnimationActive />
              {last && <ReferenceDot x={last.label} y={last.points} r={5.5} fill={GOLD} stroke="#fff" strokeWidth={2} isFront />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-[12px] text-ink-4">Poin dihitung dari belanja Lunas ({rupiah(earnPerRp)} = 1 poin).</p>
      </CardContent>
    </Card>
  )
}

/* --------------------------------- Prizes --------------------------------- */

function PrizeGrid({ account, points }: { account: Account; points: number }) {
  const cfg = useConfig(s => s.config)
  const setSection = useConfig(s => s.setSection)
  const [sel, setSel] = React.useState<Prize | null>(null)
  const prizes = cfg.prizes.filter(p => p.active)

  const reason = (p: Prize): string | null => {
    if (p.stock <= 0) return 'Stok habis'
    if (points < cfg.rules.minRedeem) return `Min. ${poin(cfg.rules.minRedeem)} poin`
    if (points < p.pointCost) return `Kurang ${poin(p.pointCost - points)} poin`
    return null
  }

  const confirm = () => {
    if (!sel) return
    const fresh = useConfig.getState().config.prizes.find(p => p.id === sel.id)
    if (!fresh || fresh.stock <= 0 || points < fresh.pointCost) { toast.error('Hadiah tidak tersedia'); setSel(null); return }
    useAccounts.getState().redeem(account.id, fresh.id, fresh.name, fresh.pointCost)
    setSection('prizes', useConfig.getState().config.prizes.map(p => p.id === fresh.id ? { ...p, stock: Math.max(0, p.stock - 1) } : p))
    toast.success(`${fresh.name} berhasil ditukar`, { description: `Sisa poin ${poin(points - fresh.pointCost)}. Sales Resique akan hubungi kamu soal pengiriman.` })
    setSel(null)
  }

  return (
    <section aria-labelledby="prizes-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="t-eyebrow">Tukar poin</p>
          <h2 id="prizes-title" className="t-h2 mt-1 text-ink">Pilihan hadiah</h2>
        </div>
        <p className="t-code shrink-0 text-[13px] text-ink-3">Min. tukar <strong className="text-ink">{poin(cfg.rules.minRedeem)}</strong> poin</p>
      </div>
      {prizes.length === 0 ? (
        <EmptyState className="mt-4" title="Belum ada hadiah aktif" desc="Daftar hadiah menyusul. Cek lagi nanti." />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {prizes.map((p, i) => {
            const why = reason(p)
            return (
              <Reveal as="li" key={p.id} delay={i * 50}>
                <article className={cn('group flex h-full flex-col rounded-xl border border-line bg-white p-3 sm:p-4', why ? 'opacity-80' : 'lift active:scale-[.98]')}>
                  <div className="relative overflow-hidden rounded-lg bg-surface-2">
                    <img src={p.image} alt={p.name} width={800} height={600} className="zoom-img aspect-[4/3] w-full object-cover" loading="lazy" />
                    {p.stock <= 0 ? <Badge variant="muted" className="absolute left-2 top-2">Habis</Badge> : p.stock <= 5 ? <Badge variant="warn" className="absolute left-2 top-2">Sisa {p.stock}</Badge> : null}
                  </div>
                  <p className="mt-3 text-[11px] font-semibold text-ink-4">{p.type}</p>
                  <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-[13px] font-bold leading-snug text-ink sm:text-[14px]">{p.name}</h3>
                  <p className="t-fig mt-1 text-[15px] text-gold-700">{poin(p.pointCost)} <span className="text-[11px] font-bold text-ink-3">poin</span></p>
                  <p className="t-code text-[11px] text-ink-4">Stok {p.stock}</p>
                  <div className="mt-auto pt-3">
                    <Button size="sm" variant={why ? 'outline' : 'gold'} className="h-11 w-full sm:h-10" disabled={!!why} onClick={() => setSel(p)} aria-label={why ? `${p.name}: ${why}` : `Tukar ${p.name}`}>
                      {why || 'Tukar'}
                    </Button>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </ul>
      )}

      <Dialog open={!!sel} onOpenChange={o => { if (!o) setSel(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tukar {sel?.name}?</DialogTitle>
            <DialogDescription>
              Tukar <strong className="text-ink">{sel?.name}</strong> dengan <strong className="t-code text-ink">{poin(sel?.pointCost)} poin</strong>? Sisa poin setelah penukaran: <strong className="t-code text-navy-700">{poin(points - (sel?.pointCost || 0))}</strong>.
            </DialogDescription>
          </DialogHeader>
          {sel && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
              <img src={sel.image} alt="" width={80} height={64} className="h-16 w-20 rounded-lg object-cover" />
              <div className="min-w-0 text-[13px] text-ink-2">{sel.desc || 'Hadiah dikirim / diambil di outlet Resique terdekat.'}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="" onClick={() => setSel(null)}>Batal</Button>
            <Button variant="gold" className="" onClick={confirm}><Gift className="h-4 w-4" strokeWidth={1.8} /> Ya, tukar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/* ---------------------------------- Lists ---------------------------------- */

function RedemptionList({ rows }: { rows: Redemption[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700"><History className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
        <div><CardTitle>Riwayat penukaran</CardTitle><CardDescription className="mt-1">{rows.length} terakhir</CardDescription></div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-line-2">
          {rows.map(r => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{r.prizeName}</p>
                <p className="text-[12px] text-ink-3"><span className="t-code">{r.id}</span> · {fmtDate(r.at)}</p>
              </div>
              <p className="t-fig shrink-0 text-[14px] text-gold-700">−{poin(r.points)}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function OrderList({ rows }: { rows: Order[] }) {
  const show = rows.slice(0, 5)
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700"><ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
        <div><CardTitle>Riwayat pesanan</CardTitle><CardDescription className="mt-1">{rows.length === 0 ? 'Belum ada pesanan Golden Sale' : `${rows.length} pesanan Golden Sale · hanya Lunas yang menambah poin`}</CardDescription></div>
      </CardHeader>
      <CardContent>
        {show.length === 0 ? (
          <EmptyState title="Belum ada pesanan Golden Sale" desc="Harga spesial selama periode Golden Privilege, stok terbatas." action={<Button asChild variant="gold" className=""><Link to="/#golden-sale">Lihat Golden Sale</Link></Button>} />
        ) : (
          <ul className="divide-y divide-line-2">
            {show.map(o => (
              <li key={o.id}>
                <Link to={`/order/${o.id}`} className="flex min-h-[44px] items-center gap-3 py-3 transition-colors hover:text-navy-700">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2"><span className="t-code text-[13px] font-semibold text-ink">{o.id}</span><Badge variant={statusVariant(o.status)}>{o.status}</Badge></p>
                    <p className="mt-0.5 text-[12px] text-ink-3">{fmtDate(o.createdAt)} · {o.lines.reduce((s, l) => s + l.qty, 0)} item · {o.fulfil.mode === 'kirim' ? 'Dikirim' : `Ambil di ${o.fulfil.outlet || 'outlet'}`}</p>
                  </div>
                  <p className="t-fig shrink-0 text-[14px] text-ink">{rupiah(o.total)}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-4" strokeWidth={1.6} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
