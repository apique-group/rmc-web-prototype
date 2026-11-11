import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-11 w-full rounded-lg border border-line bg-white px-3.5 py-2 text-[15px] text-ink shadow-none transition-colors duration-base ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ink-4 hover:border-ink-4 focus-visible:border-navy focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/25 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-danger/20',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = 'Input'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-[88px] w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-[15px] text-ink transition-colors duration-base placeholder:text-ink-4 hover:border-ink-4 focus-visible:border-navy focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-navy/25 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger',
      className,
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Input, Textarea }
