'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa-dismissed')) return

    const tryCapture = () => {
      if ((window as any).__bip) {
        setPrompt((window as any).__bip)
        setTimeout(() => setShow(true), 3000)
        return true
      }
      return false
    }

    if (!tryCapture()) {
      const handler = (e: Event) => {
        e.preventDefault()
        ;(window as any).__bip = e
        setPrompt(e as BeforeInstallPromptEvent)
        setTimeout(() => setShow(true), 3000)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  async function handleInstall() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem('pwa-dismissed', '1')
    setShow(false)
  }

  if (!show || !prompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="bg-[#065f46] px-4 py-3 flex items-center gap-3">
          <img src="/icon-192" alt="AgroRate" className="w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm leading-none">AgroRate</div>
            <div className="text-emerald-200 text-xs mt-0.5">Score de Crédito Rural</div>
          </div>
          <button onClick={handleDismiss} className="text-white/50 hover:text-white transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500 flex-1">Acesse seu score offline, direto do celular</p>
          <button
            onClick={handleInstall}
            className="bg-[#065f46] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#047857] transition-colors flex-shrink-0"
          >
            Instalar
          </button>
        </div>
      </div>
    </div>
  )
}
