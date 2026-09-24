import * as React from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/lib/reveal'
import { Narrow } from '@/components/layout/Shell'
import { KOTA_LIST, type Kota } from '@/model/types'
import { normalizePhone, displayPhone } from '@/model/phone'
import { checkPassword } from '@/model/password'
import { matchRegistration, type MatchResult } from '@/model/match'
import { useAccounts, type RegisterForm, type RegisterOutcome } from '@/store/accounts'
import { useCrm } from '@/store/crm'
import { cfg, useConfig } from '@/store/config'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioCard } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/misc'
import { MockInboxCard } from '@/components/auth/MockInboxCard'
import { PasswordChecklist, PasswordInput } from '@/components/auth/PasswordChecklist'
import { InviteRegisterForm } from '@/components/auth/InviteRegisterForm'

/* ---------------------------------------------------------------------------
   Registration, PRD Fitur 2. The form never shows a password up front: the matching cascade
   decides. LINKED (path 1/2) gets a temp password by email; PENDING/LEAD (path 3/4) choose one
   in a second step before the account is created.
   --------------------------------------------------------------------------- */

const KOTA_TUPLE = KOTA_LIST as [Kota, ...Kota[]]
const YA_TIDAK = ['ya', 'tidak'] as const

const schema = z.object({
  hasCard: z.enum(YA_TIDAK, { required_error: 'Pilih salah satu' }),
  laundry: z.string().trim().min(2, 'Nama laundry minimal 2 karakter'),
  pic: z.string().trim().min(2, 'Nama PIC wajib diisi'),
  phone: z.string().refine(v => normalizePhone(v) !== null, 'Nomor HP tidak valid. Contoh: 0812 3456 7890'),
  email: z.string().trim().email('Format email tidak valid'),
  kota: z.enum(KOTA_TUPLE).optional(),
  rsl: z.string().optional(),
  referral: z.string().optional(),
  consent: z.boolean().refine(v => v, 'Centang persetujuan dulu'),
})
type FormValues = z.infer<typeof schema>

type Step = 'form' | 'password' | 'done'

