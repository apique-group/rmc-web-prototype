import * as React from 'react'
import * as XLSX from 'xlsx'
import { AlertTriangle, Download, Lock, PackageSearch, Plus, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { GoldenSaleItem } from '@/model/types'
import { uid } from '@/lib/id'
import { downloadXLSX, stamp } from '@/lib/xlsx'
import { rupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CATALOG, CATALOG_CATEGORIES, CATALOG_UNITS, catalogByCode } from '@/data/catalog'
import { useOrders } from '@/store/orders'
import { useConfig } from '@/store/config'
import { itemLeft } from '@/store/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { useDraft } from '../useDraft'
import { ImageField } from '../ImageField'
import { NumInput, PageHead, RowTools, SaveBar, SettingsCard, cell, moveItem } from '../parts'

/* R.051 — aligned with the staging admin (CRM → RMC → Produk → Golden Sale Items):
   - fields: Code*, Nama*, Kategori* (select), Unit* (select), Harga Asli*, Harga Promo* (< asli), Quota (blank = unlimited),
     Max per Customer (0 = tanpa batas), Status, Gambar;
   - "Tambah item dari katalog": pick a catalog product → code / name / category / unit / list price locked to it;
   - duplicate code refused; an item already used by an order or a package cannot be removed, only deactivated.
   xlsx export/import stays (prototype-ahead, not in staging). */

const ITEM_HEADER = ['Kode', 'Nama', 'Kategori', 'Satuan', 'Harga', 'Harga Promo', 'Kuota', 'Maks/Pelanggan', 'Aktif']

export function exportItems(items: GoldenSaleItem[]) {
  downloadXLSX(`golden-privilege-item-${stamp()}.xlsx`, ITEM_HEADER, items.map(i => [i.code, i.name, i.cat, i.unit, i.realPrice, i.promoPrice, i.quota === null ? '' : i.quota, i.maxPerCustomer, i.active ? 'Ya' : 'Tidak']), 'Item')
}

/** Parse an item workbook (header matched by name). Returns rows + skipped reasons. Kuota blank = unlimited. */
export async function parseItemsFile(file: File): Promise<{ rows: Omit<GoldenSaleItem, 'id' | 'image'>[]; skipped: string[] }> {
  const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, raw: false, defval: '' })
  if (!aoa.length) return { rows: [], skipped: ['File kosong'] }
  const head = (aoa[0] as string[]).map(h => String(h).toLowerCase())
  const col = (n: string) => head.findIndex(h => h.includes(n.toLowerCase()))
  const c = { code: col('Kode'), name: col('Nama'), cat: col('Kategori'), unit: col('Satuan'), real: col('Harga'), promo: col('Promo'), quota: col('Kuota'), max: col('Maks'), active: col('Aktif') }
  if (c.code < 0 || c.name < 0) return { rows: [], skipped: ['Kolom "Kode" dan "Nama" wajib ada di baris pertama'] }
  const num = (v: unknown) => Number(String(v ?? '').replace(/[^\d.-]/g, '')) || 0
  const rows: Omit<GoldenSaleItem, 'id' | 'image'>[] = [], skipped: string[] = []
  aoa.slice(1).forEach((r, i) => {
    const code = String(r[c.code] ?? '').trim(), name = String(r[c.name] ?? '').trim()
    if (!code || !name) { skipped.push(`Baris ${i + 2}: kode/nama kosong`); return }
    const realPrice = num(r[c.real]), promoPrice = c.promo >= 0 ? num(r[c.promo]) : realPrice
    if (realPrice <= 0) { skipped.push(`Baris ${i + 2}: harga tidak valid`); return }
    if (promoPrice >= realPrice) { skipped.push(`Baris ${i + 2}: harga promo harus lebih kecil dari harga asli`); return }
    const quotaRaw = c.quota >= 0 ? String(r[c.quota] ?? '').trim() : ''
    const act = String(r[c.active] ?? 'Ya').trim().toLowerCase()
    rows.push({ code, name, cat: String(r[c.cat] ?? '').trim(), unit: String(r[c.unit] ?? 'pcs').trim() || 'pcs', realPrice, promoPrice, quota: quotaRaw === '' ? null : num(quotaRaw), maxPerCustomer: num(r[c.max]), active: !['tidak', 'no', 'false', '0', 'n'].includes(act) })
  })
  return { rows, skipped }
}

