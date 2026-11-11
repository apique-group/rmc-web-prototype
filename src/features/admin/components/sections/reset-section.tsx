import * as React from 'react'
import { useAdminAccess } from '@/features/admin/hooks/use-admin-access'
import { toast } from 'sonner'
import { AlertTriangle, Database, Receipt, Settings2 } from 'lucide-react'
import { useConfig } from '@/lib/api/mock/config'
import { useOrders } from '@/lib/api/mock/orders'
import { resetAllStores } from '@/lib/api/mock/persist'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHead } from '@/features/admin/components/page-head'
import { SettingsCard } from '@/features/admin/components/settings-card'

export function ResetSection() {
  const { canEdit } = useAdminAccess()
  const [confirmAll, setConfirmAll] = React.useState(false)
  const orders = useOrders(s => s.orders.length)

  return (
    <div data-admin-section="reset" className="stack-y-4">
      <PageHead title="Reset demo" sub="Kembalikan data prototype di browser ini. Tidak memengaruhi tab/perangkat lain kecuali berbagi localStorage yang sama." />

      <div className="grid gap-4 lg:grid-cols-3">
        <ResetCard icon={Settings2} title="Reset konfigurasi ke bawaan" desc="Copy, aset, benefit, tier, item, hadiah, pembayaran kembali ke seed. Transaksi dan akun tetap." action="Reset konfigurasi" disabled={!canEdit}
          onClick={() => { useConfig.getState().reset(); toast.success('Konfigurasi dikembalikan ke bawaan') }} />
        <ResetCard icon={Receipt} title="Reset transaksi" desc={`Ganti ${orders} pesanan saat ini dengan seed transaksi awal. Konfigurasi dan akun tetap.`} action="Reset transaksi" disabled={!canEdit}
          onClick={() => { useOrders.getState().reset(); toast.success('Transaksi dikembalikan ke seed') }} />
        <ResetCard icon={Database} title="Reset semua data demo" desc="Hapus seluruh rmcweb_* di localStorage (konfigurasi, transaksi, akun, CRM mock, inbox) lalu muat ulang halaman." action="Reset semua…" danger disabled={!canEdit}
          onClick={() => setConfirmAll(true)} />
      </div>

      <Dialog open={confirmAll} onOpenChange={setConfirmAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-danger" strokeWidth={1.6} />Hapus semua data demo?</DialogTitle>
            <DialogDescription>Semua konfigurasi, transaksi, akun, klaim, lead, dan audit di browser ini akan dihapus dan halaman dimuat ulang. Tindakan ini tidak bisa dibatalkan.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmAll(false)}>Batal</Button>
            <Button type="button" variant="destructive" size="sm" disabled={!canEdit} onClick={() => resetAllStores()}>Ya, hapus semua</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResetCard({ icon: Icon, title, desc, action, onClick, danger, disabled }: { icon: typeof Database; title: string; desc: string; action: string; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <SettingsCard title={title} desc={desc} className="flex flex-col" bodyClassName="mt-auto flex items-center justify-between gap-3">
      <Icon className={danger ? 'h-5 w-5 text-danger' : 'h-5 w-5 text-navy-600'} strokeWidth={1.6} />
      <Button type="button" variant={danger ? 'destructive' : 'outline'} size="sm" disabled={disabled} title={disabled ? 'Hanya lihat' : undefined} onClick={onClick}>{action}</Button>
    </SettingsCard>
  )
}
