import * as React from 'react'
import { ImageIcon, RotateCcw, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MAX_EDGE = 800
const MAX_BYTES = 300 * 1024

/** Read a File → dataURL, downscaled to ≤ 800px on the long edge (localStorage quota guard). */
export async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(file) })
  if (file.type === 'image/svg+xml') return raw
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gambar tidak terbaca')); i.src = raw })
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
  if (scale === 1 && dataUrlBytes(raw) <= MAX_BYTES) return raw
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
  c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
  const png = file.type === 'image/png' && dataUrlBytes(raw) <= MAX_BYTES * 2
  return png ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.86)
}

export const dataUrlBytes = (s: string) => Math.round((s.length - (s.indexOf(',') + 1)) * 0.75)

interface Props {
  value: string
  onChange: (v: string) => void
  /** path restored by "Pakai bawaan" (omit to hide the button) */
  defaultValue?: string
  label?: string
  hint?: string
  /** small thumbnail + stacked controls (table cells) */
  compact?: boolean
  id?: string
  className?: string
}

/** Image picker: preview + file upload (downscaled dataURL) + manual URL/path + restore default. */
export function ImageField({ value, onChange, defaultValue, label, hint, compact, id, className }: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const uid = React.useId()
  const inputId = id || `img-${uid}`
  const [busy, setBusy] = React.useState(false)

  const pick = async (f: File | undefined) => {
    if (!f) return
    if (!f.type.startsWith('image/')) { toast.error('Pilih berkas gambar (PNG/JPG/SVG/WebP)'); return }
    setBusy(true)
    try {
      const url = await fileToDataUrl(f)
      const kb = Math.round(dataUrlBytes(url) / 1024)
      if (dataUrlBytes(url) > MAX_BYTES) { toast.error(`Gambar masih ${kb} KB setelah diperkecil, maksimum 300 KB. Gunakan gambar yang lebih ringan.`); return }
      onChange(url)
      toast.success(`Gambar dimuat (${kb} KB)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membaca gambar')
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const isData = value.startsWith('data:')
  const preview = (
    <div className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-surface-2', compact ? 'h-12 w-12' : 'h-24 w-24')}>
      {value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <ImageIcon className={cn('text-ink-4', compact ? 'h-5 w-5' : 'h-7 w-7')} strokeWidth={1.6} />}
    </div>
  )

  return (
    <div className={cn('stack-y-1.5', className)}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className={cn('flex gap-3', compact ? 'items-center' : 'items-start')}>
        {preview}
        <div className="min-w-0 flex-1 stack-y-2">
          <Input
            id={inputId} value={isData ? '(gambar unggahan)' : value} readOnly={isData} placeholder="/img/nama-gambar.jpg atau https://…"
            className={cn(compact ? 'h-9 text-[13px]' : 'h-10 text-[14px]', isData && 'text-ink-3')}
            onChange={e => onChange(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden onChange={e => pick(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}><Upload strokeWidth={1.6} />{busy ? 'Memproses…' : 'Pilih gambar'}</Button>
            {defaultValue !== undefined && value !== defaultValue && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(defaultValue)}><RotateCcw strokeWidth={1.6} />Pakai bawaan</Button>
            )}
            {isData && !compact && <span className="text-[12px] text-ink-3">{Math.round(dataUrlBytes(value) / 1024)} KB · tersimpan di browser</span>}
          </div>
          {hint && !compact && <p className="text-[12px] text-ink-3">{hint}</p>}
        </div>
      </div>
    </div>
  )
}
