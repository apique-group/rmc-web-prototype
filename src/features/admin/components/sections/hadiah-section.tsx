import { Plus } from 'lucide-react'
import type { Prize } from '@/types/member'
import { uid } from '@/lib/id'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/common/empty-state'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table'
import { useDraft } from '@/features/admin/hooks/use-draft'
import { ImageField } from '@/features/admin/components/image-field'
import { NumInput } from '@/features/admin/components/num-input'
import { PageHead } from '@/features/admin/components/page-head'
import { RowTools } from '@/features/admin/components/row-tools'
import { SaveBar } from '@/features/admin/components/save-bar'
import { SettingsCard } from '@/features/admin/components/settings-card'
import { cell } from '@/features/admin/lib/cell'
import { moveItem } from '@/features/admin/lib/move-item'
import { useAdminConfig } from '@/features/admin/hooks/use-admin'

export function HadiahSection() {
  const d = useDraft('prizes', 'Katalog hadiah')
  const list = d.draft
  const set = d.setDraft
  const update = (id: string, p: Partial<Prize>) => set(list.map(x => (x.id === id ? { ...x, ...p } : x)))
  const add = () => set([...list, { id: `p-${uid()}`, name: 'Hadiah baru', type: liveTypes[0] || 'Lainnya', image: '', pointCost: 1000, stock: 10, active: true, desc: '' }])
  const activeCount = list.filter(p => p.active).length
  const t = useDraft('prizeTypes', 'Jenis hadiah')
  const types = t.draft
  const liveTypes = useAdminConfig().prizeTypes

  return (
    <div data-admin-section="hadiah" className="stack-y-4">
      <PageHead title="Hadiah / Prizes" sub="Katalog penukaran poin di profil RMC. Hadiah nonaktif atau stok 0 tidak bisa ditukar." />
      <SettingsCard
        title="Katalog hadiah" desc={`${activeCount} aktif dari ${list.length} hadiah.`}
        actions={<Button type="button" variant="outline" size="sm" onClick={add}><Plus strokeWidth={1.6} />Tambah hadiah</Button>}
      >
        {list.length === 0 ? (
          <EmptyState title="Belum ada hadiah" desc="Tambah hadiah agar seksi tukar poin tampil." action={<Button type="button" size="sm" onClick={add}>Tambah hadiah</Button>} />
        ) : (
          <Table className="min-w-[980px]">
            <THead><TR><TH className="w-10">Aktif</TH><TH className="min-w-[260px]">Gambar & nama</TH><TH>Jenis</TH><TH>Poin</TH><TH>Stok</TH><TH className="min-w-[220px]">Deskripsi</TH><TH /></TR></THead>
            <TBody>
              {list.map((p, i) => (
                <TR key={p.id} className={!p.active ? 'opacity-60' : undefined}>
                  <TD><Checkbox checked={p.active} aria-label={`Aktifkan ${p.name}`} onCheckedChange={v => update(p.id, { active: v === true })} /></TD>
                  <TD>
                    <div className="stack-y-2">
                      <Input value={p.name} aria-label="Nama hadiah" className={cell} onChange={e => update(p.id, { name: e.target.value })} />
                      <ImageField compact value={p.image} onChange={v => update(p.id, { image: v })} defaultValue={d.defaults.find(x => x.id === p.id)?.image} />
                    </div>
                  </TD>
                  <TD><select value={p.type} aria-label="Jenis hadiah" className={`${cell} h-9 w-40 rounded-md border border-line bg-white px-2 text-[13px]`} onChange={e => update(p.id, { type: e.target.value })}>{[...new Set([...liveTypes, p.type])].map(x => <option key={x} value={x}>{x}</option>)}</select></TD>
                  <TD><NumInput value={p.pointCost} aria-label="Biaya poin" className={`${cell} w-28`} onChange={n => update(p.id, { pointCost: n })} /></TD>
                  <TD><NumInput value={p.stock} aria-label="Stok" className={`${cell} w-20`} onChange={n => update(p.id, { stock: n })} /></TD>
                  <TD><Input value={p.desc || ''} aria-label="Deskripsi" className={cell} onChange={e => update(p.id, { desc: e.target.value })} /></TD>
                  <TD><RowTools index={i} count={list.length} onMove={(a, b) => set(moveItem(list, a, b))} onRemove={() => set(list.filter(x => x.id !== p.id))} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
      </SettingsCard>
      <SettingsCard title="Jenis hadiah" desc="Daftar kategori hadiah yang bisa dipilih di katalog (pisahkan dengan koma). Tampil sebagai label di kartu hadiah.">
        <Input value={types.join(', ')} aria-label="Jenis hadiah" onChange={e => t.setDraft(e.target.value.split(',').map(x => x.trim()).filter(Boolean))} />
        <SaveBar dirty={t.dirty} onSave={() => t.save()} onReset={t.reset} />
      </SettingsCard>
    </div>
  )
}
