'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type UserData = { name: string; email: string; createdAt: string }

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
  const [consents, setConsents] = useState<Record<string, boolean>>({
    sicredi: false, bb: false, sicoob: false, bradesco: false, santander: false, agrocred: false,
  })
  const [saved, setSaved] = useState(false)
  const [consentAll, setConsentAll] = useState(false)
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
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const activeCount = Object.values(consents).filter(Boolean).length

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
