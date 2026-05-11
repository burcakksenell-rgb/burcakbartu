import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
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
