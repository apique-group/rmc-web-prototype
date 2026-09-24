import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, ChevronLeft, ChevronRight, ChevronsRight, Coins, Crown, Medal, ShoppingBag, ShoppingCart, Sparkles, Star, Ticket, Trophy, X, Zap } from 'lucide-react'
import { BENEFIT_ICONS } from '@/lib/benefit-icons'
import { Reveal, useCountUp, useInView } from '@/lib/reveal'
import { poin } from '@/lib/format'
import type { Benefit, Prize } from '@/model/types'
import { srcSet2x } from '@/lib/logo'
import { rmcFor } from '@/model/rmc'
import { useCrm } from '@/store/crm'
import { SEED_ACCOUNTS } from '@/data/seed-accounts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { rupiah, fmtDate } from '@/lib/format'
import { useConfig } from '@/store/config'
import { useOrders, klasemen } from '@/store/orders'
import { useCart, cartLines, cartTotal, cartCount, cartSavings, cartPackageLines, itemLeft, packageRemaining, lineKey } from '@/store/cart'
import { useCurrentAccount } from '@/store/session'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/misc'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { QtyStepper } from '@/components/shop/QtyStepper'
import type { Config, GoldenSaleItem, GoldenSalePackage, Tier } from '@/model/types'

/* Landing (R.026, 11 Sep: the stakeholder keeps the RGP UI mock as the landing page). Rhythm follows the mock: banner
   card with a slider (hook) → prize grid "Tingkatkan Transaksi dan Dapatkan Hadiahnya!" (hero) → navy benefit band with
   the member card + four benefits + the four-step strip → six tier columns → "Cek poin-mu!" band → Golden Sale →
   Klasemen. Resique navy + green, gold reward-only. Copy is config-driven; the mock's words are the seed. Motion:
   slider autoplay, floating phone / cards, scroll-in pop on card lists, hover + press on every control. */

export function LandingPage() {
  // the basket bar's clearance lives under the footer (SiteFooter), not between klasemen and the footer (Lurd, 11 Sep)
  return (
    <div>
      <HookSection />
      <HeroSection />
      <BenefitSection />
      <TierSection />
      <CtaSection />
      <GoldenSaleSection />
      <KlasemenSection />
      <BasketBar />
    </div>
  )
}

/* Last word of a title carries the highlighter mark (draws in when the title scrolls into view, .mark in index.css). */
function Marked({ text, className, phrase }: { text: string; className?: string; phrase?: string }) {
  if (phrase && text.includes(phrase)) {
    const [before, after] = text.split(phrase)
    return <>{before}<span className={cn('mark', className)}>{phrase}</span>{after}</>
  }
  const words = text.trim().split(' ')
  return <>{words.slice(0, -1).join(' ')}{words.length > 1 ? ' ' : ''}<span className={cn('mark', className)}>{words.slice(-1)[0]}</span></>
}

/* Concentric ring outlines, a recurring background motif (paper sections). Decorative, thin, brand tints. */
function Rings({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={cn('pointer-events-none absolute hidden opacity-70 md:block', className)} viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth={1.2}>
      <circle cx="100" cy="100" r="98" /><circle cx="100" cy="100" r="74" /><circle cx="100" cy="100" r="50" /><circle cx="100" cy="100" r="26" />
    </svg>
  )
}

/* Celebration ground after the Figma Golden Sale frame (Lurd, 11 Sep): deep navy, thin diagonal streaks, gold confetti
   slivers, four-point stars and a few dots. `dim` = streaks only (the banner section ground). Rotation sits on a wrapping
   <g> so the CSS float on the inner shape does not override it. Decorative only. */
function Streaks({ dim, className }: { dim?: boolean; className?: string }) {
  const lines = [[-40, 120, 260, -60], [60, 380, 420, 140], [200, 620, 620, 340], [520, 80, 760, -80], [640, 540, 980, 320], [880, 300, 1120, 140], [960, 660, 1260, 460], [1040, 40, 1240, -90], [300, -20, 460, -120], [-20, 520, 180, 400], [420, 700, 700, 520], [720, -40, 900, -160], [1140, 560, 1300, 450], [140, 260, 300, 150], [760, 220, 900, 130], [560, 420, 700, 330], [1000, 420, 1130, 340], [240, 480, 360, 400], [820, 620, 1000, 500], [-30, 300, 90, 220]]
  const confetti = [[90, 60, -30], [330, 540, 20], [700, 90, -15], [1080, 470, 35], [1150, 120, -25], [520, 300, 15], [260, 200, -40], [900, 560, 10], [40, 440, 50], [620, 20, -60]]
  const stars = [[150, 140, 9], [1010, 70, 7], [820, 520, 8], [480, 560, 6], [1170, 330, 5], [380, 90, 5]]
  const dots = [[60, 200, 4, '#71BD41'], [980, 200, 3, '#F6E8CC'], [720, 400, 3, '#71BD41'], [240, 620, 4, '#D4A04E'], [1120, 590, 3, '#F6E8CC'], [560, 180, 2.5, '#D4A04E']]
  const star = (r: number) => `M0 ${-r}c${r * .1} ${r * .55} ${r * .45} ${r * .9} ${r} ${r}c${-r * .55} ${r * .1} ${-r * .9} ${r * .45} ${-r} ${r}c${-r * .1} ${-r * .55} ${-r * .45} ${-r * .9} ${-r} ${-r}c${r * .55} ${-r * .1} ${r * .9} ${-r * .45} ${r} ${-r}z`
  return (
    <svg aria-hidden data-streaks className={cn('pointer-events-none absolute inset-0 h-full w-full', className)} viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none">
      <g stroke="#2E2A7A" strokeLinecap="round" strokeOpacity={dim ? .5 : .7}>
        {lines.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={i % 3 === 0 ? 2 : 1} />)}
      </g>
      {!dim && (
        <>
          <g fill="#D4A04E">
            {confetti.map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}><rect x="-7" y="-3" width="14" height="6" rx="1.5" className="float-6" style={{ animationDelay: `${(i * 0.7) % 4}s` }} /></g>)}
          </g>
          <g fill="#F6E8CC">
            {stars.map(([x, y, r], i) => <g key={i} transform={`translate(${x} ${y})`}><path d={star(r)} className="twinkle" style={{ animationDelay: `${(i * 0.5) % 2.6}s` }} /></g>)}
          </g>
          {dots.map(([x, y, r, c], i) => <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} className="twinkle" style={{ animationDelay: `${(i * 0.9) % 2.6}s` }} />)}
        </>
      )}
    </svg>
  )
}


/* Hook headline: each word rises in on load (stagger), the last word keeps the highlighter mark for the gate. */
function StaggerWords({ text, neon }: { text: string; neon?: boolean }) {
  const words = text.trim().split(' ')
  return (
    <>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="hook-word inline-block" style={{ '--i': `${i * 90}ms` } as React.CSSProperties}>
            {i === words.length - 1 ? <span className={cn('mark', neon ? 'mark-neon text-green' : 'mark-green text-navy-700')}>{w}</span> : w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </>
  )
}

function SectionTitle({ title, sub, tone = 'ink', center, phrase, mark }: { title: string; sub?: string; tone?: 'ink' | 'white'; center?: boolean; phrase?: string; mark?: string }) {
  return (
    <Reveal className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      <h2 className={cn('t-h2 text-balance', tone === 'white' ? 'text-white' : 'text-ink')}><Marked text={title} phrase={phrase} className={mark ?? (tone === 'white' ? 'mark-light text-green' : undefined)} /></h2>
      {sub && <p className={cn('mt-3 text-[15px] leading-relaxed text-pretty sm:text-[17px]', tone === 'white' ? 'text-white/80' : 'text-ink-2')}>{sub}</p>}
    </Reveal>
  )
}

/* Banner ground (Lurd, 11 Sep: "more depth"): three layers at different distances. Far = a perspective floor grid
   and the doodle; mid = big solid shapes (navy-800 disc, navy-500 ring, band); near = wire cubes and dots, bigger and
   brighter the closer they are. Each layer translates by its depth with the pointer (--px / --py set on the banner),
   so the ground moves like a room, not a poster. Reduced motion: static. */
function BannerGround() {
  return (
    <div aria-hidden data-ground className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* far — R.041 (Lurd): no more scratch/line-art. The banner now carries the same ground as
          Golden Sale and Klasemen: coloured streaks, confetti and stars, nothing wire-framed. */}
      <div className="depth absolute inset-0" data-depth="far" style={{ '--d': '6px' } as React.CSSProperties}>
        <Streaks />
      </div>
      {/* mid */}
      <div className="depth absolute inset-0" data-depth="mid" style={{ '--d': '14px' } as React.CSSProperties}>
        <span className="absolute -left-24 -bottom-40 h-[420px] w-[420px] rounded-full bg-navy-800" />
        <span className="absolute -right-16 -top-24 h-[300px] w-[300px] rounded-full border-[22px] border-navy-500/60" />
        <span className="band bg-navy-800" style={{ right: '-10%', bottom: '-40%', width: '55%', height: '90%' }} />
      </div>
      {/* near */}
      <div className="depth absolute inset-0" data-depth="near" style={{ '--d': '26px' } as React.CSSProperties}>
        <span className="float-6 absolute left-[-24px] top-[190px] hidden h-14 w-14 rounded-full bg-green/80 lg:block" />
        <span className="float-6 absolute right-[22%] bottom-[40px] hidden h-4 w-4 rounded-full bg-gold lg:block [animation-delay:2s]" />
        <span className="float-6 absolute left-[30%] top-[60px] hidden h-2.5 w-2.5 rounded-full bg-green-200 lg:block [animation-delay:1s]" />
      </div>
    </div>
  )
}

