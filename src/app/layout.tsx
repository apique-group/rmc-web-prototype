import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google'
import { Providers } from '@/app/providers'
import './globals.css'

// Lurd's font rule (7–8 Sep 2026): Plus Jakarta Sans everywhere; Poppins Regular only for the small editorial notes.
const pjs = Plus_Jakarta_Sans({ subsets: ['latin'], weight: 'variable', style: ['normal', 'italic'], variable: '--font-pjs', display: 'swap' })
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-poppins', display: 'swap' })

export const metadata: Metadata = {
  title: 'Resique Golden Privilege — Resique Turun Harga',
  description: 'Tingkatkan transaksi, dapatkan hadiahnya! Program Resique Member Card (RMC) & Golden Sale.',
  icons: { icon: [{ url: '/img/favicon.png', type: 'image/png', sizes: '64x64' }], apple: '/img/apple-touch-icon.png' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#211A5A' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${pjs.variable} ${poppins.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
