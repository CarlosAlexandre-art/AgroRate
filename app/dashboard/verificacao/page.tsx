'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status = 'idle' | 'loading' | 'ok' | 'error'

type CardData = {
  key: string
  label: string
  subtitle: string
  icon: string
  endpoint: string
  planRequired: 'pro' | 'premium'
  verifiedAtField: string
  inputParam?: { name: string; label: string; placeholder: string; hint: string }
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
    inputParam: {
      name: 'cib',
      label: 'CIB do Imóvel',
      placeholder: 'Ex: 123.456.789.789-1',
      hint: 'Código do Imóvel no INCRA — consta na escritura ou CCIR.',
    },
    resultFields: [
      { label: 'Nome do Imóvel', field: 'nomeImovel' },
      { label: 'Área', field: 'area' },
      { label: 'Situação', field: 'situacao' },
      { label: 'Município/UF', field: 'municipioUf' },
      { label: 'Data Emissão', field: 'dataEmissao' },
      { label: 'Cód. INCRA', field: 'codigoINCRA' },
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
    inputParam: {
      name: 'numeroCar',
      label: 'Número CAR',
      placeholder: 'Ex: PA-1500107-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      hint: 'Número de inscrição CAR — disponível no SICAR ou na certidão do imóvel.',
    },
    resultFields: [
      { label: 'Inscrição CAR', field: 'inscricaoCAR' },
      { label: 'Situação', field: 'situacaoCadastro' },
      { label: 'Área (ha)', field: 'area' },
      { label: 'Município/UF', field: 'municipioUf' },
      { label: 'Data inscrição', field: 'dataInscricao' },
      { label: 'Módulos fiscais', field: 'modulosFiscais' },
    ],
  },
  {
    key: 'caf',
    label: 'CAF PJ',
    subtitle: 'Cadastro Nacional da Agricultura Familiar — CNPJ',
    icon: '🤝',
    endpoint: '/api/caf/verificar',
    planRequired: 'premium',
    verifiedAtField: 'cafVerifiedAt',
    resultFields: [
      { label: 'Nº CAF', field: 'numeroCaf' },
      { label: 'Razão Social', field: 'razaoSocial' },
      { label: 'Situação', field: 'situacao' },
      { label: 'Validade', field: 'dataValidade' },
      { label: 'Município/UF', field: 'municipioUf' },
    ],
  },
  {
    key: 'dapPf',
    label: 'DAP — Pessoa Física',
    subtitle: 'Declaração de Aptidão ao Pronaf — CPF',
    icon: '👨‍🌾',
    endpoint: '/api/dap/pf',
    planRequired: 'premium',
    verifiedAtField: 'dapVerifiedAt',
    resultFields: [
      { label: 'Nº DAP', field: 'numeroDAP' },
      { label: 'Tipo DAP', field: 'tipoDAP' },
      { label: 'Validade', field: 'dataValidade' },
      { label: 'Enquadramento', field: 'enquadramento' },
      { label: 'Imóvel', field: 'imovelNome' },
      { label: 'Renda Total', field: 'rendaTotal' },
    ],
  },
  {
    key: 'dapPj',
    label: 'DAP — Pessoa Jurídica',
    subtitle: 'Declaração de Aptidão ao Pronaf — CNPJ',
    icon: '🏢',
    endpoint: '/api/dap/pj',
    planRequired: 'premium',
    verifiedAtField: 'dapVerifiedAt',
    resultFields: [
      { label: 'Nº DAP', field: 'numeroDAP' },
      { label: 'Razão Social', field: 'razaoSocial' },
      { label: 'Validade', field: 'dataValidade' },
      { label: 'Município/UF', field: 'municipioUf' },
      { label: 'Representante', field: 'nomeRepresentanteLegal' },
    ],
  },
  {
    key: 'dossie',
    label: 'Dossiê QUOD Completo',
    subtitle: 'Score + pendências + protestos + ações judiciais',
    icon: '🔍',
    endpoint: '/api/dossie/verificar',
    planRequired: 'premium',
    verifiedAtField: 'dossieVerifiedAt',
    resultFields: [
      { label: 'Nome', field: 'nome' },
      { label: 'Score PF', field: 'scorePf' },
      { label: 'Pendências', field: 'pendencias' },
      { label: 'Protestos', field: 'protestos' },
      { label: 'Ações Judiciais', field: 'acoesJudiciais' },
      { label: 'Cheques s/ fundo', field: 'chequesSemFundo' },
    ],
  },
]

export default function VerificacaoPage() {
  const [plan, setPlan] = useState<string>('free')
  const [statuses, setStatuses]   = useState<Record<string, Status>>({})
  const [results, setResults]     = useState<Record<string, Record<string, string>>>({})
  const [errors, setErrors]       = useState<Record<string, string>>({})
  const [verifiedAts, setVerifiedAts] = useState<Record<string, string>>({})
  const [inputs, setInputs]       = useState<Record<string, string>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const res = await fetch('/api/perfil/me')
      if (res.ok) {
        const data = await res.json()
        setPlan(data.plan ?? 'free')
        const vats: Record<string, string> = {}
        if (data.agroRate?.quodVerifiedAt)   vats.quod   = data.agroRate.quodVerifiedAt
        if (data.agroRate?.cafirVerifiedAt)  vats.cafir  = data.agroRate.cafirVerifiedAt
        if (data.agroRate?.carVerifiedAt)    vats.car    = data.agroRate.carVerifiedAt
        if (data.agroRate?.cafVerifiedAt)    vats.caf    = data.agroRate.cafVerifiedAt
        if (data.agroRate?.dapVerifiedAt)  { vats.dapPf  = data.agroRate.dapVerifiedAt; vats.dapPj = data.agroRate.dapVerifiedAt }
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

    if (card.inputParam) {
      const val = (inputs[card.key] || '').trim()
      if (!val) {
        setErrors(e => ({ ...e, [card.key]: `Informe o ${card.inputParam!.label} antes de verificar.` }))
        return
      }
    }

    setStatuses(s => ({ ...s, [card.key]: 'loading' }))
    setErrors(e => ({ ...e, [card.key]: '' }))

    const body = card.inputParam
      ? JSON.stringify({ [card.inputParam.name]: inputs[card.key] || '' })
      : undefined

    try {
      const res = await fetch(card.endpoint, {
        method: 'POST',
        headers: card.inputParam ? { 'Content-Type': 'application/json' } : {},
        body,
      })
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

                  {/* Input para cards que precisam de parâmetro manual */}
                  {!locked && card.inputParam && status !== 'ok' && (
                    <div className="mt-3 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        {card.inputParam.label}
                      </label>
                      <input
                        type="text"
                        value={inputs[card.key] || ''}
                        onChange={e => setInputs(v => ({ ...v, [card.key]: e.target.value }))}
                        placeholder={card.inputParam.placeholder}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46] bg-slate-50"
                      />
                      <p className="text-[10px] text-slate-400">{card.inputParam.hint}</p>
                    </div>
                  )}

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
                    <a href="/dashboard/assinaturas"
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
