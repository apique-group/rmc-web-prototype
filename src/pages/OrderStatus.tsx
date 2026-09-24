import * as React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, FileText, QrCode, Store, Truck, Trophy, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { rupiah, fmtDate } from '@/lib/format'
import { Reveal } from '@/lib/reveal'
import { displayPhone } from '@/model/phone'
import type { Order, OrderStatus } from '@/model/types'
import { useOrders } from '@/store/orders'
import { Narrow } from '@/components/layout/Shell'
import { Button } from '@/components/ui/button'
import { Badge, statusVariant } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState, Separator } from '@/components/ui/misc'
import { QrisSheet } from '@/components/shop/QrisSheet'

const HAPPY: { key: OrderStatus; title: string; desc: string }[] = [
  { key: 'Menunggu Pembayaran', title: 'Menunggu Pembayaran', desc: 'Scan QRIS lalu unggah bukti pembayaran.' },
  { key: 'Bukti Diunggah', title: 'Bukti Diunggah', desc: 'Admin Resique cek bukti pembayaranmu.' },
  { key: 'Lunas', title: 'Lunas', desc: 'Pembayaran terverifikasi. Belanja masuk klasemen.' },
]

export function OrderStatusPage() {
  const { id } = useParams<{ id: string }>()
  const order = useOrders(s => s.orders.find(o => o.id === id))
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t) }, [])

  if (!order) {
    return (
      <Narrow>
        <Reveal>
          <p className="t-eyebrow">Status pesanan</p>
          <h1 className="t-h1 mt-3 text-ink">Pesanan tidak ditemukan</h1>
        </Reveal>
        <Reveal delay={80}>
          <EmptyState className="mt-8" title={`Tidak ada pesanan ${id || ''}`.trim()} desc="Cek lagi tautannya, atau buat pesanan baru di Golden Sale."
            action={<Button asChild size="lg" variant="gold" className=""><Link to="/#golden-sale">Lihat Golden Sale</Link></Button>} />
        </Reveal>
        <Link to="/" className="mt-6 inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Kembali ke beranda</Link>
      </Narrow>
    )
  }

  const expiresMs = Date.parse(order.expiresAt)
  const canPay = order.status === 'Menunggu Pembayaran' && Number.isFinite(expiresMs) && expiresMs > now
  const remainingMin = canPay ? Math.max(1, Math.ceil((expiresMs - now) / 60000)) : 0
  const isImageProof = !!order.payment.proofDataUrl && (order.payment.proofType || '').startsWith('image/')

  return (
    <Narrow>
      <Reveal>
        <Link to="/" className="inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Kembali ke beranda</Link>
        <p className="t-eyebrow mt-2">Status pesanan</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="t-h1 t-code text-ink">{order.id}</h1>
          <Badge variant={statusVariant(order.status)} className="text-[12px]">{order.status}</Badge>
        </div>
        <p className="mt-2 text-[13px] text-ink-3">Dibuat {fmtDate(order.createdAt, true)}</p>
      </Reveal>

      {/* Primary action per status, one hero per view */}
      {canPay && (
        <Reveal delay={60}>
          <Card className="mt-8 border-gold-200 bg-gold-50/60">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-gold-700 shadow-1"><QrCode className="h-5 w-5" strokeWidth={1.6} /></span>
                <div>
                  <p className="text-[15px] font-bold text-ink">Selesaikan pembayaran {rupiah(order.total)}</p>
                  <p className="t-code text-[13px] text-ink-3">QR berlaku ±{remainingMin} menit lagi.</p>
                </div>
              </div>
              <Button size="lg" variant="gold" className="" onClick={() => setSheetOpen(true)}>Buka QR & unggah bukti</Button>
            </CardContent>
          </Card>
        </Reveal>
      )}
      {order.status === 'Lunas' && (
        <Reveal delay={60}>
          <Card className="mt-8 border-ok-100 bg-ok-50/70">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-ok shadow-1"><Trophy className="h-5 w-5" strokeWidth={1.6} /></span>
                <div>
                  <p className="text-[15px] font-bold text-ink">Terima kasih. Belanja ini masuk klasemen.</p>
                  <p className="text-[13px] text-ink-3">Terverifikasi {fmtDate(order.verifiedAt, true)}</p>
                </div>
              </div>
              <Button asChild size="lg" variant="outline" className=""><Link to="/#klasemen">Lihat klasemen</Link></Button>
            </CardContent>
          </Card>
        </Reveal>
      )}

      {/* Timeline */}
      <Reveal delay={100}>
        <Card className="mt-8">
          <CardHeader><CardTitle>Perjalanan pesanan</CardTitle></CardHeader>
          <CardContent><Timeline order={order} /></CardContent>
        </Card>
      </Reveal>

      {/* Proof */}
      {order.status === 'Bukti Diunggah' && (
        <Reveal delay={120}>
          <Card className="mt-6">
            <CardHeader><CardTitle>Bukti pembayaran</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-4">
              {isImageProof ? (
                <img src={order.payment.proofDataUrl} alt={`Bukti pembayaran ${order.id}`} className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover" />
              ) : (
                <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-3"><FileText className="h-7 w-7" strokeWidth={1.6} /></span>
              )}
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-ink">{order.payment.proofName || 'Bukti pembayaran'}</p>
                <p className="text-[13px] text-ink-3">Diunggah {fmtDate(order.payment.uploadedAt, true)}</p>
                <p className="mt-1 text-[12px] text-ink-4">Menunggu verifikasi admin Resique.</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      )}

      {/* Buyer & fulfilment */}
      <Reveal delay={140}>
        <Card className="mt-6">
          <CardHeader><CardTitle>Pemesan & pengambilan</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Item label="Nama">{order.buyer.name}</Item>
              <Item label="Nama laundry">{order.buyer.laundry}</Item>
              <Item label="No. HP"><span className="t-code">{displayPhone(order.buyer.phone)}</span></Item>
              <Item label="Pengambilan">
                <span className="inline-flex items-center gap-1.5">
                  {order.fulfil.mode === 'ambil' ? <Store className="h-4 w-4 text-ink-4" strokeWidth={1.6} /> : <Truck className="h-4 w-4 text-ink-4" strokeWidth={1.6} />}
                  {order.fulfil.mode === 'ambil' ? `Ambil di outlet Resique ${order.fulfil.outlet || ''}`.trim() : 'Kirim ke alamat'}
                </span>
              </Item>
              {order.fulfil.mode === 'kirim' && order.fulfil.address && <Item label="Alamat pengiriman" className="sm:col-span-2"><span className="whitespace-pre-line">{order.fulfil.address}</span></Item>}
              {order.note && <Item label="Catatan" className="sm:col-span-2">{order.note}</Item>}
              <Item label="Metode pembayaran">{order.payment.method}</Item>
            </dl>
            {order.fulfil.mode === 'kirim' && <p className="mt-4 text-[12px] text-ink-4">Ongkir dikonfirmasi sales via WhatsApp, tidak termasuk dalam total di bawah.</p>}
          </CardContent>
        </Card>
      </Reveal>

      {/* Lines */}
      <Reveal delay={160}>
        <Card className="mt-6">
          <CardHeader><CardTitle>Rincian belanja</CardTitle></CardHeader>
          <CardContent>
            {/* stacked rows, a 4-column table wraps item names letter-by-letter at 390px */}
            <ul className="divide-y divide-line-2">
              {order.lines.map(l => (
                <li key={l.packageId || l.itemId} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold leading-snug text-ink">{l.name}</p>
                    <p className="t-code mt-0.5 text-[12px] text-ink-3">{l.qty} × {rupiah(l.promoPrice)}{l.realPrice > l.promoPrice && <span className="strike ml-1.5 text-[11px] text-ink-4">{rupiah(l.realPrice)}</span>} <span className="ml-1.5 t-code text-[10px] text-ink-4">{l.code}</span></p>
                  </div>
                  <p className="t-code shrink-0 text-[14px] font-bold text-ink">{rupiah(l.qty * l.promoPrice)}</p>
                </li>
              ))}
            </ul>
            <Separator className="my-4" />
            <div className="space-y-2 text-[14px]">
              <div className="flex items-center justify-between font-bold"><span className="gold-text">Hemat</span><span className="t-code gold-text">{rupiah(order.savings)}</span></div>
              <div className="flex items-baseline justify-between text-ink"><span className="text-[15px] font-bold">Total</span><span className="t-code text-[24px] font-extrabold tracking-tight">{rupiah(order.total)}</span></div>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      {/* Sheet stays mounted so the "Terima kasih" dialog survives the status flip after upload. */}
      <QrisSheet order={order} open={sheetOpen} onOpenChange={setSheetOpen} />
    </Narrow>
  )
}

