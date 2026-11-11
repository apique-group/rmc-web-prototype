/* Real Resique contact + social links (R.017, 7 Sep 2026). One source of truth for the header utility row, the
   mobile drawer, the footer and the profile's "WhatsApp sales" link.
   Sources: RGP UI mock (CS number, jam buka, lokasi); linktr.ee/resiquesupermarket (customer-solution WA, catalog,
   outlet hotlines, email); search-verified official accounts. TikTok / X / LinkedIn have no verified official
   account (only regional TikToks) and are deliberately absent, the mock's six icons became three. */

export const CONTACTS = {
  /** Customer Services, from the RGP mock: +62 878-1533-8811 */
  waNumber: '6287815338811',
  waDisplay: '+62 878-1533-8811',
  wa: 'https://wa.me/6287815338811',
  /** "Customer Solution Resique (pembelian produk)" from the linktree */
  waSolution: 'http://wa.link/i8cfkl',
  hours: '08.00 - 21.00 WIB',
  email: 'operation.resique@gmail.com',
  site: 'https://www.resique.co.id/',
  siteLabel: 'resique.co.id',
  catalog: 'https://resiqueoutlet.pages.dev/',
  outlets: 'https://linktr.ee/resiquesupermarket',
  instagram: 'https://www.instagram.com/resiquesupermarket.id/',
  youtube: 'https://www.youtube.com/@resiquesupermarketlaundry',
  facebook: 'https://www.facebook.com/p/Resique-Supermarket-Laundry-61569553302137/',
} as const

export const SOCIALS = [
  { id: 'instagram', label: 'Instagram Resique', href: CONTACTS.instagram },
  { id: 'youtube', label: 'YouTube Resique', href: CONTACTS.youtube },
  { id: 'facebook', label: 'Facebook Resique', href: CONTACTS.facebook },
] as const

export const EXT = { target: '_blank', rel: 'noopener noreferrer' } as const
