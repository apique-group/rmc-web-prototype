import * as React from 'react'
import { useAdminAccess } from '../access'
import { toast } from 'sonner'
import { ArrowRight, Check, UserX } from 'lucide-react'
import type { Claim } from '@/model/types'
import { fmtDate } from '@/lib/format'
import { displayPhone } from '@/model/phone'
import { useCrm } from '@/store/crm'
import { useAccounts } from '@/store/accounts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { PageHead, SettingsCard } from '../parts'

export function KlaimSection() {
  const claims = useCrm(s => s.claims)
  const leads = useCrm(s => s.leads)
  const customers = useCrm(s => s.customers)
  const open = claims.filter(c => c.status === 'open')
  const resolved = claims.filter(c => c.status !== 'open')
  const [showResolved, setShowResolved] = React.useState(false)

  return (
    <div data-admin-section="klaim" className="space-y-4">
      <PageHead title="Klaim Akun & Leads" sub="Antrean verifikasi sales (jalur 3: nama mirip, HP belum tercatat) dan lead baru dari pendaftaran mandiri." />

      <SettingsCard title="Antrean Klaim Akun" desc={open.length ? `${open.length} menunggu keputusan sales.` : 'Tidak ada klaim terbuka.'}>
        {open.length === 0 ? <EmptyState title="Antrean kosong" desc="Klaim muncul saat pendaftar cocok dengan pelanggan CRM di atas ambang fuzzy tetapi tidak bisa diverifikasi otomatis." /> : (
          <ul className="space-y-3">{open.map(c => <ClaimCard key={c.id} claim={c} />)}</ul>
        )}
        {resolved.length > 0 && (
          <div className="mt-4 border-t border-line-2 pt-3">
            <button type="button" className="text-[13px] font-semibold text-navy-600 underline-offset-2 hover:underline" aria-expanded={showResolved} onClick={() => setShowResolved(v => !v)}>
              {showResolved ? 'Sembunyikan' : 'Tampilkan'} {resolved.length} klaim selesai
            </button>
            {showResolved && (
              <Table className="mt-2">
                <THead><TR><TH>ID</TH><TH>Akun</TH><TH>Kandidat</TH><TH>Skor</TH><TH>Keputusan</TH><TH>Waktu</TH></TR></THead>
                <TBody>{resolved.map(c => <ResolvedRow key={c.id} claim={c} />)}</TBody>
              </Table>
            )}
          </div>
        )}
      </SettingsCard>

      <SettingsCard title="Leads dari Golden Privilege Web" desc={`${leads.length} lead, masuk ke CRM Resique sebagai sumber "Golden Privilege Web".`} bodyClassName="p-0">
        {leads.length === 0 ? <div className="p-5"><EmptyState title="Belum ada lead" desc="Pendaftar yang tidak cocok dengan pelanggan CRM otomatis menjadi lead." /></div> : (
          <Table>
            <THead><TR><TH className="pl-5">ID</TH><TH>Laundry</TH><TH>PIC</TH><TH>HP</TH><TH>Email</TH><TH>Kota</TH><TH>Referral</TH><TH className="pr-5">Tanggal</TH></TR></THead>
            <TBody>
              {leads.map(l => (
                <TR key={l.id}><TD className="pl-5 t-code text-[12px]">{l.id}</TD><TD className="font-semibold">{l.outlet}</TD><TD>{l.pic}</TD><TD className="t-num">{displayPhone(l.hp)}</TD><TD className="text-ink-3">{l.email}</TD><TD>{l.kota}</TD><TD className="text-ink-3">{l.referral || '-'}</TD><TD className="whitespace-nowrap pr-5 text-ink-3">{fmtDate(l.createdAt, true)}</TD></TR>
              ))}
            </TBody>
          </Table>
        )}
      </SettingsCard>

      <SettingsCard title="Pelanggan CRM (mock)" desc="Master pelanggan Resique. Nomor HP terisi otomatis setelah pendaftaran jalur 2 (RSL + nama cocok), backfill." bodyClassName="p-0">
        <Table>
          <THead><TR><TH className="pl-5">RSL</TH><TH>Outlet</TH><TH>PIC</TH><TH>HP</TH><TH>Kota</TH><TH className="pr-5">Mitra</TH></TR></THead>
          <TBody>
            {customers.map(c => (
              <TR key={c.id}>
                <TD className="pl-5 t-code text-[12px]">{c.rsl || <span className="text-ink-4">-</span>}</TD>
                <TD className="font-semibold">{c.outlet}</TD><TD>{c.pic}</TD>
                <TD className="t-num">{c.hp ? displayPhone(c.hp) : <Badge variant="muted">belum ada</Badge>}</TD>
                <TD>{c.kota}</TD>
                <TD className="pr-5">{c.mitra ? <Badge>Mitra</Badge> : <span className="text-ink-4">-</span>}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </SettingsCard>
    </div>
  )
}

function ClaimCard({ claim }: { claim: Claim }) {
  const account = useAccounts(s => s.accounts.find(a => a.id === claim.accountId))
  const customer = useCrm(s => s.customers.find(c => c.id === claim.candidateCustomerId))
  const decide = useCrm(s => s.decideClaim)
  const link = useAccounts(s => s.linkAccount)
  const unlink = useAccounts(s => s.unlinkToLead)
  const { canEdit, actor } = useAdminAccess()
  const approve = () => { if (!canEdit) return; decide(claim.id, 'approved'); link(claim.accountId, claim.candidateCustomerId); useCrm.getState().log('Klaim akun disetujui', `${claim.id} · oleh ${actor || '-'}`); toast.success(`${claim.id} disetujui, akun terhubung ke ${customer?.outlet || claim.candidateCustomerId}`) }
  const reject = () => { if (!canEdit) return; decide(claim.id, 'rejected'); unlink(claim.accountId); useCrm.getState().log('Klaim akun ditolak', `${claim.id} · oleh ${actor || '-'}`); toast.success(`${claim.id} ditolak, akun dijadikan lead`) }
  return (
    <li className="rounded-xl border border-line p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2"><span className="t-code text-[12px] text-ink-3">{claim.id}</span><Badge variant={claim.score >= 0.9 ? 'ok' : 'warn'}>skor {Math.round(claim.score * 100)}%</Badge></div>
        <span className="text-[12px] text-ink-3">{fmtDate(claim.createdAt, true)}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <Side title="Akun pendaftar" rows={[['Laundry', account?.laundry], ['PIC', account?.pic], ['HP', displayPhone(account?.phone)], ['Kota', account?.kota]]} />
        <ArrowRight className="mx-auto hidden h-5 w-5 text-ink-4 md:block" strokeWidth={1.6} />
        <Side title="Kandidat pelanggan CRM" rows={[['Outlet', customer?.outlet], ['PIC', customer?.pic], ['RSL', customer?.rsl || '-'], ['Kota', customer?.kota]]} />
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!canEdit} onClick={reject}><UserX strokeWidth={1.6} />Tolak → jadikan lead</Button>
        <Button type="button" size="sm" disabled={!canEdit} title={canEdit ? undefined : 'Hanya lihat'} onClick={approve}><Check strokeWidth={1.6} />Setujui → hubungkan</Button>
      </div>
    </li>
  )
}

function Side({ title, rows }: { title: string; rows: [string, string | undefined][] }) {
  return (
    <div className="rounded-lg bg-surface-2 px-3.5 py-3">
      <p className="mb-1.5 text-micro uppercase text-ink-3">{title}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[13px]">
        {rows.map(([k, v]) => <React.Fragment key={k}><dt className="text-ink-3">{k}</dt><dd className="font-semibold text-ink">{v || '-'}</dd></React.Fragment>)}
      </dl>
    </div>
  )
}

function ResolvedRow({ claim }: { claim: Claim }) {
  const account = useAccounts(s => s.accounts.find(a => a.id === claim.accountId))
  const customer = useCrm(s => s.customers.find(c => c.id === claim.candidateCustomerId))
  return (
    <TR>
      <TD className="t-code text-[12px]">{claim.id}</TD>
      <TD>{account?.laundry || claim.accountId}</TD>
      <TD>{customer?.outlet || claim.candidateCustomerId}</TD>
      <TD className="t-num">{Math.round(claim.score * 100)}%</TD>
      <TD><Badge variant={claim.status === 'approved' ? 'ok' : 'danger'}>{claim.status === 'approved' ? 'Disetujui' : 'REJECTED'}</Badge></TD>
      <TD className="whitespace-nowrap text-ink-3">{fmtDate(claim.decidedAt, true)}</TD>
    </TR>
  )
}
