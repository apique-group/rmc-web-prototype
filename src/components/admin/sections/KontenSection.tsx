import type { Config } from '@/model/types'
import { Input, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { useDraft } from '../useDraft'
import { CheckRow, PageHead, SaveBar, SettingsCard } from '../parts'

type CopyKey = Exclude<keyof Config['copy'], 'snapDesktop'>
interface Row { key: CopyKey; label: string; long?: boolean; hint?: string }
interface Group { title: string; desc: string; rows: Row[] }

const GROUPS: Group[] = [
  { title: 'Hero', desc: 'Judul utama di bagian atas landing page.', rows: [
    { key: 'hook', label: 'Judul hook', hint: 'Satu baris, maksimal ±4 kata.' },
    { key: 'hookSub', label: 'Sub-judul hook', long: true },
    { key: 'tagline', label: 'Tagline' },
    { key: 'taglineSub', label: 'Sub-tagline', long: true },
  ] },
  { title: 'Benefit & Tier', desc: 'Judul seksi Benefit RMC dan Tier.', rows: [
    { key: 'benefitTitle', label: 'Judul Benefit' },
    { key: 'benefitSub', label: 'Sub Benefit', long: true },
    { key: 'tierTitle', label: 'Judul Tier' },
    { key: 'tierSub', label: 'Sub Tier', long: true },
  ] },
  { title: 'CTA Poin', desc: 'Ajakan cek poin / masuk.', rows: [
    { key: 'ctaPoints', label: 'Judul CTA' },
    { key: 'ctaPointsSub', label: 'Sub CTA', long: true },
  ] },
  { title: 'Golden Sale & Klasemen', desc: 'Judul seksi belanja dan peringkat.', rows: [
    { key: 'saleTitle', label: 'Judul Golden Sale' },
    { key: 'saleSub', label: 'Sub Golden Sale', long: true },
    { key: 'salePaketTitle', label: 'Judul grup Paket (Golden Sale)' },
    { key: 'saleItemTitle', label: 'Judul grup Item (Golden Sale)' },
    { key: 'klasemenTitle', label: 'Judul Klasemen' },
    { key: 'klasemenSub', label: 'Sub Klasemen', long: true },
  ] },
]

export function KontenSection() {
  const d = useDraft('copy', 'Konten & copy')
  return (
    <div data-admin-section="konten" className="space-y-4">
      <PageHead title="Konten & Copy" sub="Semua teks landing page dibaca dari sini, tidak ada headline yang dikodekan langsung." />
      {GROUPS.map(g => (
        <SettingsCard key={g.title} title={g.title} desc={g.desc}>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.rows.map(r => (
              <Field key={r.key} label={r.label} htmlFor={`copy-${r.key}`} hint={r.hint} className={r.long ? 'sm:col-span-2' : undefined}>
                {r.long
                  ? <Textarea id={`copy-${r.key}`} value={d.draft[r.key]} rows={2} className="min-h-[64px] text-[14px]" onChange={e => d.patch({ [r.key]: e.target.value } as Partial<Config['copy']>)} />
                  : <Input id={`copy-${r.key}`} value={d.draft[r.key]} className="h-10 text-[14px]" onChange={e => d.patch({ [r.key]: e.target.value } as Partial<Config['copy']>)} />}
              </Field>
            ))}
          </div>
        </SettingsCard>
      ))}
      <SettingsCard title="Perilaku tampilan" desc="Opsi tata letak yang memengaruhi desktop saja.">
        <CheckRow id="copy-snap" checked={d.draft.snapDesktop} onChange={v => d.patch({ snapDesktop: v })} label="Snap per seksi di desktop" hint="Setiap seksi mengisi satu layar dan scroll melompat per seksi (mode pitch-deck)." />
        <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
      </SettingsCard>
    </div>
  )
}
