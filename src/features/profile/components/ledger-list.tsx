'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Gift, History, RotateCcw, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtDate, poin } from '@/lib/format'
import { LEDGER_LABEL, type LedgerEntry, type LedgerType } from '@/types/member'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/layout/empty-state'

/* ---------------------------------- Lists ---------------------------------- */
const LEDGER_ICON: Record<LedgerType, typeof TrendingUp> = { earn: TrendingUp, redeem: Gift, expire: RotateCcw, bonus: Sparkles, adjust: History }

const LEDGER_PAGE = 10

/* Riwayat poin (staging GET /member/profile/ledger): every point movement, newest first, 10 per page. */
export function LedgerCard({ rows }: { rows: LedgerEntry[] }) {
  const [page, setPage] = React.useState(1)
  const pages = Math.max(1, Math.ceil(rows.length / LEDGER_PAGE))
  const cur = Math.min(page, pages)
  const show = rows.slice((cur - 1) * LEDGER_PAGE, cur * LEDGER_PAGE)
  return (
    <Card data-ledger data-ledger-page={cur}>
      <CardHeader className="flex-row items-center gap-3 stack-y-0">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-50 text-gold-700"><History className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
        <div><CardTitle>Riwayat poin</CardTitle><CardDescription className="mt-1">{rows.length} catatan · poin masuk, ditukar, hangus, bonus, penyesuaian</CardDescription></div>
      </CardHeader>
      <CardContent>
        {show.length === 0 ? <EmptyState title="Belum ada catatan poin" desc="Belanja Lunas dan penukaran hadiah tercatat di sini." /> : (
          <ul className="divide-y divide-line-2">
            {show.map(r => { const Icon = LEDGER_ICON[r.type]; return (
              <li key={r.id} className="flex items-center gap-3 py-3" data-ledger-type={r.type}>
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg', r.points < 0 ? 'bg-surface-2 text-ink-3' : 'bg-green-50 text-green-700')}><Icon className="h-4 w-4" strokeWidth={1.6} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">{r.note || LEDGER_LABEL[r.type]}</p>
                  <p className="text-[12px] text-ink-3">{LEDGER_LABEL[r.type]} · {fmtDate(r.at)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn('t-fig text-[14px]', r.points < 0 ? 'text-ink' : 'text-green-700')}>{r.points < 0 ? '−' : '+'}{poin(Math.abs(r.points))}</p>
                  <p className="t-code text-[11px] text-ink-4">saldo {poin(r.balanceAfter)}</p>
                </div>
              </li>
            ) })}
          </ul>
        )}
        {pages > 1 && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-2 pt-3">
            <Button type="button" variant="ghost" size="sm" disabled={cur <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} data-ledger-prev><ChevronLeft className="h-4 w-4" strokeWidth={1.8} /> Sebelumnya</Button>
            <span className="t-num text-[12px] text-ink-3">{cur} / {pages}</span>
            <Button type="button" variant="ghost" size="sm" disabled={cur >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} data-ledger-next>Berikutnya <ChevronRight className="h-4 w-4" strokeWidth={1.8} /></Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
