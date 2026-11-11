import { AlertTriangle, Plus, Sparkles } from 'lucide-react'
import { BENEFIT_ICONS, BENEFIT_ICON_NAMES as ICON_NAMES } from '@/lib/benefit-icons'
import type { Benefit, Tier } from '@/types/member'
import { uid } from '@/lib/id'
import { rupiah } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { useDraft } from '@/features/admin/hooks/use-draft'
import { NumInput, PageHead, RowTools, SaveBar, SettingsCard, cell, moveItem } from '@/features/admin/components/parts'


export function BenefitSection() {
  return (
    <div data-admin-section="benefit" className="stack-y-4">
      <PageHead title="Benefit & Tier" sub="Kartu privilege member, tabel tier RMC, diskon dasar mitra, dan aturan poin." />
      <BenefitsCard />
      <TiersCard />
      <div className="grid gap-4 lg:grid-cols-2">
        <MitraCard />
        <RulesCard />
      </div>
    </div>
  )
}

function BenefitsCard() {
  const d = useDraft('benefits', 'Benefit')
  const list = d.draft
  const set = d.setDraft
  const update = (id: string, p: Partial<Benefit>) => set(list.map(b => (b.id === id ? { ...b, ...p } : b)))
  return (
    <SettingsCard title="Kartu privilege member" desc="Tampil di seksi “Yang didapat member RMC”. Angka besar memimpin tiap kartu." actions={<Button type="button" variant="outline" size="sm" onClick={() => set([...list, { id: `b-${uid()}`, icon: 'Sparkles', figure: '', figureNote: '', title: 'Benefit baru', desc: '' }])}><Plus strokeWidth={1.6} />Tambah</Button>}>
      <ol className="divide-y divide-line-2">
        {list.map((b, i) => {
          const Icon = BENEFIT_ICONS[b.icon] || Sparkles
          return (
            <li key={b.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[150px_1fr_auto] md:items-start">
              <Field label="Ikon" htmlFor={`bn-icon-${b.id}`}>
                <Select value={b.icon} onValueChange={v => update(b.id, { icon: v })}>
                  <SelectTrigger id={`bn-icon-${b.id}`} className="h-9 text-[13px]"><span className="flex items-center gap-2"><Icon className="h-4 w-4 text-navy-600" strokeWidth={1.6} /><SelectValue /></span></SelectTrigger>
                  <SelectContent>{ICON_NAMES.map(n => { const I = BENEFIT_ICONS[n]; return <SelectItem key={n} value={n}><span className="flex items-center gap-2"><I className="h-4 w-4" strokeWidth={1.6} />{n}</span></SelectItem> })}</SelectContent>
                </Select>
              </Field>
              <div className="grid gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Angka besar" htmlFor={`bn-fig-${b.id}`}><Input id={`bn-fig-${b.id}`} value={b.figure || ''} placeholder="0–5%" className="h-9 text-[13px]" onChange={e => update(b.id, { figure: e.target.value })} /></Field>
                  <Field label="Keterangan angka" htmlFor={`bn-fign-${b.id}`}><Input id={`bn-fign-${b.id}`} value={b.figureNote || ''} placeholder="diskon belanja" className="h-9 text-[13px]" onChange={e => update(b.id, { figureNote: e.target.value })} /></Field>
                </div>
                <Field label="Judul" htmlFor={`bn-title-${b.id}`}><Input id={`bn-title-${b.id}`} value={b.title} className="h-9 text-[13px]" onChange={e => update(b.id, { title: e.target.value })} /></Field>
                <Field label="Deskripsi" htmlFor={`bn-desc-${b.id}`}><Textarea id={`bn-desc-${b.id}`} value={b.desc} rows={2} className="min-h-[56px] text-[13px]" onChange={e => update(b.id, { desc: e.target.value })} /></Field>
              </div>
              <div className="md:pt-6"><RowTools index={i} count={list.length} onMove={(a, c) => set(moveItem(list, a, c))} onRemove={() => set(list.filter(x => x.id !== b.id))} /></div>
            </li>
          )
        })}
      </ol>
      <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
    </SettingsCard>
  )
}

function TiersCard() {
  const d = useDraft('tiers', 'Tier')
  const tiers = d.draft
  const set = d.setDraft
  const update = (key: string, p: Partial<Tier>) => set(tiers.map(t => (t.key === key ? { ...t, ...p } : t)))
  const gaps = tiers.map((t, i) => (i > 0 && (tiers[i - 1].max ?? -1) + 1 !== t.min ? i : -1)).filter(i => i >= 0)
  const add = () => { const last = tiers[tiers.length - 1]; set([...tiers, { key: `tier-${uid()}`, name: 'Tier baru', sw: '#3E8A1E', min: last?.max != null ? last.max + 1 : 0, max: null, perMonth: '', discount: 0, freeDelivMin: null, consult: 0, benefitCopy: '' }]) }
  return (
    <SettingsCard title="Tier RMC" desc="Band belanja 6 bulan (Rp). Batas atas tier harus sama dengan batas bawah tier berikutnya." actions={<Button type="button" variant="outline" size="sm" onClick={add}><Plus strokeWidth={1.6} />Tambah tier</Button>}>
      {gaps.length > 0 && (
        <p role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-warn-100 bg-warn-50 px-3 py-2 text-[12px] font-medium text-warn">
          <AlertTriangle className="mt-px h-4 w-4 shrink-0" strokeWidth={1.6} />
          <span>Band tidak sambung: {gaps.map(i => `${tiers[i - 1].name} (maks ${rupiah(tiers[i - 1].max ?? 0)}) → ${tiers[i].name} (min ${rupiah(tiers[i].min)})`).join('; ')}. Perbaiki agar tidak ada celah/tumpang tindih.</span>
        </p>
      )}
      <Table className="min-w-[1120px]">
        <THead><TR><TH>Nama</TH><TH>Warna</TH><TH>Min (Rp)</TH><TH>Maks (Rp)</TH><TH>Per bulan</TH><TH>Diskon %</TH><TH>Gratis ongkir ≥</TH><TH>Konsul /bln</TH><TH className="min-w-[220px]">Copy benefit</TH><TH /></TR></THead>
        <TBody>
          {tiers.map((t, i) => {
            const bad = gaps.includes(i)
            return (
              <TR key={t.key}>
                <TD><Input value={t.name} aria-label="Nama tier" className={`${cell} w-32`} onChange={e => update(t.key, { name: e.target.value })} /></TD>
                <TD>
                  <label className="flex items-center gap-1.5">
                    <input type="color" value={/^#[0-9a-f]{6}$/i.test(t.sw) ? t.sw : '#3E8A1E'} aria-label="Warna tier" className="h-9 w-9 cursor-pointer rounded-md border border-line bg-white p-0.5" onChange={e => update(t.key, { sw: e.target.value })} />
                    <Input value={t.sw} aria-label="Kode warna" className={`${cell} w-24 t-code`} onChange={e => update(t.key, { sw: e.target.value })} />
                  </label>
                </TD>
                <TD><NumInput value={t.min} aria-label="Minimum" aria-invalid={bad || undefined} className={`${cell} w-32`} onChange={n => update(t.key, { min: n })} /></TD>
                <TD><NumInput value={t.max} onClear={() => update(t.key, { max: null })} aria-label="Maksimum" placeholder="tanpa batas" className={`${cell} w-32`} onChange={n => update(t.key, { max: n })} /></TD>
                <TD><Input value={t.perMonth} aria-label="Per bulan" className={`${cell} w-28`} onChange={e => update(t.key, { perMonth: e.target.value })} /></TD>
                <TD><NumInput value={t.discount} aria-label="Diskon persen" min={0} max={100} className={`${cell} w-16`} onChange={n => update(t.key, { discount: n })} /></TD>
                <TD><NumInput value={t.freeDelivMin} onClear={() => update(t.key, { freeDelivMin: null })} aria-label="Minimum gratis ongkir" placeholder="tidak ada" className={`${cell} w-28`} onChange={n => update(t.key, { freeDelivMin: n })} /></TD>
                <TD><NumInput value={t.consult} aria-label="Sesi konsultasi per bulan" className={`${cell} w-16`} onChange={n => update(t.key, { consult: n })} /></TD>
                <TD><Input value={t.benefitCopy} aria-label="Copy benefit" className={cell} onChange={e => update(t.key, { benefitCopy: e.target.value })} /></TD>
                <TD><RowTools index={i} count={tiers.length} onMove={(a, b) => set(moveItem(tiers, a, b))} onRemove={() => set(tiers.filter(x => x.key !== t.key))} /></TD>
              </TR>
            )
          })}
        </TBody>
      </Table>
      <p className="mt-2 text-[12px] text-ink-3">Min dan Maks INKLUSIF: Starter 0–8.999.999, Beginner mulai tepat 9.000.000 (Maks = Min tier berikut − 1). Maks kosong = tanpa batas (tier tertinggi). Gratis ongkir 0 = tanpa minimum; kosong = tidak ada gratis ongkir. Konsul = sesi per bulan (1 sesi = 1 jam trainer Apique Academy). Sumber: Kebijakan Program RMC RSQ-RMC-001 v2.0.</p>
      <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
    </SettingsCard>
  )
}

function MitraCard() {
  const d = useDraft('mitraFloorDiscount', 'Diskon dasar mitra')
  return (
    <SettingsCard title="Diskon dasar mitra" desc="Mitra Apique Management selalu mendapat minimal diskon ini, apa pun tiernya.">
      <Field label="Diskon dasar (%)" htmlFor="mitra-floor">
        <NumInput id="mitra-floor" value={d.draft} min={0} max={100} className="h-10 w-32" onChange={n => d.setDraft(n)} />
      </Field>
      <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
    </SettingsCard>
  )
}

function RulesCard() {
  const d = useDraft('rules', 'Aturan poin')
  return (
    <SettingsCard title="Aturan poin" desc="Konversi belanja → poin → rupiah, minimum tukar, dan kedaluwarsa.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="1 poin per belanja (Rp)" htmlFor="rule-earn" hint={`Rp${d.draft.earnPerRp.toLocaleString('id-ID')} = 1 poin`}><NumInput id="rule-earn" value={d.draft.earnPerRp} className="h-10" onChange={n => d.patch({ earnPerRp: n })} /></Field>
        <Field label="Nilai 1 poin (Rp)" htmlFor="rule-value"><NumInput id="rule-value" value={d.draft.poinToRp} className="h-10" onChange={n => d.patch({ poinToRp: n })} /></Field>
        <Field label="Minimum penukaran (poin)" htmlFor="rule-min"><NumInput id="rule-min" value={d.draft.minRedeem} className="h-10" onChange={n => d.patch({ minRedeem: n })} /></Field>
        <Field label="Kedaluwarsa poin" htmlFor="rule-exp" hint="Teks bebas, tampil di profil."><Input id="rule-exp" value={d.draft.expiry} className="h-10 text-[14px]" onChange={e => d.patch({ expiry: e.target.value })} /></Field>
      </div>
      <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
    </SettingsCard>
  )
}
