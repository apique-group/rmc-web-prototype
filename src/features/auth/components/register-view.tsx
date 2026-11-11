'use client'

import * as React from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Narrow } from '@/components/layout/narrow'
import { normalizePhone } from '@/lib/phone'
import { matchRegistration, type MatchResult } from '@/lib/rules/match'
import { getErrorMessage } from '@/lib/api/get-error-message'
import type { RegisterForm, RegisterOutcome } from '../types'
import { authApi } from '../api/auth.api'
import { useRegister } from '../hooks/use-auth'
import { InviteRegisterForm } from './invite-register-form'
import { FormValues, RegisterFormStep } from './register-form'
import { PasswordStep } from './password-step'
import { ResultScreen } from './register-result'
import { useAppConfig, useCustomers } from '@/hooks/use-member-data'

type Step = 'form' | 'password' | 'done'

export function RegisterView() {
  const appConfig = useAppConfig()
  const password = appConfig.password
  const customers = useCustomers()
  const register = useRegister()
  const inviteToken = useSearchParams().get('invite')
  const [step, setStep] = React.useState<Step>('form')
  const [draft, setDraft] = React.useState<{ form: RegisterForm; match: MatchResult } | null>(null)
  const [outcome, setOutcome] = React.useState<RegisterOutcome | null>(null)
  const [submitError, setSubmitError] = React.useState<string | null>(null)

  const doRegister = async (form: RegisterForm) => {
    try {
      const out = await register.mutateAsync(form)
      setOutcome(out)
      setStep('done')
      setSubmitError(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const msg = getErrorMessage(e, 'Pendaftaran gagal')
      setSubmitError(msg)
      toast.error(msg)
    }
  }

  const onFormValid = async (v: FormValues) => {
    const phone = normalizePhone(v.phone)
    if (!phone) return
    if (await authApi.lookup(phone)) {
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
    const match = matchRegistration({ phone, laundry: form.laundry, pic: form.pic, rsl: form.rsl }, customers, appConfig.matching.fuzzyThreshold)
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
