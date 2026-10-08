import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import BackgroundMusic from '@/components/BackgroundMusic'
import StudentRouteGuard from '@/components/StudentRouteGuard'

export const metadata: Metadata = {
  title: 'POLARIA | Pola Bilangan Aksi Ceria',
  description: 'E-LKPD interaktif untuk menemukan rumus suku ke-n melalui masalah kontekstual.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/assets/backsound.mp3"
          as="audio"
          type="audio/mpeg"
        />
      </head>
      <body className="antialiased">
        <StudentRouteGuard>{children}</StudentRouteGuard>
        <BackgroundMusic />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
