import * as React from 'react'
import * as XLSX from 'xlsx'
import { AlertTriangle, Download, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { GoldenSaleItem } from '@/model/types'
import { uid } from '@/lib/id'
import { downloadXLSX, stamp } from '@/lib/xlsx'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { useDraft } from '../useDraft'
import { ImageField } from '../ImageField'
import { NumInput, PageHead, RowTools, SaveBar, SettingsCard, cell, moveItem } from '../parts'

const ITEM_HEADER = ['Kode', 'Jenis', 'Nama', 'Kategori', 'Satuan', 'Harga', 'Harga Promo', 'Kuota', 'Maks/Pelanggan', 'Aktif', 'Keterangan']

export function exportItems(items: GoldenSaleItem[]) {
  downloadXLSX(`golden-sale-item-${stamp()}.xlsx`, ITEM_HEADER, items.map(i => [i.code, i.kind === 'paket' ? 'Paket' : 'Item', i.name, i.cat, i.unit, i.realPrice, i.promoPrice, i.quota, i.maxPerCustomer, i.active ? 'Ya' : 'Tidak', i.desc || '']), 'Item')
}

/** Parse an item workbook (header matched by name). Returns rows + skipped reasons. */
export async function parseItemsFile(file: File): Promise<{ rows: Omit<GoldenSaleItem, 'id' | 'image'>[]; skipped: string[] }> {
  const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, raw: false, defval: '' })
  if (!aoa.length) return { rows: [], skipped: ['File kosong'] }
  const head = (aoa[0] as string[]).map(h => String(h).toLowerCase())
  const col = (n: string) => head.findIndex(h => h.includes(n.toLowerCase()))
  const c = { code: col('Kode'), kind: col('Jenis'), name: col('Nama'), cat: col('Kategori'), unit: col('Satuan'), real: col('Harga'), promo: col('Promo'), quota: col('Kuota'), max: col('Maks'), active: col('Aktif'), desc: col('Keterangan') }
  if (c.code < 0 || c.name < 0) return { rows: [], skipped: ['Kolom "Kode" dan "Nama" wajib ada di baris pertama'] }
  const num = (v: unknown) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0
  const rows: Omit<GoldenSaleItem, 'id' | 'image'>[] = [], skipped: string[] = []
  aoa.slice(1).forEach((r, i) => {
    const code = String(r[c.code] ?? '').trim(), name = String(r[c.name] ?? '').trim()
    if (!code || !name) { skipped.push(`Baris ${i + 2}: kode/nama kosong`); return }
    const realPrice = num(r[c.real]), promoPrice = c.promo >= 0 ? num(r[c.promo]) : realPrice
    if (realPrice <= 0) { skipped.push(`Baris ${i + 2}: harga tidak valid`); return }
    const act = String(r[c.active] ?? 'Ya').trim().toLowerCase()
    const kind = c.kind >= 0 && /paket|package|bundle/i.test(String(r[c.kind] ?? '')) ? 'paket' as const : 'item' as const
    rows.push({ code, kind, desc: c.desc >= 0 ? String(r[c.desc] ?? '').trim() || undefined : undefined, name, cat: String(r[c.cat] ?? '').trim(), unit: String(r[c.unit] ?? 'pcs').trim() || 'pcs', realPrice, promoPrice, quota: num(r[c.quota]), maxPerCustomer: num(r[c.max]), active: !['tidak', 'no', 'false', '0', 'n'].includes(act) })
  })
  return { rows, skipped }
}

