import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, BadgeCheck, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/lib/reveal'
import { normalizePhone } from '@/model/phone'
import { checkPassword } from '@/model/password'
import { useAccounts } from '@/store/accounts'
import { useCrm, inviteStatus, maskPosCode } from '@/store/crm'
import { useSession } from '@/store/session'
import { useConfig } from '@/store/config'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/misc'
import { PasswordChecklist, PasswordInput } from '@/components/auth/PasswordChecklist'

/* R.052 — invite registration (staging /register?invite=<token>): sales generates a link per RMC customer in the CRM;
   the customer opens it, sees their outlet pre-filled (read-only), fills Nama PIC / HP / Email / kata sandi / consent
   in ONE step and lands on the profile already LINKED — no matching cascade, no temp password. An invalid, used,
   revoked or expired link shows one generic message (the reason is never revealed). */

const schema = z.object({
  pic: z.string().trim().min(2, 'Nama PIC wajib diisi'),
  phone: z.string().refine(v => normalizePhone(v) !== null, 'Nomor HP tidak valid. Contoh: 0812 3456 7890'),
  email: z.string().trim().email('Format email tidak valid'),
  consent: z.boolean().refine(v => v, 'Centang persetujuan dulu'),
})
type Values = z.infer<typeof schema>

export function InviteRegisterForm({ token }: { token: string }) {
  const nav = useNavigate()
  const minLength = useConfig(s => s.config.password.minLength)
  const invite = useCrm(s => s.invites.find(i => i.token === token))
  const customer = useCrm(s => (invite ? s.customers.find(c => c.id === invite.customerId) : undefined))
  const valid = !!invite && !!customer && inviteStatus(invite) === 'active'
  const [pw, setPw] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const check = checkPassword(pw, minLength)
  const mismatch = confirm.length > 0 && confirm !== pw
  const { control, register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { pic: '', phone: '', email: '', consent: false },
  })
  const phoneNorm = normalizePhone(watch('phone'))

  if (!valid) {
    return (
      <div>
        <Reveal>
          <p className="t-eyebrow">Undangan RMC</p>
          <h1 className="t-h1 mt-2 text-ink">Undangan tidak ditemukan</h1>
        </Reveal>
        <Reveal delay={80}>
          <EmptyState className="mt-8" title="Link undangan tidak valid atau sudah digunakan" desc="Minta link baru ke sales Resique, atau daftar lewat formulir biasa." action={<Button asChild size="sm"><Link to="/register">Daftar lewat formulir</Link></Button>} />
        </Reveal>
      </div>
    )
  }

  const onValid = (v: Values) => {
    setTouched(true)
    if (!check.ok || confirm !== pw) return
    const res = useAccounts.getState().registerInvite({ token, pic: v.pic, phone: v.phone, email: v.email, password: pw })
    if (!res.ok) { toast.error(res.reason); return }
    useSession.getState().signIn(res.account.id)
    toast.success(`Selamat datang, ${res.account.pic.split(' ')[0]}`)
    nav('/profile', { replace: true })
  }

  return (
    <div>
      <Reveal>
        <Link to="/" className="u-slide arrow-nudge inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-navy-700 [--u-bottom:8px]"><ArrowLeft className="h-4 w-4" strokeWidth={1.8} />Beranda</Link>
        <p className="t-eyebrow mt-4">Undangan RMC</p>
        <h1 className="t-h1 mt-2 text-ink">Aktifkan akun Golden Privilege</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base">Sales Resique sudah menyiapkan akun untuk laundry-mu. Lengkapi data di bawah, akun langsung terhubung ke poin dan tier RMC.</p>
      </Reveal>
      <Reveal delay={60}>
        <div data-invite-card className="mt-6 flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50/70 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-navy-700"><Store className="h-5 w-5" strokeWidth={1.6} /></span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-ink">{customer!.outlet}</p>
            <p className="text-[13px] text-ink-3">{customer!.kota}{customer!.rsl && <> · <span className="t-code">{maskPosCode(customer!.rsl)}</span></>}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-navy-700"><BadgeCheck className="h-3.5 w-3.5" strokeWidth={1.8} />Data outlet dari undangan, tidak perlu diisi</p>
          </div>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <form onSubmit={handleSubmit(onValid)} noValidate className="mt-8 space-y-6">
          <Field label="Nama PIC" required htmlFor="pic" error={errors.pic?.message} hint="Nama pemilik atau PIC yang tercatat di Resique">
            <Input id="pic" placeholder="Maya Anggraini" autoComplete="name" aria-invalid={!!errors.pic} {...register('pic')} />
          </Field>
          <Field label="No. HP (WhatsApp)" required htmlFor="phone" error={errors.phone?.message} hint={phoneNorm ? `Disimpan sebagai ${phoneNorm}` : undefined}>
            <Input id="phone" type="tel" spellCheck={false} inputMode="tel" placeholder="0812 3456 7890" autoComplete="tel" aria-invalid={!!errors.phone} {...register('phone')} />
          </Field>
          <Field label="Email" required htmlFor="email" error={errors.email?.message} hint="Untuk konfirmasi pesanan dan reset kata sandi">
            <Input id="email" type="email" spellCheck={false} inputMode="email" placeholder="nama@laundry.id" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
          </Field>
          <Field label="Kata sandi" required htmlFor="pw" error={touched && !check.ok ? 'Lengkapi syarat kata sandi di bawah' : undefined}>
            <PasswordInput id="pw" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" aria-invalid={touched && !check.ok} placeholder={`Minimal ${minLength} karakter`} />
          </Field>
          <PasswordChecklist password={pw} minLength={minLength} />
          <Field label="Ulangi kata sandi" required htmlFor="pw2" error={mismatch ? 'Kata sandi tidak sama' : undefined}>
            <PasswordInput id="pw2" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" aria-invalid={mismatch} placeholder="Ketik ulang" />
          </Field>
          <div className="space-y-1.5">
            <Controller name="consent" control={control} render={({ field }) => (
              <label htmlFor="consent" className={cn('flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition-colors has-[[data-state=checked]]:border-navy has-[[data-state=checked]]:bg-navy-50/60', errors.consent ? 'border-danger' : 'border-line')}>
                <Checkbox id="consent" checked={field.value} onCheckedChange={v => field.onChange(v === true)} aria-invalid={!!errors.consent} className="mt-0.5" />
                <span className="text-[14px] leading-relaxed text-ink-2">Saya setuju dihubungi via WhatsApp dan menyetujui syarat program Golden Privilege<span className="ml-0.5 text-danger" aria-hidden>*</span></span>
              </label>
            )} />
            {errors.consent && <p className="text-[12px] text-danger" role="alert">{errors.consent.message}</p>}
          </div>
          <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
            Aktifkan akun
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        </form>
      </Reveal>
    </div>
  )
}
