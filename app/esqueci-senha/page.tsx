'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LogoWhite from '@/components/LogoWhite'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })

    if (err) {
      if (err.message?.includes('60 seconds') || err.status === 429) {
        setError('Aguarde 1 minuto antes de solicitar outro link.')
      } else {
        setError(err.message || 'Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
      }
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-emerald-700 to-teal-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5"><LogoWhite /></Link>
          <h1 className="text-2xl font-bold text-white mb-1">Esqueceu sua senha?</h1>
          <p className="text-emerald-200 text-sm">Vamos te ajudar a recuperar o acesso</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto">📧</div>
              <h2 className="text-lg font-bold text-slate-900">E-mail enviado!</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enviamos um link de recuperação para <strong className="text-slate-700">{email}</strong>. Verifique sua caixa de entrada (e o spam).
              </p>
              <p className="text-xs text-slate-400">O link expira em 1 hora.</p>
              <Link href="/login"
                className="block w-full bg-[#065f46] text-white font-bold py-3.5 rounded-xl hover:bg-[#047857] transition-colors text-center text-sm">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail da sua conta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] focus:border-transparent transition-all placeholder:text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#065f46] text-white font-bold py-3.5 rounded-xl hover:bg-[#047857] disabled:opacity-50 shadow-lg shadow-emerald-900/20 transition-all"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <div className="text-center pt-1">
                <Link href="/login" className="text-sm text-slate-500 hover:text-[#065f46] transition-colors">
                  ← Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
