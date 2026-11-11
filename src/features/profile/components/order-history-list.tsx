'use client'

import Link from 'next/link'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import { fmtDate, rupiah } from '@/lib/format'
import { type Order, STATUS_LABEL } from '@/types/member'
import { Button } from '@/components/ui/button'
import { Badge, statusVariant } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/layout/empty-state'

export function OrderList({ rows }: { rows: Order[] }) {
  const show = rows.slice(0, 5)
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 stack-y-0">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700"><ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
        <div><CardTitle>Riwayat pesanan</CardTitle><CardDescription className="mt-1">{rows.length === 0 ? 'Belum ada pesanan Golden Sale' : `${rows.length} pesanan Golden Sale · hanya Lunas yang menambah poin`}</CardDescription></div>
      </CardHeader>
      <CardContent>
        {show.length === 0 ? (
          <EmptyState title="Belum ada pesanan Golden Sale" desc="Harga spesial selama periode Golden Privilege, stok terbatas." action={<Button variant="gold" className="" nativeButton={false} render={<Link href="/#golden-sale" />}>Lihat Golden Sale</Button>} />
        ) : (
          <ul className="divide-y divide-line-2">
            {show.map(o => (
              <li key={o.id}>
                <Link href={`/order/${o.id}`} className="flex min-h-[44px] items-center gap-3 py-3 transition-colors hover:text-navy-700">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2"><span className="t-code text-[13px] font-semibold text-ink">{o.id}</span><Badge variant={statusVariant(o.status)}>{STATUS_LABEL[o.status]}</Badge></p>
                    <p className="mt-0.5 text-[12px] text-ink-3">{fmtDate(o.createdAt)} · {o.lines.reduce((s, l) => s + l.qty, 0)} item · {o.fulfil.mode === 'DELIVERY' ? 'Dikirim' : `Ambil di ${o.fulfil.outlet || 'outlet'}`}</p>
                  </div>
                  <p className="t-fig shrink-0 text-[14px] text-ink">{rupiah(o.total)}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-4" strokeWidth={1.6} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
