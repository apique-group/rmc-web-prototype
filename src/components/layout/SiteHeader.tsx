import * as React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Clock, Facebook, Instagram, MessageCircle, Phone, Youtube } from 'lucide-react'
import { cn } from '@/lib/utils'
import { srcSet2x } from '@/lib/logo'
import { useConfig } from '@/store/config'
import { useCurrentAccount, useSession } from '@/store/session'
import { CONTACTS, EXT, SOCIALS } from '@/data/contacts'
import { Button } from '@/components/ui/button'

/* Nav content from the RGP UI mock (Lurd's designer, 7 Sep 2026): Home · RMC · Golden Sale · Klasemen. */
const NAV = [
  { id: 'home', to: '/', label: 'Home' },
  { id: 'benefit', to: '/#benefit', label: 'RMC' },
  { id: 'golden-sale', to: '/#golden-sale', label: 'Golden Sale' },
  { id: 'klasemen', to: '/#klasemen', label: 'Klasemen' },
]
const SPY_IDS = ['benefit', 'golden-sale', 'klasemen']

const SOCIAL_ICON = { instagram: Instagram, youtube: Youtube, facebook: Facebook } as const

/* Two-tier header (R.017): a utility row (customer services · jam buka · lokasi · Hubungi Kami) above the main row
   (real Resique lockup · nav · socials · Cek poin). The utility row slides away once the page scrolls (lg only, transform
   only). Mobile keeps the single 56px row + a drawer that stacks the same content. */
