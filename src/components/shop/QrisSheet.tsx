import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, Clock, CheckCircle2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { rupiah, mmss } from '@/lib/format'
import { useConfig } from '@/store/config'
import { useOrders } from '@/store/orders'
import type { Order } from '@/model/types'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const MAX_PROOF_BYTES = 10 * 1024 * 1024
const PROOF_ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
const DOWNSCALE_ABOVE = 300 * 1024
const DOWNSCALE_MAX_PX = 1200
/** PDF proofs keep only the file name; the thumbnail slot gets this tiny placeholder. */
const PDF_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="14" fill="#F4F6F8"/><text x="48" y="56" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="700" fill="#445050">PDF</text></svg>')

function readAsDataUrl(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = () => rej(new Error('Gagal membaca file'))
    r.readAsDataURL(file)
  })
}
function loadImage(src: string, crossOrigin = false) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = () => rej(new Error('Gagal memuat gambar'))
    img.src = src
  })
}
/** Images above 300 KB are downscaled to ≤1200px (JPEG) before they land in localStorage. */
async function proofToDataUrl(file: File): Promise<string> {
  if (file.type === 'application/pdf') return PDF_PLACEHOLDER
  const raw = await readAsDataUrl(file)
  if (file.size <= DOWNSCALE_ABOVE) return raw
  const img = await loadImage(raw)
  const scale = Math.min(1, DOWNSCALE_MAX_PX / Math.max(img.naturalWidth, img.naturalHeight, 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return raw
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

/**
 * QRIS payment sheet, shared by Checkout (right after an order is created) and OrderStatus (re-open while
 * still "Menunggu Pembayaran"). Reads the live order from the store so status/expiry changes propagate.
 */
export function QrisSheet({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (open: boolean) => void }) {
  const nav = useNavigate()
  const cfg = useConfig(s => s.config)
  const live = useOrders(s => s.orders.find(o => o.id === order.id)) || order
  const uploadProof = useOrders(s => s.uploadProof)

  const [now, setNow] = React.useState(() => Date.now())
  const [openedAt, setOpenedAt] = React.useState<number | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [thanks, setThanks] = React.useState<{ fileName: string } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const expiredFired = React.useRef(false)

  // 1s tick while the sheet is open (drives both the QR countdown and the upload-delay countdown).
  React.useEffect(() => {
    if (!open) return
    setNow(Date.now())
    setOpenedAt(Date.now())
    expiredFired.current = false
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [open])

  const expiresMs = Date.parse(live.expiresAt)
  const remainingSec = Number.isFinite(expiresMs) ? Math.max(0, Math.ceil((expiresMs - now) / 1000)) : 0
  const waiting = live.status === 'AWAITING_PAYMENT'
  const expired = live.status === 'EXPIRED' || (waiting && remainingSec <= 0)
  const uploaded = live.status !== 'AWAITING_PAYMENT' && live.status !== 'EXPIRED'
  const waitLeft = openedAt === null ? cfg.payment.uploadDelaySec : Math.max(0, cfg.payment.uploadDelaySec - Math.floor((now - openedAt) / 1000))
  // staging: proof is still accepted after expiry (late transfer → manual verification by staff)
  const lateWindow = expired && live.status !== 'PROOF_UPLOADED' && live.status !== 'PAID' && live.status !== 'REJECTED' && live.status !== 'CANCELLED'
  const canUpload = (waiting || lateWindow) && waitLeft === 0 && !busy

  // Countdown hit zero → flip the order to Kedaluwarsa in the store (same rule Shell runs every 15s).
  React.useEffect(() => {
    if (open && waiting && remainingSec <= 0 && !expiredFired.current) {
      expiredFired.current = true
      useOrders.getState().expireStale()
    }
  }, [open, waiting, remainingSec])

  async function downloadQr() {
    try {
      const img = await loadImage(cfg.assets.qrisImage, true)
      const size = 720, pad = 56, foot = 220
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size + foot
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas tidak tersedia di browser ini')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, pad, pad, size - pad * 2, size - pad * 2)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1E2A2A'
      ctx.font = '800 44px "Plus Jakarta Sans", "Helvetica Neue", Helvetica, sans-serif'
      ctx.fillText(rupiah(live.total), size / 2, size + 52)
      ctx.fillStyle = '#445050'
      ctx.font = '600 22px "Plus Jakarta Sans", "Helvetica Neue", Helvetica, sans-serif'
      ctx.fillText(cfg.payment.qrisMerchant, size / 2, size + 100)
      ctx.fillStyle = '#6F7878'
      ctx.font = '600 24px "Plus Jakarta Sans", "Helvetica Neue", Helvetica, sans-serif'
      ctx.fillText(live.id, size / 2, size + 150)
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'))
      if (!blob) throw new Error('Gagal membuat gambar QR')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qris-${live.id}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1500)
      toast.success('QR diunduh')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal mengunduh QR')
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_PROOF_BYTES) return toast.error('File melebihi batas 10MB')
    if (!PROOF_ALLOWED.includes(file.type)) return toast.error('Tipe file tidak diizinkan (PNG, JPEG, WEBP, atau PDF)')
    setBusy(true)
    try {
      const dataUrl = await proofToDataUrl(file)
      const row = uploadProof(live.id, { name: file.name, type: file.type, dataUrl })
      if (!row) throw new Error('Pesanan tidak ditemukan')
      setThanks({ fileName: file.name })
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunggah bukti')
    } finally {
      setBusy(false)
    }
  }

  function go(to: string) {
    setThanks(null)
    onOpenChange(false)
    nav(to)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="sm:bottom-4 sm:mx-auto sm:max-w-md sm:rounded-xl">
          <SheetHeader>
            <SheetTitle>Bayar dengan QRIS</SheetTitle>
            <SheetDescription>Pesanan <span className="t-code text-ink-2">{live.id}</span> · scan dengan aplikasi bank / e-wallet apa pun.</SheetDescription>
          </SheetHeader>

          {/* Double-bezel QR frame, one of two premium objects in DESIGN-RMC §3 */}
          <div className="mx-auto mt-5 w-full max-w-[320px]">
            <div className={cn('rounded-xl bg-black/5 p-1.5 ring-1 ring-black/5 transition-opacity duration-slow', expired && 'opacity-40 grayscale')}>
              <div className="rounded-xl bg-white p-4 shadow-1">
                <img src={cfg.assets.qrisImage} alt={`QRIS ${cfg.payment.qrisMerchant}`} width={1135} height={1600} className="mx-auto aspect-[1135/1600] max-h-[62vh] w-auto rounded-lg object-contain" draggable={false} />
                <div className="mt-3 text-center">
                  <p className="text-[13px] font-bold text-ink">{cfg.payment.qrisMerchant}</p>
                  <p className="mt-0.5 t-code text-[11px] tracking-wide text-ink-3">NMID {cfg.payment.qrisNmid}</p>
                  <p className="mt-1.5 text-[11px] leading-snug text-ink-3">QR ini tanpa nominal. Ketik sendiri jumlahnya sesuai total di bawah.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="t-eyebrow">Total pembayaran</p>
            <p className="t-code mt-1 text-[34px] font-extrabold leading-none tracking-tight text-ink">{rupiah(live.total)}</p>
            {expired ? (
              <p data-qr-countdown className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-danger-50 px-3 py-1 text-[13px] font-bold text-danger">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.6} /> QR kedaluwarsa
              </p>
            ) : uploaded ? (
              <p data-qr-countdown className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ok-50 px-3 py-1 text-[13px] font-bold text-ok">
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.6} /> Bukti sudah diunggah
              </p>
            ) : (
              <p data-qr-countdown className={cn('t-code mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold', remainingSec <= 60 ? 'bg-danger-50 text-danger' : 'bg-navy-50 text-navy-700')}>
                <Clock className="h-3.5 w-3.5" strokeWidth={1.6} /> QR berlaku {mmss(remainingSec)}
              </p>
            )}
          </div>

          {expired && !lateWindow ? (
            <div className="mt-6 space-y-3">
              <p className="text-center text-[13px] leading-relaxed text-ink-3">Batas waktu pembayaran habis dan pesanan ini ditutup. Buat pesanan baru untuk mendapatkan QR yang baru.</p>
              <Button size="xl" variant="gold" className="w-full" onClick={() => go('/#golden-sale')}>Buat pesanan baru</Button>
            </div>
          ) : lateWindow ? (
            <div className="mt-6 space-y-3">
              <p data-late-proof className="text-center text-[13px] leading-relaxed text-ink-3">Batas waktu pembayaran sudah lewat. Kalau kamu sudah terlanjur membayar, unggah buktinya di sini — admin Resique memverifikasinya secara manual. Kalau belum, buat pesanan baru.</p>
              <Button data-upload-btn size="xl" variant="outline" className="w-full" disabled={!canUpload} onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" strokeWidth={1.6} />{busy ? 'Memproses…' : 'Unggah bukti (terlambat)'}</Button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" tabIndex={-1} onChange={onFile} aria-hidden />
              <Button size="xl" variant="gold" className="w-full" onClick={() => go('/#golden-sale')}>Buat pesanan baru</Button>
            </div>
          ) : uploaded ? (
            <div className="mt-6 space-y-3">
              <p className="text-center text-[13px] leading-relaxed text-ink-3">Admin Resique akan memverifikasi bukti pembayaranmu. Status pesanan bisa dicek kapan saja.</p>
              <Button size="xl" className="w-full" onClick={() => go('/order/' + live.id)}>Lihat status pesanan</Button>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <Button size="xl" variant="outline" className="w-full" onClick={downloadQr}>
                <Download className="h-4 w-4" strokeWidth={1.6} /> Unduh QR
              </Button>
              <div>
                <p className="mb-2 text-center text-[13px] font-semibold text-ink-2">Setelah bayar, unggah bukti</p>
                <Button data-upload-btn size="xl" variant="gold" className="w-full" disabled={!canUpload} onClick={() => fileRef.current?.click()} aria-describedby="upload-hint">
                  <Upload className="h-4 w-4" strokeWidth={1.6} />
                  {busy ? 'Memproses…' : waitLeft > 0 ? <>Unggah bukti pembayaran <span className="t-code text-[12px] font-bold opacity-70">· Aktif dalam {waitLeft} dtk</span></> : 'Unggah bukti pembayaran'}
                </Button>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="sr-only" tabIndex={-1} onChange={onFile} aria-hidden />
                <p id="upload-hint" className="mt-2 text-center text-[12px] text-ink-4">PNG, JPEG, WEBP, atau PDF, maks. 10 MB. Admin Resique cek buktinya setelah diunggah.</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!thanks} onOpenChange={o => { if (!o) setThanks(null) }}>
        <DialogContent data-thanks className="max-w-md">
          <DialogHeader>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-ok-50 text-ok"><CheckCircle2 className="h-6 w-6" strokeWidth={1.6} /></span>
            <DialogTitle className="pt-2">Terima kasih, {live.buyer.name}!</DialogTitle>
            <DialogDescription>
              Bukti pembayaran <span className="inline-flex items-center gap-1 font-semibold text-ink-2"><FileText className="h-3.5 w-3.5" strokeWidth={1.6} />{thanks?.fileName}</span> diterima. Admin Resique akan memverifikasi; status pesanan <span className="t-code text-ink-2">{live.id}</span> bisa dicek kapan saja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="lg" className="" onClick={() => go('/')}>Kembali ke beranda</Button>
            <Button size="lg" className="" onClick={() => go('/order/' + live.id)}>Lihat status pesanan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