/* 1, Hook = the RGP mock's banner card with a slider, styled like the drenched R.025 hook (Lurd, 11 Sep): navy-900
   drench, wire-frame cubes, floating green dot, doodle; slide 1 carries the mock's exact words and a floating collage
   of the three biggest Golden Sale drops with the HEMAT seal. 3 slides, dots + arrows, autoplay paused on hover/focus
   and under reduced motion. Copy is config-driven. */
function HookSection() {
  const { copy, items, assets } = useConfig(s => s.config)
  const drops = items.filter(i => i.active && i.realPrice > i.promoPrice)
    .map(i => ({ ...i, pct: Math.round((1 - i.promoPrice / i.realPrice) * 100), save: i.realPrice - i.promoPrice }))
    .sort((a, b) => b.save - a.save)
  const maxPct = Math.max(...drops.map(d => d.pct), 0)
  const jump = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }) }
  const track = React.useRef<HTMLDivElement>(null)
  const [idx, setIdx] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const count = 3
  // pointer parallax (desktop): the ground layers shift by their depth, --px / --py in -1..1 on the banner
  const banner = React.useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent) => {
    const el = banner.current; if (!el || e.pointerType !== 'mouse') return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5) * 2))
    el.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5) * 2))
  }
  const onLeave = () => { const el = banner.current; if (el) { el.style.setProperty('--px', '0'); el.style.setProperty('--py', '0') } }
  const goTo = React.useCallback((i: number) => { const el = track.current; if (!el) return; const n = ((i % count) + count) % count; el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' }) }, [])
  React.useEffect(() => {
    const el = track.current; if (!el) return
    const onScroll = () => setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
    el.addEventListener('scroll', onScroll, { passive: true }); return () => el.removeEventListener('scroll', onScroll)
  }, [])
  React.useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => goTo(idx + 1), 6000); return () => clearInterval(t)
  }, [idx, paused, goTo])
  const slides = [
    { id: 'harga', kicker: 'Resique Supermarket Laundry', title: copy.hook, sub: copy.hookSub, h1: true },
    { id: 'hadiah', kicker: 'Resique Member Card', title: copy.tagline, sub: copy.taglineSub, h1: false },
    { id: 'sale', kicker: 'Golden Sale', title: 'Golden Sale!!', sub: `Harga turun paling besar sampai -${maxPct}%`, h1: false },
  ]
  const tile = (j: number) => cn('hook-float absolute overflow-hidden rounded-xl bg-white shadow-3', j === 0 && 'left-0 top-8 z-20 w-[54%] rotate-[-5deg]', j === 1 && 'right-0 top-0 z-10 w-[48%] rotate-[6deg] [animation-delay:1.5s]', j === 2 && 'bottom-0 right-[4%] w-[48%] rotate-[-3deg] [animation-delay:3s]')
  return (
    <section id="hook" className="scroll-mt-20 bg-white pb-10 pt-5 lg:pb-14 lg:pt-8">
      {/* plain white like the prize section under it; the card carries all the depth (Lurd, 11 Sep) */}
      <div className="container relative">
        <div ref={banner} className="relative isolate overflow-hidden rounded-xl bg-navy-900 text-white shadow-3" data-banner data-reveal="in" onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); onLeave() }} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onPointerMove={onMove}>
          <BannerGround />
          <div ref={track} className="banner-track no-scrollbar flex snap-x snap-mandatory overflow-x-auto" role="region" aria-roledescription="carousel" aria-label="Banner Golden Privilege">
            {slides.map((sl, i) => {
              const Title = sl.h1 ? 'h1' : 'h2'
              return (
                <div key={sl.id} data-slide={sl.id} className={cn('relative grid w-full shrink-0 snap-start grid-cols-1 items-center gap-8 px-6 pb-14 pt-8 sm:px-10 lg:min-h-[460px] lg:grid-cols-12 lg:gap-6 lg:px-14 lg:py-12', sl.id === 'harga' && '[grid-template-rows:1fr_auto] lg:[grid-template-rows:none]')} aria-roledescription="slide" aria-label={`${i + 1} dari ${count}`}>
                  <div className="min-w-0 lg:col-span-7">
                    <Title className={cn('t-mega mt-4 max-w-3xl text-balance uppercase text-white', !sl.h1 && 'text-[clamp(30px,5vw,60px)]')}>{sl.h1 ? <StaggerWords text={sl.title} neon /> : <Marked text={sl.title} className="mark-neon text-green" />}</Title>
                    {sl.sub && <p className={cn('mt-3 max-w-xl text-balance font-extrabold uppercase text-white', sl.h1 ? 'text-[20px] sm:text-[26px]' : 'text-[15px] font-semibold normal-case text-white/85 sm:text-[17px]')}>{sl.sub}</p>}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                      {sl.id === 'hadiah' ? (
                        <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200"><Link to="/register">Daftar Sekarang <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link></Button>
                      ) : (
                        <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200"><a href="#golden-sale" onClick={jump('golden-sale')}>Lihat Golden Sale <ArrowRight className="h-4 w-4" strokeWidth={2} /></a></Button>
                      )}
                      {sl.h1 && <Link to="/login" className="u-slide arrow-nudge inline-flex min-h-[44px] items-center gap-1 text-[15px] font-semibold text-white [--u-bottom:8px]">Cek poin-mu! <ChevronsRight className="h-4 w-4" strokeWidth={2} /></Link>}
                    </div>
                  </div>
                  <div className={cn('min-w-0 lg:col-span-5', sl.id === 'harga' && 'lg:self-end')}>
                    {sl.id === 'harga' && (
                      /* the mock's own hero picture: phone-in-hand with the Resique WhatsApp profile, Rinso pouch + jerrycan, washing
                         machine and scale floating around it (layers lifted from the RGP PDF, composited once → hero-phone.webp).
                         It sits on the banner floor and the hand runs off the bottom edge, exactly like the source. */
                      <div className="hook-card-wrap relative -mx-6 -mb-14 w-[calc(100%+48px)] sm:mx-auto sm:w-full sm:max-w-[560px] lg:absolute lg:bottom-0 lg:right-0 lg:m-0 lg:w-[680px] lg:max-w-none">
                        <img src="/img/hero-phone.webp" alt="Profil WhatsApp Customer Solution Resique di HP, dikelilingi produk laundry" width={1010} height={606} className="hook-float block w-full" loading="eager" decoding="async" data-hero-art />
                      </div>
                    )}
                    {sl.id === 'hadiah' && (
                      <div className="relative mx-auto h-[220px] w-full max-w-[420px] sm:h-[260px]">
                        {assets.heroPrizes.slice(0, 3).map((p, j) => (
                          <div key={p.id} className={tile(j)}>
                            <img src={p.image} alt={p.label} width={800} height={600} className="aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" />
                            <p className="truncate px-3 py-1.5 text-[12px] font-bold text-ink">{p.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {sl.id === 'sale' && (
                      <div className="mx-auto grid w-full max-w-[420px] grid-cols-2 gap-3">
                        {drops.slice(0, 4).map((d, j) => (
                          <a key={d.id} href="#golden-sale" onClick={jump('golden-sale')} data-no-press className={cn('lift group relative overflow-hidden rounded-xl bg-white shadow-3', j % 2 ? 'prize-b' : 'prize-a')}>
                            <img src={d.image} alt={d.name} width={800} height={600} className="zoom-img aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" />
                            <span className="absolute left-2 top-2 rounded-md bg-gold px-2 py-0.5 text-[11px] font-extrabold text-gold-ink">-{d.pct}%</span>
                            <span className="flex items-baseline gap-2 px-3 py-1.5"><span className="t-fig text-[14px] text-navy-700">{rupiah(d.promoPrice)}</span><span className="t-num strike text-[11px] text-ink-3">{rupiah(d.realPrice)}</span></span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <button type="button" aria-label="Slide sebelumnya" onClick={() => goTo(idx - 1)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-base hover:-translate-x-0.5 hover:bg-white/20 lg:grid"><ChevronLeft className="h-5 w-5" strokeWidth={2} /></button>
          <button type="button" aria-label="Slide berikutnya" onClick={() => goTo(idx + 1)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition-[background-color,transform] duration-base hover:translate-x-0.5 hover:bg-white/20 lg:grid"><ChevronRight className="h-5 w-5" strokeWidth={2} /></button>
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5" role="tablist" aria-label="Pilih slide">
            {slides.map((sl, i) => (
              <button key={sl.id} type="button" role="tab" aria-selected={i === idx} aria-label={`Slide ${i + 1}`} onClick={() => goTo(i)} className={cn('banner-dot h-2 rounded-full transition-[width,background-color] duration-base', i === idx ? 'w-7 bg-green' : 'w-2 bg-white/40 hover:bg-white/70')} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* 2, Hero = the mock's prize grid, made playful (Lurd, 11 Sep): the "TANPA DIUNDI!" of the sub is a gold sticker,
   the four prize cards rest with an alternating tilt, pop in staggered, straighten + zoom on hover with a light sweep,
   the point chip counts up, and the biggest prize carries a "Hadiah utama" seal. Prizes come from config. */
function HeroSection() {
  const { copy, prizes } = useConfig(s => s.config)
  const top = [...prizes].filter(p => p.active).sort((a, b) => b.pointCost - a.pointCost).slice(0, 4)
  const STICK = 'TANPA DIUNDI!'
  const sub = copy.taglineSub.includes(STICK) ? copy.taglineSub.split(STICK) : null
  return (
    <section id="hero" className="scroll-mt-20 bg-white py-14 lg:py-20">
      <div className="container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="t-h2 text-balance text-ink"><Marked text={copy.tagline} /></h2>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty text-ink-2 sm:text-[17px]">
            {sub ? <>{sub[0]}<span className="sticker-in inline-block rotate-[-3deg] rounded-md bg-gold px-2 py-0.5 text-[13px] font-extrabold uppercase text-gold-ink shadow-1 sm:text-[14px]">{STICK}</span>{sub[1]}</> : copy.taglineSub}
          </p>
        </Reveal>
        {top.length === 0 ? <EmptyState className="mt-8" title="Hadiah belum diatur" desc="Admin menambahkan hadiah lewat CRM." /> : (
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5" aria-label="Hadiah Golden Privilege">
            {top.map((p, i) => <PrizeCard key={p.id} prize={p} idx={i} />)}
          </ul>
        )}
      </div>
    </section>
  )
}
function PrizeCard({ prize, idx }: { prize: Prize; idx: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const pts = useCountUp(prize.pointCost, inView, 900)
  return (
    <Reveal as="li" delay={idx * 80} className="reveal-pop">
      <Link to="/login" data-prize-card className={cn('lift card-fx sweep group relative flex h-full flex-col rounded-lg border border-line bg-white p-3 sm:p-4', idx % 2 ? 'prize-b' : 'prize-a')} data-no-press style={{ '--tint': '#F1F9EA' } as React.CSSProperties}>
        {idx === 0 && <span className="absolute left-4 top-4 z-10 rotate-[-6deg] rounded-md bg-navy-700 px-2 py-1 text-[11px] font-extrabold text-white shadow-2 sm:left-5 sm:top-5">Hadiah utama</span>}
        <span className="block overflow-hidden rounded-md bg-surface-2"><img src={prize.image} alt={prize.name} width={800} height={600} className="zoom-img aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" /></span>
        <span className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] font-bold leading-snug text-ink sm:text-[14px]">{prize.name}</span>
        <span ref={ref} className="chip mt-2 inline-flex w-fit items-center gap-1.5 rounded-md bg-gold-100 px-2 py-1 text-[12px] font-extrabold text-gold-ink transition-transform duration-base group-hover:-rotate-3 group-hover:scale-105"><Coins className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /><span className="t-fig text-[13px]">{poin(pts)}</span> Pt</span>
      </Link>
    </Reveal>
  )
}

/* 3, Benefit = the mock's navy band: title with "Tak Terbatas" in green (translucent green band under it, not a
   solid one), the member card, four benefits (icon disc · title · one line) whose discs breathe, then the four-step
   strip in the mock's colours (green / blue / blue / green discs, numbered) with an active step that cycles
   left → right so the flow reads itself (Lurd, 11 Sep: "the user is no fun"). */
const STEPS = [
  { n: 1, icon: ShoppingCart, label: ['Diskon', 'Belanja'], tone: 'bg-green text-navy-900', badge: 'bg-navy-700 text-white' },
  { n: 2, icon: Star, label: ['Dapatkan', 'Point'], tone: 'bg-navy-500 text-white', badge: 'bg-green text-navy-900' },
  { n: 3, icon: Ticket, label: ['Tukarkan', 'Voucher'], tone: 'bg-navy-500 text-white', badge: 'bg-green text-navy-900' },
  { n: 4, icon: ShoppingBag, label: ['Nikmati', 'Keuntungannya'], tone: 'bg-green text-navy-900', badge: 'bg-navy-700 text-white' },
]
function BenefitSection() {
  const { copy, benefits } = useConfig(s => s.config)
  const { ref: stepsRef, inView: stepsIn } = useInView<HTMLOListElement>()
  const [step, setStep] = React.useState(-1)
  React.useEffect(() => {
    if (!stepsIn) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setStep(0); return }
    let i = 0; setStep(0)
    const t = setInterval(() => { i = (i + 1) % STEPS.length; setStep(i) }, 1500)
    return () => clearInterval(t)
  }, [stepsIn])
  return (
    <section id="benefit" className="scroll-mt-20">
      <div className="relative isolate overflow-hidden bg-navy-700 py-14 text-white lg:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><Streaks dim /><span className="band bg-navy-800" style={{ left: '-12%', bottom: '-40%', width: '48%', height: '80%' }} /></div>
        <div className="container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="t-h2 text-balance text-white"><Marked text={copy.benefitTitle} phrase="Tak Terbatas" className="mark-neon text-green" /></h2>
            <p className="mt-3 text-[15px] leading-relaxed text-pretty text-white/80 sm:text-[17px]">{copy.benefitSub}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="min-w-0 lg:col-span-5"><MemberCardArt /></div>
            <ul className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7 lg:gap-5">
              {benefits.map((b, i) => <BenefitRow key={b.id} b={b} idx={i} />)}
            </ul>
          </div>
        </div>
      </div>
      <div className="bg-navy-50 py-10 lg:py-14" data-steps>
        <div className="container">
          <div className="relative overflow-hidden rounded-xl bg-white shadow-3 ring-1 ring-line">
            {/* banner head: green bar + kicker, the strip reads as one highlighted object */}
            <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-green" />
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[14px] border-green-50" />
            <span aria-hidden className="pointer-events-none absolute -left-12 -bottom-16 h-40 w-40 rounded-full bg-green-50" />
            <div className="relative flex flex-col items-center gap-1 px-5 pb-2 pt-7 text-center">
              <h3 className="text-[20px] font-extrabold text-balance text-navy-700 sm:text-[24px]">4 langkah, langsung untung</h3>
            </div>
        <ol ref={stepsRef} className="relative flex flex-wrap items-start justify-center gap-y-6 px-4 pb-8 pt-4" aria-label="Cara kerja Resique Member Card">
          {STEPS.map((st, i) => (
            <li key={st.n} className="step flex items-start" data-active={step === i ? 'true' : 'false'}>
              <Reveal delay={i * 110} className="reveal-pop flex w-[150px] flex-col items-center text-center sm:w-[170px]">
                <span className={cn('step-circle relative grid h-[88px] w-[88px] place-items-center rounded-full shadow-2 sm:h-[96px] sm:w-[96px]', st.tone)}>
                  <st.icon className="h-9 w-9" strokeWidth={1.7} aria-hidden />
                  <span className={cn('t-fig absolute -top-1 left-1/2 grid h-7 w-7 -translate-x-1/2 place-items-center rounded-full text-[13px] ring-2 ring-white', st.badge)}>{st.n}</span>
                </span>
                <span className="mt-3 text-[14px] font-extrabold leading-tight text-navy-700">{st.label[0]}<br />{st.label[1]}</span>
              </Reveal>
              {i < STEPS.length - 1 && <ArrowRight className="step-arrow mx-1 mt-8 hidden h-6 w-6 shrink-0 text-navy-700/50 sm:mx-4 sm:block" strokeWidth={2.2} aria-hidden data-on={step === i ? 'true' : 'false'} />}
            </li>
          ))}
        </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
function BenefitRow({ b, idx }: { b: Benefit; idx: number }) {
  const Icon = BENEFIT_ICONS[b.icon] || Sparkles
  return (
    <Reveal as="li" delay={idx * 90} className="reveal-pop min-w-0">
      <div className="lift-lg card-fx flex h-full items-start gap-4 rounded-lg p-3" style={{ '--tint': 'rgba(255,255,255,.08)' } as React.CSSProperties}>
        <span className="chip pulse-ring grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green text-navy-900 shadow-1" style={{ '--pd': `${idx * 0.7}s` } as React.CSSProperties} aria-hidden><Icon className="h-6 w-6" strokeWidth={1.9} /></span>
        <div className="min-w-0">
          <h3 className="text-[16px] font-extrabold leading-tight text-white sm:text-[17px]">{b.title}</h3>
          <p className="mt-1 text-[14px] leading-relaxed text-pretty text-white/80">{b.desc}</p>
        </div>
      </div>
    </Reveal>
  )
}
/* The member card, drawn from the photo Lurd sent (11 Sep): royal-blue card, one green crescent sweeping up the right
   edge, white text — RMC / RESIQUE MEMBER CARD / MEMBER ID RMC 2025 0321 0839 / "Lebih Rutin, Lebih Untung" — a soft
   white glow. Rests slightly turned, floats; on hover it swirls once and zooms in (card-swirl keyframes). */
function MemberCardArt() {
  return (
    <div className="card3d-wrap relative mx-auto max-w-[420px] py-6">
      <div className="hook-float">
        <div className="card3d relative aspect-[1.586] overflow-hidden rounded-xl p-5 text-white sm:p-6" data-member-card style={{ background: '#1D4FB8' }}>
          {/* right-edge dark field + the green crescent */}
          <svg aria-hidden className="swoosh absolute inset-0 h-full w-full" viewBox="0 0 400 252" preserveAspectRatio="none" fill="none">
            <path d="M310 252C365 200 400 130 400 40V252Z" fill="#153C8F" />
            <path d="M225 252C300 215 360 150 400 60V118C355 190 300 236 250 252Z" fill="#71BD41" />
            <path d="M232 252C305 216 362 150 400 66" stroke="#B7E094" strokeWidth="2" strokeOpacity=".8" />
          </svg>
          <div className="relative flex h-full flex-col">
            <div>
              <p className="t-fig text-[34px] leading-none text-white sm:text-[42px]">RMC</p>
              <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.02em] text-white sm:text-[13px]">Resique Member Card</p>
            </div>
            <div className="mt-auto">
              <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-white/85 sm:text-[10px]">Member ID</p>
              <p className="t-fig text-[14px] leading-none sm:text-[16px]">RMC 2025 0321 0839</p>
              <p className="mt-3 text-[11px] leading-tight text-white/90 sm:text-[12px]">Lebih Rutin,<br /><strong className="text-[13px] font-extrabold text-white sm:text-[14px]">Lebih Untung</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* 4, Tier = the mock's six columns: emblem, name, per-month, then "Benefit Diskon Tiap Transaksi" + %, "Gratis Ongkir /
   Min Belanja / Rp 500.000", "Gratis Sesi Konsultasi Bisnis / 1x /bulan", "Belanja 6 Bulan (Rp) / band" — the check and
   cross marks sit before the row label as in the mock. Mobile keeps the snap rail. */
function TierSection() {
  const cfg = useConfig(s => s.config)
  const rail = React.useRef<HTMLOListElement>(null)
  const [active, setActive] = React.useState(0)
  React.useEffect(() => {
    const el = rail.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const mq = window.matchMedia('(max-width: 1023px)')
    if (!mq.matches) return
    const items = [...el.querySelectorAll<HTMLElement>(':scope > li')]
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.6) setActive(items.indexOf(e.target as HTMLElement)) })
    }, { root: el, threshold: [0.6] })
    items.forEach(li => io.observe(li))
    let nudged = false
    const hint = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || nudged) return
      nudged = true
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      setTimeout(() => { el.scrollTo({ left: 40, behavior: 'smooth' }); setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 520) }, 700)
    }, { threshold: 0.4 })
    hint.observe(el)
    return () => { io.disconnect(); hint.disconnect() }
  }, [cfg.tiers.length])
  const goTo = (i: number) => { const li = rail.current?.querySelectorAll<HTMLElement>(':scope > li')[i]; li?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }) }
  return (
    <section id="tier" className="relative isolate scroll-mt-20 overflow-hidden border-t border-line bg-gradient-to-b from-white via-navy-50/60 to-white py-14 lg:py-24">
      {/* R.045 (Lurd): the streak mesh plus two skewed bands plus the wash was three competing
          layers. One layer now — two oversized, heavily blurred tints bleeding in from the
          corners. No edges to notice, so it reads as depth rather than as pattern. */}
      <span aria-hidden className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[560px] w-[560px] rounded-full bg-navy-100/50 blur-3xl" />
      <span aria-hidden className="pointer-events-none absolute -right-48 bottom-[-14%] -z-10 h-[620px] w-[620px] rounded-full bg-gold-100/40 blur-3xl" />
      <div className="container">
        <SectionTitle title={cfg.copy.tierTitle} sub={cfg.copy.tierSub} center />
        <ol ref={rail} className="tier-rail no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 lg:mx-0 lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0" aria-label="Daftar tier RMC">
          {cfg.tiers.map((t, i) => <TierCardV key={t.key} tier={t} idx={i} top={i === cfg.tiers.length - 1} active={i === active} />)}
        </ol>
        <div className="mt-2 flex items-center justify-center gap-1.5 lg:hidden" role="tablist" aria-label="Geser tier">
          {cfg.tiers.map((t, i) => (
            <button key={t.key} type="button" role="tab" aria-selected={i === active} aria-label={t.name} onClick={() => goTo(i)} className={cn('tier-dot h-2 rounded-full', i === active ? 'w-6' : 'w-2 bg-line')} style={i === active ? { background: t.sw } : undefined} />
          ))}
        </div>
        <Reveal delay={120} className="mx-auto mt-6 flex max-w-3xl items-start gap-3 rounded-lg border border-gold-200 bg-gold-50 px-4 py-3 shadow-1" data-mitra-note>
          <span className="t-fig mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gold text-[15px] text-gold-ink" aria-hidden>*</span>
          <p className="t-note text-[15px] leading-relaxed text-gold-ink">*Mitra Apique Management memiliki diskon minimal <strong className="font-medium">{cfg.mitraFloorDiscount}%</strong> sejak Starter. Jika diskon tier lebih besar, itu yang dipakai.</p>
        </Reveal>
      </div>
    </section>
  )
}
const rpFull = (n: number) => `Rp ${n.toLocaleString('id-ID')}`
function TierCardV({ tier, idx, top, active }: { tier: Tier; idx: number; top: boolean; active?: boolean }) {
  const ongkirOn = tier.freeDelivMin !== null
  const konsulOn = tier.consult > 0
  return (
    <Reveal as="li" delay={idx * 60} data-active={active ? 'true' : 'false'} className={cn('lift tier-card card-fx reveal-pop group relative flex w-[76%] shrink-0 snap-center flex-col overflow-hidden rounded-xl p-4 text-white sm:w-[44%] lg:w-auto', top && 'sweep ring-2 ring-gold ring-offset-2 ring-offset-white hover:shadow-gold')}
      style={{ '--tier': tier.sw, '--tint': 'rgba(255,255,255,.10)', background: tier.sw } as React.CSSProperties}>
      <span aria-hidden className="t-fig pointer-events-none absolute -bottom-3 -right-1 select-none text-[96px] leading-none text-white/10">{idx + 1}</span>
      <div className="tier-head relative flex items-start justify-between gap-2">
        <span className={cn('badge grid h-11 w-11 shrink-0 place-items-center rounded-full', top ? 'bg-gold text-gold-ink' : 'bg-white/15 text-white')} aria-hidden>
          {top ? <Crown className="h-6 w-6" strokeWidth={1.6} fill="currentColor" /> : <Medal className="h-6 w-6" strokeWidth={1.7} />}
        </span>
      </div>
      <h3 className="mt-3 text-[18px] font-extrabold leading-tight">{tier.name}</h3>
      <p className="t-num text-[12px] text-white/75">{tier.perMonth} / bulan</p>
      <div className="mt-3 border-t border-white/20 pt-3" data-row="diskon">
        <p className="text-[11px] font-semibold leading-tight text-white/80">Benefit Diskon<br />Tiap Transaksi</p>
        <CountPct value={tier.discount} className={cn('mt-1', top ? 'text-gold' : 'text-white')} />
      </div>
      <TierRow on={ongkirOn} label="Gratis Ongkir" sub="Min Belanja" value={tier.freeDelivMin === null ? undefined : tier.freeDelivMin === 0 ? 'Tanpa min.' : rpFull(tier.freeDelivMin)} row="ongkir" />
      <TierRow on={konsulOn} label="Gratis Sesi" sub="Konsultasi Bisnis" value={konsulOn ? `${tier.consult}x /bulan` : undefined} row="konsul" />
      {/* bands are inclusive both ends (0–8.999.999, next tier starts sharp at 9.000.000), the exact rupiah, Lurd's rule */}
      <div className="mt-3 border-t border-white/20 pt-3" data-row="belanja">
        <p className="text-[11px] font-semibold text-white/80">Belanja 6 Bulan (Rp)</p>
        <p className="t-num mt-0.5 text-[13px] font-bold">{tier.max !== null ? <>{tier.min.toLocaleString('id-ID')} –<br />{tier.max.toLocaleString('id-ID')}</> : `≥ ${tier.min.toLocaleString('id-ID')}`}</p>
      </div>
      <span className="bar" aria-hidden />
    </Reveal>
  )
}
/* one benefit row of a tier column: the mock's filled check (green) / cross (muted) disc before the label */
function TierRow({ on, label, sub, value, row }: { on: boolean; label: string; sub: string; value?: string; row: string }) {
  return (
    <div className="mt-3 border-t border-white/20 pt-3" data-row={row}>
      <div className="flex items-start gap-2">
        <span className={cn('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full ring-1 ring-white/40', on ? 'bg-green text-white' : 'bg-danger text-white')} aria-hidden data-mark={on ? 'check' : 'x'}>
          {on ? <Check className="h-3 w-3" strokeWidth={3.4} /> : <X className="h-3 w-3" strokeWidth={3.2} />}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold leading-tight">{label}</p>
          <p className="text-[11px] font-semibold leading-tight text-white/75">{sub}</p>
          {value && <p className="t-num mt-1 text-[14px] font-extrabold leading-none">{value}</p>}
        </div>
      </div>
    </div>
  )
}
/* a rupiah figure that counts up once in view (podium spend) */
function CountRupiah({ value, className }: { value: number; className?: string }) {
  const { ref, inView } = useInView<HTMLParagraphElement>()
  const v = useCountUp(value, inView, 1100)
  return <p ref={ref} className={cn('t-fig', className)} data-spend={value}>{rupiah(v)}</p>
}
/* the discount figure counts up from 0 once the card is in view (final value under reduced motion) */
function CountPct({ value, className }: { value: number; className?: string }) {
  const { ref, inView } = useInView<HTMLParagraphElement>()
  const v = useCountUp(value, inView)
  return <p ref={ref} className={cn('t-fig t-fig-black origin-left text-[36px] leading-none transition-transform duration-slow ease-out group-hover:scale-110', className)} data-pct={value}>{v}%</p>
}

/* 5, CTA band = the mock's "Daftar RMC Sekarang!": title + sub from the mock, the four benefit highlights (icon
   chips), then the three step chips and the RMC card preview kept from the earlier rounds. Primary = Daftar Sekarang
   (green), secondary = Masuk & cek poin (white). */
function CtaSection() {
  const cfg = useConfig(s => s.config)
  const { copy, rules, benefits } = cfg
  const acc = useCurrentAccount()
  return (
    <section id="cek-poin" className="relative isolate scroll-mt-20 overflow-hidden bg-navy-700 py-16 text-white lg:py-24">
      <Streaks dim />
      <span aria-hidden className="band bg-navy-800" style={{ left: '-12%', bottom: '-40%', width: '52%', height: '80%' }} />
      <div className="container relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
        <div className="min-w-0 lg:col-span-7">
          <Reveal>
            <h2 className="t-h1 text-balance text-white"><Marked text={copy.ctaPoints} className="mark-light" /></h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-pretty text-white/85 sm:text-[17px]">{copy.ctaPointsSub}</p>
          </Reveal>
          <Reveal delay={60}>
            <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" aria-label="Keuntungan member" data-cta-benefits>
              {benefits.map((b, i) => { const Icon = BENEFIT_ICONS[b.icon] || Sparkles; return (
                <li key={b.id} className="lift-lg card-fx flex min-w-0 flex-col items-center gap-3 rounded-xl bg-white/10 px-3 py-4 text-center ring-1 ring-white/15 sm:py-5" style={{ '--tint': 'rgba(255,255,255,.08)' } as React.CSSProperties}>
                  <span className="chip pulse-ring grid h-14 w-14 shrink-0 place-items-center rounded-full bg-green text-navy-900 shadow-2 sm:h-16 sm:w-16" style={{ '--pd': `${i * 0.6}s` } as React.CSSProperties} aria-hidden><Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.9} /></span>
                  <span className="text-[13px] font-extrabold leading-tight text-white sm:text-[14px]">{b.title}</span>
                </li>
              ) })}
            </ul>
          </Reveal>
          <Reveal delay={160} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            {acc ? (
              <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200">
                <Link to="/profile">Buka profil RMC <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="arrow-nudge bg-green text-navy-900 shadow-2 hover:-translate-y-0.5 hover:bg-green-200">
                  <Link to="/register">Daftar Sekarang <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>
                </Button>
                <Button asChild size="lg" variant="inverse" className="arrow-nudge hover:-translate-y-0.5">
                  <Link to="/login">Masuk & cek poin <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>
                </Button>
              </>
            )}
          </Reveal>
        </div>
        <Reveal delay={120} className="min-w-0 lg:col-span-5">
          {/* R.041 (Lurd): QR first, card underneath, and the code big enough to scan off a screen
              across a counter rather than from arm's length. */}
          <div className="mx-auto flex max-w-[400px] items-center gap-5 rounded-xl bg-white p-5 text-ink shadow-3 lg:ml-auto lg:mr-0" data-site-qr>
            <img src="/img/qr-site.svg" alt="QR kode ke rmc-web-beta.vercel.app" width={176} height={176} className="h-36 w-36 shrink-0 rounded-md sm:h-44 sm:w-44" loading="lazy" decoding="async" />
            <div className="min-w-0">
              <p className="text-[15px] font-extrabold leading-tight text-navy-700">Scan untuk buka web Golden Privilege</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-2">Arahkan kamera HP ke QR ini, atau bagikan ke teman laundry-mu.</p>
              <p className="t-code mt-2 truncate text-[12px] font-bold text-green-700">rmc-web-beta.vercel.app</p>
            </div>
          </div>
          <div className="mt-6"><RmcCardPreview rules={rules} /></div>
        </Reveal>
      </div>
    </section>
  )
}

/* The demo member's card, computed with the same rmcFor() the profile uses, real tier, real points, real months. */
function RmcCardPreview({ rules }: { rules: Config['rules'] }) {
  const cfg = useConfig(s => s.config)
  const orders = useOrders(s => s.orders)
  const demo = SEED_ACCOUNTS[0]
  const customer = useCrm(s => s.customers.find(c => c.id === demo.crmCustomerId)) || null
  const rmc = React.useMemo(() => rmcFor(cfg, customer, orders, [], demo.id, demo.isMitra), [cfg, customer, orders, demo.id, demo.isMitra])
  if (!customer) return null
  const months = rmc.monthly.slice(-6)
  const maxPts = Math.max(1, ...months.map(m => m.points))
  return (
    <div className="tilt-wrap relative mx-auto max-w-[340px] pt-3 pr-3 lg:ml-auto lg:mr-0">
      <p className="mb-4 text-[13px] font-semibold text-white/70">Contoh profil member: {demo.laundry}</p>
      <div className="relative">
        <div className="tilt-back absolute inset-0 rounded-xl bg-gold" aria-hidden />
        <div data-rmc-card className="tilt relative rounded-xl bg-white p-5 text-ink shadow-3 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src={cfg.assets.mark} srcSet={srcSet2x(cfg.assets.mark)} alt="" width={28} height={28} className="h-7 w-7" />
              <p className="text-[13px] font-bold text-ink">Resique Member Card</p>
            </div>
            <span className="rounded-md px-2.5 py-1 text-[12px] font-extrabold text-white" style={{ background: rmc.tier.sw }}>{rmc.tier.name}</span>
          </div>
          <p className="mt-6 text-[13px] font-semibold text-ink-3">Poin RMC</p>
          <p className="t-fig t-fig-black mt-1 text-[40px] leading-none text-navy-700 sm:text-[44px]">{poin(rmc.points)}</p>
          <p className="t-code mt-1.5 text-[13px] text-ink-2">Diskon {rmc.discount}% · poin berlaku sampai {rules.expiry}</p>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-line-2 pt-4">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-ink">{demo.laundry}</p>
              <p className="truncate text-[13px] text-ink-2">{demo.pic} · {demo.rsl}</p>
            </div>
            <div className="flex h-9 shrink-0 items-end gap-1" aria-label="Poin 6 bulan terakhir">
              {months.map((m, i) => (
                <span key={m.ym} className={cn('w-2 rounded-sm', i === months.length - 1 ? 'bg-gold' : 'bg-green-200')} style={{ height: `${Math.max(12, Math.round((m.points / maxPts) * 100))}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Confetti behind the Golden Sale band (dark ground): gold coins, green + white dots, a few stars; drift on the float
   keyframes; fewer on phones. */
function SaleConfetti() {
  const dots = ['left-[8%] top-[70px] h-3 w-3 bg-gold', 'left-[44%] top-[36px] h-2 w-2 bg-green', 'right-[14%] top-[80px] h-4 w-4 bg-gold', 'left-[12%] bottom-[160px] h-2 w-2 bg-white/70 hidden md:block', 'right-[6%] bottom-[120px] h-3 w-3 bg-green hidden md:block', 'left-[36%] bottom-[40px] h-2 w-2 bg-gold', 'right-[36%] top-[150px] h-2.5 w-2.5 bg-white/60 hidden lg:block', 'left-[60%] bottom-[90px] h-3 w-3 bg-gold hidden lg:block']
  const stars = ['left-[20%] top-[120px]', 'right-[22%] top-[40px] hidden md:block', 'left-[70%] bottom-[60px] hidden lg:block']
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d, i) => <span key={i} className={cn('float-6 absolute rounded-full', d)} style={{ animationDelay: `${(i * 0.9) % 5}s` }} />)}
      {stars.map((st, i) => <Sparkles key={i} className={cn('float-6 absolute h-6 w-6 text-gold', st)} strokeWidth={1.6} style={{ animationDelay: `${1 + i}s` }} />)}
      <span className="absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full border-[24px] border-white/[.05]" />
      <span className="absolute -left-20 -bottom-28 h-[300px] w-[300px] rounded-full bg-navy-800" />
    </div>
  )
}

/* Countdown to the campaign end (end of day, local time). Ticks every second; the boxes read Hari / Jam / Menit / Detik. */
function Countdown({ end }: { end: string }) {
  const target = React.useMemo(() => new Date(`${end}T23:59:59`).getTime(), [end])
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const left = Math.max(0, target - now)
  const d = Math.floor(left / 86_400_000), h = Math.floor(left / 3_600_000) % 24, m = Math.floor(left / 60_000) % 60, sec = Math.floor(left / 1000) % 60
  const cells = [[d, 'Hari'], [h, 'Jam'], [m, 'Menit'], [sec, 'Detik']] as const
  return (
    <div className="inline-flex flex-col items-start gap-2 lg:items-end" data-countdown aria-live="off">
      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gold"><Zap className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />{left === 0 ? 'Periode berakhir' : 'Berakhir dalam'}</p>
      <div className="flex items-center gap-1.5">
        {cells.map(([v, l], i) => (
          <React.Fragment key={l}>
            <span className="flex min-w-[56px] flex-col items-center rounded-md bg-gold px-2 py-1.5 text-gold-ink shadow-2 sm:min-w-[62px]">
              <span className="t-fig text-[22px] leading-none sm:text-[24px]" data-cd={l}>{String(v).padStart(2, '0')}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.04em]">{l}</span>
            </span>
            {i < cells.length - 1 && <span className="t-fig text-[20px] text-gold" aria-hidden>:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

/* 6, Golden Sale = the latest Figma (11 Sep, designer's note: "wow factor, like a Shopee flash sale"): dark navy band,
   an angled gold ribbon marquee "GOLDEN SALE • HARGA SPESIAL MEMBER RESIQUE", a FLASH SALE chip, "GOLDEN SALE!!" with
   SALE!! in gold, the live countdown, white product cards with a red -N% badge, price + strike, a gold "Hemat Rp…" chip
   and the green Tambah. Confetti drifts behind. Copy is config-driven ({pct} = the real biggest cut). */
function GoldenSaleSection() {
  const cfg = useConfig(s => s.config)
  const orders = useOrders(s => s.orders)
  const qty = useCart(s => s.qty)
  const pkgQty = useCart(s => s.pkgQty)
  const inc = useCart(s => s.inc)
  const dec = useCart(s => s.dec)
  const incPkg = useCart(s => s.incPkg)
  const decPkg = useCart(s => s.decPkg)
  const items = cfg.items.filter(i => i.active)
  const packages = cfg.packages.filter(p => p.active)
  const maxPct = Math.max(...items.map(i => i.realPrice > i.promoPrice ? Math.round((1 - i.promoPrice / i.realPrice) * 100) : 0), 0)
  const ribbon = Array.from({ length: 8 }, (_, i) => i)
  const empty = items.length === 0 && packages.length === 0
  /* R.050 (Lurd): the package group sits above the item group, each under its own highlighted title.
     R.051: packages are bundles of items (staging model) — availability comes from the contents. */
  return (
    <section id="golden-sale" className="relative isolate scroll-mt-20 overflow-hidden bg-navy-900 pb-16 pt-20 text-white lg:pb-24 lg:pt-24">
      <Streaks />
      <SaleConfetti />
      {/* angled gold ribbon marquee across the top edge */}
      <div aria-hidden className="ribbon pointer-events-none absolute inset-x-[-6%] top-3 overflow-hidden bg-gold py-2 text-gold-ink shadow-2 lg:top-4">
        <ul className="marquee-track gap-0" style={{ animationDuration: '28s' }}>
          {ribbon.map(i => <li key={i} className="inline-flex shrink-0 items-center gap-3 px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] sm:text-[12px]"><Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />Golden Sale<span className="h-1 w-1 rounded-full bg-gold-ink/60" />Harga spesial member Resique</li>)}
        </ul>
      </div>
      <div className="container relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 rounded-md bg-gold px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em] text-gold-ink"><Zap className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />Flash Sale</p>
            <h2 className="t-h1 mt-3 text-balance uppercase text-white"><Marked text={cfg.copy.saleTitle} className="mark-gold text-gold" /></h2>
            <p className="mt-3 text-[15px] leading-relaxed text-pretty text-white/80 sm:text-[17px]">{cfg.copy.saleSub.replace('{pct}', String(maxPct))}</p>
            <p className="t-num mt-2 text-[13px] text-white/60">{packages.length > 0 ? `${packages.length} paket · ` : ''}{items.length} produk · sampai {fmtDate(cfg.campaign.end)} · selama stok ada</p>
          </Reveal>
          <Reveal delay={80}><Countdown end={cfg.campaign.end} /></Reveal>
        </div>
        {empty ? (
          <EmptyState className="mt-8" title="Belum ada item Golden Sale" desc="Item promo belum dibuka. Cek lagi nanti." />
        ) : (
          <>
            {packages.length > 0 && (
              <div data-sale-group="paket" className="mt-10">
                <Reveal><h3 className="t-h2 text-balance uppercase text-white"><Marked text={cfg.copy.salePaketTitle} className="mark-gold text-gold" /></h3></Reveal>
                <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
                  {packages.map((pkg, idx) => {
                    const left = packageRemaining(pkg, cfg.items, orders, cfg.packages)
                    const q = pkgQty[pkg.id] || 0
                    const cap = pkg.maxPerCustomer > 0 ? pkg.maxPerCustomer : Infinity
                    const max = Math.min(cap, left)
                    return (
                      <Reveal as="li" key={pkg.id} delay={Math.min(idx, 11) * 40} className="reveal-pop">
                        <PackageCard pkg={pkg} items={cfg.items} qty={q} left={left} max={Number.isFinite(max) ? max : undefined}
                          onInc={() => { if (left <= 0) return toast.error('Stok habis'); if (Number.isFinite(max) && q >= max) return toast.warning(cap <= left ? `Maksimal ${cap} per pelanggan` : `Stok tersisa ${left}`); incPkg(pkg.id) }}
                          onDec={() => decPkg(pkg.id)} />
                      </Reveal>
                    )
                  })}
                </ul>
              </div>
            )}
            {items.length > 0 && (
              <div data-sale-group="item" className={packages.length > 0 ? 'mt-12 lg:mt-16' : 'mt-10'}>
                <Reveal><h3 className="t-h2 text-balance uppercase text-white"><Marked text={cfg.copy.saleItemTitle} className="mark-gold text-gold" /></h3></Reveal>
                <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
                  {items.map((it, idx) => {
                    const left = itemLeft(it, orders, cfg.packages)
                    const q = qty[it.id] || 0
                    const cap = it.maxPerCustomer > 0 ? it.maxPerCustomer : Infinity
                    const max = Math.min(cap, left)
                    return (
                      <Reveal as="li" key={it.id} delay={Math.min(idx, 11) * 40} className="reveal-pop">
                        <ProductCard item={it} qty={q} left={left} max={Number.isFinite(max) ? max : undefined}
                          onInc={() => { if (left <= 0) return toast.error('Stok habis'); if (Number.isFinite(max) && q >= max) return toast.warning(cap <= left ? `Maksimal ${cap} per pelanggan` : `Stok tersisa ${left}`); inc(it.id) }}
                          onDec={() => dec(it.id)} />
                      </Reveal>
                    )
                  })}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
/** Shared card chrome for items and packages: photo, -N% badge, Habis / Sisa N badge, name, meta line, price pair, chips, stepper. */
function SaleCard({ image, name, meta, contents, realPrice, promoPrice, maxPerCustomer, qty, left, max, onInc, onDec, extra }: { image: string; name: string; meta: string; contents?: string; realPrice: number; promoPrice: number; maxPerCustomer: number; qty: number; left: number; max?: number; onInc: () => void; onDec: () => void; extra?: React.ReactNode }) {
  const soldOut = left <= 0
  const pct = realPrice > 0 ? Math.round((1 - promoPrice / realPrice) * 100) : 0
  const save = realPrice - promoPrice
  return (
    <article className={cn('lift card-fx sweep group flex h-full flex-col rounded-lg bg-white p-3 text-ink sm:p-4', qty > 0 ? 'ring-2 ring-green' : 'ring-1 ring-white/10', soldOut && 'opacity-70')} style={{ '--tint': '#FBF5E8' } as React.CSSProperties}>
      <div className="relative overflow-hidden rounded-md bg-surface-2">
        <img src={image} alt={name} width={800} height={600} className="zoom-img aspect-[4/3] w-full object-cover" loading="lazy" />
        {pct > 0 && <span className="absolute left-2 top-2 rounded-md bg-danger px-2 py-0.5 text-[11px] font-extrabold text-white shadow-1">-{pct}%</span>}
        {soldOut ? <Badge variant="muted" className="absolute right-2 top-2">Habis</Badge>
          : Number.isFinite(left) && left <= 10 ? <Badge variant="warn" className="absolute right-2 top-2">Sisa {left}</Badge> : null}
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] font-bold leading-snug text-ink sm:text-[14px]">{name}</h3>
      <p className="mt-0.5 text-[12px] text-ink-3">{meta}</p>
      {contents && <p data-contents className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-2">Isi: {contents}</p>}
      {extra}
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="t-fig text-[16px] text-navy-700 sm:text-[17px]">{rupiah(promoPrice)}</span>
        {save > 0 && <span className="t-num strike text-[12px] text-ink-4">{rupiah(realPrice)}</span>}
      </div>
      {(save > 0 || maxPerCustomer > 0) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {save > 0 && <span className="t-num inline-flex w-fit rounded-md bg-gold-100 px-2 py-0.5 text-[11px] font-extrabold text-gold-ink">Hemat {rupiah(save)}</span>}
          {maxPerCustomer > 0 && <span data-max-chip className="t-num inline-flex w-fit rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink-3">Maks {maxPerCustomer}/pelanggan</span>}
        </div>
      )}
      <div className="mt-3">
        <QtyStepper qty={qty} onInc={onInc} onDec={onDec} max={max} disabled={soldOut} label={name} className="w-full justify-center" />
      </div>
    </article>
  )
}
function ProductCard({ item, qty, left, max, onInc, onDec }: { item: GoldenSaleItem; qty: number; left: number; max?: number; onInc: () => void; onDec: () => void }) {
  return <SaleCard image={item.image} name={item.name} meta={`${item.cat} · per ${item.unit}`} realPrice={item.realPrice} promoPrice={item.promoPrice} maxPerCustomer={item.maxPerCustomer} qty={qty} left={left} max={max} onInc={onInc} onDec={onDec} />
}
/** Package card (staging PackageCard): the contents line "Isi: A x1, B x2" comes from the bundle, the optional description under it. */
function PackageCard({ pkg, items, qty, left, max, onInc, onDec }: { pkg: GoldenSalePackage; items: GoldenSaleItem[]; qty: number; left: number; max?: number; onInc: () => void; onDec: () => void }) {
  const contents = pkg.items.map(c => `${items.find(i => i.id === c.itemId)?.name || '?'} x${c.qty}`).join(', ')
  return <SaleCard image={pkg.image} name={pkg.name} meta={`Paket · ${pkg.items.length} jenis item`} contents={contents} realPrice={pkg.realPrice} promoPrice={pkg.promoPrice} maxPerCustomer={pkg.maxPerCustomer} qty={qty} left={left} max={max} onInc={onInc} onDec={onDec}
    extra={pkg.desc ? <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-3">{pkg.desc}</p> : undefined} />
}

/* Basket bar + sheet (floating → shadow, no border). Item lines and package lines live side by side (staging BasketBarClient). */
function BasketBar() {
  const cfg = useConfig(s => s.config)
  const qty = useCart(s => s.qty)
  const pkgQty = useCart(s => s.pkgQty)
  const setQty = useCart(s => s.set)
  const setPkg = useCart(s => s.setPkg)
  const [open, setOpen] = React.useState(false)
  const lines = [...cartLines(qty, cfg.items), ...cartPackageLines(pkgQty, cfg.packages)]
  const count = cartCount(lines), total = cartTotal(lines), savings = cartSavings(lines)
  const show = count > 0
  const setLine = (l: (typeof lines)[number], q: number) => (l.packageId ? setPkg(l.packageId, q) : setQty(l.itemId!, q))
  return (
    <>
      <div data-basket-bar aria-hidden={!show} className={cn('fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))]', show ? 'bar-in' : 'pointer-events-none translate-y-6 opacity-0')}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl bg-ink p-2 pl-4 text-white shadow-3">
          <button type="button" onClick={() => setOpen(true)} className="slide flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-md text-left" aria-label="Lihat keranjang">
            <span className="t-code text-[13px] text-white/80">{count} item · hemat {rupiah(savings)}</span>
            <span className="t-fig truncate text-[17px] leading-tight">{rupiah(total)}</span>
          </button>
          <Button asChild variant="gold" size="lg" className="bar-pop rounded-lg"><Link to="/checkout">Checkout <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link></Button>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="sm:bottom-4 sm:mx-auto sm:max-w-lg sm:rounded-xl">
          <SheetHeader><SheetTitle>Keranjang</SheetTitle><SheetDescription>{count} item · total {rupiah(total)}</SheetDescription></SheetHeader>
          <ul className="mt-4 divide-y divide-line-2">
            {lines.map(l => (
              <li key={lineKey(l)} className="py-3">
                <p className="text-[15px] font-semibold text-ink">{l.name}{l.packageId && <span className="ml-2 rounded-md bg-gold-100 px-1.5 py-px text-[11px] font-bold text-gold-ink">Paket</span>}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <QtyStepper qty={l.qty} onInc={() => setLine(l, l.qty + 1)} onDec={() => setLine(l, l.qty - 1)} label={l.name} />
                  <p className="t-code text-[15px] font-bold text-ink">{rupiah(l.qty * l.promoPrice)}</p>
                </div>
              </li>
            ))}
          </ul>
          <Button asChild size="xl" variant="gold" className="mt-4 w-full rounded-lg"><Link to="/checkout">Bayar {rupiah(total)}</Link></Button>
        </SheetContent>
      </Sheet>
    </>
  )
}

/* 7, Klasemen: a podium for the top three (rank 1 in navy with the trophy, the grand-prize chip and a gold ring;
   2 and 3 flank it in silver / bronze), then rows 4–10 with a spend bar that fills on reveal. One <ol> so the ranking
   stays a single ordered list; the podium is laid out with CSS `order` so DOM order = rank order. */
function KlasemenSection() {
  const cfg = useConfig(s => s.config)
  const orders = useOrders(s => s.orders)
  const acc = useCurrentAccount()
  const rows = React.useMemo(() => klasemen(orders, cfg.campaign.start, cfg.campaign.end), [orders, cfg.campaign.start, cfg.campaign.end])
  const top = rows.slice(0, cfg.klasemen.topN)
  const mine = acc ? rows.find(r => r.accountId === acc.id || (acc.crmCustomerId && r.crmCustomerId === acc.crmCustomerId) || r.phone === acc.phone) : undefined
  const leadSpend = top[0]?.spend || 1
  const grand = cfg.assets.heroPrizes[0]
  const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <section id="klasemen" className="scroll-mt-20 bg-white pb-10 pt-14 lg:pb-14 lg:pt-24">
      <div className="container">
        {/* the frame: a gold panel that carries the arena (navy stage floor, spotlight beams, rings, sparkles);
            the section itself stays plain white (Lurd, 11 Sep) */}
        <div data-klasemen-frame className="relative isolate overflow-hidden rounded-2xl bg-navy-900 px-5 py-8 text-white ring-1 ring-white/10 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
          <Streaks className="-z-10" />
          <span aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] -z-10 h-[520px] w-[140%] -translate-x-1/2 rounded-[50%] bg-navy-800 lg:top-[34%] lg:h-[620px] lg:w-[110%]" />
          <span aria-hidden className="pointer-events-none absolute left-[18%] top-[-10%] -z-10 h-[70%] w-[22%] origin-top skew-x-[18deg] bg-white/[.04]" />
          <span aria-hidden className="pointer-events-none absolute right-[18%] top-[-10%] -z-10 h-[70%] w-[22%] origin-top skew-x-[-18deg] bg-white/[.04]" />
          <Rings className="right-[-120px] bottom-[-100px] -z-10 h-[380px] w-[380px] text-gold" />
          <Rings className="left-[-160px] top-[-140px] -z-10 h-[360px] w-[360px] text-navy-500" />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            {['left-[8%] top-[140px]', 'right-[10%] top-[40px] hidden md:block', 'left-[48%] top-[24px] hidden lg:block'].map((st, i) => <Sparkles key={st} className={cn('float-6 absolute h-6 w-6 text-gold', st)} strokeWidth={1.6} style={{ animationDelay: `${1 + i}s` }} />)}
          </div>
<SectionTitle title={cfg.copy.klasemenTitle} sub={cfg.copy.klasemenSub} tone="white" mark="mark-gold text-gold [--mark:rgba(212,160,78,.38)]" />
        {top.length === 0 ? <EmptyState className="mt-8" title="Belum ada pesanan Lunas" desc="Pesanan yang sudah Lunas akan tampil di sini." /> : (
          <ol className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:items-end sm:gap-4" aria-label="Peringkat belanja Golden Sale">
            {top.map((r, i) => {
              const me = !!mine && r.key === mine.key
              const share = Math.max(4, Math.round((r.spend / leadSpend) * 100))
              if (i < 3) {
                const first = i === 0
                const medal = ['Emas', 'Perak', 'Perunggu'][i]
                return (
                  <Reveal as="li" key={r.key} data-rank={r.rank} delay={first ? 320 : i === 1 ? 160 : 0}
                    className={cn('lift podium-rise relative flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 rounded-xl p-4 text-left sm:flex-col sm:flex-nowrap sm:items-center sm:justify-start sm:gap-0 sm:px-4 sm:pb-4 sm:pt-5 sm:text-center', ['podium-1', 'podium-2', 'podium-3'][i],
                      first ? 'ring-pulse bg-navy-700 text-white ring-2 ring-gold ring-offset-2 ring-offset-navy-900 sm:order-2 sm:min-h-[340px] sm:pb-6 sm:pt-7' : 'border sm:order-1',
                      i === 1 && 'border-[#C0C6CE] bg-[#F3F5F8] sm:min-h-[292px]',
                      i === 2 && 'border-[#E3C3A8] bg-[#FBF3EC] sm:order-3 sm:min-h-[256px]')}>
                    {/* big faint rank number, like the tier columns */}
                    <span aria-hidden className={cn('t-fig pointer-events-none absolute -bottom-3 right-2 select-none text-[88px] leading-none', first ? 'text-white/10' : 'text-navy-900/[.06]')}>{r.rank}</span>
                    {/* medal: trophy for rank 1 (the only svg in that li, the gate counts it); a medal icon in silver / bronze for 2 and 3 */}
                    <span className={cn('medal grid shrink-0 place-items-center rounded-full', first ? 'h-14 w-14 bg-gold text-gold-ink sm:h-16 sm:w-16' : 'h-12 w-12 text-white sm:h-14 sm:w-14')} style={first ? undefined : { background: 'var(--pod)' }} aria-hidden>
                      {first ? <Trophy className="h-7 w-7" strokeWidth={1.6} /> : <Medal className="h-6 w-6" strokeWidth={1.7} />}
                    </span>
                    <span className={cn('hidden h-11 w-11 place-items-center rounded-full text-[14px] font-extrabold sm:mt-3 sm:grid', first ? 'bg-white/15 text-white' : 'bg-white text-navy-700 shadow-1')} aria-hidden>{initials(r.laundry)}</span>
                    <div className="relative min-w-0 flex-1 sm:w-full sm:flex-none">
                      <p className={cn('t-num text-[11px] font-bold sm:mt-2', first ? 'text-gold' : i === 1 ? 'text-[#6B7480]' : 'text-[#9A5F33]')}>Peringkat {r.rank} · {medal}{first && <span> · kandidat hadiah utama</span>}</p>
                      <p className={cn('mt-0.5 break-words text-[16px] font-extrabold leading-tight sm:mt-1 sm:line-clamp-2 sm:text-balance', first ? 'text-white' : 'text-ink')}>{r.laundry}{me && <Badge className="ml-1 align-middle">Kamu</Badge>}</p>
                      {cfg.klasemen.showPic && <p className={cn('t-num mt-0.5 truncate text-[12px]', first ? 'text-white/75' : 'text-ink-2')}>{r.pic} · {r.orders} transaksi</p>}
                    </div>
                    <CountRupiah value={r.spend} className={cn('relative shrink-0 text-[17px] leading-none sm:mt-2 sm:w-full sm:truncate sm:text-[22px]', first ? 'text-gold' : 'text-navy-700')} />
                    {first && grand && (
                      <span className="relative inline-flex min-w-full shrink-0 items-center gap-2 self-start rounded-md bg-white/10 py-1 pl-1 pr-2.5 text-[12px] font-semibold text-white sm:mt-3 sm:min-w-0">
                        <img src={grand.image} alt="" width={800} height={600} className="h-6 w-6 shrink-0 rounded-[4px] object-cover" loading="lazy" />
                        <span className="truncate">Hadiah utama: {grand.label}</span>
                      </span>
                    )}
                    {/* spend relative to the leader */}
                    <div className={cn('relative h-1.5 min-w-full shrink-0 overflow-hidden rounded-full sm:mt-4', first ? 'bg-white/15' : 'bg-navy-900/10')} aria-hidden>
                      <div className="bar-fill h-full rounded-full" style={{ width: `${share}%`, background: first ? '#D4A04E' : 'var(--pod)' }} />
                    </div>
                  </Reveal>
                )
              }
              return (
                <Reveal as="li" key={r.key} data-rank={r.rank} delay={Math.min(i, 9) * 40} className={cn('slide -mx-3 rounded-md px-3 py-3 hover:bg-white/10 sm:order-4 sm:col-span-3 sm:-mx-4 sm:px-4', i === 3 && 'mt-2 sm:mt-4', me && 'bg-green/15 hover:bg-green/15')}>
                  <div className="flex items-center gap-4">
                    <span className="t-fig grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/10 text-[15px] text-white/70">{r.rank}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-white">{r.laundry}{me && <Badge className="ml-2 align-middle">Kamu</Badge>}</p>
                      {cfg.klasemen.showPic && <p className="t-num truncate text-[13px] text-white/65">{r.pic} · {r.orders} transaksi</p>}
                    </div>
                    <p className="t-fig shrink-0 text-[15px] text-gold sm:text-[17px]">{rupiah(r.spend)}</p>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15" style={{ marginLeft: 52 }} aria-hidden>
                    <div className="bar-fill h-full rounded-full bg-green" style={{ width: `${share}%` }} />
                  </div>
                </Reveal>
              )
            })}
            {mine && mine.rank > cfg.klasemen.topN && (
              <li className="-mx-3 mt-2 flex items-center gap-4 rounded-md bg-green/15 px-3 py-3.5 sm:order-5 sm:col-span-3 sm:-mx-4 sm:px-4">
                <span className="t-fig grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white text-[15px] text-navy-700">{mine.rank}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[15px] font-bold text-white">{mine.laundry} <Badge className="ml-1 align-middle">Kamu</Badge></p><p className="text-[13px] text-white/65">Peringkatmu saat ini</p></div>
                <p className="t-fig text-[15px] text-gold">{rupiah(mine.spend)}</p>
              </li>
            )}
          </ol>
        )}
        </div>
        <p className="t-num mt-6 max-w-2xl text-[13px] leading-relaxed text-ink-2">Yang dihitung: pesanan Lunas (bukti bayar sudah diverifikasi) dalam periode {cfg.campaign.label}. Rp{cfg.rules.earnPerRp.toLocaleString('id-ID')} belanja = 1 poin.</p>
        <span className="hidden"><ShoppingBag /></span>
      </div>
    </section>
  )
}
