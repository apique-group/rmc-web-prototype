import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/stores/cart.store'
import { Clock, ExternalLink, Facebook, Instagram, Mail, MessageCircle, Store, Youtube } from 'lucide-react'
import { useConfig } from '@/lib/api/mock/config'
import { srcSet2x } from '@/lib/logo'
import { Reveal } from '@/components/common/reveal'
import { cn } from '@/lib/utils'
import { CONTACTS, EXT, SOCIALS } from '@/lib/contacts'

const SOCIAL_ICON = { instagram: Instagram, youtube: Youtube, facebook: Facebook } as const

/* Footer (R.017): navy-900 with the white lockup, three columns — brand + socials · Hubungi kami (real contacts) ·
   Golden Privilege links. Single scroll-in reveal for the block, per-link underline + press. */
export function SiteFooter() {
  const cfg = useConfig(s => s.config)
  // on the landing page with items in the cart, the fixed basket bar covers the footer's last line → clearance below it
  const hasCart = useCart(s => Object.keys(s.qty).length > 0)
  const onLanding = usePathname() === '/'
  const link = 'u-slide inline-flex min-h-[32px] items-center gap-2 text-[14px] text-white/85 transition-colors duration-base hover:text-white [--u-bottom:2px]'
  const contact = [
    { icon: MessageCircle, label: `WhatsApp ${CONTACTS.waDisplay}`, href: CONTACTS.wa, ext: true },
    { icon: Clock, label: `Jam buka ${CONTACTS.hours}` },
    { icon: Mail, label: CONTACTS.email, href: `mailto:${CONTACTS.email}`, ext: false },
    { icon: Store, label: 'Katalog produk', href: CONTACTS.catalog, ext: true },
    { icon: ExternalLink, label: 'Semua outlet & hotline', href: CONTACTS.outlets, ext: true },
  ]
  const site = [
    { label: 'Benefit RMC', to: '/#benefit' },
    { label: 'Tier RMC', to: '/#tier' },
    { label: 'Golden Sale', to: '/#golden-sale' },
    { label: 'Klasemen', to: '/#klasemen' },
  ]
  const jump = (to: string) => (e: React.MouseEvent) => { if (to.startsWith('/#') && window.location.pathname === '/') { e.preventDefault(); document.getElementById(to.slice(2))?.scrollIntoView({ behavior: 'smooth' }) } }
  return (
    <footer className={cn("tex tex-grain relative isolate mt-auto overflow-hidden bg-navy-900 text-white [&.tex-grain::before]:opacity-[.06]", hasCart && onLanding && "pb-24")}>
      <Reveal className="container relative z-10 grid grid-cols-1 gap-10 pb-12 pt-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-14 lg:pb-16 lg:pt-12">
        <div>
          <img src={cfg.assets.logoWhite} srcSet={srcSet2x(cfg.assets.logoWhite)} alt="Resique Supermarket Laundry" width={180} height={39} className="h-9 w-auto" loading="lazy" decoding="async" />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-pretty text-white/75">Supermarket laundry terlengkap di Indonesia. Chemical, perlengkapan, mesin, dan paket usaha laundry di satu tempat.</p>
          <p className="mt-2 text-[13px] text-white/60">Apique Group · {cfg.campaign.label}</p>
          <ul className="mt-5 flex items-center gap-2" aria-label="Media sosial Resique">
            {SOCIALS.map(s => { const Icon = SOCIAL_ICON[s.id]; return (
              <li key={s.id}>
                <a href={s.href} {...EXT} aria-label={s.label} className="grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white transition-[transform,background-color] duration-base hover:-translate-y-0.5 hover:bg-white/15"><Icon className="h-5 w-5" strokeWidth={1.7} /></a>
              </li>
            ) })}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-bold text-green-200">Hubungi kami</p>
          <ul className="mt-3 stack-y-1.5">
            {contact.map(c => (
              <li key={c.label}>
                {c.href ? (
                  <a href={c.href} {...(c.ext ? EXT : {})} className={link}><c.icon className="h-4 w-4 shrink-0 text-green-200" strokeWidth={1.7} aria-hidden />{c.label}</a>
                ) : (
                  <span className="inline-flex min-h-[32px] items-center gap-2 text-[14px] text-white/85"><c.icon className="h-4 w-4 shrink-0 text-green-200" strokeWidth={1.7} aria-hidden />{c.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[13px] font-bold text-green-200">Golden Privilege</p>
          <ul className="mt-3 stack-y-1.5" aria-label="Tautan kaki">
            {site.map(s => <li key={s.to}><a href={s.to} onClick={jump(s.to)} className={link}>{s.label}</a></li>)}
            <li><Link href="/login" className={cn(link, "font-bold text-green-200 hover:text-green-100")}>Masuk / cek poin</Link></li>
            <li><Link href="/register" className={cn(link, "font-bold text-green-200 hover:text-green-100")}>Daftar RMC</Link></li>
          </ul>
        </div>
      </Reveal>
      <div className="relative z-10 border-t border-white/10">
        <div className="container flex flex-col gap-2 py-5 text-[13px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Resique Supermarket Laundry · Apique Group</p>
          <a href={CONTACTS.site} {...EXT} className="u-slide inline-flex min-h-[32px] items-center gap-1.5 font-semibold text-white/85 transition-colors duration-base hover:text-white [--u-bottom:2px]">Situs resmi {CONTACTS.siteLabel} <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden /></a>
        </div>
      </div>
    </footer>
  )
}
