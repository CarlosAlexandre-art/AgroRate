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

export default function CadastroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (err) { setError(err.message); setLoading(false); return }
    if (data.session) {
      router.push('/dashboard')
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-emerald-700 to-teal-800 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">📧</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Confirme seu e-mail</h2>
          <p className="text-slate-500 text-sm mb-2 leading-relaxed">
            Enviamos um link de confirmação para
          </p>
          <p className="font-semibold text-slate-800 text-sm mb-6 break-all">{email}</p>
          <p className="text-xs text-slate-400 mb-6">Clique no link do e-mail para ativar sua conta e acessar o dashboard.</p>
          <Link href="/login" className="block w-full bg-[#065f46] text-white font-bold py-3.5 rounded-xl hover:bg-[#047857] transition-colors text-center">
            Ir para o login
          </Link>
        </div>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-white mb-1">Comece grátis hoje</h1>
          <p className="text-emerald-200 text-sm">Calcule seu score de crédito rural em minutos</p>
        </div>

        {/* Banner AgroOS — ATENÇÃO para usuários existentes */}
        <div className="bg-amber-400/20 border border-amber-300/30 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <div className="text-xl flex-shrink-0">⚠️</div>
          <div>
            <div className="text-white font-semibold text-sm leading-snug">Já usa o AgroOS?</div>
            <div className="text-amber-200 text-xs mt-0.5 leading-relaxed">
              Não crie uma nova conta. Vá direto para o login e use o <strong className="text-white">mesmo e-mail e senha</strong> do AgroOS — sua conta já funciona aqui.
            </div>
            <Link href="/login" className="inline-flex items-center gap-1 text-xs font-bold text-white mt-1.5 hover:text-amber-200 transition-colors">
              Ir para o login →
            </Link>
          </div>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {/* Benefícios rápidos */}
          <div className="flex items-center justify-around mb-5 pb-4 border-b border-slate-100">
            {[
              { icon: '✅', label: 'Grátis' },
              { icon: '⚡', label: '2 minutos' },
              { icon: '🔒', label: 'Seguro' },
            ].map(({ icon, label }) => (
              <div key={label} className="text-center">
                <div className="text-lg">{icon}</div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="João Silva"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
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
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] focus:border-transparent transition-all placeholder:text-slate-300"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#065f46] text-white font-bold py-3.5 rounded-xl hover:bg-[#047857] disabled:opacity-50 transition-all shadow-lg hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Criando conta...
                </span>
              ) : 'Criar conta grátis →'}
            </button>
            <p className="text-center text-xs text-slate-400">
              Sem cartão de crédito. Cancele quando quiser.
            </p>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Já tem conta?{' '}
              <Link href="/login" className="font-semibold text-[#065f46] hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-emerald-300/70 mt-6">
          Parte do ecossistema AgroCore · AgroOS · AgroRate
        </p>
      </div>
    </div>
  )
}
