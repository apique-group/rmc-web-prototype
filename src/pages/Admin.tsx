import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { Eye, ShieldAlert } from 'lucide-react'
import { useConfig } from '@/store/config'
import { useCrm } from '@/store/crm'
import { useOrders } from '@/store/orders'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminShell, isAdminSection, type AdminSectionId } from '@/components/admin/AdminShell'
import { AdminAccessContext } from '@/components/admin/access'
import { EDIT_CAPABILITY, parseActor } from '@/model/access'
import { KontenSection } from '@/components/admin/sections/KontenSection'
import { AsetSection } from '@/components/admin/sections/AsetSection'
import { BenefitSection } from '@/components/admin/sections/BenefitSection'
import { KampanyeSection } from '@/components/admin/sections/KampanyeSection'
import { HadiahSection } from '@/components/admin/sections/HadiahSection'
import { ItemsSection } from '@/components/admin/sections/ItemsSection'
import { PaketSection } from '@/components/admin/sections/PaketSection'
import { PembayaranSection } from '@/components/admin/sections/PembayaranSection'
import { TransaksiSection } from '@/components/admin/sections/TransaksiSection'
import { KlaimSection } from '@/components/admin/sections/KlaimSection'
import { AkunSection } from '@/components/admin/sections/AkunSection'
import { ResetSection } from '@/components/admin/sections/ResetSection'

const SECTIONS: Record<AdminSectionId, React.ComponentType> = {
  konten: KontenSection, aset: AsetSection, benefit: BenefitSection,
  kampanye: KampanyeSection, hadiah: HadiahSection, items: ItemsSection, paket: PaketSection,
  pembayaran: PembayaranSection, transaksi: TransaksiSection, klaim: KlaimSection,
  akun: AkunSection, reset: ResetSection,
}
/* Form-only sections are wrapped in <fieldset disabled> when read-only; the operational ones keep their
   filters/rows usable and guard each mutating control explicitly (Verifikasi, Setujui, import, reset). */
const FORM_SECTIONS: AdminSectionId[] = ['konten', 'aset', 'benefit', 'kampanye', 'hadiah', 'items', 'paket', 'pembayaran']

const CRM_URL = 'https://crm-apique.vercel.app'

/* `#/admin?embed=1&tab=…&actor=…&role=…&level=…&caps=…` is what the CRM (Member Card (RMC) → Golden Privilege)
   iframes (R.014). No passcode: rights come from the Role Access Matrix sub-module level + capability
   manage_config, exactly the two axes production UM exposes via /me/permissions. Outside the embed → denied. */
export function AdminPage() {
  const [params, setParams] = useSearchParams()
  const access = React.useMemo(() => parseActor(params), [params])
  const tabParam = params.get('tab')
  const tab: AdminSectionId = isAdminSection(tabParam) ? tabParam : 'konten'

  const logo = useConfig(s => s.config.assets.logo)
  const openClaims = useCrm(s => s.claims.filter(c => c.status === 'open').length)
  const pendingProofs = useOrders(s => s.orders.filter(o => o.status === 'PROOF_UPLOADED').length)

  React.useEffect(() => { document.title = 'Golden Privilege · Konfigurasi' }, [])

  const setTab = (id: AdminSectionId) => setParams(p => { const n = new URLSearchParams(p); n.set('tab', id); return n }, { replace: true })

  if (!access.allowed) return <Denied logo={logo} reason={!access.embed ? 'outside' : !access.actor ? 'anonymous' : 'none'} />

  const Section = SECTIONS[tab]
  const body = <Section key={tab} />
  return (
    <AdminAccessContext.Provider value={access}>
      <div className="min-h-dvh bg-bg">
        <div className="mx-auto w-full max-w-[1200px] px-3 pt-3 sm:px-4">
          <div data-admin-actor className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[13px]">
            <p className="min-w-0 truncate text-ink-2">
              <span className="font-semibold text-ink">{access.actor}</span>
              <span className="text-ink-3"> · {access.role || '-'} · level </span>
              <span className={access.canEdit ? 'font-semibold text-navy-700' : 'font-semibold text-warn'}>{access.level}</span>
              {access.caps.includes('super_admin') && <span className="text-ink-3"> · super_admin</span>}
            </p>
            <p className="text-[12px] text-ink-3">Hak akses: Role Access Matrix (sub-modul Golden Privilege) + capability {EDIT_CAPABILITY}, User Management</p>
          </div>
          {access.readOnly && (
            <p data-admin-readonly role="status" className="mt-2 flex items-center gap-2 rounded-lg border border-warn-100 bg-warn-50 px-3 py-2 text-[13px] text-ink">
              <Eye className="h-4 w-4 shrink-0 text-warn" strokeWidth={1.6} />
              <span><strong>Hanya lihat.</strong> Role {access.role || '-'}: {access.reason}. Perubahan tidak bisa disimpan.</span>
            </p>
          )}
        </div>
        <AdminShell active={tab} onChange={setTab} embed={access.embed} badges={{ klaim: openClaims, transaksi: pendingProofs }}>
          {access.readOnly && FORM_SECTIONS.includes(tab)
            ? <fieldset disabled aria-describedby="admin-readonly" className="min-w-0 border-0 p-0 [&_input]:opacity-70 [&_textarea]:opacity-70">{body}</fieldset>
            : body}
        </AdminShell>
      </div>
    </AdminAccessContext.Provider>
  )
}

function Denied({ logo, reason }: { logo: string; reason: 'outside' | 'anonymous' | 'none' }) {
  const text = reason === 'none'
    ? 'Role kamu punya level None untuk sub-modul Golden Privilege di Role Access Matrix. Minta admin User Management menaikkan levelnya.'
    : 'Halaman ini tidak dibuka langsung. Buka lewat CRM Resique → Member Card (RMC) → Golden Privilege; hak aksesnya mengikuti Role Access Matrix (sub-modul Golden Privilege) dan capability manage_config di User Management.'
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <Card className="w-full max-w-md" data-admin-denied>
        <CardHeader className="items-center text-center">
          <img src={logo} alt="Resique" className="mb-3 h-10 w-auto" />
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-warn" strokeWidth={1.6} />Konfigurasi Golden Privilege</CardTitle>
          <CardDescription className="text-pretty">{text}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild><a href={CRM_URL}>Buka CRM Resique</a></Button>
          <Button asChild variant="outline"><a href="#/">Kembali ke situs</a></Button>
        </CardContent>
      </Card>
    </div>
  )
}
