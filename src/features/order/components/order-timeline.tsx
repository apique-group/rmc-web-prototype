'use client'

import { Check, Clock, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtDate } from '@/lib/format'
import { type Order, type OrderStatus, STATUS_LABEL } from '@/types/member'
import { Badge } from '@/components/ui/badge'

const HAPPY: { key: OrderStatus; title: string; desc: string }[] = [
  { key: 'AWAITING_PAYMENT', title: STATUS_LABEL.AWAITING_PAYMENT, desc: 'Scan QRIS lalu unggah bukti pembayaran.' },
  { key: 'PROOF_UPLOADED', title: STATUS_LABEL.PROOF_UPLOADED, desc: 'Admin Resique cek bukti pembayaranmu.' },
  { key: 'PAID', title: STATUS_LABEL.PAID, desc: 'Pembayaran terverifikasi. Belanja masuk klasemen.' },
]

/** Vertical timeline: 3 happy steps; Ditolak / Kedaluwarsa render as a terminal node after the step they interrupt. */
export function Timeline({ order }: { order: Order }) {
  const terminal = order.status === 'REJECTED' || order.status === 'EXPIRED' || order.status === 'CANCELLED'
  // Index of the last step reached on the happy path.
  const reached = terminal ? (order.status === 'REJECTED' ? 1 : 0) : HAPPY.findIndex(s => s.key === order.status)
  const nodes: { key: string; title: string; desc: string; state: 'done' | 'current' | 'todo' | 'terminal' }[] = HAPPY
    .filter((_, i) => !terminal || i <= reached)
    .map((s, i) => ({ key: s.key, title: s.title, desc: s.desc, state: terminal ? 'done' : i < reached ? 'done' : i === reached ? 'current' : 'todo' }))
  if (terminal) {
    nodes.push({
      key: order.status,
      title: STATUS_LABEL[order.status],
      desc: order.status === 'CANCELLED'
        ? `Pesanan dibatalkan oleh admin Resique${order.cancelReason ? ': ' + order.cancelReason : ''}.`
        : order.status === 'REJECTED'
        ? (order.rejectReason ? `Alasan: ${order.rejectReason}. Hubungi sales Resique.` : 'Bukti pembayaran tidak dapat diverifikasi. Hubungi sales Resique.')
        : `Batas waktu pembayaran habis pada ${fmtDate(order.expiresAt, true)}. Buat pesanan baru di Golden Sale.`,
      state: 'terminal',
    })
  }
  const stamp = (key: string) => key === 'AWAITING_PAYMENT' ? order.createdAt : key === 'PROOF_UPLOADED' ? order.payment.uploadedAt : key === 'PAID' ? order.verifiedAt : key === 'EXPIRED' ? order.expiresAt : undefined

  return (
    <ol className="relative stack-y-6" aria-label="Perjalanan pesanan">
      {nodes.map((n, i) => {
        const last = i === nodes.length - 1
        const at = n.state !== 'todo' ? stamp(n.key) : undefined
        return (
          <li key={n.key} className="relative flex gap-4" aria-current={n.state === 'current' ? 'step' : undefined}>
            {!last && <span aria-hidden className={cn('absolute left-[15px] top-8 h-[calc(100%+8px)] w-0.5 rounded-full', n.state === 'done' ? 'bg-navy-200' : 'bg-line')} />}
            <span className={cn('relative z-1 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors',
              n.state === 'done' && 'border-navy-500 bg-navy-500 text-white',
              n.state === 'current' && 'border-navy-500 bg-white text-navy-700 ring-4 ring-navy-50',
              n.state === 'todo' && 'border-line bg-white text-ink-4',
              n.state === 'terminal' && (order.status === 'REJECTED' ? 'border-danger bg-danger-50 text-danger' : 'border-ink-4 bg-surface-2 text-ink-3'))}>
              {n.state === 'done' ? <Check className="h-4 w-4" strokeWidth={2.2} />
                : n.state === 'terminal' ? (order.status === 'REJECTED' ? <XCircle className="h-4 w-4" strokeWidth={1.6} /> : <Clock className="h-4 w-4" strokeWidth={1.6} />)
                : <span className="t-code text-[12px] font-extrabold">{i + 1}</span>}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className={cn('text-[15px] font-bold leading-tight', n.state === 'todo' ? 'text-ink-4' : n.state === 'terminal' && order.status === 'REJECTED' ? 'text-danger' : 'text-ink')}>
                {n.title}{n.state === 'current' && <Badge className="ml-2 align-middle">Saat ini</Badge>}
              </p>
              <p className={cn('mt-1 text-[13px] leading-relaxed', n.state === 'todo' ? 'text-ink-4' : 'text-ink-3')}>{n.desc}</p>
              {at && <p className="mt-1 text-[12px] text-ink-4">{fmtDate(at, true)}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