export function RegisterPage() {
  const password = useConfig(s => s.config.password)
  const inviteToken = useSearchParams()[0].get('invite')
  const [step, setStep] = React.useState<Step>('form')
  const [draft, setDraft] = React.useState<{ form: RegisterForm; match: MatchResult } | null>(null)
  const [outcome, setOutcome] = React.useState<RegisterOutcome | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const doRegister = (form: RegisterForm) => {
    try {
      const out = useAccounts.getState().register(form)
      setOutcome(out)
      setStep('done')
      setSubmitError(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Pendaftaran gagal'
      setSubmitError(msg)
      toast.error(msg)
    }
  }

  const onFormValid = (v: FormValues) => {
    const phone = normalizePhone(v.phone)
    if (!phone) return
    if (useAccounts.getState().byPhone(phone)) {
      setSubmitError('Nomor HP sudah terdaftar')
      toast.error('Nomor HP sudah terdaftar')
      return
    }
    const form: RegisterForm = {
      hasCard: v.hasCard === 'ya',
      laundry: v.laundry,
      pic: v.pic,
      phone,
      email: v.email,
      kota: v.kota,
      rsl: v.hasCard === 'ya' && v.rsl?.trim() ? v.rsl.trim().toUpperCase() : undefined,
      referral: v.referral?.trim() || undefined,
    }
    const match = matchRegistration({ phone, laundry: form.laundry, pic: form.pic, rsl: form.rsl }, useCrm.getState().customers, cfg().matching.fuzzyThreshold)
    if (match.link === 'LINKED') {
      doRegister(form)
    } else {
      setDraft({ form, match })
      setSubmitError(null)
      setStep('password')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // R.052 — invite mode (/register?invite=<token>) is a separate one-step form, like staging
  if (inviteToken) return <Narrow><InviteRegisterForm token={inviteToken} /></Narrow>

  return (
    <Narrow>
      {step === 'done' && outcome ? (
        <ResultScreen outcome={outcome} />
      ) : step === 'password' && draft ? (
        <PasswordStep
          match={draft.match}
          minLength={password.minLength}
          onBack={() => setStep('form')}
          onSubmit={pw => doRegister({ ...draft.form, password: pw })}
          error={submitError}
        />
      ) : (
        <RegisterFormStep onValid={onFormValid} submitError={submitError} />
      )}
    </Narrow>
  )
}

/* ------------------------------ Step 1: form ------------------------------ */

function RegisterFormStep({ onValid, submitError }: { onValid: (v: FormValues) => void; submitError: string | null }) {
  const { control, register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { laundry: '', pic: '', phone: '', email: '', rsl: '', referral: '', consent: false },
  })
  const phoneRaw = watch('phone')
  const hasCard = watch('hasCard')
  const phonePreview = normalizePhone(phoneRaw)
  const dup = !!submitError && /terdaftar/i.test(submitError)

  return (
    <div>
      <Reveal>
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="u-slide arrow-nudge inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-navy-700 [--u-bottom:8px]"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Beranda</Link>
          <Link to="/login" className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-navy-700 transition-colors hover:bg-navy-50">Sudah punya akun? Masuk</Link>
        </div>
        <p className="t-eyebrow mt-4">Resique Member Card</p>
        <h1 className="t-h1 mt-2 text-ink">Daftar RMC</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base">Isi data laundry-mu. Kalau nomor HP sudah ada di data Resique, poin RMC langsung tersambung.</p>
      </Reveal>

      <Reveal delay={80}>
        <form onSubmit={handleSubmit(onValid)} noValidate className="mt-8 space-y-6">
          <Field label="Sudah punya Resique Member Card" required error={errors.hasCard?.message}>
            <Controller name="hasCard" control={control} render={({ field }) => (
              <RadioGroup value={field.value} onValueChange={field.onChange} className="grid-cols-2" aria-invalid={!!errors.hasCard}>
                <RadioCard id="rc-card-ya" value="ya" title="Ya" />
                <RadioCard id="rc-card-tidak" value="tidak" title="Tidak" />
              </RadioGroup>
            )} />
          </Field>

          <Separator />

          <Field label="Nama laundry" required htmlFor="laundry" error={errors.laundry?.message}>
            <Input id="laundry" placeholder="Fresh Laundry Kemang" autoComplete="organization" aria-invalid={!!errors.laundry} {...register('laundry')} />
          </Field>

          <Field label="Nama PIC" required htmlFor="pic" error={errors.pic?.message} hint="Nama pemilik atau PIC yang tercatat di Resique">
            <Input id="pic" placeholder="Maya Anggraini" autoComplete="name" aria-invalid={!!errors.pic} {...register('pic')} />
          </Field>

          <Field label="No. HP (WhatsApp)" required htmlFor="phone" error={errors.phone?.message} hint={phonePreview ? `Disimpan sebagai ${phonePreview} · ${displayPhone(phonePreview)}` : 'Nomor ini dipakai untuk masuk'}>
            <Input id="phone" type="tel" spellCheck={false} inputMode="tel" placeholder="0812 3456 7890" autoComplete="tel" aria-invalid={!!errors.phone} {...register('phone')} />
          </Field>

          <Field label="Email" required htmlFor="email" error={errors.email?.message} hint="Kata sandi sementara dikirim ke sini kalau data cocok">
            <Input id="email" type="email" spellCheck={false} inputMode="email" placeholder="nama@laundry.id" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
          </Field>

          <Field label="Kota / outlet Resique terdekat" hint="Opsional. Supaya sales outlet terdekat yang menghubungi" htmlFor="kota" error={errors.kota?.message}>
            <Controller name="kota" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="kota" aria-invalid={!!errors.kota} className={cn(errors.kota && 'border-danger')}><SelectValue placeholder="Pilih kota" /></SelectTrigger>
                <SelectContent>{KOTA_LIST.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </Field>

          {hasCard === 'ya' && (
            <Field label="Nomor Member Card" htmlFor="rsl" error={errors.rsl?.message} hint="Opsional. Ada di kartu, contoh RSL40001. Dipakai kalau nomor HP-mu belum ada di data Resique.">
              <Input id="rsl" placeholder="RSL40001" className="t-code uppercase tracking-wider" autoCapitalize="characters" {...register('rsl')} />
            </Field>
          )}

          <Field label="Kode referral / nama sales" htmlFor="referral" hint="Opsional">
            <Input id="referral" placeholder="Nama sales Resique kamu" {...register('referral')} />
          </Field>

          <div className="space-y-1.5">
            <Controller name="consent" control={control} render={({ field }) => (
              <label htmlFor="consent" className={cn('flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition-colors has-[[data-state=checked]]:border-navy has-[[data-state=checked]]:bg-navy-50/60 hover:border-ink-4', errors.consent ? 'border-danger' : 'border-line')}>
                <Checkbox id="consent" checked={field.value} onCheckedChange={v => field.onChange(v === true)} aria-invalid={!!errors.consent} className="mt-0.5" />
                <span className="text-[14px] leading-relaxed text-ink-2">Saya setuju dihubungi via WhatsApp dan menyetujui syarat program Golden Privilege<span className="ml-0.5 text-danger" aria-hidden>*</span></span>
              </label>
            )} />
            {errors.consent && <p className="text-[12px] text-danger" role="alert">{errors.consent.message}</p>}
          </div>

          {submitError && (
            <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-[13px] text-danger">
              {submitError}{dup && <> · <Link to={`/login?phone=${encodeURIComponent(phonePreview || phoneRaw)}`} className="font-bold underline underline-offset-2">Masuk di sini</Link></>}
            </div>
          )}

          <Button type="submit" size="xl" className="w-full" disabled={isSubmitting}>
            Daftar sekarang
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Button>
          <p className="text-center text-[12px] text-ink-4">Kata sandi menyusul setelah data dicocokkan: via email, atau dibuat di langkah 2.</p>
        </form>
      </Reveal>
    </div>
  )
}

/* ----------------------- Step 2: password (PENDING / LEAD) ----------------------- */

function PasswordStep({ match, minLength, onBack, onSubmit, error }: { match: MatchResult; minLength: number; onBack: () => void; onSubmit: (pw: string) => void; error: string | null }) {
  const [pw, setPw] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [touched, setTouched] = React.useState(false)
  const check = checkPassword(pw, minLength)
  const mismatch = confirm.length > 0 && confirm !== pw
  const canSubmit = check.ok && confirm === pw

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    onSubmit(pw)
  }

  return (
    <div>
      <Reveal>
        <button type="button" onClick={onBack} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full pr-3 text-[13px] font-semibold text-ink-3 transition-colors hover:text-navy-700"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Ubah data pendaftaran</button>
        <p className="t-eyebrow mt-4">Langkah 2 dari 2</p>
        <h1 className="t-h1 mt-2 text-ink">Buat kata sandi</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base">
          {match.link === 'PENDING'
            ? 'Kami menemukan data yang mirip di Resique. Sales cek dulu, biasanya 1×24 jam. Akun sudah bisa dipakai belanja Golden Sale.'
            : 'Data laundry-mu belum ada di Resique, jadi dicatat sebagai pelanggan baru. Akun sudah bisa dipakai belanja Golden Sale.'}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <form onSubmit={submit} noValidate className="mt-8 space-y-6">
          <Field label="Kata sandi" required htmlFor="pw" error={touched && !check.ok ? 'Lengkapi syarat kata sandi di bawah' : undefined}>
            <PasswordInput id="pw" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" aria-invalid={touched && !check.ok} placeholder={`Minimal ${minLength} karakter`} />
          </Field>
          <PasswordChecklist password={pw} minLength={minLength} />
          <Field label="Ulangi kata sandi" required htmlFor="pw2" error={mismatch ? 'Kata sandi tidak sama' : undefined}>
            <PasswordInput id="pw2" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" aria-invalid={mismatch} placeholder="Ketik ulang" />
          </Field>
          {error && <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-[13px] text-danger">{error}</div>}
          <Button type="submit" size="xl" className="w-full" disabled={!canSubmit}>
            Selesaikan pendaftaran
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        </form>
      </Reveal>
    </div>
  )
}

/* ------------------------------- Result screen ------------------------------- */

function ResultScreen({ outcome }: { outcome: RegisterOutcome }) {
  const nav = useNavigate()
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
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base">
              Kata sandi sementara sudah dikirim ke <strong className="text-ink">{account.email}</strong>. Masuk dengan nomor HP <span className="t-num font-semibold text-ink">{displayPhone(account.phone)}</span>, lalu kamu akan diminta membuat kata sandi baru.
            </p>
          </Reveal>
          <Reveal delay={80}><MockInboxCard email={account.email} className="mt-8" /></Reveal>
          <Reveal delay={140} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="xl" className="flex-1" onClick={() => nav(loginTo)}>
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
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base">
              Kami menemukan data yang mirip di Resique. Sales akan memverifikasi (biasanya 1×24 jam). Belanja Golden Sale sudah bisa.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Card className="mt-8">
              <CardContent className="space-y-3 pt-5 sm:pt-6">
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
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base">
              {account.link === 'NEW_CUSTOMER' ? 'Laundry-mu sudah tercatat sebagai pelanggan Resique.' : 'Data laundry-mu belum ada di Resique. Sales akan menghubungi via WhatsApp.'} Belanja Golden Sale sudah bisa.
            </p>
          </Reveal>
          <Reveal delay={80}>
            <Card className="mt-8">
              <CardContent className="space-y-3 pt-5 sm:pt-6">
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
      <Button asChild size="xl" className="flex-1"><Link to={loginTo}>Masuk</Link></Button>
      <Button asChild size="xl" variant="gold" className="flex-1"><Link to="/#golden-sale">Lihat Golden Sale</Link></Button>
    </Reveal>
  )
}
