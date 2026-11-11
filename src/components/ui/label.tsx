import * as React from 'react'
import { cn } from '@/lib/utils'

/* shadcn label (base-ui style: a plain <label>, as in apique-web-rmc), Resique look kept. */
function Label({ className, required, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label data-slot="label" className={cn('text-[13px] font-semibold text-ink-2 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
    </label>
  )
}

/** Field wrapper: label + control + hint/error. */
export function Field({ label, required, hint, error, htmlFor, children, className }: { label: string; required?: boolean; hint?: string; error?: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('stack-y-1.5', className)}>
      <Label htmlFor={htmlFor} required={required}>{label}</Label>
      {children}
      {error ? <p className="text-[12px] text-danger" role="alert">{error}</p> : hint ? <p className="text-[12px] text-ink-3">{hint}</p> : null}
    </div>
  )
}

export { Label }
