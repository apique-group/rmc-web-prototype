'use client'

import * as React from 'react'

export function Item({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-micro uppercase text-ink-4">{label}</dt>
      <dd className="mt-1 text-[14px] font-semibold text-ink">{children}</dd>
    </div>
  )
}
