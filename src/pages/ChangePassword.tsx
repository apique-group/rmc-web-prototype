import * as React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Reveal } from '@/lib/reveal'
import { Narrow } from '@/components/layout/Shell'
import { checkPassword } from '@/model/password'
import { displayPhone } from '@/model/phone'
import { useAccounts } from '@/store/accounts'
import { useCurrentAccount } from '@/store/session'
import { useConfig } from '@/store/config'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/label'
import { PasswordChecklist, PasswordInput } from '@/components/auth/PasswordChecklist'

/* First sign-in after a temp password (PRD Fitur 3, BR-3.x): the temp password is single-use. */
export function ChangePasswordPage() {
  const account = useCurrentAccount()
  const minLength = useConfig(s => s.config.password.minLength)
  const nav = useNavigate()
  const [pw, setPw] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [touched, setTouched] = React.useState(false)

  if (!account) return <Navigate to="/login" replace />

  const check = checkPassword(pw, minLength)
  const mismatch = confirm.length > 0 && confirm !== pw
  const canSubmit = check.ok && confirm === pw

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    useAccounts.getState().changePassword(account.id, pw)
    toast.success('Kata sandi baru tersimpan')
    nav('/profile', { replace: true })
  }

  return (
    <Narrow>
      <Reveal>
        <span className="grid h-14 w-14 place-items-center rounded-xl bg-navy-50 text-navy-700"><ShieldCheck className="h-7 w-7" strokeWidth={1.6} /></span>
        <h1 className="t-h1 mt-5 text-ink">Buat kata sandi baru</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-3 sm:text-base sm:leading-6">Kata sandi sementara cuma berlaku sekali. Buat kata sandi baru untuk akun <span className="t-num font-semibold text-ink">{displayPhone(account.phone)}</span>.</p>
      </Reveal>
      <Reveal delay={80}>
        <form onSubmit={submit} noValidate className="mt-8 stack-y-6">
          <Field label="Kata sandi baru" required htmlFor="pw" error={touched && !check.ok ? 'Lengkapi syarat kata sandi di bawah' : undefined}>
            <PasswordInput id="pw" value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" aria-invalid={touched && !check.ok} placeholder={`Minimal ${minLength} karakter`} autoFocus />
          </Field>
          <PasswordChecklist password={pw} minLength={minLength} />
          <Field label="Ulangi kata sandi baru" required htmlFor="pw2" error={mismatch ? 'Kata sandi tidak sama' : undefined}>
            <PasswordInput id="pw2" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" aria-invalid={mismatch} placeholder="Ketik ulang" />
          </Field>
          <Button type="submit" size="xl" className="w-full" disabled={!canSubmit}>
            Simpan kata sandi
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Button>
        </form>
      </Reveal>
    </Narrow>
  )
}
