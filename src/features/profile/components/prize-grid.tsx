'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import { poin } from '@/lib/format'
import { Reveal } from '@/components/layout/reveal'
import type { Account, Prize } from '@/types/member'
import { useRedeemPrize } from '../hooks/use-profile'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EmptyState } from '@/components/layout/empty-state'
import { useAppConfig } from '@/features/landing/hooks/use-config'

/* --------------------------------- Prizes --------------------------------- */
export function PrizeGrid({ account, points }: { account: Account; points: number }) {
  const cfg = useAppConfig()
  const redeem = useRedeemPrize()
  const [sel, setSel] = React.useState<Prize | null>(null)
  const prizes = cfg.prizes.filter(p => p.active)

  /* why a prize cannot be redeemed, in staging's order: stock (STOK_HABIS), the minimum redeem rule (BELOW_MIN_REDEEM, on the prize's cost),
     then the balance (POIN_KURANG) */
  const reason = (p: Prize): string | null => {
    if (p.stock <= 0) return 'Stok habis'
    if (p.pointCost < cfg.rules.minRedeem) return `Di bawah min. tukar ${poin(cfg.rules.minRedeem)} poin`
    if (points < p.pointCost) return `Kurang ${poin(p.pointCost - points)} poin`
    return null
  }

  const confirm = async () => {
    if (!sel) return
    const fresh = cfg.prizes.find(p => p.id === sel.id)
    if (!fresh || !fresh.active) { toast.error('Hadiah tidak ditemukan'); setSel(null); return }
    if (fresh.stock <= 0) { toast.error('Stok hadiah sudah habis'); setSel(null); return }
    if (fresh.pointCost < cfg.rules.minRedeem) { toast.error(`Minimum redeem ${poin(cfg.rules.minRedeem)} poin`); setSel(null); return }
    if (points < fresh.pointCost) { toast.error('Saldo poin tidak cukup'); setSel(null); return }
    const balance = points - fresh.pointCost
    const r = await redeem.mutateAsync({ accountId: account.id, prizeId: fresh.id, balanceAfter: balance })
    toast.success(`${fresh.name} berhasil ditukar`, { description: `Kode penukaran ${r.code}. Sisa poin ${poin(balance)}. Sales Resique akan hubungi kamu soal pengiriman.`, duration: 8000 })
    setSel(null)
  }

  return (
    <section aria-labelledby="prizes-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="t-eyebrow">Tukar poin</p>
          <h2 id="prizes-title" className="t-h2 mt-1 text-ink">Pilihan hadiah</h2>
        </div>
        <p className="t-code shrink-0 text-[13px] text-ink-3">Min. tukar <strong className="text-ink">{poin(cfg.rules.minRedeem)}</strong> poin</p>
      </div>
      {prizes.length === 0 ? (
        <EmptyState className="mt-4" title="Belum ada hadiah aktif" desc="Daftar hadiah menyusul. Cek lagi nanti." />
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {prizes.map((p, i) => {
            const why = reason(p)
            return (
              <Reveal as="li" key={p.id} delay={i * 50}>
                <article className={cn('group flex h-full flex-col rounded-xl border border-line bg-white p-3 sm:p-4', why ? 'opacity-80' : 'lift active:scale-[.98]')}>
                  <div className="relative overflow-hidden rounded-lg bg-surface-2">
                    <img src={p.image} alt={p.name} width={800} height={600} className="zoom-img aspect-4/3 w-full object-cover" loading="lazy" />
                    {p.stock <= 0 ? <Badge variant="muted" className="absolute left-2 top-2">Habis</Badge> : p.stock <= 5 ? <Badge variant="warn" className="absolute left-2 top-2">Sisa {p.stock}</Badge> : null}
                  </div>
                  <p className="mt-3 text-[11px] font-semibold text-ink-4">{p.type}</p>
                  <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-[13px] font-bold leading-snug text-ink sm:text-[14px]">{p.name}</h3>
                  <p className="t-fig mt-1 text-[15px] text-gold-700">{poin(p.pointCost)} <span className="text-[11px] font-bold text-ink-3">poin</span></p>
                  <p className="t-code text-[11px] text-ink-4">Stok {p.stock}</p>
                  <div className="mt-auto pt-3">
                    <Button size="sm" variant={why ? 'outline' : 'gold'} className="h-11 w-full sm:h-10" disabled={!!why} onClick={() => setSel(p)} aria-label={why ? `${p.name}: ${why}` : `Tukar ${p.name}`}>
                      {why || 'Tukar'}
                    </Button>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </ul>
      )}

      <Dialog open={!!sel} onOpenChange={o => { if (!o) setSel(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tukar {sel?.name}?</DialogTitle>
            <DialogDescription>
              Tukar <strong className="text-ink">{sel?.name}</strong> dengan <strong className="t-code text-ink">{poin(sel?.pointCost)} poin</strong>? Sisa poin setelah penukaran: <strong className="t-code text-navy-700">{poin(points - (sel?.pointCost || 0))}</strong>.
            </DialogDescription>
          </DialogHeader>
          {sel && (
            <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
              <img src={sel.image} alt="" width={80} height={64} className="h-16 w-20 rounded-lg object-cover" />
              <div className="min-w-0 text-[13px] text-ink-2">{sel.desc || 'Hadiah dikirim / diambil di outlet Resique terdekat.'}</div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="" onClick={() => setSel(null)}>Batal</Button>
            <Button variant="gold" className="" onClick={confirm}><Gift className="h-4 w-4" strokeWidth={1.8} /> Ya, tukar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