export function ItemsSection() {
  const d = useDraft('items', 'Golden Sale items')
  const list = d.draft
  const set = d.setDraft
  const orders = useOrders(s => s.orders)
  const packages = useConfig(s => s.config.packages)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [picker, setPicker] = React.useState(false)
  const update = (id: string, p: Partial<GoldenSaleItem>) => set(list.map(x => (x.id === id ? { ...x, ...p } : x)))
  const add = () => set([{ id: `it-${uid()}`, code: '', name: 'Item baru', cat: CATALOG_CATEGORIES[0], unit: 'pcs', realPrice: 0, promoPrice: 0, image: '', quota: null, maxPerCustomer: 0, active: true }, ...list])
  const dupCodes = new Set(list.map(i => i.code).filter((c, i, a) => c && a.indexOf(c) !== i))
  const badPrice = list.some(it => it.realPrice <= 0 || it.promoPrice <= 0 || it.promoPrice >= it.realPrice)
  const cats = [...new Set([...CATALOG_CATEGORIES, ...list.map(i => i.cat).filter(Boolean)])]
  const units = [...new Set([...CATALOG_UNITS, ...list.map(i => i.unit).filter(Boolean)])]
  const usedBy = (id: string) => {
    if (packages.some(p => p.items.some(x => x.itemId === id))) return 'paket'
    if (orders.some(o => o.lines.some(l => l.itemId === id))) return 'transaksi'
    return null
  }
  const remove = (it: GoldenSaleItem) => {
    const used = usedBy(it.id)
    if (used === 'paket') return toast.error(`${it.name} masih menjadi isi paket. Lepas dari paket dulu sebelum dihapus.`)
    if (used === 'transaksi') { update(it.id, { active: false }); return toast.warning(`${it.name} dinonaktifkan. Sudah pernah dipakai transaksi, tidak bisa dihapus permanen.`) }
    set(list.filter(x => x.id !== it.id))
  }
  /* Pick from the catalog: code / name / category / unit / list price come from the product and stay locked. */
  const addFromCatalog = (code: string) => {
    const p = catalogByCode(code)
    if (!p) return
    if (list.some(i => i.code === p.code)) return toast.error('Kode item sudah dipakai')
    set([{ id: `it-${uid()}`, code: p.code, name: p.name, cat: p.cat, unit: p.unit, realPrice: p.price, promoPrice: 0, image: `/img/product-${p.code}.jpg`, quota: null, maxPerCustomer: 0, active: true }, ...list])
    setPicker(false)
    toast.success(`${p.name} ditambahkan dari katalog. Isi harga promonya, lalu Simpan.`)
  }

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
        title="Golden Sale Items" sub="Produk satuan yang dipromosikan. Kode, nama, kategori, satuan, dan harga asli ikut katalog produk Resique bila ditambah dari katalog. Kuota kosong = tanpa batas; Maks per pelanggan 0 = tanpa batas. Paket diatur di menu Paket Golden Sale."
        actions={
          <>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="sr-only" tabIndex={-1} aria-hidden onChange={e => onImport(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => exportItems(list)}><Download strokeWidth={1.6} />Export item (xlsx)</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload strokeWidth={1.6} />Import item (xlsx)</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPicker(true)}><PackageSearch strokeWidth={1.6} />Tambah dari katalog</Button>
            <Button type="button" size="sm" onClick={add}><Plus strokeWidth={1.6} />Tambah item</Button>
          </>
        }
      />
      <SettingsCard title="Daftar item" desc={`${list.filter(i => i.active).length} aktif dari ${list.length} item.`} bodyClassName="p-0">
        {list.length === 0 ? (
          <div className="p-5"><EmptyState title="Belum ada item" desc="Tambah dari katalog, tambah manual, atau import dari xlsx." action={<Button type="button" size="sm" onClick={() => setPicker(true)}>Tambah dari katalog</Button>} /></div>
        ) : (
          <Table className="min-w-[1240px]">
            <THead><TR><TH className="w-10 pl-5">Aktif</TH><TH>Kode</TH><TH className="min-w-[240px]">Nama & gambar</TH><TH>Kategori</TH><TH>Satuan</TH><TH>Harga asli</TH><TH>Harga promo</TH><TH>Disc</TH><TH>Kuota</TH><TH>Sisa</TH><TH>Maks/plg</TH><TH /></TR></THead>
            <TBody>
              {list.map((it, i) => {
                const pct = it.realPrice > 0 ? Math.round((1 - it.promoPrice / it.realPrice) * 100) : 0
                const bad = it.realPrice <= 0 || it.promoPrice <= 0 || it.promoPrice >= it.realPrice
                const dup = dupCodes.has(it.code)
                const locked = !!catalogByCode(it.code)
                const left = itemLeft(it, orders, packages)
                return (
                  <TR key={it.id} className={!it.active ? 'opacity-60' : undefined}>
                    <TD className="pl-5"><Checkbox checked={it.active} aria-label={`Aktifkan ${it.name}`} onCheckedChange={v => update(it.id, { active: v === true })} /></TD>
                    <TD>
                      <Input value={it.code} aria-label="Kode" aria-invalid={dup || undefined} readOnly={locked} placeholder="000000" className={`${cell} w-24 t-code`} onChange={e => update(it.id, { code: e.target.value.trim() })} />
                      {dup && <p className="mt-1 text-[11px] font-semibold text-danger">Kode item sudah dipakai</p>}
                      {locked && <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-ink-4"><Lock className="h-3 w-3" strokeWidth={1.8} />dari katalog</p>}
                    </TD>
                    <TD>
                      <div className="space-y-2">
                        <Input value={it.name} aria-label="Nama" readOnly={locked} className={cell} onChange={e => update(it.id, { name: e.target.value })} />
                        <ImageField compact value={it.image} onChange={v => update(it.id, { image: v })} defaultValue={d.defaults.find(x => x.id === it.id)?.image} />
                      </div>
                    </TD>
                    <TD>
                      <Select value={it.cat} onValueChange={v => update(it.id, { cat: v })} disabled={locked}>
                        <SelectTrigger aria-label="Kategori" className="h-9 w-40 text-[13px]"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                        <SelectContent>{cats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </TD>
                    <TD>
                      <Select value={it.unit} onValueChange={v => update(it.id, { unit: v })} disabled={locked}>
                        <SelectTrigger aria-label="Satuan" className="h-9 w-24 text-[13px]"><SelectValue placeholder="Satuan" /></SelectTrigger>
                        <SelectContent>{units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                      </Select>
                    </TD>
                    <TD><NumInput value={it.realPrice} aria-label="Harga asli" readOnly={locked} className={`${cell} w-28`} onChange={n => update(it.id, { realPrice: n })} /></TD>
                    <TD><NumInput value={it.promoPrice} aria-label="Harga promo" aria-invalid={bad || undefined} className={`${cell} w-28`} onChange={n => update(it.id, { promoPrice: n })} /></TD>
                    <TD>
                      {bad
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-bold text-danger" title="Harga promo harus lebih kecil dari harga asli"><AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.6} />promo ≥ asli</span>
                        : <span className={cn('rounded-full px-1.5 py-px text-[11px] font-extrabold', pct > 0 ? 'bg-gold-100 text-gold-ink' : 'bg-surface-2 text-ink-4')}>-{pct}%</span>}
                    </TD>
                    <TD><NumInput value={it.quota} aria-label="Kuota" placeholder="Kosong = tanpa batas" className={`${cell} w-28`} onChange={n => update(it.id, { quota: n })} onClear={() => update(it.id, { quota: null })} /></TD>
                    <TD className="t-num text-[13px] text-ink-3" data-left>{Number.isFinite(left) ? left : '∞'}</TD>
                    <TD><NumInput value={it.maxPerCustomer} aria-label="Maks per pelanggan" placeholder="0" className={`${cell} w-20`} onChange={n => update(it.id, { maxPerCustomer: n })} /></TD>
                    <TD className="pr-4"><RowTools index={i} count={list.length} onMove={(a, b) => set(moveItem(list, a, b))} onRemove={() => remove(it)} /></TD>
                  </TR>
                )
              })}
            </TBody>
          </Table>
        )}
        <div className="px-5 pb-5">
          <SaveBar dirty={d.dirty} disabled={dupCodes.size > 0 || badPrice} onSave={() => d.save()} onReset={d.reset}>
            {badPrice && <span className="text-[12px] font-semibold text-danger">Harga asli dan harga promo harus angka &gt; 0, dan harga promo harus lebih kecil dari harga asli.</span>}
          </SaveBar>
        </div>
      </SettingsCard>

      <CatalogPicker open={picker} onOpenChange={setPicker} taken={new Set(list.map(i => i.code))} onPick={addFromCatalog} />
    </div>
  )
}

/** "Tambah item dari katalog" — the staging picker over the product catalog; products already in the list are greyed out. */
export function CatalogPicker({ open, onOpenChange, taken, onPick }: { open: boolean; onOpenChange: (v: boolean) => void; taken: Set<string>; onPick: (code: string) => void }) {
  const [q, setQ] = React.useState('')
  const rows = CATALOG.filter(p => !q || `${p.code} ${p.name} ${p.cat}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-catalog-picker className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Tambah item dari katalog</DialogTitle>
          <DialogDescription>Kode, nama, kategori, satuan, dan harga asli diambil dari produk katalog dan tidak bisa diubah di sini. Harga promo, kuota, batas per pelanggan, gambar, dan status diisi setelahnya.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.6} />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari kode, nama, atau kategori" className="pl-9" aria-label="Cari produk katalog" />
        </div>
        <ul className="max-h-[50vh] divide-y divide-line-2 overflow-y-auto">
          {rows.map(p => {
            const has = taken.has(p.code)
            return (
              <li key={p.code}>
                <button type="button" disabled={has} onClick={() => onPick(p.code)} className={cn('slide flex w-full items-center justify-between gap-3 py-2.5 text-left', has ? 'cursor-not-allowed opacity-50' : 'hover:text-navy-700')}>
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] font-semibold text-ink">{p.name}</span>
                    <span className="t-code block text-[12px] text-ink-3">{p.code} · {p.cat} · per {p.unit}</span>
                  </span>
                  <span className="t-num shrink-0 text-[13px] font-bold text-ink">{has ? 'sudah ada' : rupiah(p.price)}</span>
                </button>
              </li>
            )
          })}
          {rows.length === 0 && <li className="py-6 text-center text-[13px] text-ink-3">Tidak ada produk yang cocok.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
