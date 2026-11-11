import * as React from 'react'
import { cn } from '@/lib/utils'

/** Small stat tile for section summaries. */
export function StatTile({ label, value, hint, tone = 'ink' }: { label: string; value: React.ReactNode; hint?: string; tone?: 'ink' | 'navy' | 'warn' }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-3.5 shadow-1">
      <p className="text-micro uppercase text-ink-3">{label}</p>
      <p className={cn('t-num mt-1 text-[22px] font-extrabold leading-none tracking-tight', tone === 'navy' ? 'text-navy-700' : tone === 'warn' ? 'text-warn' : 'text-ink')}>{value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-3">{hint}</p>}
    </div>
  )}
