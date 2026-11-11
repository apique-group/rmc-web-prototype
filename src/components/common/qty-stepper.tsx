import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** 44px tap targets; qty 0 collapses to a single "Tambah" pill (market-place idiom). */
export function QtyStepper({ qty, onInc, onDec, max, disabled, label, className }: { qty: number; onInc: () => void; onDec: () => void; max?: number; disabled?: boolean; label: string; className?: string }) {
  const atMax = !!max && max > 0 && qty >= max
  if (qty <= 0) {
    return (
      <button type="button" onClick={onInc} disabled={disabled} aria-label={`Tambah ${label}`} className={cn('inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-green-700 px-4 text-[13px] font-bold text-white shadow-1 transition-[transform,background-color] duration-base ease-out hover:bg-green-600 active:scale-[.97] disabled:opacity-50', className)}>
        <Plus className="h-4 w-4" strokeWidth={2.5} /> Tambah
      </button>
    )
  }
  return (
    <div className={cn('inline-flex h-11 items-center rounded-full border border-navy-200 bg-white shadow-1', className)} role="group" aria-label={`Jumlah ${label}`}>
      <button type="button" onClick={onDec} aria-label={`Kurangi ${label}`} className="grid h-11 w-11 place-items-center rounded-full text-green-700 transition-[transform,background-color] duration-base ease-out hover:bg-green-50 active:scale-[.94]"><Minus className="h-4 w-4" strokeWidth={2.5} /></button>
      <output aria-live="polite" className="t-num w-8 text-center text-[15px] font-extrabold text-ink">{qty}</output>
      <button type="button" onClick={onInc} disabled={atMax || disabled} aria-label={`Tambah ${label}`} className="grid h-11 w-11 place-items-center rounded-full bg-green-700 text-white transition-[transform,background-color] duration-base ease-out hover:bg-green-600 active:scale-[.94] disabled:opacity-40"><Plus className="h-4 w-4" strokeWidth={2.5} /></button>
    </div>
  )
}
