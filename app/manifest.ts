import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'AgroRate — Crédito Rural Baseado na Sua Produção',
    short_name: 'AgroRate',
    description: 'Score de crédito inteligente para produtores rurais. Sua produção vira garantia.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#065f46',
    theme_color: '#065f46',
    orientation: 'portrait',
    categories: ['finance', 'productivity'],
    lang: 'pt-BR',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Meu Score', url: '/dashboard', description: 'Ver meu score de crédito' },
      { name: 'Ofertas de Crédito', url: '/dashboard/credito', description: 'Ver ofertas disponíveis' },
    ],
  }
}
