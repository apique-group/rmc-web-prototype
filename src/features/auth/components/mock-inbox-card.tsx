import * as React from 'react'
import { Inbox, MailOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtDate } from '@/lib/format'
import { useInbox } from '@/lib/api/mock/inbox'
import { Badge } from '@/components/ui/badge'
import type { InboxMail } from '@/types/member'

/* PROTOTYPE ONLY, stands in for the real transactional email (see DESIGN-RMC.md §6).
   Shows the latest mails for one address (or all), with the temp password line highlighted. */

const TEMP_PW = /^Rsq-[A-Za-z0-9!@#$%]{6,}$/

function MailBody({ body }: { body: string }) {
  return (
    <div className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-2">
      {body.split('\n').map((line, i) => {
        const t = line.trim()
        if (TEMP_PW.test(t)) {
          return (
            <p key={i} className="my-2">
              <code className="inline-block select-all rounded-lg border border-gold-200 bg-gold-50 px-3 py-1.5 t-code text-[16px] font-bold tracking-wide text-gold-ink">{t}</code>
            </p>
          )
        }
        return <React.Fragment key={i}>{line}{'\n'}</React.Fragment>
      })}
    </div>
  )
}

function MailItem({ mail, defaultOpen }: { mail: InboxMail; defaultOpen: boolean }) {
  const markRead = useInbox(s => s.markRead)
  const [open, setOpen] = React.useState(defaultOpen)
  React.useEffect(() => { if (open && !mail.read) markRead(mail.id) }, [open, mail.id, mail.read, markRead])
  return (
    <li className="border-t border-line-2 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2/70 sm:px-5"
      >
        <span className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full', mail.read ? 'bg-surface-2 text-ink-4' : 'bg-navy-50 text-navy-700')}>
          <MailOpen className="h-4 w-4" strokeWidth={1.6} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className={cn('truncate text-[14px]', mail.read ? 'font-semibold text-ink-2' : 'font-bold text-ink')}>{mail.subject}</span>
            <span className="t-num shrink-0 text-[11px] text-ink-4">{fmtDate(mail.at, true)}</span>
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-ink-3">Kepada: {mail.to}</span>
        </span>
      </button>
      {open && <div className="px-4 pb-4 pl-[60px] sm:px-5 sm:pl-[64px]"><MailBody body={mail.body} /></div>}
    </li>
  )
}

export function MockInboxCard({ email, limit = 3, className, title = 'Kotak masuk (demo)' }: { email?: string; limit?: number; className?: string; title?: string }) {
  const mails = useInbox(s => s.mails)
  const target = email?.trim().toLowerCase()
  const list = (target ? mails.filter(m => m.to.toLowerCase() === target) : mails).slice(0, limit)
  return (
    <section className={cn('overflow-hidden rounded-xl border border-gold-200 bg-white shadow-1', className)} aria-label={title}>
      <header className="flex items-center gap-3 border-b border-line-2 bg-gold-50/60 px-4 py-3 sm:px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-gold-700 shadow-1"><Inbox className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-ink">{title}</p>
          <p className="truncate text-[12px] text-ink-3">{target || 'Semua alamat'}</p>
        </div>
        <Badge variant="gold" className="shrink-0">Simulasi email</Badge>
      </header>
      <p className="border-b border-line-2 px-4 py-2 text-[11px] text-ink-3 sm:px-5">
        Simulasi. Aslinya email ini dikirim ke alamat kamu. Panel ini hanya ada di prototype.
      </p>
      {list.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-ink-3 sm:px-5">Belum ada email untuk alamat ini.</p>
      ) : (
        <ul>{list.map((m, i) => <MailItem key={m.id} mail={m} defaultOpen={i === 0} />)}</ul>
      )}
    </section>
  )
}
