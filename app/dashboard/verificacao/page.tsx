'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'loading' | 'ok' | 'error' | 'pending'

type CardData = {
  key: string
  label: string
  subtitle: string
  icon: string
  endpoint: string
  planRequired: 'pro' | 'premium'
  verifiedAtField: string
  resultFields: { label: string; field: string }[]
}

const CARDS: CardData[] = [
  {
    key: 'quod',
    label: 'QUOD / Bureau de Crédito',
    subtitle: 'Score de crédito PF/PJ via Direct Data',
    icon: '📊',
    endpoint: '/api/quod/verificar',
    planRequired: 'pro',
    verifiedAtField: 'quodVerifiedAt',
    resultFields: [
      { label: 'Score', field: 'score' },
      { label: 'Faixa', field: 'faixa' },
      { label: 'Capacidade', field: 'capacidade' },
    ],
  },
  {
    key: 'cafir',
    label: 'CAFIR',
    subtitle: 'Cadastro de Imóveis Rurais — INCRA/RFB',
    icon: '🗺️',
    endpoint: '/api/cafir/verificar',
    planRequired: 'premium',
    verifiedAtField: 'cafirVerifiedAt',
    resultFields: [
      { label: 'Número', field: 'numero' },
      { label: 'Área', field: 'area' },
      { label: 'Situação', field: 'situacao' },
      { label: 'Município/UF', field: 'municipioUf' },
    ],
  },
  {
    key: 'car',
    label: 'CAR',
    subtitle: 'Cadastro Ambiental Rural — SICAR',
    icon: '🌿',
    endpoint: '/api/car/verificar',
    planRequired: 'premium',
    verifiedAtField: 'carVerifiedAt',
    resultFields: [
      { label: 'Número', field: 'numero' },
      { label: 'Situação', field: 'situacao' },
      { label: 'Área total', field: 'areaTotal' },
    ],
  },
  {
    key: 'caf',
    label: 'CAF / DAP',
    subtitle: 'Cadastro da Agricultura Familiar / Pronaf',
    icon: '👨‍🌾',
    endpoint: '/api/caf/verificar',
    planRequired: 'premium',
    verifiedAtField: 'cafVerifiedAt',
    resultFields: [
      { label: 'Número', field: 'numero' },
      { label: 'Situação', field: 'situacao' },
      { label: 'Validade', field: 'validade' },
    ],
  },
  {
    key: 'dossie',
    label: 'Dossiê Completo',
    subtitle: 'Perfil completo: endereços, veículos, imóveis',
    icon: '🔍',
    endpoint: '/api/dossie/verificar',
    planRequired: 'premium',
    verifiedAtField: 'dossieVerifiedAt',
    resultFields: [
      { label: 'Endereços', field: 'totalEnderecos' },
      { label: 'Telefones', field: 'totalTelefones' },
      { label: 'Veículos', field: 'totalVeiculos' },
      { label: 'Imóveis', field: 'totalImoveis' },
    ],
  },
]