export function SiteHeader() {
  const cfg = useConfig(s => s.config)
  const acc = useCurrentAccount()
  const signOut = useSession(s => s.signOut)
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const [active, setActive] = React.useState<string>('home')
  const firstLink = React.useRef<HTMLAnchorElement>(null)

  React.useEffect(() => { setOpen(false) }, [loc.pathname, loc.hash])
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const main = document.querySelector('main')
    if (main) { if (open) main.setAttribute('inert', ''); else main.removeAttribute('inert') }
    if (open) setTimeout(() => firstLink.current?.focus(), 200)
    return () => { document.body.style.overflow = ''; main?.removeAttribute('inert') }
  }, [open])
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  // scroll state (passive listener, one boolean) for the utility-row slide
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 64)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* The header hides the utility row on scroll by translating up by exactly its height.
     Publish that height instead of hardcoding it in CSS: it has already drifted three times
     as the row's padding and button size changed. Re-measured on resize. */
  const utilityRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = utilityRef.current
    if (!el) return
    // set it on the HEADER, not the row: custom properties inherit downward, so a var set on
    // the child is invisible to the .site-header rule that consumes it
    const apply = () => (el.closest('[data-site-header]') as HTMLElement | null)?.style.setProperty('--utility-h', `${el.offsetHeight}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // scroll-spy: the section crossing the middle band of the viewport owns the nav's current mark
  React.useEffect(() => {
    if (loc.pathname !== '/' || typeof IntersectionObserver === 'undefined') { setActive('home'); return }
    const els = SPY_IDS.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    const seen = new Map<string, boolean>()
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => seen.set(e.target.id, e.isIntersecting))
      const cur = SPY_IDS.find(id => seen.get(id))
      setActive(cur || 'home')
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [loc.pathname])

  const go = (to: string) => (e: React.MouseEvent) => {
    if (to.startsWith('/#')) {
      e.preventDefault()
      const id = to.slice(2)
      if (loc.pathname !== '/') { nav('/'); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80) }
      else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      setOpen(false)
    } else if (to === '/' && loc.pathname === '/') {
      e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setOpen(false)
    }
  }

  const info = [
    { icon: Phone, label: 'Customer Services', value: CONTACTS.waDisplay, href: `tel:+${CONTACTS.waNumber}` },
    { icon: Clock, label: 'Jam Buka', value: CONTACTS.hours, code: true },
  ]

  return (
    <>
      <header data-site-header data-scrolled={scrolled || undefined} className="site-header sticky top-0 z-40 bg-bg">
        {/* tier 1 — utility row (desktop). Outside <nav> so `header nav a` stays the main links. */}
        <div ref={utilityRef} data-utility className="hidden border-b border-line-2 bg-white py-2.5 lg:block">
          <div className="container flex items-center justify-between gap-6 text-[13px]">
            <ul className="flex items-center">
              {info.map((it, i) => (
                <li key={it.label} className="flex items-center">
                  {i > 0 && <span className="mx-5 h-4 w-px bg-line" aria-hidden />}
                  {it.href ? (
                    <a href={it.href} className="group inline-flex min-h-8 items-center gap-2 text-ink-2 transition-colors duration-base hover:text-navy-700 hover:-translate-y-px">
                      <it.icon className="h-4 w-4 text-green-700" strokeWidth={1.7} aria-hidden />
                      <span>{it.label}</span><strong className="font-semibold text-ink">{it.value}</strong>
                    </a>
                  ) : (
                    <span className="inline-flex min-h-8 items-center gap-2 text-ink-2">
                      <it.icon className="h-4 w-4 text-green-700" strokeWidth={1.7} aria-hidden />
                      <span>{it.label}</span><strong className={cn('font-semibold text-ink', it.code && 't-code')}>{it.value}</strong>
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <Button asChild size="sm" className="arrow-nudge">
              <a href={CONTACTS.wa} {...EXT}><MessageCircle strokeWidth={1.8} />Hubungi Kami</a>
            </Button>
          </div>
        </div>

        {/* tier 2 — main row */}
        <div className="h-14 border-b border-line lg:h-16">
          <div className="container flex h-full items-center justify-between gap-3">
            <Link to="/" onClick={go('/')} className="flex min-h-11 items-center gap-3 transition-[transform,opacity] duration-base hover:-translate-y-px hover:opacity-90" aria-label="Resique Golden Privilege, beranda">
              <img src={cfg.assets.logo} srcSet={srcSet2x(cfg.assets.logo)} alt="Resique Supermarket Laundry" width={130} height={32} className="h-8 w-auto" decoding="async" />
              <span className="hidden items-center gap-3 sm:inline-flex" aria-hidden>
                <span className="h-6 w-px bg-line" />
                <span className="text-[13px] font-bold leading-none text-navy-700">Golden<br />Privilege</span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
              {NAV.map(n => {
                const cur = active === n.id
                return (
                  <a key={n.id} href={n.to === '/' ? '#/' : n.to} onClick={go(n.to)} aria-current={cur ? 'page' : undefined}
                    className={cn('u-slide relative rounded-md px-3 py-2 text-[15px] font-medium transition-colors duration-base hover:text-navy-700 [--u-bottom:4px] [--u-inset:0.75rem]', cur ? 'font-semibold text-navy-700' : 'text-ink-2')}>
                    {n.label}
                    <span aria-hidden className={cn('absolute left-1/2 top-[6px] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green transition-[transform,opacity] duration-base ease-out', cur ? 'scale-100 opacity-100' : 'scale-50 opacity-0')} />
                  </a>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <ul className="hidden items-center gap-0.5 xl:flex" aria-label="Media sosial Resique">
                {SOCIALS.map(s => { const Icon = SOCIAL_ICON[s.id]; return (
                  <li key={s.id}>
                    <a href={s.href} {...EXT} aria-label={s.label} className="grid h-9 w-9 place-items-center rounded-md text-ink-3 transition-[color,transform,background-color] duration-base hover:-translate-y-0.5 hover:bg-surface-2 hover:text-navy-700">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    </a>
                  </li>
                ) })}
                <li className="ml-1 mr-2 h-5 w-px bg-line" aria-hidden />
              </ul>
              {acc ? (
                <>
                  <Button asChild><Link to="/profile">Profil RMC</Link></Button>
                  <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => { signOut(); nav('/') }}>Keluar</Button>
                </>
              ) : (
                <Button asChild><Link to="/login">Cek poin</Link></Button>
              )}
              <button type="button" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="site-drawer" onClick={() => setOpen(o => !o)} className="relative grid h-11 w-11 place-items-center rounded-md text-ink transition-colors duration-fast hover:bg-surface-2 md:hidden">
                <span className={cn('absolute h-[2px] w-5 rounded-full bg-current transition-transform duration-base ease-out', open ? 'rotate-45' : '-translate-y-[4px]')} />
                <span className={cn('absolute h-[2px] w-5 rounded-full bg-current transition-transform duration-base ease-out', open ? '-rotate-45' : 'translate-y-[4px]')} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* mobile drawer: slides down a touch, links stagger in, then the contact block + socials */}
      <div id="site-drawer" data-open={open} aria-hidden={!open} className={cn('fixed inset-x-0 bottom-0 top-14 z-[35] overflow-y-auto bg-white px-5 py-6 transition-[opacity,transform] duration-base ease-out md:hidden', open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0')}>
        <nav className="flex flex-col divide-y divide-line-2 border-y border-line" aria-label="Navigasi seluler">
          {NAV.map((n, i) => (
            <a key={n.id} ref={i === 0 ? firstLink : undefined} href={n.to === '/' ? '#/' : n.to} onClick={go(n.to)} style={{ '--i': `${i * 40}ms` } as React.CSSProperties}
              className={cn('drawer-link slide flex min-h-[52px] items-center justify-between rounded-md text-[17px] font-semibold', active === n.id ? 'text-navy-700' : 'text-ink')}>
              {n.label}{active === n.id && <span className="h-2 w-2 rounded-full bg-green" aria-hidden />}
            </a>
          ))}
        </nav>
        <div className="mt-5 flex gap-3">
          {acc ? (
            <>
              <Button asChild size="lg" className="flex-1"><Link to="/profile">Profil RMC</Link></Button>
              <Button variant="outline" size="lg" onClick={() => { signOut(); nav('/') }}>Keluar</Button>
            </>
          ) : (
            <>
              <Button asChild size="lg" className="flex-1"><Link to="/login">Masuk</Link></Button>
              <Button asChild variant="outline" size="lg" className="flex-1"><Link to="/register">Daftar</Link></Button>
            </>
          )}
        </div>
        <div className="drawer-link mt-6 rounded-lg bg-surface-2 p-4" style={{ '--i': '180ms' } as React.CSSProperties}>
          <ul className="space-y-2.5 text-[14px]">
            {info.map(it => (
              <li key={it.label} className="flex items-center gap-2.5 text-ink-2">
                <it.icon className="h-4 w-4 shrink-0 text-green-700" strokeWidth={1.7} aria-hidden />
                <span>{it.label}</span>
                {it.href ? <a href={it.href} className="u-slide font-semibold text-ink [--u-bottom:-2px]">{it.value}</a> : <strong className={cn('font-semibold text-ink', it.code && 't-code')}>{it.value}</strong>}
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" size="lg" className="mt-4 w-full">
            <a href={CONTACTS.wa} {...EXT}><MessageCircle strokeWidth={1.8} />Hubungi Kami</a>
          </Button>
        </div>
        <ul className="drawer-link mt-5 flex items-center gap-1" aria-label="Media sosial Resique" style={{ '--i': '220ms' } as React.CSSProperties}>
          {SOCIALS.map(s => { const Icon = SOCIAL_ICON[s.id]; return (
            <li key={s.id}>
              <a href={s.href} {...EXT} aria-label={s.label} className="grid h-11 w-11 place-items-center rounded-md text-ink-2 transition-colors duration-base hover:bg-surface-2 hover:text-navy-700"><Icon className="h-5 w-5" strokeWidth={1.7} /></a>
            </li>
          ) })}
        </ul>
      </div>
    </>
  )
}
