

export const MAX_PROOF_BYTES = 10 * 1024 * 1024

export const PROOF_ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

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

export function loadImage(src: string, crossOrigin = false) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => res(img)
    img.onerror = () => rej(new Error('Gagal memuat gambar'))
    img.src = src
  })
}

/** Images above 300 KB are downscaled to ≤1200px (JPEG) before they land in localStorage. */
export async function proofToDataUrl(file: File): Promise<string> {
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
