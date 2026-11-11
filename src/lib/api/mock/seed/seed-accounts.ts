import type { Account } from '@/types/member'
import { hashPassword } from '@/lib/password'

/* Demo account for stakeholder walkthroughs, prototype only. Linked to the top Klasemen customer
   (Laundry 24 Jam Kuningan) so the profile shows a real tier, points, chart, orders and the "Kamu" row. */
export const DEMO_LOGIN = { phone: '0812 0000 0001', password: 'Demo#2026' }

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'ACC-demo',
    phone: '+6281200000001',
    email: 'yuni@laundry24.id',
    laundry: 'Laundry 24 Jam Kuningan',
    pic: 'Yuni Astuti',
    kota: 'Jakarta',
    isMitra: false,
    hasCard: true,
    rsl: 'RSL10014',
    consentAt: '2026-09-01T09:00:00.000Z',
    passwordHash: hashPassword(DEMO_LOGIN.password),
    mustChangePassword: false,
    link: 'LINKED',
    crmCustomerId: 'C-2026-0049',
    matchPath: 1,
    matchScore: 1,
    createdAt: '2026-09-01T09:00:00.000Z',
  },
]
