import { rupiah, fmtDate, toLocalInput, fromLocalInput } from '@/lib/format'
import { displayPhone } from '@/model/phone'
import { useOrders, klasemen } from '@/store/orders'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { EmptyState, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { useDraft } from '../useDraft'
import { CheckRow, NumInput, PageHead, SaveBar, SettingsCard } from '../parts'

export function KampanyeSection() {
  const camp = useDraft('campaign', 'Kampanye')
  const kl = useDraft('klasemen', 'Klasemen')
  const match = useDraft('matching', 'Pencocokan akun')
  const pw = useDraft('password', 'Kata sandi')
  const orders = useOrders(s => s.orders)
  const rows = klasemen(orders, camp.draft.start, camp.draft.end, kl.draft.showPic)
  const shown = rows.slice(0, Math.max(1, kl.draft.topN))
  const badRange = new Date(camp.draft.start).getTime() > new Date(camp.draft.end).getTime()

  return (
    <div data-admin-section="kampanye" className="space-y-4">
      <PageHead title="Kampanye & Klasemen" sub="Periode Golden Privilege, tampilan peringkat, dan parameter pencocokan akun." />

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsCard title="Periode kampanye" desc="Tanggal + jam (zona waktu perangkat, disimpan dengan offset, mis. +07:00). Klasemen hanya menghitung pesanan Lunas di dalam periode ini; hitung mundur di landing berhenti tepat di jam selesai.">
          <div className="grid gap-4">
            <Field label="Label kampanye" htmlFor="camp-label"><Input id="camp-label" value={camp.draft.label} className="h-10 text-[14px]" onChange={e => camp.patch({ label: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mulai" htmlFor="camp-start"><Input id="camp-start" type="datetime-local" step={1} value={toLocalInput(camp.draft.start)} className="h-10 text-[14px]" onChange={e => { const v = fromLocalInput(e.target.value); if (v) camp.patch({ start: v }) }} /></Field>
              <Field label="Selesai" htmlFor="camp-end" error={badRange ? 'Tanggal selesai mendahului tanggal mulai' : undefined}><Input id="camp-end" type="datetime-local" step={1} value={toLocalInput(camp.draft.end)} aria-invalid={badRange || undefined} className="h-10 text-[14px]" onChange={e => { const v = fromLocalInput(e.target.value); if (v) camp.patch({ end: v }) }} /></Field>
            </div>
          </div>
          <SaveBar dirty={camp.dirty} disabled={badRange} onSave={() => camp.save()} onReset={camp.reset} />
        </SettingsCard>

        <SettingsCard title="Tampilan klasemen" desc="Berapa baris peringkat yang tampil di landing page.">
          <div className="grid gap-4">
            <Field label="Jumlah teratas (top N)" htmlFor="kl-topn"><NumInput id="kl-topn" value={kl.draft.topN} min={1} className="h-10 w-32" onChange={n => kl.patch({ topN: Math.max(1, n) })} /></Field>
            <CheckRow id="kl-pic" checked={kl.draft.showPic} onChange={v => kl.patch({ showPic: v })} label="Tampilkan nama PIC" hint="Label publik: Laundry - PIC (0812****247). Jika mati: Laundry (0812****247). Nomor HP selalu disamarkan." />
          </div>
          <SaveBar dirty={kl.dirty} onSave={() => kl.save()} onReset={kl.reset} />
        </SettingsCard>
      </div>

      <SettingsCard title="Pratinjau klasemen" desc={`Dihitung langsung dari transaksi Lunas ${fmtDate(camp.draft.start, true)} s.d. ${fmtDate(camp.draft.end, true)}${camp.dirty ? ' (periode draf, belum disimpan)' : ''}.`}>
        {shown.length === 0 ? (
          <EmptyState title="Belum ada transaksi Lunas di periode ini" desc="Verifikasi pesanan di menu Transaksi agar peringkat terisi." />
        ) : (
          <Table>
            <THead><TR><TH className="w-12">#</TH><TH>Laundry</TH>{kl.draft.showPic && <TH>PIC</TH>}<TH>HP</TH><TH>Label publik</TH><TH className="text-right">Pesanan</TH><TH className="text-right">Belanja</TH></TR></THead>
            <TBody>
              {shown.map(r => (
                <TR key={r.key}>
                  <TD className="t-num font-bold">{r.rank <= 3 ? <Badge variant="gold">{r.rank}</Badge> : r.rank}</TD>
                  <TD className="font-semibold">{r.laundry}</TD>
                  {kl.draft.showPic && <TD>{r.pic}</TD>}
                  <TD className="t-num text-ink-3">{displayPhone(r.phone)}</TD>
                  <TD className="t-num text-ink-3">{r.label}</TD>
                  <TD className="t-num text-right">{r.orders}</TD>
                  <TD className="t-num text-right font-bold text-navy-700">{rupiah(r.spend)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
        {rows.length > shown.length && <p className="mt-2 text-[12px] text-ink-3">{rows.length - shown.length} peserta lain di luar top {kl.draft.topN}.</p>}
      </SettingsCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingsCard title="Pencocokan akun" desc="Ambang kemiripan nama laundry/PIC saat pendaftaran tanpa RSL (jalur 3).">
          <Field label="Ambang fuzzy" htmlFor="match-th" hint={`${Math.round(match.draft.fuzzyThreshold * 100)}%, di bawah ini akun jadi lead, di atasnya masuk antrean Klaim Akun.`}>
            <div className="flex items-center gap-3">
              <input id="match-th" type="range" min={0.5} max={0.95} step={0.05} value={match.draft.fuzzyThreshold} className="h-2 flex-1 cursor-pointer accent-navy-500" onChange={e => match.patch({ fuzzyThreshold: Number(e.target.value) })} />
              <NumInput value={match.draft.fuzzyThreshold} step={0.05} min={0.5} max={0.95} aria-label="Ambang fuzzy" className="h-10 w-24" onChange={n => match.patch({ fuzzyThreshold: Math.min(0.95, Math.max(0.5, n)) })} />
            </div>
          </Field>
          <SaveBar dirty={match.dirty} onSave={() => match.save()} onReset={match.reset} />
        </SettingsCard>

        <SettingsCard title="Kata sandi" desc="Berlaku untuk kata sandi baru saat pendaftaran dan ganti sandi.">
          <Field label="Panjang minimum" htmlFor="pw-min"><NumInput id="pw-min" value={pw.draft.minLength} min={4} className="h-10 w-32" onChange={n => pw.patch({ minLength: Math.max(4, n) })} /></Field>
          <SaveBar dirty={pw.dirty} onSave={() => pw.save()} onReset={pw.reset} />
        </SettingsCard>
      </div>
    </div>
  )
}
