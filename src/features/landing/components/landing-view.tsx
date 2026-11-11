'use client'

import { BasketBar } from './basket-bar'
import { BenefitSection } from './benefit-section'
import { CtaSection } from './cta-section'
import { GoldenSaleSection } from './golden-sale-section'
import { HeroSection } from './hero-section'
import { HookSection } from './hook-section'
import { KlasemenSection } from './klasemen-section'
import { TierSection } from './tier-section'

/* Landing (R.026, 11 Sep: the stakeholder keeps the RGP UI mock as the landing page). Rhythm follows the mock: banner
   card with a slider (hook) → prize grid "Tingkatkan Transaksi dan Dapatkan Hadiahnya!" (hero) → navy benefit band with
   the member card + four benefits + the four-step strip → six tier columns → "Cek poin-mu!" band → Golden Sale →
   Klasemen. Resique navy + green, gold reward-only. Copy is config-driven; the mock's words are the seed. Motion:
   slider autoplay, floating phone / cards, scroll-in pop on card lists, hover + press on every control. */
export function LandingView() {
  // the basket bar's clearance lives under the footer (SiteFooter), not between klasemen and the footer (Lurd, 11 Sep)
  return (
    <div>
      <HookSection />
      <HeroSection />
      <BenefitSection />
      <TierSection />
      <CtaSection />
      <GoldenSaleSection />
      <KlasemenSection />
      <BasketBar />
    </div>
  )
}
