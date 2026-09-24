import * as React from 'react'
import { useAdminAccess } from '../access'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, Search, Upload } from 'lucide-react'
import type { Order, OrderStatus } from '@/model/types'
import { ORDER_STATUSES, STATUS_LABEL } from '@/model/types'
import { fmtDate, rupiah } from '@/lib/format'
import { displayPhone } from '@/model/phone'
import { downloadTemplate, exportOrders, parseOrdersFile, type ImportPreview } from '@/lib/xlsx'
import { cn } from '@/lib/utils'
import { useConfig } from '@/store/config'
import { useOrders } from '@/store/orders'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, statusVariant } from '@/components/ui/badge'
import { EmptyState, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { PageHead, SettingsCard, StatTile } from '../parts'
import { TransaksiDetail } from './TransaksiDetail'
import { TransaksiImport } from './TransaksiImport'

type Filter = 'Semua' | OrderStatus

export function TransaksiSection() {
  const orders = useOrders(s => s.orders)
  const items = useConfig(s => s.config.items)
  const [filter, setFilter] = React.useState<Filter>('Semua')
  const [q, setQ] = React.useState('')
  const [openId, setOpenId] = React.useState<string | null>(null)
  const { canEdit } = useAdminAccess()
  const [preview, setPreview] = React.useState<ImportPreview | null>(null)
  const [fileName, setFileName] = React.useState('')
  const fileRef = React.useRef<HTMLInputElement>(null)

  const lunas = orders.filter(o => o.status === 'PAID')
  const pending = orders.filter(o => o.status === 'PROOF_UPLOADED').length
  const counts = ORDER_STATUSES.reduce<Record<string, number>>((m, s) => ({ ...m, [s]: orders.filter(o => o.status === s).length }), {})

  const needle = q.trim().toLowerCase()
  const filtered = orders
    .filter(o => filter === 'Semua' || o.status === filter)
    .filter(o => !needle || [o.id, o.buyer.name, o.buyer.laundry, o.buyer.phone, o.fulfil.outlet || ''].some(v => v.toLowerCase().includes(needle)))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const open = openId ? orders.find(o => o.id === openId) || null : null

  const onImport = async (f: File | undefined) => {
    if (!f) return
    try {
      const p = await parseOrdersFile(f, items)
      if (!p.rows.length && p.skipped.length) toast.error(p.skipped[0])
      setFileName(f.name); setPreview(p)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca berkas')
    } finally { if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div data-admin-section="transaksi" className="space-y-4">
      <PageHead
        title="Transaksi" sub="Pesanan Golden Sale. Verifikasi bukti pembayaran di sini, status Lunas masuk ke klasemen."
        actions={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" tabIndex={-1} aria-hidden onChange={e => onImport(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => { exportOrders(filtered); toast.success(`${filtered.length} transaksi diekspor`) }}><Download strokeWidth={1.6} />Export xlsx</Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}><FileSpreadsheet strokeWidth={1.6} />Template import</Button>
            <Button type="button" size="sm" disabled={!canEdit} title={canEdit ? undefined : 'Hanya lihat'} onClick={() => fileRef.current?.click()}><Upload strokeWidth={1.6} />Import xlsx</Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Lunas" value={lunas.length} hint={`dari ${orders.length} pesanan`} tone="navy" />
        <StatTile label="Omzet Lunas" value={rupiah(lunas.reduce((s, o) => s + o.total, 0))} tone="navy" />
        <StatTile label="Menunggu verifikasi" value={pending} hint="bukti sudah diunggah" tone={pending ? 'warn' : 'ink'} />
      </div>

      <SettingsCard title="Daftar pesanan" desc={`${filtered.length} ditampilkan.`} bodyClassName="p-0">
        <div className="flex flex-col gap-3 border-b border-line-2 px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto" role="group" aria-label="Filter status">
            {(['Semua', ...ORDER_STATUSES] as Filter[]).map(s => {
              const on = filter === s
              const n = s === 'Semua' ? orders.length : counts[s]
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => setFilter(s)} className={cn('flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[12px] font-semibold transition-colors', on ? 'border-navy-500 bg-navy-500 text-white' : 'border-line bg-white text-ink-2 hover:border-ink-4')}>
                  {s === 'Semua' ? s : STATUS_LABEL[s]}<span className={cn('t-num rounded-full px-1.5 text-[11px]', on ? 'bg-white/20' : 'bg-surface-2 text-ink-3')}>{n}</span>
                </button>
              )
            })}
          </div>
          <div className="relative lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.6} />
            <Input value={q} placeholder="Cari ID, nama, laundry, HP…" aria-label="Cari pesanan" className="h-9 pl-9 text-[13px]" onChange={e => setQ(e.target.value)} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5"><EmptyState title="Tidak ada pesanan" desc={needle || filter !== 'Semua' ? 'Coba ubah filter atau kata kunci.' : 'Pesanan dari Golden Sale akan muncul di sini.'} /></div>
        ) : (
          <Table>
            <THead><TR><TH className="pl-5">ID</TH><TH>Tanggal</TH><TH>Pembeli</TH><TH>HP</TH><TH>Pengambilan</TH><TH className="text-right">Total</TH><TH>Status</TH><TH className="pr-5" /></TR></THead>
            <TBody>
              {filtered.map(o => <Row key={o.id} o={o} onOpen={() => setOpenId(o.id)} />)}
            </TBody>
          </Table>
        )}
      </SettingsCard>

      <TransaksiDetail order={open} onClose={() => setOpenId(null)} />
      <TransaksiImport preview={preview} fileName={fileName} onClose={() => setPreview(null)} />
    </div>
  )
}

function Row({ o, onOpen }: { o: Order; onOpen: () => void }) {
  return (
    <TR className="cursor-pointer" onClick={onOpen}>
      <TD className="pl-5 t-code text-[12px] text-ink">{o.id}</TD>
      <TD className="whitespace-nowrap text-ink-3">{fmtDate(o.createdAt, true)}</TD>
      <TD><span className="font-semibold text-ink">{o.buyer.laundry || '-'}</span><span className="block text-[12px] text-ink-3">{o.buyer.name}</span></TD>
      <TD className="t-num whitespace-nowrap">{displayPhone(o.buyer.phone)}</TD>
      <TD className="text-ink-2">{o.fulfil.mode === 'DELIVERY' ? 'Kirim' : `Ambil · ${o.fulfil.outlet || '-'}`}</TD>
      <TD className="t-num text-right font-semibold">{rupiah(o.total)}</TD>
      <TD><Badge variant={statusVariant(o.status)}>{STATUS_LABEL[o.status]}</Badge></TD>
      <TD className="pr-5 text-right"><Button type="button" variant="ghost" size="sm" onClick={e => { e.stopPropagation(); onOpen() }}>Detail</Button></TD>
    </TR>
  )
}
