import * as XLSX from 'xlsx'
import type { Order, OrderStatus } from '@/model/types'
import { STATUS_LABEL, statusFromLabel } from '@/model/types'

/* Mirrors crm-apique primitives.jsx downloadXLSX (autosized columns, phone/ID forced to text)
   and the POS import idiom (crm_pages2.jsx:8331). File naming per PRD: golden-privilege-transaksi-YYYYMMDD.xlsx */

export const HEADER = ['ID Pesanan', 'Tanggal', 'Status', 'Nama Pembeli', 'Nama Laundry', 'No HP', 'Pengambilan', 'Outlet', 'Alamat', 'Metode', 'Item (kode×qty)', 'Total', 'Hemat', 'Bukti', 'Diverifikasi', 'Alasan Tolak']

export function orderToRow(o: Order): (string | number)[] {
  return [
    o.id, o.createdAt.slice(0, 19).replace('T', ' '), STATUS_LABEL[o.status], o.buyer.name, o.buyer.laundry, o.buyer.phone,
    o.fulfil.mode === 'DELIVERY' ? 'Kirim' : 'Ambil di outlet', o.fulfil.outlet || '', o.fulfil.address || '', o.payment.method,
    o.lines.map(l => `${l.code}×${l.qty}`).join('; '), o.total, o.savings, o.payment.proofName || '', o.verifiedAt ? o.verifiedAt.slice(0, 19).replace('T', ' ') : '', o.rejectReason || '',
  ]
}

export function downloadXLSX(filename: string, header: string[], rows: (string | number)[][], sheet = 'Data') {
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
  // force text on ID + phone columns so Excel keeps leading zeros / plus sign
  const textCols = header.map((h, i) => (/ID|HP|kode/i.test(h) ? i : -1)).filter(i => i >= 0)
  rows.forEach((_, r) => textCols.forEach(c => { const ref = XLSX.utils.encode_cell({ r: r + 1, c }); if (ws[ref]) { ws[ref].t = 's'; ws[ref].v = String(ws[ref].v) } }))
  ws['!cols'] = header.map((h, i) => ({ wch: Math.min(48, Math.max(h.length, ...rows.map(r => String(r[i] ?? '').length)) + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheet)
  XLSX.writeFile(wb, filename)
}

export const stamp = (d = new Date()) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`

export function exportOrders(orders: Order[]) {
  downloadXLSX(`golden-privilege-transaksi-${stamp()}.xlsx`, HEADER, orders.map(orderToRow), 'Transaksi')
}

export function downloadTemplate() {
  const sample: (string | number)[] = ['GS-20260905-9001', '2026-09-05 10:00:00', 'Lunas', 'Nama PIC', 'Nama Laundry', '+628123456789', 'Ambil di outlet', 'Jakarta', '', 'QRIS', '000004×2; 000148×1', 350000, 60000, 'bukti.jpg', '2026-09-05 12:00:00', '']
  downloadXLSX(`golden-privilege-template-import.xlsx`, HEADER, [sample], 'Template')
}

export interface ImportPreview { rows: Order[]; skipped: string[] }

/** Parse an uploaded xlsx (header row = HEADER order, matched by fuzzy header name). */
export async function parseOrdersFile(file: File, catalog: { id: string; code: string; name: string; promoPrice: number; realPrice: number }[]): Promise<ImportPreview> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const aoa = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, raw: false, defval: '' })
  if (!aoa.length) return { rows: [], skipped: ['File kosong'] }
  const head = (aoa[0] as string[]).map(h => String(h).toLowerCase())
  const col = (name: string) => head.findIndex(h => h.includes(name.toLowerCase()))
  const c = { id: col('ID'), tgl: col('Tanggal'), status: col('Status'), nama: col('Nama Pembeli'), laundry: col('Laundry'), hp: col('HP'), ambil: col('Pengambilan'), outlet: col('Outlet'), alamat: col('Alamat'), metode: col('Metode'), item: col('Item'), total: col('Total'), hemat: col('Hemat'), bukti: col('Bukti'), verif: col('Diverifikasi'), alasan: col('Alasan') }
  const rows: Order[] = [], skipped: string[] = []
  aoa.slice(1).forEach((r, i) => {
    const id = String(r[c.id] ?? '').trim()
    if (!id) { skipped.push(`Baris ${i + 2}: ID kosong`); return }
    const statusRaw = String(r[c.status] ?? 'Lunas').trim()
    const status: OrderStatus | undefined = statusFromLabel(statusRaw)
    if (!status) { skipped.push(`Baris ${i + 2}: status "${statusRaw}" tidak dikenal`); return }
    const lines = String(r[c.item] ?? '').split(';').map(s => s.trim()).filter(Boolean).map(s => {
      const [code, q] = s.split('×').length > 1 ? s.split('×') : s.split('x')
      const it = catalog.find(x => x.code === code.trim())
      const qty = parseInt(q, 10) || 1
      return it ? { itemId: it.id, code: it.code, name: it.name, qty, promoPrice: it.promoPrice, realPrice: it.realPrice } : { itemId: `x-${code.trim()}`, code: code.trim(), name: `Item ${code.trim()}`, qty, promoPrice: 0, realPrice: 0 }
    })
    const created = String(r[c.tgl] ?? '').trim()
    const createdAt = created ? new Date(created.replace(' ', 'T')).toISOString() : new Date().toISOString()
    rows.push({
      id, createdAt, expiresAt: createdAt, status,
      buyer: { name: String(r[c.nama] ?? ''), laundry: String(r[c.laundry] ?? ''), phone: String(r[c.hp] ?? '') },
      fulfil: { mode: /kirim/i.test(String(r[c.ambil] ?? '')) ? 'DELIVERY' : 'PICKUP', outlet: (String(r[c.outlet] ?? '') || undefined) as Order['fulfil']['outlet'], address: String(r[c.alamat] ?? '') || undefined },
      payment: { method: (String(r[c.metode] ?? 'QRIS') as Order['payment']['method']) || 'QRIS', proofName: String(r[c.bukti] ?? '') || undefined },
      lines, total: Number(String(r[c.total] ?? '0').replace(/[^\d.-]/g, '')) || lines.reduce((s, l) => s + l.qty * l.promoPrice, 0),
      savings: Number(String(r[c.hemat] ?? '0').replace(/[^\d.-]/g, '')) || 0,
      verifiedAt: String(r[c.verif] ?? '') ? new Date(String(r[c.verif]).replace(' ', 'T')).toISOString() : undefined,
      rejectReason: String(r[c.alasan] ?? '') || undefined,
    })
  })
  return { rows, skipped }
}
