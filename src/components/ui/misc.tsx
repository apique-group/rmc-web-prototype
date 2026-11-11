import * as React from 'react'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export const Separator = React.forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root ref={ref} decorative={decorative} orientation={orientation} className={cn('shrink-0 bg-line', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className)} {...props} />
))
Separator.displayName = 'Separator'

export const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { tone?: 'navy' | 'gold' }>(({ className, value, tone = 'navy', ...props }, ref) => (
  <ProgressPrimitive.Root ref={ref} className={cn('relative h-2 w-full overflow-hidden rounded-full bg-black/10', className)} {...props}>
    <ProgressPrimitive.Indicator className={cn('h-full w-full flex-1 rounded-full transition-transform duration-700 ease-out', tone === 'gold' ? 'gold-gradient' : 'bg-navy')} style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value || 0))}%)` }} />
  </ProgressPrimitive.Root>
))
Progress.displayName = 'Progress'

/* Minimal table primitives (shadcn table) */
export const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-x-auto"><table ref={ref} className={cn('w-full caption-bottom text-[13px]', className)} {...props} /></div>
))
Table.displayName = 'Table'
export const THead = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className={cn('[&_tr]:border-b', className)} {...p} />
export const TBody = ({ className, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className={cn('[&_tr:last-child]:border-0', className)} {...p} />
export const TR = ({ className, ...p }: React.HTMLAttributes<HTMLTableRowElement>) => <tr className={cn('border-b border-line-2 transition-colors hover:bg-surface-2/70 data-[state=selected]:bg-navy-50', className)} {...p} />
export const TH = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn('h-10 px-3 text-left align-middle text-micro uppercase text-ink-3', className)} {...p} />
export const TD = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('px-3 py-2.5 align-middle', className)} {...p} />

/** Empty state, one sentence + optional action. */
export function EmptyState({ title, desc, action, className }: { title: string; desc?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-dashed border-line px-6 py-10 text-center', className)}>
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      {desc && <p className="mt-1 text-[13px] text-ink-3">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Section eyebrow + title + sub, used on every landing section for a consistent rhythm. */
export function SectionHead({ eyebrow, title, sub, align = 'left', tone = 'ink', className }: { eyebrow?: string; title: string; sub?: string; align?: 'left' | 'center'; tone?: 'ink' | 'white'; className?: string }) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <p className={cn('t-eyebrow mb-3', tone === 'white' && 'text-gold-200')}>{eyebrow}</p>}
      <h2 className={cn('t-h1', tone === 'white' ? 'text-white' : 'text-ink')}>{title}</h2>
      {sub && <p className={cn('mt-3 text-[15px] leading-relaxed sm:text-base sm:leading-6', tone === 'white' ? 'text-white/75' : 'text-ink-3')}>{sub}</p>}
    </div>
  )
}
