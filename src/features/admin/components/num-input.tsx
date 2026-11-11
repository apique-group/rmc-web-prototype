import * as React from 'react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

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
