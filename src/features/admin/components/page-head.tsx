import * as React from 'react'

/* Settings-page building blocks (echo of UM: page-head h1 + sub, card-head h3 + body, save bar). */
export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-ink-3">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
