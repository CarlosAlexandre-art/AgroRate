import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaInstall from '@/components/PwaInstall'

export const metadata: Metadata = {
  title: 'AgroRate — Crédito Rural Baseado na Sua Produção',
  description: 'Score de crédito inteligente para produtores rurais. Sua produção vira garantia.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgroRate',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#065f46',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="apple-touch-icon" href="/icon-192" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-[#f8fafc] text-[#0f172a]">
        {children}
        <PwaInstall />
      </body>
    </html>
  )
}
