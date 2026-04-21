'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type UserData = { name: string; email: string; createdAt: string }
type QuodData = { score: number; faixa: string; capacidade: string; cpfMasked: string }

const CONSENTS = [
  { id: 'sicredi',  label: 'Sicredi',        desc: 'Compartilhar score para análise de crédito rural premium' },
  { id: 'bb',       label: 'Banco do Brasil', desc: 'Compartilhar para acesso às linhas Finagro e Pronaf' },
  { id: 'sicoob',   label: 'Sicoob',          desc: 'Compartilhar para ofertas de custeio e investimento' },
  { id: 'bradesco', label: 'Bradesco',        desc: 'Compartilhar para financiamento agrícola' },
  { id: 'santander',label: 'Santander',       desc: 'Compartilhar para custeio e capital de giro' },
  { id: 'agrocred', label: 'AgroCred',        desc: 'Compartilhar para antecipação de recebíveis' },
]

export default function ConfigPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [quod, setQuod] = useState<QuodData | null>(null)
  const [cpf, setCpf] = useState('')
  const [cpfConsent, setCpfConsent] = useState(false)
  const [quodLoading, setQuodLoading] = useState(false)
  const [quodError, setQuodError] = useState('')
  const [quodSuccess, setQuodSuccess] = useState('')
  const STORAGE_KEY = 'agrorate_consents'
  const defaultConsents = { sicredi: false, bb: false, sicoob: false, bradesco: false, santander: false, agrocred: false }
  const [consents, setConsents] = useState<Record<string, boolean>>(defaultConsents)
  const [saved, setSaved] = useState(false)
  const [consentAll, setConsentAll] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setConsents(parsed)
        setConsentAll(Object.values(parsed).every(Boolean))
      }
    } catch { /* ignore */ }
  }, [])
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) { router.push('/login'); return }
      setUser({
        name: u.user_metadata?.name || u.email?.split('@')[0] || 'Usuário',
        email: u.email || '',
        createdAt: u.created_at,
      })
    })
  }, [router])

  function toggleConsent(id: string) {
    setConsents(c => ({ ...c, [id]: !c[id] }))
  }

  function toggleAll() {
    const next = !consentAll
    setConsentAll(next)
    setConsents(Object.fromEntries(CONSENTS.map(c => [c.id, next])))
  }

  function handleSave() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consents)) } catch { /* ignore */ }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const activeCount = Object.values(consents).filter(Boolean).length

  function formatCpf(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
  }

  async function handleVerificarCpf() {
    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) { setQuodError('CPF inválido. Digite 11 dígitos.'); return }
    if (!cpfConsent) { setQuodError('Autorize a consulta antes de continuar.'); return }
    setQuodLoading(true); setQuodError(''); setQuodSuccess('')
    try {
      const res = await fetch('/api/quod/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: digits }),
      })
      const data = await res.json()
      if (!res.ok) { setQuodError(data.error || 'Erro na verificação'); return }
      setQuod(data)
      setQuodSuccess(`CPF verificado! Score QUOD: ${data.score} — ${data.faixa}`)
      setCpf('')
    } catch {
      setQuodError('Erro de conexão. Tente novamente.')
    } finally {
      setQuodLoading(false)
    }
  }

  return (
    <div className="p-5 max-w-2xl mx-auto space-y-4">

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Configurações salvas com sucesso.
        </div>
      )}

      {/* Conta */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Minha conta</div>
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#065f46] flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
                {user.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-lg">{user.name}</div>
                <div className="text-sm text-slate-500">{user.email}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Membro desde {new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Sistema</div>
                <div className="font-bold text-slate-800 text-sm">AgroRate</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Integração</div>
                <div className="font-bold text-emerald-700 text-sm">AgroOS ativo</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-20 bg-slate-100 rounded-xl animate-pulse"/>
        )}
      </div>

      {/* Verificação QUOD */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Verificação de crédito</div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Vincule seu CPF para enriquecer seu score com dados do bureau de crédito. O AgroRate passa a usar 70% dados da fazenda + 30% perfil de crédito externo.
        </p>

        {quod ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-emerald-800">CPF verificado · {quod.cpfMasked}</div>
                <div className="text-xs text-emerald-700">Score bureau: {quod.score} · {quod.faixa}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Score QUOD</div>
                <div className="font-black text-slate-800 text-lg">{quod.score}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Capacidade</div>
                <div className="font-bold text-slate-700 text-xs leading-tight mt-1">{quod.capacidade || '—'}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {quodSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
                {quodSuccess}
              </div>
            )}
            {quodError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {quodError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">CPF do titular</label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]"
              />
            </div>
            <div
              className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer"
              onClick={() => setCpfConsent(c => !c)}
            >
              <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${cpfConsent ? 'bg-[#065f46] border-[#065f46]' : 'border-slate-300 bg-white'}`}>
                {cpfConsent && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Autorizo</strong> o AgroRate a consultar meu perfil de crédito junto ao bureau parceiro para enriquecer meu score agrícola, conforme a <strong>LGPD (Lei 13.709/2018)</strong>. Meu CPF será armazenado criptografado e nunca compartilhado com terceiros.
              </p>
            </div>
            <button
              onClick={handleVerificarCpf}
              disabled={quodLoading || !cpfConsent || cpf.replace(/\D/g,'').length !== 11}
              className="w-full py-2.5 rounded-xl bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {quodLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Verificando...
                </>
              ) : 'Verificar CPF e enriquecer score'}
            </button>
          </div>
        )}
      </div>

      {/* Ecossistema */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Conexão com o ecossistema</div>
        <div className="space-y-3">
          {[
            { name: 'AgroOS', desc: 'Sistema Operacional da Fazenda', href: 'https://agros-os.vercel.app', status: 'connected', dot: 'bg-emerald-400' },
            { name: 'AgroCore', desc: 'Marketplace de Serviços Agrícolas', href: 'https://agrolink-opal.vercel.app', status: 'connected', dot: 'bg-amber-400' },
          ].map(sys => (
            <div key={sys.name} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sys.dot}`}/>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 text-sm">{sys.name}</div>
                <div className="text-xs text-slate-500">{sys.desc}</div>
              </div>
              <a href={sys.href} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold text-[#065f46] hover:underline flex items-center gap-1">
                Acessar
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 leading-relaxed">
          O AgroRate usa o mesmo login e banco de dados do AgroOS. Seus dados de propriedade, receitas e custos alimentam seu score automaticamente.
        </p>
      </div>

      {/* Consentimentos */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Consentimentos de compartilhamento</div>
          <span className="text-xs font-semibold text-slate-500">{activeCount}/{CONSENTS.length} ativos</span>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Escolha com quais parceiros seu score AgroRate pode ser compartilhado para análise de crédito. Você pode revogar a qualquer momento.
        </p>

        {/* Toggle all */}
        <button onClick={toggleAll}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-[#065f46]/5 border border-[#065f46]/10 mb-3 hover:bg-[#065f46]/8 transition-colors">
          <span className="text-sm font-semibold text-[#065f46]">Autorizar todos os parceiros</span>
          <div className={`w-10 h-5.5 rounded-full transition-all relative flex-shrink-0 ${consentAll ? 'bg-[#065f46]' : 'bg-slate-200'}`}
            style={{ height: 22 }}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${consentAll ? 'left-5' : 'left-0.5'}`}/>
          </div>
        </button>

        <div className="space-y-2">
          {CONSENTS.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleConsent(c.id)}>
              <div className={`w-10 rounded-full transition-all relative flex-shrink-0 ${consents[c.id] ? 'bg-[#065f46]' : 'bg-slate-200'}`}
                style={{ height: 22 }}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${consents[c.id] ? 'left-5' : 'left-0.5'}`}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-800">{c.label}</div>
                <div className="text-xs text-slate-500 truncate">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
          <span className="text-base flex-shrink-0">🔒</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>LGPD:</strong> seus dados nunca são vendidos. O compartilhamento é feito exclusivamente para análise de crédito pelo parceiro selecionado.
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ações da conta</div>
        <div className="space-y-2">
          <button onClick={handleSave}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#065f46] text-white font-semibold text-sm hover:bg-[#047857] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
            Salvar configurações
          </button>
          <a href="https://agros-os.vercel.app" target="_blank" rel="noopener noreferrer"
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
            <span className="text-base">🖥️</span>
            Gerenciar dados da fazenda no AgroOS
          </a>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-100 text-red-600 font-semibold text-sm hover:bg-red-50 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sair da conta
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-slate-300 pb-4">
        AgroRate v1.0 · Parte do ecossistema AgroCore · AgroOS · AgroRate
      </p>
    </div>
  )
}
