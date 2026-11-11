'use client'

import { Sparkles, Zap } from 'lucide-react'
import { Reveal } from '@/components/layout/reveal'
import { fmtDate } from '@/lib/format'
import { toast } from 'sonner'
import { itemLeft, packageRemaining, useCart } from '@/stores/cart.store'
import { EmptyState } from '@/components/layout/empty-state'
import { Countdown } from './countdown'
import { Marked } from './marked'
import { PackageCard, ProductCard } from './sale-card'
import { SaleConfetti } from './sale-confetti'
import { Streaks } from './streaks'
import { useAppConfig } from '@/features/landing/hooks/use-config'
import { useMyOrders } from '@/features/order/hooks/use-order'

/* 6, Golden Sale = the latest Figma (11 Sep, designer's note: "wow factor, like a Shopee flash sale"): dark navy band,
   an angled gold ribbon marquee "GOLDEN SALE • HARGA SPESIAL MEMBER RESIQUE", a FLASH SALE chip, "GOLDEN SALE!!" with
   SALE!! in gold, the live countdown, white product cards with a red -N% badge, price + strike, a gold "Hemat Rp…" chip
   and the green Tambah. Confetti drifts behind. Copy is config-driven ({pct} = the real biggest cut). */
export function GoldenSaleSection() {
  const cfg = useAppConfig()
  const orders = useMyOrders()
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
