'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Registra service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Detecta se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Detecta se já foi dispensado
    if (localStorage.getItem('pwa-dismissed')) {
      setDismissed(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
  }

  if (installed || dismissed || !prompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 flex items-center gap-4 max-w-sm mx-auto">
      <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0">
        AR
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-slate-900 text-sm">Instalar AgroRate</div>
        <div className="text-xs text-slate-500">Acesse seu score offline, direto do celular</div>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
        >
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-slate-400 text-xs hover:text-slate-600 transition text-center"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
