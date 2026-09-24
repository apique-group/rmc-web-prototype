import * as React from 'react'
import { BadgePercent, Boxes, CreditCard, Database, FileText, Gift, Image, ListChecks, Receipt, ShieldCheck, Trophy, UserCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/reveal'

export type AdminSectionId = 'konten' | 'aset' | 'benefit' | 'kampanye' | 'hadiah' | 'items' | 'paket' | 'pembayaran' | 'transaksi' | 'klaim' | 'akun' | 'reset'

export interface AdminNavItem { id: AdminSectionId; label: string; icon: LucideIcon; badge?: number }
export interface AdminNavGroup { label: string; items: AdminNavItem[] }

export const ADMIN_GROUPS: AdminNavGroup[] = [
  { label: 'Konten', items: [
    { id: 'konten', label: 'Konten & Copy', icon: FileText },
    { id: 'aset', label: 'Aset Gambar', icon: Image },
    { id: 'benefit', label: 'Benefit & Tier', icon: BadgePercent },
  ] },
  { label: 'Program', items: [
    { id: 'kampanye', label: 'Kampanye & Klasemen', icon: Trophy },
    { id: 'hadiah', label: 'Hadiah / Prizes', icon: Gift },
    { id: 'items', label: 'Golden Sale Items', icon: ListChecks },
    { id: 'paket', label: 'Paket Golden Sale', icon: Boxes },
  ] },
  { label: 'Transaksi', items: [
    { id: 'pembayaran', label: 'Pembayaran', icon: CreditCard },
    { id: 'transaksi', label: 'Transaksi', icon: Receipt },
    { id: 'klaim', label: 'Klaim Akun & Leads', icon: UserCheck },
  ] },
  { label: 'Sistem', items: [
    { id: 'akun', label: 'Akun & Audit', icon: ShieldCheck },
    { id: 'reset', label: 'Reset demo', icon: Database },
  ] },
]

export const ADMIN_SECTION_IDS = ADMIN_GROUPS.flatMap(g => g.items.map(i => i.id))
export const isAdminSection = (v: string | null | undefined): v is AdminSectionId => !!v && (ADMIN_SECTION_IDS as string[]).includes(v)

interface ShellProps {
  active: AdminSectionId
  onChange: (id: AdminSectionId) => void
  /** per-section counters (e.g. open claims, proofs awaiting verification) */
  badges?: Partial<Record<AdminSectionId, number>>
  embed?: boolean
  children: React.ReactNode
}

/** Settings shell: sticky 220px left rail (≥ lg) or a horizontal pill strip (< lg). */
export function AdminShell({ active, onChange, badges = {}, embed, children }: ShellProps) {
  const mobile = useIsMobile(1024)
  return (
    <div className={cn('mx-auto w-full max-w-[1200px]', embed ? 'px-3 py-3 sm:px-4' : 'px-4 py-5 sm:px-6 lg:py-7')}>
      <div className={cn('grid items-start gap-5', mobile ? 'grid-cols-1' : 'grid-cols-[220px_minmax(0,1fr)]')}>
        {mobile ? <PillStrip active={active} onChange={onChange} badges={badges} /> : <Rail active={active} onChange={onChange} badges={badges} embed={embed} />}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}

function Rail({ active, onChange, badges, embed }: Omit<ShellProps, 'children'>) {
  return (
    <nav aria-label="Navigasi konfigurasi" className={cn('sticky flex flex-col gap-4', embed ? 'top-3' : 'top-5')}>
      {ADMIN_GROUPS.map(g => (
        <div key={g.label}>
          <p className="mb-1 border-b border-line-2 px-3 pb-1.5 text-micro uppercase text-ink-3">{g.label}</p>
          <div className="flex flex-col">
            {g.items.map(it => {
              const on = it.id === active
              const n = badges?.[it.id]
              return (
                <button
                  key={it.id} type="button" data-admin-nav={it.id} aria-current={on ? 'page' : undefined} onClick={() => onChange(it.id)}
                  className={cn(
                    'flex items-center gap-2.5 border-l-[3px] px-3 py-2 text-left text-[13px] transition-[transform,background-color,color,border-color] duration-fast ease-out hover:translate-x-0.5',
                    on ? 'rounded-r-md border-navy-500 bg-navy-50 font-bold text-navy-700' : 'rounded-md border-transparent font-medium text-ink-2 hover:bg-surface-2',
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  <span className="flex-1 truncate">{it.label}</span>
                  {!!n && <span className="t-num rounded-full bg-warn-50 px-1.5 text-[11px] font-bold text-warn">{n}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function PillStrip({ active, onChange, badges }: Omit<ShellProps, 'children' | 'embed'>) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => { ref.current?.querySelector<HTMLElement>(`[data-admin-nav="${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' }) }, [active])
  return (
    <nav aria-label="Navigasi konfigurasi" className="-mx-3 sticky top-0 z-10 bg-bg/95 px-3 py-1 backdrop-blur sm:-mx-4 sm:px-4">
      <div ref={ref} role="tablist" className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {ADMIN_GROUPS.map((g, gi) => (
          <React.Fragment key={g.label}>
            {gi > 0 && <span aria-hidden className="my-1.5 w-px shrink-0 bg-line" />}
            {g.items.map(it => {
              const on = it.id === active
              const n = badges?.[it.id]
              return (
                <button
                  key={it.id} type="button" role="tab" aria-selected={on} data-admin-nav={it.id} onClick={() => onChange(it.id)}
                  className={cn('flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] transition-[transform,background-color,border-color,color] duration-fast ease-out hover:-translate-y-px', on ? 'border-navy-500 bg-navy-500 font-bold text-white' : 'border-line bg-white font-medium text-ink-2 hover:border-ink-4')}
                >
                  <it.icon className="h-3.5 w-3.5" strokeWidth={1.6} />
                  {it.label}
                  {!!n && <span className={cn('t-num rounded-full px-1.5 text-[11px] font-bold', on ? 'bg-white/20 text-white' : 'bg-warn-50 text-warn')}>{n}</span>}
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </nav>
  )
}
