'use client'

import Link from 'next/link'
import { ArrowUpRight, Link2Off, MessageCircle, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SALES_WA } from './profile-body'

/* Staging profile cards for the non-linked states (apique-web-rmc lead-card / new-customer-card / unlinked-card): LEAD = laundry never
   registered (sales will register it), NEW_CUSTOMER = a CRM customer was created at registration, points start at the first outlet
   transaction, UNLINKED = staff detached the account from its customer. */
const LINK_STATE = {
  LEAD: { icon: MessageCircle, title: 'Belum terdaftar sebagai pelanggan Resique', desc: 'Tim sales akan menghubungi via WhatsApp untuk mendaftarkan laundry-mu. Setelah itu poin RMC mulai terhitung dari setiap belanja.' },
  NEW_CUSTOMER: { icon: Store, title: 'Sudah terdaftar sebagai pelanggan Resique', desc: 'Laundry-mu sudah tercatat di Resique. Poin & tier RMC mulai dihitung setelah transaksi pertamamu di outlet Resique.' },
  UNLINKED: { icon: Link2Off, title: 'Tautan akunmu telah dilepas', desc: 'Hubungi tim Resique untuk menautkan kembali akun ke data pelanggan yang sesuai.' },
} as const

export function LinkStateCard({ state }: { state: keyof typeof LINK_STATE }) {
  const s = LINK_STATE[state]
  const Icon = s.icon
  return (
    <Card className="rounded-xl" data-link-state={state}>
      <CardContent className="pt-5 sm:pt-6">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-50 text-navy-700"><Icon className="h-5 w-5" strokeWidth={1.6} /></span>
        <p className="mt-4 text-[17px] font-bold text-ink">{s.title}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">{s.desc}</p>
        {state === 'UNLINKED' ? (
          <Button size="lg" variant="secondary" className="mt-5 w-full" nativeButton={false} render={<a href={`${SALES_WA}?text=${encodeURIComponent('Halo Sales Resique, mohon tautkan kembali akun RMC saya.')}`} target="_blank" rel="noreferrer" />}><MessageCircle className="h-4 w-4" strokeWidth={1.6} /> Hubungi tim Resique</Button>
        ) : (
          <Button size="lg" variant="gold" className="mt-5 w-full" nativeButton={false} render={<Link href="/#golden-sale" />}>Belanja Golden Sale<ArrowUpRight className="h-4 w-4" strokeWidth={2} /></Button>
        )}
      </CardContent>
    </Card>
  )
}
