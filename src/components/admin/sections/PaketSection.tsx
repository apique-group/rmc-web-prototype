import * as React from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { GoldenSalePackage } from '@/model/types'
import { uid } from '@/lib/id'
import { rupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useOrders } from '@/store/orders'
import { useConfig } from '@/store/config'
import { packageRemaining } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Field } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { useDraft } from '../useDraft'
import { ImageField } from '../ImageField'
import { NumInput, PageHead, RowTools, SaveBar, SettingsCard, cell, moveItem } from '../parts'

/* R.051 — Paket Golden Sale, the staging model (CRM → RMC → Produk → tab Paket, GET /member/packages):
   a package bundles Golden Sale ITEMS (each with a qty) and is sold at one price. It has no stock of its
   own — how many sets are left comes from its contents (min over items of floor(remaining ÷ qty)) — and
   its own Max per Customer. Form fields follow the staging modal: Code*, Nama*, Harga Asli*, Harga Promo*
   (< asli), Max per Customer (0 = tanpa batas), Status, Deskripsi (opsional), Isi Paket* (min 1 row,
   qty ≥ 1), Gambar. A package already used by a transaction is deactivated instead of deleted. */

type Draft = Omit<GoldenSalePackage, 'items'> & { items: { itemId: string; qty: number | null }[] }

