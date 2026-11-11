import * as React from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminAccess } from '@/features/admin/hooks/use-admin-access'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

/* Settings-page building blocks (echo of UM: page-head h1 + sub, card-head h3 + body, save bar). */

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-ink-3">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SettingsCard({ title, desc, actions, children, className, bodyClassName }: { title: string; desc?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn('rounded-xl border border-line bg-white shadow-1', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-2 px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-bold leading-tight text-ink">{title}</h3>
          {desc && <p className="mt-0.5 text-[12px] text-ink-3">{desc}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}

/** Sticky-ish footer of a card: dirty hint + Batal + Simpan. */
export function SaveBar({ dirty, onSave, onReset, label = 'Simpan', disabled, children }: { dirty: boolean; onSave: () => void; onReset: () => void; label?: string; disabled?: boolean; children?: React.ReactNode }) {
  const { canEdit } = useAdminAccess()
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-2 pt-4">
      <p className={cn('text-[12px]', dirty ? 'font-semibold text-warn' : 'text-ink-4')} aria-live="polite">{dirty ? 'Ada perubahan belum disimpan' : 'Tidak ada perubahan'}</p>
      <div className="flex items-center gap-2">
        {children}
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={!dirty}>Batal</Button>
        <Button type="button" size="sm" onClick={onSave} disabled={!dirty || disabled || !canEdit} title={canEdit ? undefined : 'Hanya lihat, tidak bisa menyimpan'}>{label}</Button>
      </div>
    </div>
  )
}

/** Number input, `inputMode="numeric"`. Empty string ⇒ `onClear()` when given, else `empty` (default 0). */
export function NumInput({ value, onChange, onClear, empty = 0, className, ...rest }: { value: number | null | undefined; onChange: (n: number) => void; onClear?: () => void; empty?: number; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [text, setText] = React.useState(value == null ? '' : String(value))
  React.useEffect(() => { setText(t => (Number(t) === value || (t === '' && value == null) ? t : value == null ? '' : String(value))) }, [value])
  return (
    <Input
      type="text" inputMode={rest.step && Number(rest.step) < 1 ? 'decimal' : 'numeric'} value={text} className={cn('t-num', className)}
      onChange={e => {
        const raw = e.target.value.replace(/[^\d.\-]/g, '')
        setText(raw)
        if (raw === '' && onClear) { onClear(); return }
        const n = Number(raw)
        onChange(raw === '' || Number.isNaN(n) ? empty : n)
      }}
      {...rest}
    />
  )
}

/** Checkbox + label + hint as one tappable row. */
export function CheckRow({ id, checked, onChange, label, hint, className }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string; className?: string }) {
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-3 rounded-lg border border-line px-3.5 py-3 transition-colors hover:border-ink-4', className)}>
      <Checkbox id={id} checked={checked} onCheckedChange={v => onChange(v === true)} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-ink-3">{hint}</span>}
      </span>
    </label>
  )
}

/** Up / down / remove trio for list editors. */
export function RowTools({ index, count, onMove, onRemove }: { index: number; count: number; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  const { canEdit } = useAdminAccess()
  return (
    <div className="flex items-center gap-0.5">
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Naik" disabled={!canEdit || index === 0} onClick={() => onMove(index, index - 1)}><ArrowUp strokeWidth={1.6} /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Turun" disabled={!canEdit || index === count - 1} onClick={() => onMove(index, index + 1)}><ArrowDown strokeWidth={1.6} /></Button>
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Hapus" disabled={!canEdit} className="text-danger hover:bg-danger-50 hover:text-danger" onClick={onRemove}><Trash2 strokeWidth={1.6} /></Button>
    </div>
  )
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const next = list.slice()
  const [it] = next.splice(from, 1)
  next.splice(to, 0, it)
  return next
}

/** Small stat tile for section summaries. */
export function StatTile({ label, value, hint, tone = 'ink' }: { label: string; value: React.ReactNode; hint?: string; tone?: 'ink' | 'navy' | 'warn' }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3.5 shadow-1">
      <p className="text-micro uppercase text-ink-3">{label}</p>
      <p className={cn('t-num mt-1 text-[22px] font-extrabold leading-none tracking-tight', tone === 'navy' ? 'text-navy-700' : tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-3">{hint}</p>}
    </div>
  )}

/** Compact input class for table cells. */
export const cell = 'h-9 px-2.5 text-[13px]'
