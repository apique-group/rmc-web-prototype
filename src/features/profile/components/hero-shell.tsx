'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------- Points hero ------------------------------- */
export function HeroShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl bg-navy-700/10 p-1.5 ring-1 ring-black/5', className)}>
      <div className="navy-gradient relative overflow-hidden rounded-xl p-6 text-white sm:p-8">
        <div className="relative">{children}</div>
      </div>
    </div>
  )
}
