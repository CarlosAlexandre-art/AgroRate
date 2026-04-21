import type { Metadata, Viewport } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import PwaInstall from '@/components/PwaInstall'

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: 'AgroRate — Crédito Rural Baseado na Sua Produção',
  description: 'Score de crédito inteligente para produtores rurais. Sua produção vira garantia.',
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icon-192',
    shortcut: '/icons/icon.svg',
  },
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
    <html lang="pt-BR" className={`h-full ${montserrat.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{
          __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__bip=e;});`
        }} />
      </head>
      <body className="font-sans min-h-full bg-[#f0fdf4] text-[#0f172a]">
        {children}
        <PwaInstall />
        <script dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'});});}`
        }} />
      </body>
    </html>
  )
}
