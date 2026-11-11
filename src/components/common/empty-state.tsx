import * as React from 'react'
import { cn } from '@/lib/utils'

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
