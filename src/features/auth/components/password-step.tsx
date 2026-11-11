'use client'

import * as React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/layout/reveal'
import { checkPassword } from '@/lib/password'
import type { MatchResult } from '../types'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/label'
import { PasswordChecklist, PasswordInput } from './password-checklist'

/* ----------------------- Step 2: password (PENDING / LEAD) ----------------------- */
export function PasswordStep({ match, minLength, onBack, onSubmit, error }: { match: MatchResult; minLength: number; onBack: () => void; onSubmit: (pw: string) => void; error: string | null }) {
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
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base sm:leading-6">
          {match.link === 'PENDING'
            ? 'Kami menemukan data yang mirip di Resique. Sales cek dulu, biasanya 1×24 jam. Akun sudah bisa dipakai belanja Golden Sale.'
            : 'Data laundry-mu belum ada di Resique, jadi dicatat sebagai pelanggan baru. Akun sudah bisa dipakai belanja Golden Sale.'}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <form onSubmit={submit} noValidate className="mt-8 stack-y-6">
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