function Item({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-micro uppercase text-ink-4">{label}</dt>
      <dd className="mt-1 text-[14px] font-semibold text-ink">{children}</dd>
    </div>
  )
}

/** Vertical timeline: 3 happy steps; Ditolak / Kedaluwarsa render as a terminal node after the step they interrupt. */
function Timeline({ order }: { order: Order }) {
  const terminal = order.status === 'Ditolak' || order.status === 'Kedaluwarsa'
  // Index of the last step reached on the happy path.
  const reached = terminal ? (order.status === 'Ditolak' ? 1 : 0) : HAPPY.findIndex(s => s.key === order.status)
  const nodes: { key: string; title: string; desc: string; state: 'done' | 'current' | 'todo' | 'terminal' }[] = HAPPY
    .filter((_, i) => !terminal || i <= reached)
    .map((s, i) => ({ key: s.key, title: s.title, desc: s.desc, state: terminal ? 'done' : i < reached ? 'done' : i === reached ? 'current' : 'todo' }))
  if (terminal) {
    nodes.push({
      key: order.status,
      title: order.status,
      desc: order.status === 'Ditolak'
        ? (order.rejectReason ? `Alasan: ${order.rejectReason}. Hubungi sales Resique.` : 'Bukti pembayaran tidak dapat diverifikasi. Hubungi sales Resique.')
        : `Batas waktu pembayaran habis pada ${fmtDate(order.expiresAt, true)}. Buat pesanan baru di Golden Sale.`,
      state: 'terminal',
    })
  }
  const stamp = (key: string) => key === 'Menunggu Pembayaran' ? order.createdAt : key === 'Bukti Diunggah' ? order.payment.uploadedAt : key === 'Lunas' ? order.verifiedAt : key === 'Kedaluwarsa' ? order.expiresAt : undefined

  return (
    <ol className="relative space-y-6" aria-label="Perjalanan pesanan">
      {nodes.map((n, i) => {
        const last = i === nodes.length - 1
        const at = n.state !== 'todo' ? stamp(n.key) : undefined
        return (
          <li key={n.key} className="relative flex gap-4" aria-current={n.state === 'current' ? 'step' : undefined}>
            {!last && <span aria-hidden className={cn('absolute left-[15px] top-8 h-[calc(100%+8px)] w-0.5 rounded-full', n.state === 'done' ? 'bg-navy-200' : 'bg-line')} />}
            <span className={cn('relative z-[1] grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 transition-colors',
              n.state === 'done' && 'border-navy-500 bg-navy-500 text-white',
              n.state === 'current' && 'border-navy-500 bg-white text-navy-700 ring-4 ring-navy-50',
              n.state === 'todo' && 'border-line bg-white text-ink-4',
              n.state === 'terminal' && (order.status === 'Ditolak' ? 'border-danger bg-danger-50 text-danger' : 'border-ink-4 bg-surface-2 text-ink-3'))}>
              {n.state === 'done' ? <Check className="h-4 w-4" strokeWidth={2.2} />
                : n.state === 'terminal' ? (order.status === 'Ditolak' ? <XCircle className="h-4 w-4" strokeWidth={1.6} /> : <Clock className="h-4 w-4" strokeWidth={1.6} />)
                : <span className="t-code text-[12px] font-extrabold">{i + 1}</span>}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className={cn('text-[15px] font-bold leading-tight', n.state === 'todo' ? 'text-ink-4' : n.state === 'terminal' && order.status === 'Ditolak' ? 'text-danger' : 'text-ink')}>
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
