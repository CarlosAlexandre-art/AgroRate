'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LogoWhite() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={40} height={40} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="10" fill="white" fillOpacity="0.15"/>
        <path d="M9 22 A10 10 0 0 1 27 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" fill="none"/>
        <path d="M9 22 A10 10 0 0 1 24 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <circle cx="18" cy="22" r="2" fill="white"/>
        <line x1="18" y1="22" x2="23" y2="14.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M11 27 C11 27 13 23 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        <path d="M11 27 C13 25 15 24 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      </svg>
      <div>
        <div className="font-bold text-white text-xl leading-none tracking-tight">AgroRate</div>
        <div className="text-[11px] text-emerald-200 leading-none mt-0.5">Score de Crédito Rural</div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-emerald-700 to-teal-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <LogoWhite />
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Bem-vindo de volta</h1>
          <p className="text-emerald-200 text-sm">Entre para ver seu score de crédito rural</p>
        </div>

        {/* Banner AgroOS integrado */}
        <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">🔗</div>
          <div>
            <div className="text-white font-semibold text-sm leading-snug">Já usa o AgroOS?</div>
            <div className="text-emerald-200 text-xs mt-0.5 leading-relaxed">
              Use exatamente o mesmo e-mail e senha do AgroOS aqui. Os dois sistemas compartilham a mesma conta — sem novo cadastro.
            </div>
          </div>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex gap-2">
                <span>⚠️</span>
                <span>{error === 'Invalid login credentials' ? 'E-mail ou senha incorretos. Tente novamente.' : error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#065f46] text-white font-bold py-3.5 rounded-xl hover:bg-[#047857] disabled:opacity-50 transition-all shadow-lg hover:-translate-y-0.5 hover:shadow-emerald-900/30"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          {/* Divisor */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-300">ou</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* CTA Criar grátis — destaque */}
          <Link href="/cadastro"
            className="flex items-center justify-center gap-2 w-full border-2 border-[#065f46] text-[#065f46] font-bold py-3.5 rounded-xl hover:bg-emerald-50 transition-all hover:-translate-y-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Criar conta grátis
          </Link>
          <p className="text-center text-xs text-slate-400 mt-2">Sem cartão de crédito · Score calculado em minutos</p>
        </div>

        <p className="text-center text-xs text-emerald-300/70 mt-6">
          Parte do ecossistema AgroCore · AgroOS · AgroRate
        </p>
      </div>
    </div>
  )
}
