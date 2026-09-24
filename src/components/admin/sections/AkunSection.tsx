import * as React from 'react'
import { toast } from 'sonner'
import { Ban, Copy, Download, Link2, Plus, X } from 'lucide-react'
import type { Account } from '@/model/types'
import { fmtDate } from '@/lib/format'
import { displayPhone } from '@/model/phone'
import { downloadXLSX } from '@/lib/xlsx'
import { useAccounts } from '@/store/accounts'
import { useCrm, inviteStatus, inviteUrl, maskPosCode } from '@/store/crm'
import { useAdminAccess } from '../access'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { EmptyState, Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { PageHead, SettingsCard } from '../parts'

const LINK: Record<Account['link'], { label: string; variant: BadgeProps['variant'] }> = {
  LINKED: { label: 'Terhubung', variant: 'ok' },
  PENDING: { label: 'Menunggu klaim', variant: 'warn' },
  NEW_CUSTOMER: { label: 'Pelanggan baru', variant: 'info' },
  LEAD: { label: 'Lead', variant: 'muted' },
  UNLINKED: { label: 'Dilepas', variant: 'muted' },
}
const PATH: Record<Account['matchPath'], string> = { 0: 'Undangan', 1: 'HP cocok', 2: 'RSL + nama', 3: 'Nama mirip', 4: 'Tidak cocok' }
const INVITE_STATUS: Record<ReturnType<typeof inviteStatus>, { label: string; variant: BadgeProps['variant'] }> = {
  active: { label: 'Aktif', variant: 'ok' }, used: { label: 'Dipakai', variant: 'info' }, revoked: { label: 'Dicabut', variant: 'muted' }, expired: { label: 'Kedaluwarsa', variant: 'warn' },
}

export function AkunSection() {
  const accounts = useAccounts(s => s.accounts)
  const audit = useCrm(s => s.audit)
  const latest = audit.slice(0, 100)

  return (
    <div data-admin-section="akun" className="space-y-4">
      <PageHead title="Akun & Undangan" sub="Akun RMC Web yang terdaftar, undangan pendaftaran untuk pelanggan RMC yang belum punya akun, dan jejak audit sisi CRM (100 terbaru)." />

      <InviteCard />

      <SettingsCard title="Akun terdaftar" desc={`${accounts.length} akun · ${accounts.filter(a => a.link === 'LINKED').length} terhubung ke pelanggan CRM.`} bodyClassName="p-0">
        {accounts.length === 0 ? <div className="p-5"><EmptyState title="Belum ada akun" desc="Daftar lewat halaman Daftar di situs untuk mengisi tabel ini." /></div> : (
          <Table>
            <THead><TR><TH className="pl-5">Laundry</TH><TH>PIC</TH><TH>HP</TH><TH>Email</TH><TH>Kota</TH><TH>Status</TH><TH>Jalur</TH><TH className="pr-5">Dibuat</TH></TR></THead>
            <TBody>
              {accounts.map(a => (
                <TR key={a.id}>
                  <TD className="pl-5"><span className="font-semibold">{a.laundry}</span>{a.rsl && <span className="block t-code text-[11px] text-ink-3">{a.rsl}</span>}</TD>
                  <TD>{a.pic}</TD>
                  <TD className="t-num whitespace-nowrap">{displayPhone(a.phone)}</TD>
                  <TD className="text-ink-3">{a.email}</TD>
                  <TD>{a.kota}</TD>
                  <TD><Badge variant={LINK[a.link].variant}>{LINK[a.link].label}</Badge>{a.crmCustomerId && <span className="block t-code text-[11px] text-ink-3">{a.crmCustomerId}</span>}</TD>
                  <TD className="text-ink-2">{a.matchPath} · {PATH[a.matchPath]}{a.matchScore != null && a.matchPath === 3 ? ` (${Math.round(a.matchScore * 100)}%)` : ''}</TD>
                  <TD className="whitespace-nowrap pr-5 text-ink-3">{fmtDate(a.createdAt, true)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </SettingsCard>

      <SettingsCard title="Jejak audit" desc={`${audit.length} entri · menampilkan ${latest.length} terbaru.`} bodyClassName="p-0">
        {latest.length === 0 ? <div className="p-5"><EmptyState title="Belum ada aktivitas" desc="Pendaftaran, pesanan, dan verifikasi tercatat di sini." /></div> : (
          <ol className="divide-y divide-line-2">
            {latest.map(r => (
              <li key={r.id} className="grid gap-x-4 gap-y-0.5 px-5 py-2.5 text-[13px] sm:grid-cols-[150px_1fr]">
                <time className="t-num whitespace-nowrap text-[12px] text-ink-3" dateTime={r.t}>{fmtDate(r.t, true)}</time>
                <div className="min-w-0"><p className="font-semibold text-ink">{r.event}</p><p className="truncate text-[12px] text-ink-3">{r.meta}</p></div>
              </li>
            ))}
          </ol>
        )}
      </SettingsCard>
    </div>
  )
}

/* R.052 — "Generate Undangan" (staging CRM → RMC → Loyalty → Akun Member): pick RMC customers that have no account yet,
   generate one link per customer (valid 90 days, single use), copy it or export the batch as xlsx. */
function InviteCard() {
  const { canEdit } = useAdminAccess()
  const customers = useCrm(s => s.customers)
  const invites = useCrm(s => s.invites)
  const accounts = useAccounts(s => s.accounts)
  const generate = useCrm(s => s.generateInvites)
  const revoke = useCrm(s => s.revokeInvite)
  const [picked, setPicked] = React.useState<string[]>([])
  const [q, setQ] = React.useState('')
  const [last, setLast] = React.useState<string[]>([])
  const hasAccount = (cid: string) => accounts.some(a => a.crmCustomerId === cid && (a.link === 'LINKED' || a.link === 'NEW_CUSTOMER'))
  const hasActiveInvite = (cid: string) => invites.some(i => i.customerId === cid && inviteStatus(i) === 'active')
  const candidates = customers.filter(c => !hasAccount(c.id) && !picked.includes(c.id) && (!q || `${c.outlet} ${c.pic} ${c.rsl || ''} ${c.kota}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 8)
  const cust = (id: string) => customers.find(c => c.id === id)
  const onGenerate = () => {
    if (!picked.length) return toast.warning('Pilih minimal satu pelanggan.')
    const rows = generate(picked)
    if (!rows.length) { toast.warning('Tidak ada undangan dibuat. Semua kandidat sudah punya akun atau undangan aktif.'); return }
    setLast(rows.map(r => r.id)); setPicked([])
    toast.success(`${rows.length} undangan berhasil dibuat.`)
  }
  const copy = async (url: string) => { try { await navigator.clipboard.writeText(url); toast.success('Link undangan disalin.') } catch { toast.error('Gagal menyalin, salin manual.') } }
  const exportXlsx = () => {
    const rows = invites.filter(i => last.length ? last.includes(i.id) : true)
    if (!rows.length) return toast.error('Tidak ada undangan untuk diexport.')
    downloadXLSX(`rmc-invites-export-${new Date().toISOString().slice(0, 10)}.xlsx`, ['Outlet', 'PIC', 'Kota', 'Nomor Member Card', 'Link undangan', 'Status', 'Berlaku sampai', 'Dibuat'],
      rows.map(i => { const c = cust(i.customerId); return [c?.outlet || '', c?.pic || '', c?.kota || '', c?.rsl || '', inviteUrl(i.token), INVITE_STATUS[inviteStatus(i)].label, fmtDate(i.expiresAt), fmtDate(i.createdAt, true)] }), 'Invites')
    toast.success(`${rows.length} baris diexport.`)
  }
  return (
    <SettingsCard title="Undangan pendaftaran" desc="Untuk pelanggan RMC yang belum punya akun: satu link per pelanggan, berlaku 90 hari, sekali pakai. Pelanggan membuka link, mengisi PIC / HP / e-mail / kata sandi, dan akunnya langsung terhubung." actions={<Button type="button" variant="outline" size="sm" onClick={exportXlsx} disabled={invites.length === 0}><Download strokeWidth={1.6} />Export xlsx</Button>}>
      <div data-invite-generate className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari pelanggan: outlet, PIC, nomor kartu, kota" aria-label="Cari pelanggan" className="flex-1" disabled={!canEdit} />
          <Button type="button" size="sm" onClick={onGenerate} disabled={!canEdit || picked.length === 0}><Plus strokeWidth={1.6} />Generate undangan ({picked.length})</Button>
        </div>
        {q && (
          <ul className="divide-y divide-line-2 rounded-lg border border-line">
            {candidates.map(c => (
              <li key={c.id}>
                <button type="button" onClick={() => { setPicked(p => [...p, c.id]); setQ('') }} className="slide flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] hover:text-navy-700">
                  <span><span className="font-semibold text-ink">{c.outlet}</span> · {c.pic}<span className="ml-2 text-ink-3">{c.kota}{c.rsl ? ` · ${c.rsl}` : ''}</span></span>
                  {hasActiveInvite(c.id) && <Badge variant="warn">Sudah ada undangan aktif</Badge>}
                </button>
              </li>
            ))}
            {candidates.length === 0 && <li className="px-3 py-3 text-[13px] text-ink-3">Tidak ada pelanggan yang cocok (yang sudah punya akun tidak ditampilkan).</li>}
          </ul>
        )}
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {picked.map(id => { const c = cust(id); return <span key={id} className="inline-flex items-center gap-1 rounded-full bg-surface-2 py-1 pl-2.5 pr-1.5 text-[12px] text-ink-2">{c?.outlet}<button type="button" onClick={() => setPicked(p => p.filter(x => x !== id))} aria-label={`Hapus ${c?.outlet}`} className="rounded-full p-0.5 hover:text-danger"><X className="h-3 w-3" /></button></span> })}
          </div>
        )}
        {invites.length > 0 && (
          <Table className="min-w-[860px]">
            <THead><TR><TH>Outlet</TH><TH>Kota</TH><TH>Kartu</TH><TH>Link</TH><TH>Status</TH><TH>Berlaku sampai</TH><TH /></TR></THead>
            <TBody>
              {invites.map(i => { const c = cust(i.customerId); const st = inviteStatus(i); return (
                <TR key={i.id} data-invite-row data-status={st}>
                  <TD className="font-semibold">{c?.outlet}</TD>
                  <TD>{c?.kota}</TD>
                  <TD className="t-code">{c?.rsl ? maskPosCode(c.rsl) : '-'}</TD>
                  <TD><span className="inline-flex items-center gap-1 text-[12px] text-ink-3"><Link2 className="h-3.5 w-3.5" strokeWidth={1.6} />…register?invite={i.token.slice(0, 8)}…</span></TD>
                  <TD><Badge variant={INVITE_STATUS[st].variant}>{INVITE_STATUS[st].label}</Badge></TD>
                  <TD className="t-num whitespace-nowrap text-ink-3">{fmtDate(i.expiresAt)}</TD>
                  <TD className="text-right">
                    <div className="inline-flex items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => copy(inviteUrl(i.token))} disabled={st !== 'active'}><Copy className="h-4 w-4" strokeWidth={1.6} />Salin</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => { revoke(i.id); toast('Undangan dicabut') }} disabled={!canEdit || st !== 'active'}><Ban className="h-4 w-4" strokeWidth={1.6} />Cabut</Button>
                    </div>
                  </TD>
                </TR>
              ) })}
            </TBody>
          </Table>
        )}
      </div>
    </SettingsCard>
  )
}
