import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgroRate — Crédito Rural Baseado na Sua Produção',
  description: 'Score de crédito inteligente para produtores rurais. Sua produção vira garantia.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#065f46',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-[#f8fafc] text-[#0f172a]">
        {children}
      </body>
    </html>
  )
}
