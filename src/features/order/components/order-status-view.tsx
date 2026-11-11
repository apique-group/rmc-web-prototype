'use client'

import * as React from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, FileText, QrCode, Store, Trophy, Truck } from 'lucide-react'
import { fmtDate, rupiah } from '@/lib/format'
import { Reveal } from '@/components/common/reveal'
import { displayPhone, normalizePhone } from '@/lib/phone'
import { STATUS_LABEL } from '@/types/member'
import { useCurrentAccount } from '@/hooks/use-member-data'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { useOrderById } from '@/hooks/use-member-data'
import { Narrow } from '@/components/layout/narrow'
import { Button } from '@/components/ui/button'
import { Badge, statusVariant } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { Separator } from '@/components/ui/separator'
import { QrisSheet } from '@/components/common/qris-sheet'
import { Item } from './order-item'
import { Timeline } from './order-timeline'

export function OrderStatusView() {
  const { id } = useParams<{ id: string }>()
  const order = useOrderById(id) ?? undefined
  const acc = useCurrentAccount()
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const setParams = (fn: (prev: URLSearchParams) => URLSearchParams) => { const next = fn(new URLSearchParams(params.toString())); router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false }) }
  const phoneParam = normalizePhone(params.get('phone'))
  const [phoneInput, setPhoneInput] = React.useState('')
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
            action={<Button size="lg" variant="gold" className="" nativeButton={false} render={<Link href="/#golden-sale" />}>Lihat Golden Sale</Button>} />
        </Reveal>
        <Link href="/" className="mt-6 inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Kembali ke beranda</Link>
      </Narrow>
    )
  }

  // staging GET /member/orders/:id: a member sees their own orders; a guest must present the buyer's phone (?phone=)
  const owned = !!acc && (order.accountId === acc.id || (!!acc.crmCustomerId && order.crmCustomerId === acc.crmCustomerId) || order.buyer.phone === acc.phone)
  if (!owned && phoneParam !== order.buyer.phone) {
    return (
      <Narrow>
        <Reveal>
          <p className="t-eyebrow">Status pesanan</p>
          <h1 className="t-h1 t-code mt-3 text-ink">{order.id}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-3">Masukkan nomor HP yang dipakai saat memesan untuk membuka status pesanan ini.</p>
        </Reveal>
        <Reveal delay={80}>
          <form data-order-phone-gate className="mt-8 stack-y-4" onSubmit={e => { e.preventDefault(); const p = normalizePhone(phoneInput); if (!p) return; setParams(prev => { const n = new URLSearchParams(prev); n.set('phone', p); return n }) }}>
            <Field label="No. HP pemesan" required htmlFor="order-phone" error={phoneParam && phoneParam !== order.buyer.phone ? 'Nomor HP tidak cocok dengan pesanan ini' : undefined}>
              <Input id="order-phone" type="tel" inputMode="tel" placeholder="0812 3456 7890" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} />
            </Field>
            <Button type="submit" size="lg" className="w-full">Buka status pesanan</Button>
          </form>
        </Reveal>
      </Narrow>
    )
  }

  const expiresMs = Date.parse(order.expiresAt)
  const canPay = order.status === 'AWAITING_PAYMENT' && Number.isFinite(expiresMs) && expiresMs > now
  const remainingMin = canPay ? Math.max(1, Math.ceil((expiresMs - now) / 60000)) : 0
  const isImageProof = !!order.payment.proofDataUrl && (order.payment.proofType || '').startsWith('image/')

  return (
    <Narrow>
      <Reveal>
        <Link href="/" className="inline-flex h-11 items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Kembali ke beranda</Link>
        <p className="t-eyebrow mt-2">Status pesanan</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="t-h1 t-code text-ink">{order.id}</h1>
          <Badge variant={statusVariant(order.status)} className="text-[12px]">{STATUS_LABEL[order.status]}</Badge>
        </div>
        <p className="mt-2 text-[13px] text-ink-3">Dibuat {fmtDate(order.createdAt, true)}</p>
      </Reveal>

      {/* Primary action per status, one hero per view */}
      {order.status === 'EXPIRED' && (
        <Reveal delay={60}>
          <Card className="mt-8 border-line bg-surface-2">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="text-[15px] font-bold text-ink">Batas waktu pembayaran sudah lewat</p>
                <p className="text-[13px] text-ink-3">Sudah terlanjur bayar? Unggah buktinya, admin memverifikasi manual. Belum bayar? Buat pesanan baru.</p>
              </div>
              <Button size="lg" variant="outline" className="" onClick={() => setSheetOpen(true)}>Unggah bukti terlambat</Button>
            </CardContent>
          </Card>
        </Reveal>
      )}
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
      {order.status === 'PAID' && (
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
              <Button size="lg" variant="outline" className="" nativeButton={false} render={<Link href="/#klasemen" />}>Lihat klasemen</Button>
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
      {order.status === 'PROOF_UPLOADED' && (
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
                <p className="mt-1 text-[12px] text-ink-4">{order.payment.proofLate ? 'Bukti diunggah setelah batas waktu — admin Resique memverifikasinya secara manual.' : 'Menunggu verifikasi admin Resique.'}</p>
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
                  {order.fulfil.mode === 'PICKUP' ? <Store className="h-4 w-4 text-ink-4" strokeWidth={1.6} /> : <Truck className="h-4 w-4 text-ink-4" strokeWidth={1.6} />}
                  {order.fulfil.mode === 'PICKUP' ? `Ambil di outlet Resique ${order.fulfil.outlet || ''}`.trim() : 'Kirim ke alamat'}
                </span>
              </Item>
              {order.fulfil.mode === 'DELIVERY' && order.fulfil.address && <Item label="Alamat pengiriman" className="sm:col-span-2"><span className="whitespace-pre-line">{order.fulfil.address}</span></Item>}
              {order.note && <Item label="Catatan" className="sm:col-span-2">{order.note}</Item>}
              <Item label="Metode pembayaran">{order.payment.method}</Item>
            </dl>
            {order.fulfil.mode === 'DELIVERY' && <p className="mt-4 text-[12px] text-ink-4">Ongkir dikonfirmasi sales via WhatsApp, tidak termasuk dalam total di bawah.</p>}
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
            <div className="stack-y-2 text-[14px]">
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
