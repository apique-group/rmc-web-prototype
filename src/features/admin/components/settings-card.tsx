import * as React from 'react'
import { cn } from '@/lib/utils'

export function SettingsCard({ title, desc, actions, children, className, bodyClassName }: { title: string; desc?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn('rounded-xl border border-line bg-white shadow-1', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line-2 px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-bold leading-tight text-ink">{title}</h3>
          {desc && <p className="mt-0.5 text-[12px] text-ink-3">{desc}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  )
}
