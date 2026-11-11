import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/label'
import { useDraft } from '@/features/admin/hooks/use-draft'
import { CheckRow } from '@/features/admin/components/check-row'
import { NumInput } from '@/features/admin/components/num-input'
import { PageHead } from '@/features/admin/components/page-head'
import { SaveBar } from '@/features/admin/components/save-bar'
import { SettingsCard } from '@/features/admin/components/settings-card'

const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean)

export function PembayaranSection() {
  const d = useDraft('payment', 'Pembayaran')
  return (
    <div data-admin-section="pembayaran" className="stack-y-4">
      <PageHead title="Pembayaran" sub="Parameter QRIS demo dan kanal pembayaran alternatif." />

      <SettingsCard title="QRIS" desc="Prototype menampilkan QR statis; produksi memakai QRIS dinamis per pesanan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama merchant" htmlFor="pay-merchant"><Input id="pay-merchant" value={d.draft.qrisMerchant} className="h-10 text-[14px]" onChange={e => d.patch({ qrisMerchant: e.target.value })} /></Field>
          <Field label="NMID" htmlFor="pay-nmid"><Input id="pay-nmid" value={d.draft.qrisNmid} className="h-10 t-code text-[14px]" onChange={e => d.patch({ qrisNmid: e.target.value })} /></Field>
          <Field label="Batas waktu QR (detik)" htmlFor="pay-timeout" hint={`${Math.round(d.draft.qrTimeoutSec / 60)} menit, pesanan kedaluwarsa jika belum dibayar.`}><NumInput id="pay-timeout" value={d.draft.qrTimeoutSec} min={30} className="h-10" onChange={n => d.patch({ qrTimeoutSec: n })} /></Field>
          <Field label="Jeda unggah bukti (detik)" htmlFor="pay-delay" hint="Tombol unggah bukti baru aktif setelah jeda ini."><NumInput id="pay-delay" value={d.draft.uploadDelaySec} min={0} className="h-10" onChange={n => d.patch({ uploadDelaySec: n })} /></Field>
        </div>
      </SettingsCard>

      <SettingsCard title="Kanal alternatif" desc="Virtual account dan e-wallet. Daftar dipisah koma.">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="stack-y-3">
            <CheckRow id="pay-va" checked={d.draft.vaEnabled} onChange={v => d.patch({ vaEnabled: v })} label="Aktifkan Virtual Account" />
            <Field label="Bank VA" htmlFor="pay-va-banks" hint="Contoh: BCA, BNI, Mandiri, BRI"><Input id="pay-va-banks" value={d.draft.vaBanks.join(', ')} disabled={!d.draft.vaEnabled} className="h-10 text-[14px]" onChange={e => d.patch({ vaBanks: splitList(e.target.value) })} /></Field>
          </div>
          <div className="stack-y-3">
            <CheckRow id="pay-ew" checked={d.draft.ewalletEnabled} onChange={v => d.patch({ ewalletEnabled: v })} label="Aktifkan e-wallet" />
            <Field label="E-wallet" htmlFor="pay-ewallets" hint="Contoh: GoPay, ShopeePay, OVO, DANA"><Input id="pay-ewallets" value={d.draft.ewallets.join(', ')} disabled={!d.draft.ewalletEnabled} className="h-10 text-[14px]" onChange={e => d.patch({ ewallets: splitList(e.target.value) })} /></Field>
          </div>
        </div>
        <SaveBar dirty={d.dirty} onSave={() => d.save()} onReset={d.reset} />
      </SettingsCard>

    </div>
  )
}
