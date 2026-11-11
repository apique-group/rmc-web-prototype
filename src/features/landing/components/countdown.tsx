'use client'

import * as React from 'react'
import { Zap } from 'lucide-react'
import { campaignIso } from '@/lib/format'

/* Countdown to the campaign end (end of day, local time). Ticks every second; the boxes read Hari / Jam / Menit / Detik. */
export function Countdown({ end }: { end: string }) {
  const target = React.useMemo(() => new Date(campaignIso(end, true)).getTime(), [end])
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])
  const left = Math.max(0, target - now)
  const d = Math.floor(left / 86_400_000), h = Math.floor(left / 3_600_000) % 24, m = Math.floor(left / 60_000) % 60, sec = Math.floor(left / 1000) % 60
  const cells = [[d, 'Hari'], [h, 'Jam'], [m, 'Menit'], [sec, 'Detik']] as const
  return (
    <div className="inline-flex flex-col items-start gap-2 lg:items-end" data-countdown aria-live="off">
      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-gold"><Zap className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />{left === 0 ? 'Periode berakhir' : 'Berakhir dalam'}</p>
      <div className="flex items-center gap-1.5">
        {cells.map(([v, l], i) => (
          <React.Fragment key={l}>
            <span className="flex min-w-[56px] flex-col items-center rounded-md bg-gold px-2 py-1.5 text-gold-ink shadow-2 sm:min-w-[62px]">
              <span className="t-fig text-[22px] leading-none sm:text-[24px]" data-cd={l}>{String(v).padStart(2, '0')}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.04em]">{l}</span>
            </span>
            {i < cells.length - 1 && <span className="t-fig text-[20px] text-gold" aria-hidden>:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
