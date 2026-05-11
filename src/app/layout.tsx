import type { Metadata } from 'next'
import './globals.css'

const metadataBase =
  process.env.NEXT_PUBLIC_SITE_URL && /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : new URL('https://example.com')

export const metadata: Metadata = {
  metadataBase,
  title: 'Bartu & Burçak — 25 Temmuz 2026',
  description: 'River Garden, Paşamandıra / Beykoz',
  openGraph: {
    title: 'Bartu & Burçak Düğünü',
    description: '25 Temmuz 2026 · Cumartesi · River Garden, Beykoz',
    images: ['/invitations/davetiye.jpg'],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
