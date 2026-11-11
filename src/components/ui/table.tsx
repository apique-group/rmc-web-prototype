import * as React from 'react'
import { cn } from '@/lib/utils'

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
