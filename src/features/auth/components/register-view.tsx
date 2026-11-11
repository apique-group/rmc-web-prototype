'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Narrow } from '@/components/layout/narrow'
import { normalizePhone } from '@/lib/phone'
import { matchRegistration, type MatchResult } from '@/lib/api/mock/rules/match'
import { type RegisterForm, type RegisterOutcome, useAccounts } from '@/lib/api/mock/accounts'
import { useCrm } from '@/lib/api/mock/crm'
import { cfg, useConfig } from '@/lib/api/mock/config'
import { InviteRegisterForm } from './invite-register-form'
import { FormValues, RegisterFormStep } from './register-form'
import { PasswordStep } from './password-step'
import { ResultScreen } from './register-result'

type Step = 'form' | 'password' | 'done'

export function RegisterView() {
  const password = useConfig(s => s.config.password)
  const inviteToken = useSearchParams().get('invite')
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
