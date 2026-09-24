import { useAdminAccess } from '../access'
import { useCrm } from '@/store/crm'
import { toast } from 'sonner'
import { STATUS_LABEL, type Order } from '@/model/types'
import type { ImportPreview } from '@/lib/xlsx'
import { fmtDate, rupiah } from '@/lib/format'
import { useOrders } from '@/store/orders'
import { Button } from '@/components/ui/button'
import { Badge, statusVariant } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'

/** Import preview: parsed rows + skipped reasons → Konfirmasi import. */
export function TransaksiImport({ preview, fileName, onClose }: { preview: ImportPreview | null; fileName: string; onClose: () => void }) {
  const orders = useOrders(s => s.orders)
  const importRows = useOrders(s => s.importRows)
  const existing = new Set(orders.map(o => o.id))
  const rows: Order[] = preview?.rows ?? []
  const fresh = rows.filter(r => !existing.has(r.id))
  const dupes = rows.length - fresh.length

  const { canEdit, actor } = useAdminAccess()
  const confirm = () => {
    if (!canEdit) return
    const n = importRows(rows)
    useCrm.getState().log('Transaksi diimpor', `${n} baris · oleh ${actor || '-'}`)
    toast.success(`${n} transaksi diimpor${dupes ? ` · ${dupes} dilewati (ID sudah ada)` : ''}`)
    onClose()
  }

  return (
    <Dialog open={!!preview} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pratinjau import</DialogTitle>
          <DialogDescription>{fileName} · {rows.length} baris terbaca · {fresh.length} akan ditambahkan{dupes ? ` · ${dupes} ID sudah ada (dilewati)` : ''}</DialogDescription>
        </DialogHeader>

        {rows.length > 0 && (
          <Table>
            <THead><TR><TH>ID</TH><TH>Tanggal</TH><TH>Laundry</TH><TH>Item</TH><TH className="text-right">Total</TH><TH>Status</TH></TR></THead>
            <TBody>
              {rows.slice(0, 50).map(r => {
                const dup = existing.has(r.id)
                return (
                  <TR key={r.id} className={dup ? 'opacity-50' : undefined}>
                    <TD className="t-code text-[12px]">{r.id}{dup && <span className="ml-1 text-[10px] font-bold uppercase text-ink-4">ada</span>}</TD>
                    <TD className="whitespace-nowrap">{fmtDate(r.createdAt)}</TD>
                    <TD><span className="font-semibold">{r.buyer.laundry || '-'}</span><span className="block text-[12px] text-ink-3">{r.buyer.name}</span></TD>
                    <TD className="text-[12px] text-ink-3">{r.lines.map(l => `${l.code}×${l.qty}`).join(', ') || '-'}</TD>
                    <TD className="t-num text-right font-semibold">{rupiah(r.total)}</TD>
                    <TD><Badge variant={statusVariant(r.status)}>{STATUS_LABEL[r.status]}</Badge></TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
        {rows.length > 50 && <p className="text-[12px] text-ink-3">…dan {rows.length - 50} baris lagi.</p>}

        {preview && preview.skipped.length > 0 && (
          <div className="rounded-lg border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] text-warn">
            <p className="font-bold">{preview.skipped.length} baris dilewati</p>
            <ul className="mt-1 list-disc pl-4">{preview.skipped.slice(0, 8).map((s, i) => <li key={i}>{s}</li>)}</ul>
            {preview.skipped.length > 8 && <p className="mt-1">…dan {preview.skipped.length - 8} lainnya.</p>}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Batal</Button>
          <Button type="button" size="sm" disabled={!canEdit || fresh.length === 0} onClick={confirm}>Konfirmasi import ({fresh.length})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