export function PaketSection() {
  const d = useDraft('packages', 'Paket Golden Sale')
  const list = d.draft
  const set = d.setDraft
  const items = useConfig(s => s.config.items)
  const orders = useOrders(s => s.orders)
  const [editing, setEditing] = React.useState<Draft | null>(null)
  const dupCodes = new Set(list.map(p => p.code).filter((c, i, a) => c && a.indexOf(c) !== i))
  const usedInOrders = (id: string) => orders.some(o => o.lines.some(l => l.packageId === id))
  const itemName = (id: string) => items.find(i => i.id === id)?.name || '(item tidak ditemukan)'

  const openNew = () => setEditing({ id: `gsp-${uid()}`, code: '', name: '', desc: '', image: '', realPrice: 0, promoPrice: 0, maxPerCustomer: 0, active: true, items: [{ itemId: '', qty: 1 }] })
  const openEdit = (p: GoldenSalePackage) => setEditing({ ...p, items: p.items.map(x => ({ ...x })) })
  const remove = (p: GoldenSalePackage) => {
    if (usedInOrders(p.id)) { set(list.map(x => x.id === p.id ? { ...x, active: false } : x)); return toast.warning(`${p.name} dinonaktifkan. Sudah pernah dipakai transaksi, tidak bisa dihapus permanen.`) }
    set(list.filter(x => x.id !== p.id))
  }
  const commit = (p: GoldenSalePackage) => {
    set(list.some(x => x.id === p.id) ? list.map(x => x.id === p.id ? p : x) : [...list, p])
    setEditing(null)
    toast.success(`${p.name} dimuat ke draf. Klik Simpan untuk menerapkan.`)
  }

  return (
    <div data-admin-section="paket" className="space-y-4">
      <PageHead
        title="Paket Golden Sale" sub="Bundel beberapa item Golden Sale dengan satu harga. Sisa paket dihitung dari sisa kuota isinya; batas per pelanggan milik paket sendiri. Di situs, grup Diskon Paket tampil di atas Diskon Item."
        actions={<Button type="button" size="sm" onClick={openNew}><Plus strokeWidth={1.6} />Tambah paket</Button>}
      />
      <SettingsCard title="Daftar paket" desc={`${list.filter(p => p.active).length} aktif dari ${list.length} paket.`} bodyClassName="p-0">
        {list.length === 0 ? (
          <div className="p-5"><EmptyState title="Belum ada paket" desc="Tambah paket dari item Golden Sale yang sudah ada." action={<Button type="button" size="sm" onClick={openNew}>Tambah paket</Button>} /></div>
        ) : (
          <Table className="min-w-[1080px]">
            <THead><TR><TH className="w-10 pl-5">Aktif</TH><TH>Kode</TH><TH className="min-w-[220px]">Nama & gambar</TH><TH className="min-w-[260px]">Isi paket</TH><TH>Harga asli</TH><TH>Harga promo</TH><TH>Disc</TH><TH>Sisa</TH><TH>Maks/plg</TH><TH /></TR></THead>
            <TBody>
              {list.map((p, i) => {
                const pct = p.realPrice > 0 ? Math.round((1 - p.promoPrice / p.realPrice) * 100) : 0
                const left = packageRemaining(p, items, orders, list)
                return (
                  <TR key={p.id} className={!p.active ? 'opacity-60' : undefined}>
                    <TD className="pl-5"><Checkbox checked={p.active} aria-label={`Aktifkan ${p.name}`} onCheckedChange={v => set(list.map(x => x.id === p.id ? { ...x, active: v === true } : x))} /></TD>
                    <TD><span className={cn('t-code text-[13px]', dupCodes.has(p.code) && 'text-danger')}>{p.code}</span>{dupCodes.has(p.code) && <p className="mt-1 text-[11px] font-semibold text-danger">Kode paket sudah dipakai</p>}</TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <ImageField compact value={p.image} onChange={v => set(list.map(x => x.id === p.id ? { ...x, image: v } : x))} defaultValue={d.defaults.find(x => x.id === p.id)?.image} />
                        <div className="min-w-0">
                          <button type="button" className="u-slide text-left text-[14px] font-semibold text-ink hover:text-navy-700" onClick={() => openEdit(p)}>{p.name}</button>
                          {p.desc && <p className="line-clamp-1 text-[12px] text-ink-3">{p.desc}</p>}
                        </div>
                      </div>
                    </TD>
                    <TD className="text-[12px] text-ink-2" data-contents>{p.items.map(x => `${itemName(x.itemId)} x${x.qty}`).join(', ')}</TD>
                    <TD className="t-num text-[13px]">{rupiah(p.realPrice)}</TD>
                    <TD className="t-num text-[13px] font-semibold">{rupiah(p.promoPrice)}</TD>
                    <TD><span className={cn('rounded-full px-1.5 py-px text-[11px] font-extrabold', pct > 0 ? 'bg-gold-100 text-gold-ink' : 'bg-surface-2 text-ink-4')}>-{pct}%</span></TD>
                    <TD className="t-num text-[13px] text-ink-3" data-left>{Number.isFinite(left) ? left : '∞'}</TD>
                    <TD className="t-num text-[13px]">{p.maxPerCustomer || '∞'}</TD>
                    <TD className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                        <RowTools index={i} count={list.length} onMove={(a, b) => set(moveItem(list, a, b))} onRemove={() => remove(p)} />
                      </div>
                    </TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
        <div className="px-5 pb-5"><SaveBar dirty={d.dirty} disabled={dupCodes.size > 0} onSave={() => d.save()} onReset={d.reset} /></div>
      </SettingsCard>

      {editing && <PaketForm draft={editing} existingCodes={new Set(list.filter(x => x.id !== editing.id).map(x => x.code))} onCancel={() => setEditing(null)} onSubmit={commit} />}
    </div>
  )
}

/** The staging "Tambah Paket Baru / Edit Paket" modal, with its validation messages. */
function PaketForm({ draft, existingCodes, onCancel, onSubmit }: { draft: Draft; existingCodes: Set<string>; onCancel: () => void; onSubmit: (p: GoldenSalePackage) => void }) {
  const items = useConfig(s => s.config.items)
  const [f, setF] = React.useState<Draft>(draft)
  const patch = (p: Partial<Draft>) => setF(s => ({ ...s, ...p }))
  const setRow = (idx: number, p: Partial<Draft['items'][number]>) => patch({ items: f.items.map((r, i) => i === idx ? { ...r, ...p } : r) })
  const validRows = f.items.filter(r => r.itemId && (r.qty || 0) > 0)
  const badQty = f.items.some(r => r.itemId && !((r.qty || 0) > 0))
  const active = items.filter(i => i.active)
  const submit = () => {
    if (!f.code.trim() || !f.name.trim()) return toast.error('Kode dan nama wajib diisi')
    if (existingCodes.has(f.code.trim())) return toast.error('Kode paket sudah dipakai')
    if (!(f.realPrice > 0) || !(f.promoPrice > 0)) return toast.error('Harga asli dan harga promo harus angka lebih dari 0')
    if (f.promoPrice >= f.realPrice) return toast.error('Harga promo harus lebih kecil dari harga asli')
    if (validRows.length === 0 || badQty) return toast.error('Isi paket belum lengkap: minimal 1 isi paket dengan jumlah lebih dari 0')
    onSubmit({ ...f, code: f.code.trim(), name: f.name.trim(), desc: f.desc?.trim() || undefined, maxPerCustomer: f.maxPerCustomer || 0, items: validRows.map(r => ({ itemId: r.itemId, qty: Math.max(1, r.qty || 1) })) })
  }
  const bad = f.realPrice > 0 && f.promoPrice >= f.realPrice
  return (
    <Dialog open onOpenChange={o => { if (!o) onCancel() }}>
      <DialogContent data-paket-form className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{draft.name ? `Edit paket: ${draft.name}` : 'Tambah paket baru'}</DialogTitle>
          <DialogDescription>Satu harga untuk satu set. Sisa paket mengikuti sisa kuota isinya.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kode" required htmlFor="pk-code"><Input id="pk-code" value={f.code} placeholder="GS-PKG-01" className="t-code" onChange={e => patch({ code: e.target.value })} /></Field>
          <Field label="Nama" required htmlFor="pk-name"><Input id="pk-name" value={f.name} placeholder="Paket Hemat Rumah" onChange={e => patch({ name: e.target.value })} /></Field>
          <Field label="Harga asli (Rp)" required htmlFor="pk-real"><NumInput id="pk-real" value={f.realPrice} placeholder="0" onChange={n => patch({ realPrice: n })} /></Field>
          <Field label="Harga promo (Rp)" required htmlFor="pk-promo" error={bad ? 'Harga promo harus lebih kecil dari harga asli' : undefined}><NumInput id="pk-promo" value={f.promoPrice} placeholder="0" aria-invalid={bad || undefined} onChange={n => patch({ promoPrice: n })} /></Field>
          <Field label="Maks per pelanggan" hint="0 = tanpa batas" htmlFor="pk-max"><NumInput id="pk-max" value={f.maxPerCustomer} placeholder="0" onChange={n => patch({ maxPerCustomer: n })} /></Field>
          <Field label="Status" htmlFor="pk-status">
            <Select value={f.active ? 'true' : 'false'} onValueChange={v => patch({ active: v === 'true' })}>
              <SelectTrigger id="pk-status"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="true">Aktif</SelectItem><SelectItem value="false">Nonaktif</SelectItem></SelectContent>
            </Select>
          </Field>
          <Field label="Deskripsi" hint="Opsional, satu kalimat" htmlFor="pk-desc" className="sm:col-span-2"><Input id="pk-desc" value={f.desc || ''} placeholder="Opsional" onChange={e => patch({ desc: e.target.value })} /></Field>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink">Isi paket <span className="text-danger">*</span></p>
            <Button type="button" variant="ghost" size="sm" onClick={() => patch({ items: [...f.items, { itemId: '', qty: 1 }] })}><Plus strokeWidth={1.6} />Tambah isi</Button>
          </div>
          <ul className="mt-2 max-h-[40vh] space-y-2 overflow-y-auto pr-1">
            {f.items.map((r, idx) => (
              <li key={idx} className="grid grid-cols-[1fr_84px_36px] items-center gap-2">
                <Select value={r.itemId} onValueChange={v => setRow(idx, { itemId: v })}>
                  <SelectTrigger aria-label={`Isi paket ${idx + 1}`}><SelectValue placeholder="Pilih item Golden Sale…" /></SelectTrigger>
                  <SelectContent>{active.map(i => <SelectItem key={i.id} value={i.id}>{i.code} · {i.name}</SelectItem>)}</SelectContent>
                </Select>
                <NumInput value={r.qty} aria-label="Jumlah" placeholder="1" className={cell} onChange={n => setRow(idx, { qty: n })} onClear={() => setRow(idx, { qty: null })} />
                <Button type="button" variant="ghost" size="icon" aria-label="Hapus baris" onClick={() => patch({ items: f.items.filter((_, i) => i !== idx) })}><Trash2 className="h-4 w-4" strokeWidth={1.6} /></Button>
              </li>
            ))}
          </ul>
          {(validRows.length === 0 || badQty) && <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-danger"><AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.6} />Minimal 1 isi paket dengan jumlah lebih dari 0</p>}
        </div>
        <ImageField label="Gambar" hint="PNG, JPEG, atau WEBP; diperkecil otomatis" value={f.image} onChange={v => patch({ image: v })} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
          <Button type="button" onClick={submit}>{draft.name ? 'Simpan perubahan' : 'Tambah paket'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
