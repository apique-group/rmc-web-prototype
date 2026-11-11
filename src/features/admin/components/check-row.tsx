import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'

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
