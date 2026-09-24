import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-[0.02em] transition-colors', {
  variants: {
    variant: {
      default: 'border-transparent bg-navy-50 text-navy-700',
      gold: 'border-transparent bg-gold-100 text-gold-ink',
      outline: 'border-line text-ink-2 bg-white',
      ok: 'border-transparent bg-ok-50 text-ok',
      warn: 'border-transparent bg-warn-50 text-warn',
      danger: 'border-transparent bg-danger-50 text-danger',
      info: 'border-transparent bg-info-50 text-info',
      muted: 'border-transparent bg-surface-2 text-ink-3',
      inverse: 'border-white/20 bg-white/15 text-white backdrop-blur',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

/** Order status → badge variant (single source for admin + order page). */
export function statusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'PAID': return 'ok'
    case 'PROOF_UPLOADED': return 'info'
    case 'AWAITING_PAYMENT': return 'warn'
    case 'REJECTED': return 'danger'
    case 'EXPIRED': return 'muted'
    default: return 'outline'
  }
}

export { Badge, badgeVariants }
