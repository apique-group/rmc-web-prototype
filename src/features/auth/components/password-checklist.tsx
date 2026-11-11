import * as React from 'react'
import { Check, Eye, EyeOff, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { checkPassword } from '@/lib/password'
import { Input, type InputProps } from '@/components/ui/input'

/** Live policy checklist (5 rules), shared by Register (password step) and ChangePassword. */
export function PasswordChecklist({ password, minLength, className }: { password: string; minLength: number; className?: string }) {
  const r = checkPassword(password, minLength)
  const rules: { key: keyof typeof r; label: string }[] = [
    { key: 'minLength', label: `Minimal ${minLength} karakter` },
    { key: 'upper', label: 'Huruf besar (A–Z)' },
    { key: 'lower', label: 'Huruf kecil (a–z)' },
    { key: 'digit', label: 'Angka (0–9)' },
    { key: 'symbol', label: 'Simbol (!@#$%)' },
  ]
  return (
    <ul className={cn('grid gap-1.5 sm:grid-cols-2', className)} aria-label="Syarat kata sandi">
      {rules.map(rule => {
        const ok = r[rule.key]
        return (
          <li key={rule.key} className={cn('flex items-center gap-2 text-[13px] transition-colors', ok ? 'text-navy-700' : 'text-ink-3')}>
            <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full', ok ? 'bg-navy-50 text-navy-700' : 'bg-surface-2 text-ink-4')}>
              {ok ? <Check className="h-3 w-3" strokeWidth={2.5} /> : <Minus className="h-3 w-3" strokeWidth={2} />}
            </span>
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

/** Password input with a 44px show/hide toggle. */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>(({ className, ...props }, ref) => {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input ref={ref} type={show ? 'text' : 'password'} autoComplete={props.autoComplete || 'current-password'} className={cn('pr-12', className)} {...props} />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        aria-pressed={show}
        className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-lg text-ink-3 transition-colors hover:text-ink focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/25"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.6} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.6} />}
      </button>
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'
