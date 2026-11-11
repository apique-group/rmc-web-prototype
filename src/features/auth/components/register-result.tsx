'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, Clock, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/common/reveal'
import { displayPhone } from '@/lib/phone'
import type { RegisterOutcome } from '../types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { MockInboxCard } from './mock-inbox-card'

/* ------------------------------- Result screen ------------------------------- */
export function ResultScreen({ outcome }: { outcome: RegisterOutcome }) {
  const router = useRouter()
  const { account, match } = outcome
  const loginTo = `/login?phone=${encodeURIComponent(account.phone)}`
  const linked = account.link === 'LINKED' && match.customer

  return (
    <div>
      {linked ? (
        <>
          <Reveal>
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-50 text-navy-700"><CheckCircle2 className="h-7 w-7" strokeWidth={1.6} /></span>
            <p className="t-eyebrow mt-5">Pendaftaran berhasil</p>
            <h1 className="t-h1 mt-2 text-ink">Akun terhubung ke data Resique</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base sm:leading-6">
              Kata sandi sementara sudah dikirim ke <strong className="text-ink">{account.email}</strong>. Masuk dengan nomor HP <span className="t-num font-semibold text-ink">{displayPhone(account.phone)}</span>, lalu kamu akan diminta membuat kata sandi baru.
            </p>
          </Reveal>
          <Reveal delay={80}><MockInboxCard email={account.email} className="mt-8" /></Reveal>
          <Reveal delay={140} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="xl" className="flex-1" onClick={() => router.push(loginTo)}>
              Masuk sekarang
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Button>
          </Reveal>
        </>
      ) : account.link === 'PENDING' && match.customer ? (
        <>
          <Reveal>
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-gold-50 text-gold-700"><Clock className="h-7 w-7" strokeWidth={1.6} /></span>
            <p className="t-eyebrow mt-5">Menunggu verifikasi</p>
            <h1 className="t-h1 mt-2 text-ink">Akun aktif. Data RMC dicek sales dulu</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base sm:leading-6">
              Kami menemukan data yang mirip di Resique. Sales akan memverifikasi (biasanya 1×24 jam). Belanja Golden Sale sudah bisa.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Card className="mt-8">
              <CardContent className="stack-y-3 pt-5 sm:pt-6">
                <Row ok label="Belanja Golden Sale" desc="Sudah bisa checkout dan cek status pesanan." />
                <Row label="Poin & tier RMC" desc="Tampil setelah sales konfirmasi akun ini milikmu." badge={<Badge variant="warn">Terkunci</Badge>} />
                <p className="text-[12px] text-ink-4">Masuk dengan nomor HP {displayPhone(account.phone)} dan kata sandi yang barusan kamu buat.</p>
              </CardContent>
            </Card>
          </Reveal>
          <ResultButtons loginTo={loginTo} />
        </>
      ) : (
        <>
          <Reveal>
            <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-50 text-navy-700"><MessageCircle className="h-7 w-7" strokeWidth={1.6} /></span>
            <p className="t-eyebrow mt-5">Pendaftaran diterima</p>
            <h1 className="t-h1 mt-2 text-ink">Akun sudah aktif, {account.pic.split(' ')[0]}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base sm:leading-6">
              {account.link === 'NEW_CUSTOMER' ? 'Laundry-mu sudah tercatat sebagai pelanggan Resique.' : 'Data laundry-mu belum ada di Resique. Sales akan menghubungi via WhatsApp.'} Belanja Golden Sale sudah bisa.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Card className="mt-8">
              <CardContent className="stack-y-3 pt-5 sm:pt-6">
                <Row ok label="Belanja Golden Sale" desc="Sudah bisa checkout dan cek status pesanan." />
                <Row label="Poin & tier RMC" desc={account.link === 'NEW_CUSTOMER' ? 'Mulai dihitung setelah transaksi pertamamu di outlet Resique.' : 'Mulai dihitung setelah sales mendaftarkan laundry-mu di Resique.'} badge={<Badge variant="muted">Belum aktif</Badge>} />
                <p className="text-[12px] text-ink-4">Masuk dengan nomor HP {displayPhone(account.phone)} dan kata sandi yang barusan kamu buat.</p>
              </CardContent>
            </Card>
          </Reveal>
          <ResultButtons loginTo={loginTo} />
        </>
      )}
    </div>
  )
}

function Row({ ok, label, desc, badge }: { ok?: boolean; label: string; desc: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className={cn('mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full', ok ? 'bg-navy-50 text-navy-700' : 'bg-surface-2 text-ink-4')}>
        {ok ? <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} /> : <Clock className="h-4 w-4" strokeWidth={1.8} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] font-bold text-ink">{label}{badge}</p>
        <p className="text-[13px] text-ink-3">{desc}</p>
      </div>
    </div>
  )
}

function ResultButtons({ loginTo }: { loginTo: string }) {
  return (
    <Reveal delay={140} className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Button asChild size="xl" className="flex-1"><Link href={loginTo}>Masuk</Link></Button>
      <Button asChild size="xl" variant="gold" className="flex-1"><Link href="/#golden-sale">Lihat Golden Sale</Link></Button>
    </Reveal>
  )
}
