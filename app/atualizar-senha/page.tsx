'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import LogoWhite from '@/components/LogoWhite'

export default function AtualizarSenhaPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message === 'Auth session missing!'
        ? 'Sessão expirada. Solicite um novo link de recuperação.'
        : 'Não foi possível atualizar a senha. Tente novamente.')
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065f46] via-emerald-700 to-teal-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5"><LogoWhite /></Link>
          <h1 className="text-2xl font-bold text-white mb-1">Nova senha</h1>
          <p className="text-emerald-200 text-sm">Escolha uma senha forte para sua conta</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto">✅</div>
              <h2 className="text-lg font-bold text-slate-900">Senha atualizada!</h2>
              <p className="text-sm text-slate-500">Redirecionando para o dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nova senha</label>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar nova senha</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] focus:border-transparent transition-all placeholder:text-slate-300"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#065f46] text-white font-bold py-3.5 rounded-xl hover:bg-[#047857] disabled:opacity-50 shadow-lg shadow-emerald-900/20 transition-all"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
