'use client'

import Link from 'next/link'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '@/components/common/reveal'
import { type Kota, KOTA_LIST } from '@/types/member'
import { displayPhone, normalizePhone } from '@/lib/phone'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioCard, RadioGroup } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'

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

export type FormValues = z.infer<typeof schema>

/* ------------------------------ Step 1: form ------------------------------ */
export function RegisterFormStep({ onValid, submitError }: { onValid: (v: FormValues) => void; submitError: string | null }) {
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
          <Link href="/" className="u-slide arrow-nudge inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-navy-700 [--u-bottom:8px]"><ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Beranda</Link>
          <Link href="/login" className="inline-flex min-h-[44px] items-center whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-navy-700 transition-colors hover:bg-navy-50">Sudah punya akun? Masuk</Link>
        </div>
        <p className="t-eyebrow mt-4">Resique Member Card</p>
        <h1 className="t-h1 mt-2 text-ink">Daftar RMC</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base sm:leading-6">Isi data laundry-mu. Kalau nomor HP sudah ada di data Resique, poin RMC langsung tersambung.</p>
      </Reveal>

      <Reveal delay={80}>
        <form onSubmit={handleSubmit(onValid)} noValidate className="mt-8 stack-y-6">
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

          <div className="stack-y-1.5">
            <Controller name="consent" control={control} render={({ field }) => (
              <label htmlFor="consent" className={cn('flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border bg-white p-4 transition-colors has-data-checked:border-navy has-data-checked:bg-navy-50/60 hover:border-ink-4', errors.consent ? 'border-danger' : 'border-line')}>
                <Checkbox id="consent" checked={field.value} onCheckedChange={v => field.onChange(v === true)} aria-invalid={!!errors.consent} className="mt-0.5" />
                <span className="text-[14px] leading-relaxed text-ink-2">Saya setuju dihubungi via WhatsApp dan menyetujui syarat program Golden Privilege<span className="ml-0.5 text-danger" aria-hidden>*</span></span>
              </label>
            )} />
            {errors.consent && <p className="text-[12px] text-danger" role="alert">{errors.consent.message}</p>}
          </div>

          {submitError && (
            <div role="alert" className="rounded-xl border border-danger-100 bg-danger-50 px-4 py-3 text-[13px] text-danger">
              {submitError}{dup && <> · <Link href={`/login?phone=${encodeURIComponent(phonePreview || phoneRaw)}`} className="font-bold underline underline-offset-2">Masuk di sini</Link></>}
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
