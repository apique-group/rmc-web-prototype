'use client'

import * as React from 'react'
import { rupiah } from '@/lib/format'
import type { GoldenSaleItem, GoldenSalePackage } from '@/types/member'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { QtyStepper } from '@/features/landing/components/qty-stepper'

/** Shared card chrome for items and packages: photo, -N% badge, Habis / Sisa N badge, name, meta line, price pair, chips, stepper. */
function SaleCard({ image, name, meta, contents, realPrice, promoPrice, maxPerCustomer, qty, left, max, onInc, onDec, extra }: { image: string; name: string; meta: string; contents?: string; realPrice: number; promoPrice: number; maxPerCustomer: number; qty: number; left: number; max?: number; onInc: () => void; onDec: () => void; extra?: React.ReactNode }) {
  const soldOut = left <= 0
  const pct = realPrice > 0 ? Math.round((1 - promoPrice / realPrice) * 100) : 0
  const save = realPrice - promoPrice
  return (
    <article className={cn('lift card-fx sweep group flex h-full flex-col rounded-lg bg-white p-3 text-ink sm:p-4', qty > 0 ? 'ring-2 ring-green' : 'ring-1 ring-white/10', soldOut && 'opacity-70')} style={{ '--tint': '#FBF5E8' } as React.CSSProperties}>
      <div className="relative overflow-hidden rounded-md bg-surface-2">
        <img src={image} alt={name} width={800} height={600} className="zoom-img aspect-4/3 w-full object-cover" loading="lazy" />
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

export function ProductCard({ item, qty, left, max, onInc, onDec }: { item: GoldenSaleItem; qty: number; left: number; max?: number; onInc: () => void; onDec: () => void }) {
  return <SaleCard image={item.image} name={item.name} meta={`${item.cat} · per ${item.unit}`} realPrice={item.realPrice} promoPrice={item.promoPrice} maxPerCustomer={item.maxPerCustomer} qty={qty} left={left} max={max} onInc={onInc} onDec={onDec} />
}

/** Package card (staging PackageCard): the contents line "Isi: A x1, B x2" comes from the bundle, the optional description under it. */
export function PackageCard({ pkg, items, qty, left, max, onInc, onDec }: { pkg: GoldenSalePackage; items: GoldenSaleItem[]; qty: number; left: number; max?: number; onInc: () => void; onDec: () => void }) {
  const contents = pkg.items.map(c => `${items.find(i => i.id === c.itemId)?.name || '?'} x${c.qty}`).join(', ')
  return <SaleCard image={pkg.image} name={pkg.name} meta={`Paket · ${pkg.items.length} jenis item`} contents={contents} realPrice={pkg.realPrice} promoPrice={pkg.promoPrice} maxPerCustomer={pkg.maxPerCustomer} qty={qty} left={left} max={max} onInc={onInc} onDec={onDec}
    extra={pkg.desc ? <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-3">{pkg.desc}</p> : undefined} />
}
