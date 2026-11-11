import { Plus } from 'lucide-react'
import type { HeroPrize } from '@/types/member'
import { uid } from '@/lib/id'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { EmptyState } from '@/components/common/empty-state'
import { useDraft } from '@/features/admin/hooks/use-draft'
import { ImageField } from '@/features/admin/components/image-field'
import { PageHead } from '@/features/admin/components/page-head'
import { RowTools } from '@/features/admin/components/row-tools'
import { SaveBar } from '@/features/admin/components/save-bar'
import { SettingsCard } from '@/features/admin/components/settings-card'
import { moveItem } from '@/features/admin/lib/move-item'

export function AsetSection() {
  const d = useDraft('assets', 'Aset gambar')
  const prizes = d.draft.heroPrizes
  const setPrizes = (list: HeroPrize[]) => d.patch({ heroPrizes: list })
  const update = (id: string, p: Partial<HeroPrize>) => setPrizes(prizes.map(h => (h.id === id ? { ...h, ...p } : h)))
  const defaultImage = (h: HeroPrize) => d.defaults.heroPrizes.find(x => x.id === h.id)?.image

  return (
    <div data-admin-section="aset" className="stack-y-4">
      <PageHead title="Aset Gambar" sub="Logo, gambar QRIS demo, dan strip hadiah di hero. Unggahan diperkecil ke ≤ 800 px dan disimpan di browser (maks 300 KB)." />

      <SettingsCard title="Identitas & pembayaran" desc="Dipakai di header situs dan lembar pembayaran QRIS.">
        <div className="grid gap-5 md:grid-cols-2">
          <ImageField label="Logo (warna)" value={d.draft.logo} onChange={v => d.patch({ logo: v })} defaultValue={d.defaults.logo} hint="Lockup lengkap, latar transparan, tampil 32 px tinggi di header." />
          <ImageField label="Logo (putih)" value={d.draft.logoWhite} onChange={v => d.patch({ logoWhite: v })} defaultValue={d.defaults.logoWhite} hint="Versi putih untuk footer dan bidang navy." />
          <ImageField label="Ikon (mark)" value={d.draft.mark} onChange={v => d.patch({ mark: v })} defaultValue={d.defaults.mark} hint="Rasio 1:1, dipakai di kartu RMC dan slot kecil." />
          <ImageField label="Gambar QRIS (demo)" value={d.draft.qrisImage} onChange={v => d.patch({ qrisImage: v })} defaultValue={d.defaults.qrisImage} hint="Prototype: QR statis. Produksi memakai QRIS dinamis per pesanan." />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Strip hadiah hero" desc="Urutan tampil di marquee hero (kiri → kanan)."
        actions={<Button type="button" variant="outline" size="sm" onClick={() => setPrizes([...prizes, { id: `h-${uid()}`, image: '', label: 'Hadiah baru' }])}><Plus strokeWidth={1.6} />Tambah</Button>}
      >
        {prizes.length === 0 ? (
          <EmptyState title="Belum ada hadiah di strip" desc="Tambah minimal satu gambar agar marquee hero tampil." />
        ) : (
          <ol className="divide-y divide-line-2">
            {prizes.map((h, i) => (
              <li key={h.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[1fr_220px_auto] md:items-start">
                <ImageField compact value={h.image} onChange={v => update(h.id, { image: v })} defaultValue={defaultImage(h)} />
                <Field label="Label" htmlFor={`hero-${h.id}`}>
                  <Input id={`hero-${h.id}`} value={h.label} className="h-9 text-[13px]" onChange={e => update(h.id, { label: e.target.value })} />
                </Field>
                <div className="md:pt-6"><RowTools index={i} count={prizes.length} onMove={(a, b) => setPrizes(moveItem(prizes, a, b))} onRemove={() => setPrizes(prizes.filter(x => x.id !== h.id))} /></div>
              </li>
            ))}
          </ol>
        )}
        <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
      </SettingsCard>
    </div>
  )
}
