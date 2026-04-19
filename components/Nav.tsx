'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from './Logo'
import { createClient } from '@/lib/supabase/client'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; initial: string } | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        const name = u.user_metadata?.name || u.email?.split('@')[0] || 'Usuário'
        setUser({ name, initial: name[0]?.toUpperCase() || 'U' })
      }
      setLoadingAuth(false)
    })
  }, [])

  const links = [
    { href: '/como-funciona', label: 'Como funciona' },
    { href: '/score', label: 'Meu Score' },
    { href: '/parceiros', label: 'Parceiros' },
    { href: '/ecossistema', label: 'Ecossistema' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between py-4">
        <Link href="/"><Logo /></Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {!loadingAuth && (
            user ? (
              /* Usuário logado */
              <Link href="/dashboard" className="flex items-center gap-2.5 bg-[#065f46]/8 border border-[#065f46]/20 px-4 py-2 rounded-xl hover:bg-[#065f46]/12 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-[#065f46] flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                  {user.initial}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
                  <div className="text-[10px] text-[#065f46] font-semibold leading-none mt-0.5">Ver meu dashboard →</div>
                </div>
              </Link>
            ) : (
              /* Não logado */
              <>
                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">
                  Entrar
                </Link>
                <Link href="/cadastro"
                  className="bg-[#065f46] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#047857] transition-all shadow-lg shadow-emerald-900/20 hover:-translate-y-0.5">
                  Calcular score grátis
                </Link>
              </>
            )
          )}
        </div>

        <button className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" onClick={() => setMenuOpen(o => !o)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-6 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2">
            {user ? (
              <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                className="block text-center py-3 text-sm font-bold text-white bg-[#065f46] rounded-xl">
                Ir para o Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/login" className="block text-center py-3 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl">Entrar</Link>
                <Link href="/cadastro" className="block text-center py-3 text-sm font-bold text-white bg-[#065f46] rounded-xl">Calcular score grátis</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
