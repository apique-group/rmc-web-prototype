'use client'

import { redirect } from 'next/navigation'
import { useCurrentAccount } from '@/hooks/use-member-data'
import { ProfileBody } from './profile-body'

/* Profile, PRD Fitur 4 (poin & tier), Fitur 5 (tukar hadiah), Fitur 6 (riwayat). */
export function ProfileView() {
  const account = useCurrentAccount()
  if (!account) return redirect("/login?redirect=%2Fprofile")
  return <ProfileBody account={account} />
}
