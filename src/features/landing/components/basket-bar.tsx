'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { rupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { cartCount, cartLines, cartPackageLines, cartSavings, cartTotal, lineKey, useCart } from '@/stores/cart.store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { QtyStepper } from '@/features/landing/components/qty-stepper'
import { useAppConfig } from '@/features/landing/hooks/use-config'

/* Basket bar + sheet (floating → shadow, no border). Item lines and package lines live side by side (staging BasketBarClient). */
export function BasketBar() {
  const cfg = useAppConfig()
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
          <Button variant="gold" size="lg" className="bar-pop rounded-lg" nativeButton={false} render={<Link href="/checkout" />}>Checkout <ArrowRight className="h-4 w-4" strokeWidth={2} /></Button>
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
          <Button size="xl" variant="gold" className="mt-4 w-full rounded-lg" nativeButton={false} render={<Link href="/checkout" />}>Bayar {rupiah(total)}</Button>
        </SheetContent>
      </Sheet>
    </>
  )
}
