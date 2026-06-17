'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const COOKIE_KEY = 'agrorate_cookie_consent'

export default function CookieBanner() {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(COOKIE_KEY)) setVisivel(true)
  }, [])

  function aceitar() {
    localStorage.setItem(COOKIE_KEY, 'aceito')
    setVisivel(false)
  }

  function recusar() {
    localStorage.setItem(COOKIE_KEY, 'recusado')
    setVisivel(false)
  }

  if (!visivel) return null

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#0f172a',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ flex: '1 1 300px', fontSize: 13, color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
        Usamos cookies essenciais para autenticação e preferências. Ao continuar, você concorda com nossa{' '}
        <Link href="/privacidade" style={{ color: '#f59e0b', textDecoration: 'underline' }}>
          Política de Privacidade
        </Link>{' '}
        em conformidade com a LGPD.
      </p>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        <button
          onClick={recusar}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
        >
          Recusar
        </button>
        <button
          onClick={aceitar}
          style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#000', fontSize: 13, cursor: 'pointer', fontWeight: 700 }}
        >
          Aceitar cookies
        </button>
      </div>
    </div>
  )
}