export default function VerificacaoPage() {
  const [plan, setPlan] = useState<string>('free')
  const [statuses, setStatuses]   = useState<Record<string, Status>>({})
  const [results, setResults]     = useState<Record<string, Record<string, string>>>({})
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [verifiedAts, setVerifiedAts] = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const res = await fetch('/api/perfil/me')
      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan ?? 'free')
        const vats: Record<string, string> = {}
        if (data.agroRate?.quodVerifiedAt)  vats.quod   = data.agroRate.quodVerifiedAt
        if (data.agroRate?.cafirVerifiedAt) vats.cafir  = data.agroRate.cafirVerifiedAt
        if (data.agroRate?.carVerifiedAt)   vats.car    = data.agroRate.carVerifiedAt
        if (data.agroRate?.cafVerifiedAt)   vats.caf    = data.agroRate.cafVerifiedAt
        if (data.agroRate?.dossieVerifiedAt) vats.dossie = data.agroRate.dossieVerifiedAt
        setVerifiedAts(vats)
      }
    })
  }, [])

  const isPlanOk = (required: 'pro' | 'premium') => {
    if (required === 'pro')     return ['pro', 'premium', 'enterprise', 'admin'].includes(plan)
    if (required === 'premium') return ['premium', 'enterprise', 'admin'].includes(plan)
    return false
  }

  async function handleVerify(card: CardData) {
    if (!isPlanOk(card.planRequired)) return

    setStatuses(s => ({ ...s, [card.key]: 'loading' }))
    setErrors(e => ({ ...e, [card.key]: '' }))

    try {
      const res = await fetch(card.endpoint, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setErrors(e => ({ ...e, [card.key]: data.error || 'Erro desconhecido' }))
        setStatuses(s => ({ ...s, [card.key]: 'error' }))
        return
      }

      const mapped: Record<string, string> = {}
      for (const f of card.resultFields) {
        const v = data[f.field]
        if (f.field === 'municipioUf') mapped[f.field] = [data.municipio, data.uf].filter(Boolean).join(' / ')
        else mapped[f.field] = v != null ? String(v) : '–'
      }
      setResults(r => ({ ...r, [card.key]: mapped }))
      setVerifiedAts(v => ({ ...v, [card.key]: new Date().toISOString() }))
      setStatuses(s => ({ ...s, [card.key]: 'ok' }))
    } catch (err) {
      setErrors(e => ({ ...e, [card.key]: err instanceof Error ? err.message : 'Erro de conexão' }))
      setStatuses(s => ({ ...s, [card.key]: 'error' }))
    }
  }

  const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : null

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#065f46] to-emerald-700 rounded-2xl p-5 text-white">
        <div className="text-2xl mb-1">🛡️</div>
        <h1 className="text-xl font-bold mb-1">Verificação Documental</h1>
        <p className="text-emerald-100 text-sm leading-relaxed">
          Consulte sua situação nos principais cadastros rurais brasileiros. Cada verificação aumenta seu score e credibilidade junto às instituições financeiras.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs bg-white/15 px-2.5 py-1 rounded-lg font-semibold">Plano atual: <strong className="uppercase">{plan}</strong></span>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {CARDS.map(card => {
          const locked    = !isPlanOk(card.planRequired)
          const status    = statuses[card.key] || 'idle'
          const result    = results[card.key]
          const error     = errors[card.key]
          const verifiedAt = verifiedAts[card.key]

          return (
            <div key={card.key}
              className={`bg-white rounded-2xl border-2 transition-all ${locked ? 'border-slate-100 opacity-70' : status === 'ok' ? 'border-emerald-300' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className="p-4 flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${status === 'ok' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                  {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{card.label}</span>
                    {locked && (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase">
                        {card.planRequired === 'premium' ? 'Premium' : 'Pro'}
                      </span>
                    )}
                    {!locked && verifiedAt && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        Verificado em {fmtDate(verifiedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{card.subtitle}</p>

                  {/* Resultado */}
                  {status === 'ok' && result && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {card.resultFields.map(f => (
                        <div key={f.field} className="bg-slate-50 rounded-xl px-3 py-2">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{f.label}</div>
                          <div className="text-sm font-bold text-slate-800 mt-0.5 truncate">{result[f.field] || '–'}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Erro */}
                  {status === 'error' && error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</div>
                  )}
                </div>

                {/* Botão */}
                <div className="flex-shrink-0">
                  {locked ? (
                    <a href="/planos"
                      className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl hover:bg-amber-100 transition">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Upgrade
                    </a>
                  ) : (
                    <button
                      onClick={() => handleVerify(card)}
                      disabled={status === 'loading'}
                      className={`text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50 ${
                        status === 'ok'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-[#065f46] text-white hover:bg-[#047857]'
                      }`}
                    >
                      {status === 'loading' ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Consultando
                        </span>
                      ) : status === 'ok' ? 'Atualizar' : verifiedAt ? 'Revalidar' : 'Verificar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">ℹ️</span>
        <div>
          <div className="font-semibold text-blue-800 text-sm mb-1">Como funciona</div>
          <p className="text-xs text-blue-700 leading-relaxed">
            QUOD está disponível no plano Pro. CAFIR, CAR, CAF/DAP e Dossiê estão no plano Premium. Cada verificação salva os dados automaticamente e impacta positivamente no seu AgroRate Score.
          </p>
        </div>
      </div>
    </div>
  )
}
