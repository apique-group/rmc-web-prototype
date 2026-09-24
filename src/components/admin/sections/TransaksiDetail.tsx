import * as React from 'react'
import { useAdminAccess } from '../access'
import { useCrm } from '@/store/crm'
import { toast } from 'sonner'
import { CheckCircle2, FileText, RotateCcw, XCircle } from 'lucide-react'
import { STATUS_LABEL, type Order } from '@/model/types'
import { fmtDate, rupiah } from '@/lib/format'
import { displayPhone } from '@/model/phone'
import { useOrders } from '@/store/orders'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { Badge, statusVariant } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'

/** Order drawer: lines, fulfilment, proof preview, verify / reject / undo. */
export function TransaksiDetail({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const setStatus = useOrders(s => s.setStatus)
  const [rejecting, setRejecting] = React.useState(false)
  const [reason, setReason] = React.useState('')
  React.useEffect(() => { if (!order) { setRejecting(false); setReason('') } }, [order])

  const { canEdit, actor } = useAdminAccess()
  const act = (status: Order['status'], r?: string) => {
    if (!order || !canEdit) return
    setStatus(order.id, status, r)
    useCrm.getState().log('Status pesanan diubah', `${order.id} → ${STATUS_LABEL[status]} · oleh ${actor || '-'}`)
    toast.success(`${order.id} → ${STATUS_LABEL[status]}`)
    setRejecting(false); setReason('')
    if (status !== 'AWAITING_PAYMENT') onClose()
  }

  const o = order
  const proof = o?.payment
  const isImg = !!proof?.proofDataUrl && (proof.proofType?.startsWith('image/') || /^data:image\//.test(proof.proofDataUrl))

  return (
    <Dialog open={!!o} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92dvh] overflow-y-auto">
        {o && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <DialogTitle className="t-code text-[17px]">{o.id}</DialogTitle>
                <Badge variant={statusVariant(o.status)}>{STATUS_LABEL[o.status]}</Badge>{o.payment.proofLate && <Badge variant="warn">Bukti terlambat</Badge>}
              </div>
              <DialogDescription>{fmtDate(o.createdAt, true)} · {o.payment.method}{o.verifiedAt ? ` · diverifikasi ${fmtDate(o.verifiedAt, true)}` : ''}</DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-3">
              <Item k="Pembeli" v={`${o.buyer.name} · ${o.buyer.laundry}`} />
              <Item k="HP" v={displayPhone(o.buyer.phone)} mono />
              {/* Orders stored before these fields existed render a dash rather than crashing. */}
              <Item k="Email" v={o.buyer.email || '-'} mono />
              <Item k="Bersedia dihubungi" v={o.consentAt ? `Ya · ${fmtDate(o.consentAt)}` : '-'} />
              <Item k="Pengambilan" v={o.fulfil.mode === 'DELIVERY' ? `Kirim · ${o.fulfil.address || '-'}` : `Ambil di outlet ${o.fulfil.outlet || '-'}`} />
              <Item k="Akun" v={o.accountId || 'Tamu'} mono />
              <Item k="Pelanggan CRM" v={o.crmCustomerId || '-'} mono />
              {o.note && <Item k="Catatan" v={o.note} />}
              {o.rejectReason && <Item k="Alasan tolak" v={o.rejectReason} />}
              {o.cancelReason && <Item k="Alasan batal" v={o.cancelReason} />}
            </dl>

            <Table>
              <THead><TR><TH>Kode</TH><TH>Item</TH><TH className="text-right">Qty</TH><TH className="text-right">Harga promo</TH><TH className="text-right">Subtotal</TH></TR></THead>
              <TBody>
                {o.lines.map(l => (
                  <TR key={l.packageId || l.itemId}><TD className="t-code text-ink-3">{l.code}</TD><TD>{l.name}</TD><TD className="t-num text-right">{l.qty}</TD><TD className="t-num text-right">{rupiah(l.promoPrice)}</TD><TD className="t-num text-right font-semibold">{rupiah(l.qty * l.promoPrice)}</TD></TR>
                ))}
                <TR className="hover:bg-transparent"><TD colSpan={4} className="text-right text-ink-3">Hemat {rupiah(o.savings)}</TD><TD className="t-num text-right text-[15px] font-extrabold text-navy-700">{rupiah(o.total)}</TD></TR>
              </TBody>
            </Table>

            <Separator />
            <div>
              <p className="mb-2 text-micro uppercase text-ink-3">Bukti pembayaran</p>
              {proof?.proofName ? (
                <div className="flex items-start gap-3">
                  {isImg ? <a href={proof.proofDataUrl} target="_blank" rel="noreferrer" className="block shrink-0"><img src={proof.proofDataUrl} alt="Bukti pembayaran" className="h-32 w-32 rounded-lg border border-line object-cover" /></a>
                    : <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-line bg-surface-2 text-ink-3"><FileText className="h-6 w-6" strokeWidth={1.6} /></div>}
                  <div className="text-[13px]">
                    <p className="font-semibold text-ink">{proof.proofName}</p>
                    <p className="text-ink-3">{proof.proofType || 'berkas'}{proof.uploadedAt ? ` · diunggah ${fmtDate(proof.uploadedAt, true)}` : ''}</p>
                    {!isImg && proof.proofDataUrl && <a href={proof.proofDataUrl} download={proof.proofName} className="mt-1 inline-block text-navy-600 underline-offset-2 hover:underline">Unduh berkas</a>}
                  </div>
                </div>
              ) : <p className="text-[13px] text-ink-3">Belum ada bukti diunggah.</p>}
            </div>

            {rejecting && (
              <Field label="Alasan penolakan" htmlFor="reject-reason" hint="Dikirim ke email pembeli (jika punya akun).">
                <Textarea id="reject-reason" autoFocus value={reason} rows={2} placeholder="Contoh: nominal transfer tidak sesuai" onChange={e => setReason(e.target.value)} />
              </Field>
            )}

            <DialogFooter className="sm:justify-between">
              <div className="flex gap-2">
                {o.status !== 'AWAITING_PAYMENT' && <Button type="button" variant="ghost" size="sm" disabled={!canEdit} onClick={() => act('AWAITING_PAYMENT')}><RotateCcw strokeWidth={1.6} />Tandai Menunggu</Button>}
                {(o.status === 'AWAITING_PAYMENT' || o.status === 'EXPIRED') && <Button type="button" variant="ghost" size="sm" className="text-ink-3" disabled={!canEdit} onClick={() => act('CANCELLED', 'dibatalkan admin')}>Batalkan</Button>}
              </div>
              <div className="flex gap-2">
                {rejecting ? (
                  <>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setRejecting(false)}>Batal</Button>
                    <Button type="button" variant="destructive" size="sm" disabled={!canEdit || !reason.trim()} onClick={() => act('REJECTED', reason.trim())}><XCircle strokeWidth={1.6} />Konfirmasi tolak</Button>
                  </>
                ) : (
                  <>
                    {o.status !== 'REJECTED' && <Button type="button" variant="outline" size="sm" className="text-danger" disabled={!canEdit} onClick={() => setRejecting(true)}><XCircle strokeWidth={1.6} />Tolak</Button>}
                    {o.status !== 'PAID' && <Button type="button" size="sm" disabled={!canEdit} title={canEdit ? undefined : 'Hanya lihat'} onClick={() => act('PAID')}><CheckCircle2 strokeWidth={1.6} />Verifikasi (Lunas)</Button>}
                  </>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Item({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-micro uppercase text-ink-3">{k}</dt>
      <dd className={mono ? 'truncate t-code text-[12px] text-ink' : 'text-ink'}>{v}</dd>
    </div>
  )
}
