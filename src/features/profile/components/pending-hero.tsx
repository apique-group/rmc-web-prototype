'use client'

import { Clock, MessageCircle } from 'lucide-react'
import { poin } from '@/lib/format'
import type { RmcSummary } from '@/lib/api/mock/rules/rmc'
import type { Account } from '@/types/member'
import { useConfig } from '@/lib/api/mock/config'
import { useCrm } from '@/lib/api/mock/crm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { HeroShell } from './hero-shell'
import { SALES_WA } from './profile-body'

export function PendingHero({ account, rmc }: { account: Account; rmc: RmcSummary }) {
  const cfg = useConfig(s => s.config)
  const claimTarget = useCrm(s => s.customers.find(c => c.id === account.crmCustomerId))
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-[6px]">
        <HeroShell>
          <p className="t-eyebrow text-gold-200">Poin RMC</p>
          <p data-points={rmc.points} className="t-fig t-fig-black mt-3 text-[56px] leading-none sm:text-[64px]">{poin(rmc.points)}</p>
          <p className="mt-2 text-[13px] text-white/80">Berlaku sampai {cfg.rules.expiry}</p>
          <div className="mt-6 border-t border-white/15 pt-5"><p className="text-[17px] font-bold">{account.laundry}</p><p className="text-[13px] text-white/75">{account.pic} · {account.kota}</p></div>
          <Progress value={35} tone="gold" className="mt-8 bg-white/15" />
        </HeroShell>
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-xl shadow-3">
          <CardContent className="pt-5 sm:pt-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-50 text-gold-700"><Clock className="h-5 w-5" strokeWidth={1.6} /></span>
            <p className="mt-4 text-[17px] font-bold text-ink">Menunggu verifikasi sales</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
              Datamu mirip dengan pelanggan <strong className="text-ink">{claimTarget?.outlet || 'Resique'}</strong>. Sales Resique memastikan akun ini milikmu (biasanya 1×24 jam) sebelum poin & tier tampil.
            </p>
            <Button asChild variant="secondary" className="mt-4 w-full">
              <a href={`${SALES_WA}?text=${encodeURIComponent(`Halo Sales Resique, mohon verifikasi akun RMC saya: ${account.laundry} (${account.pic}).`)}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" strokeWidth={1.6} /> Hubungi sales
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