export function ItemsSection() {
  const d = useDraft('items', 'Golden Sale items')
  const list = d.draft
  const set = d.setDraft
  const fileRef = React.useRef<HTMLInputElement>(null)
  const update = (id: string, p: Partial<GoldenSaleItem>) => set(list.map(x => (x.id === id ? { ...x, ...p } : x)))
  const add = () => set([{ id: `it-${uid()}`, kind: 'item', code: '', name: 'Item baru', cat: '', unit: 'pcs', realPrice: 0, promoPrice: 0, image: '', quota: 0, maxPerCustomer: 0, active: true }, ...list])
  const dupCodes = new Set(list.map(i => i.code).filter((c, i, a) => c && a.indexOf(c) !== i))

  const onImport = async (f: File | undefined) => {
    if (!f) return
    try {
      const { rows, skipped } = await parseItemsFile(f)
      if (!rows.length) { toast.error(skipped[0] || 'Tidak ada baris valid'); return }
      let updated = 0, added = 0
      const next = list.slice()
      rows.forEach(r => {
        const idx = next.findIndex(x => x.code === r.code)
        if (idx >= 0) { next[idx] = { ...next[idx], ...r }; updated++ } else { next.push({ id: `it-${uid()}`, image: '', ...r }); added++ }
      })
      set(next)
      toast.success(`${added} item baru, ${updated} diperbarui, dimuat ke draf. Klik Simpan untuk menerapkan.${skipped.length ? ` ${skipped.length} baris dilewati.` : ''}`)
      if (skipped.length) skipped.slice(0, 3).forEach(s => toast.warning(s))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca berkas')
    } finally { if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div data-admin-section="items" className="space-y-4">
      <PageHead
        title="Golden Sale Items" sub="Katalog promo: Item satuan dan Paket Usaha (satu harga untuk satu set). Di landing, grup Paket tampil di atas grup Item. Kuota / Maks per pelanggan 0 = tanpa batas. Import mencocokkan baris berdasarkan Kode; kolom Jenis = Item / Paket."
        actions={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" tabIndex={-1} aria-hidden onChange={e => onImport(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => exportItems(list)}><Download strokeWidth={1.6} />Export item (xlsx)</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload strokeWidth={1.6} />Import item (xlsx)</Button>
            <Button type="button" size="sm" onClick={add}><Plus strokeWidth={1.6} />Tambah item</Button>
          </>
        }
      />
      <SettingsCard title="Daftar item" desc={`${list.filter(i => i.active).length} aktif dari ${list.length} item.`} bodyClassName="p-0">
        {list.length === 0 ? (
          <div className="p-5"><EmptyState title="Belum ada item" desc="Tambah manual atau import dari xlsx." action={<Button type="button" size="sm" onClick={add}>Tambah item</Button>} /></div>
        ) : (
          <Table className="min-w-[1240px]">
            <THead><TR><TH className="w-10 pl-5">Aktif</TH><TH>Kode</TH><TH>Jenis</TH><TH className="min-w-[240px]">Nama & gambar</TH><TH>Kategori</TH><TH>Satuan</TH><TH>Harga</TH><TH>Harga promo</TH><TH>Disc</TH><TH>Kuota</TH><TH>Maks/plg</TH><TH /></TR></THead>
            <TBody>
              {list.map((it, i) => {
                const pct = it.realPrice > 0 ? Math.round((1 - it.promoPrice / it.realPrice) * 100) : 0
                const bad = it.realPrice > 0 && it.promoPrice >= it.realPrice
                const dup = dupCodes.has(it.code)
                return (
                  <TR key={it.id} className={!it.active ? 'opacity-60' : undefined}>
                    <TD className="pl-5"><Checkbox checked={it.active} aria-label={`Aktifkan ${it.name}`} onCheckedChange={v => update(it.id, { active: v === true })} /></TD>
                    <TD><Input value={it.code} aria-label="Kode" aria-invalid={dup || undefined} placeholder="000000" className={`${cell} w-24 t-code`} onChange={e => update(it.id, { code: e.target.value.trim() })} />{dup && <p className="mt-1 text-[11px] text-danger">Kode ganda</p>}</TD>
                    <TD>
                      <Select value={it.kind || 'item'} onValueChange={v => update(it.id, { kind: v as 'item' | 'paket', ...(v === 'paket' && !it.cat ? { cat: 'Paket Usaha', unit: 'paket' } : {}) })}>
                        <SelectTrigger aria-label="Jenis" className="h-9 w-24 text-[13px]"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="item">Item</SelectItem><SelectItem value="paket">Paket</SelectItem></SelectContent>
                      </Select>
                    </TD>
                    <TD>
                      <div className="space-y-2">
                        <Input value={it.name} aria-label="Nama" className={cell} onChange={e => update(it.id, { name: e.target.value })} />
                        {it.kind === 'paket' && <Input value={it.desc || ''} aria-label="Isi paket" placeholder="Isi paket (satu baris, tampil di kartu)" className={cell} onChange={e => update(it.id, { desc: e.target.value })} />}
                        <ImageField compact value={it.image} onChange={v => update(it.id, { image: v })} defaultValue={d.defaults.find(x => x.id === it.id)?.image} />
                      </div>
                    </TD>
                    <TD><Input value={it.cat} aria-label="Kategori" className={`${cell} w-36`} onChange={e => update(it.id, { cat: e.target.value })} /></TD>
                    <TD><Input value={it.unit} aria-label="Satuan" className={`${cell} w-16`} onChange={e => update(it.id, { unit: e.target.value })} /></TD>
                    <TD><NumInput value={it.realPrice} aria-label="Harga" className={`${cell} w-28`} onChange={n => update(it.id, { realPrice: n })} /></TD>
                    <TD><NumInput value={it.promoPrice} aria-label="Harga promo" aria-invalid={bad || undefined} className={`${cell} w-28`} onChange={n => update(it.id, { promoPrice: n })} /></TD>
                    <TD>
                      {bad
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger" title="Harga promo harus lebih rendah dari harga"><AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.6} />≥ harga</span>
                        : <span className={cn('rounded-full px-1.5 py-px text-[11px] font-extrabold', pct > 0 ? 'bg-gold-100 text-gold-ink' : 'bg-surface-2 text-ink-4')}>-{pct}%</span>}
                    </TD>
                    <TD><NumInput value={it.quota} aria-label="Kuota" placeholder="0" className={`${cell} w-20`} onChange={n => update(it.id, { quota: n })} /></TD>
                    <TD><NumInput value={it.maxPerCustomer} aria-label="Maks per pelanggan" placeholder="0" className={`${cell} w-20`} onChange={n => update(it.id, { maxPerCustomer: n })} /></TD>
                    <TD className="pr-4"><RowTools index={i} count={list.length} onMove={(a, b) => set(moveItem(list, a, b))} onRemove={() => set(list.filter(x => x.id !== it.id))} /></TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
        <div className="px-5 pb-5"><SaveBar dirty={d.dirty} disabled={dupCodes.size > 0} onSave={() => d.save()} onReset={d.reset} /></div>
      </SettingsCard>
    </div>
  )
}
