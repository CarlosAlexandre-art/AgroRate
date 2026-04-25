'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Offer {
  id: string
  partner: string
  partnerType: string
  name: string
  amount: number
  rate: number
  term: number
  requirements: string[]
  featured?: boolean
  minScore?: number
}

// Dados baseados no Plano Safra 2025/26 — taxas anuais convertidas para mensais
// Pronaf: 2-8% a.a. | Pronamp: 8-10% a.a. | Mercado: 12-18% a.a. (Selic 15%)
const MOCK_OFFERS: Offer[] = [
  { id: '1',  partner: 'BNB – Agroamigo',    partnerType: 'Banco',       name: 'Pronaf B – Microcrédito',        amount: 12000,    rate: 0.04, term: 24, requirements: ['CAF ativo', 'Renda até R$ 50 mil/ano'],                    minScore: 0 },
  { id: '2',  partner: 'Banco do Brasil',     partnerType: 'Banco',       name: 'Pronaf Custeio – Alimentos',     amount: 250000,   rate: 0.25, term: 12, requirements: ['CAF ativo', 'Produção de alimentos básicos'],              minScore: 100 },
  { id: '3',  partner: 'Sicoob',              partnerType: 'Cooperativa', name: 'Pronaf Mais Alimentos',          amount: 250000,   rate: 0.21, term: 36, requirements: ['CAF ativo', 'Score acima de 200'],                       minScore: 200 },
  { id: '4',  partner: 'Cresol',              partnerType: 'Cooperativa', name: 'Pronaf Custeio – Orgânicos',     amount: 250000,   rate: 0.17, term: 12, requirements: ['CAF ativo', 'Certificação orgânica'],                    minScore: 200 },
  { id: '5',  partner: 'Banco do Brasil',     partnerType: 'Banco',       name: 'Pronamp Custeio',                amount: 1500000,  rate: 0.69, term: 12, requirements: ['Score acima de 400', 'CCIR e ITR em dia'],               minScore: 400 },
  { id: '6',  partner: 'Sicredi',             partnerType: 'Cooperativa', name: 'Pronamp Custeio',                amount: 1500000,  rate: 0.69, term: 12, requirements: ['Score acima de 450', 'Propriedade documentada'],        featured: true, minScore: 450 },
  { id: '7',  partner: 'Sicredi',             partnerType: 'Cooperativa', name: 'Pronamp Investimento',           amount: 2000000,  rate: 0.64, term: 60, requirements: ['Score acima de 500', 'Projeto técnico'],                minScore: 500 },
  { id: '8',  partner: 'Bradesco E-agro',     partnerType: 'Banco',       name: 'Custeio Geral – Empresarial',    amount: 3000000,  rate: 0.82, term: 12, requirements: ['Score acima de 550', 'CPR Digital'],                    minScore: 550 },
  { id: '9',  partner: 'Banco do Brasil',     partnerType: 'Banco',       name: 'Moderinfra – Irrigação',         amount: 3000000,  rate: 0.80, term: 60, requirements: ['Score acima de 600', 'CAR ativo', 'Outorga de água'],   minScore: 600 },
  { id: '10', partner: 'Banco do Brasil',     partnerType: 'Banco',       name: 'PCA – Armazéns (até 12 mil t)', amount: 5000000,  rate: 0.69, term: 84, requirements: ['Score acima de 650', 'Projeto técnico BNDES'],          minScore: 650 },
  { id: '11', partner: 'Agrolend',            partnerType: 'Fintech',     name: 'CPR Digital – Custeio',          amount: 500000,   rate: 1.05, term: 6,  requirements: ['Contratos no AgroCore', 'Score acima de 300'],          minScore: 300 },
  { id: '12', partner: 'TerraMagna',          partnerType: 'Fintech',     name: 'Financiamento Terra Garantida',  amount: 2000000,  rate: 0.95, term: 24, requirements: ['Imóvel como garantia', 'Score acima de 400'],           minScore: 400 },
  { id: '13', partner: 'Santander',           partnerType: 'Banco',       name: 'Crédito Livre Agro (CPRF)',      amount: 10000000, rate: 1.10, term: 18, requirements: ['Score acima de 600', 'Faturamento comprovado'],         minScore: 600 },
]

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const calcParcela = (p: number, r: number, n: number) => {
  const rate = r / 100
  return (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
}

type QuodInfo = { score: number; faixa: string; capacidade: string; tipo: string; docMasked: string }

export default function CreditoPage() {
  const [score, setScore] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [propertyName, setPropertyName] = useState<string>('')
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [activityCount, setActivityCount] = useState<number>(0)
  const [quod, setQuod] = useState<QuodInfo | null>(null)
  const [quodVerifiedAt, setQuodVerifiedAt] = useState<string | null>(null)
  const [quodTipo, setQuodTipo] = useState<string | null>(null)
  const [scoreAntes, setScoreAntes] = useState<number | null>(null)
  const [docTab, setDocTab] = useState<'PF' | 'PJ'>('PF')
  const [cpf, setCpf] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [docConsent, setDocConsent] = useState(false)
  const [quodLoading, setQuodLoading] = useState(false)
  const [quodError, setQuodError] = useState('')
  const [amount, setAmount] = useState(100000)
  const [selected, setSelected] = useState<Offer | null>(null)
  const [modal, setModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [filterType, setFilterType] = useState<string>('todos')

  useEffect(() => {
    async function loadScore() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      setUserId(session.user.id)
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      const json = await res.json()
      if (res.ok) {
        setScore(json.score)
        setTotalRevenue(Number(json.totalRevenue) || 0)
        setActivityCount(Number(json.activityCount) || 0)
        if (json.quodVerifiedAt) {
          setQuodVerifiedAt(json.quodVerifiedAt)
          setQuodTipo(json.quodTipo || 'PF')
          setQuod({ score: json.quodScore, faixa: json.quodFaixa, capacidade: json.quodCapacidade, tipo: json.quodTipo || 'PF', docMasked: '' })
        }
      }
      // Load property name
      const profRes = await fetch('/api/user/profile')
      if (profRes.ok) {
        const prof = await profRes.json()
        setPropertyName(prof.name || '')
      }
    }
    loadScore()
  }, [])

  function formatCpf(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
  }

  function formatCnpj(value: string) {
    const d = value.replace(/\D/g, '').slice(0, 14)
    if (d.length <= 2) return d
    if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
    if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
    if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
    return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
  }

  async function handleVerificar() {
    if (!docConsent) { setQuodError('Autorize a consulta antes de continuar.'); return }
    const cpfDigits  = cpf.replace(/\D/g, '')
    const cnpjDigits = cnpj.replace(/\D/g, '')
    if (docTab === 'PF' && cpfDigits.length !== 11)  { setQuodError('CPF inválido. Digite 11 dígitos.'); return }
    if (docTab === 'PJ' && cnpjDigits.length !== 14) { setQuodError('CNPJ inválido. Digite 14 dígitos.'); return }
    setQuodLoading(true); setQuodError('')
    try {
      const body = docTab === 'PJ' ? { cpf: cpfDigits, cnpj: cnpjDigits } : { cpf: cpfDigits }
      const res = await fetch('/api/quod/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setQuodError(data.error || 'Erro na verificação'); return }
      setQuod(data)
      setQuodTipo(data.tipo)
      setQuodVerifiedAt(new Date().toISOString())
      setCpf(''); setCnpj('')

      // Recalcula score híbrido imediatamente
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setScoreAntes(score)
        const scoreRes = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
        const scoreJson = await scoreRes.json()
        if (scoreRes.ok) setScore(scoreJson.score)
      }
    } catch {
      setQuodError('Erro de conexão. Tente novamente.')
    } finally {
      setQuodLoading(false)
    }
  }

  const eligible = MOCK_OFFERS.filter(o => {
    const scoreOk = score === null || (o.minScore ?? 0) <= score
    const typeOk = filterType === 'todos' || o.partnerType === filterType
    return scoreOk && typeOk
  })

  async function handleRequest() {
    if (!selected) return
    setSubmitting(true)
    try {
      await fetch('/api/agrorate/credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          partnerId: null,
          partnerName: selected.partner,
          lineName: selected.name,
          requestedAmount: Math.min(amount, selected.amount),
          rate: selected.rate,
          termMonths: selected.term,
        }),
      })
    } catch { /* silent */ } finally {
      setSubmitting(false)
      setModal(false)
      setSent(true)
      setTimeout(() => setSent(false), 4000)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ofertas de Crédito</h1>
          <p className="text-slate-500 text-sm">Escolha a melhor linha para sua fazenda</p>
        </div>
        {score !== null && (
          <div className="ml-auto bg-[#065f46] text-white text-sm font-bold px-4 py-2 rounded-xl">
            Score: {score}
          </div>
        )}
      </div>

      {sent && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-medium">
          ✅ Solicitação enviada! Nossa equipe entrará em contato em até 24h.
        </div>
      )}

      {/* Verificação QUOD */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verificação de crédito</div>
          {quodVerifiedAt && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              Verificado · {quodTipo}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Vincule seu documento para enriquecer seu score: 70% dados da fazenda + 30% perfil de crédito externo.
        </p>

        {quodVerifiedAt && quod ? (
          <div className="space-y-3">
            {scoreAntes !== null && score !== null && score > scoreAntes && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                  +{score - scoreAntes}
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-800">Score atualizado!</div>
                  <div className="text-xs text-emerald-600">{scoreAntes} → {score} pts com verificação {quodTipo}</div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Score bureau</div>
                <div className="font-black text-emerald-700 text-lg">{quod.score}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Faixa</div>
                <div className="font-bold text-slate-700 text-xs leading-tight mt-1">{quod.faixa || '—'}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-500 mb-0.5">Score híbrido</div>
                <div className="font-black text-[#065f46] text-lg">{score}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Abas PF / PJ */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
              {(['PF', 'PJ'] as const).map(tab => (
                <button key={tab} onClick={() => { setDocTab(tab); setQuodError('') }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${docTab === tab ? 'bg-white text-[#065f46] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab === 'PF' ? 'Pessoa Física (CPF)' : 'Pessoa Jurídica (CNPJ)'}
                </button>
              ))}
            </div>

            {quodError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{quodError}</div>
            )}

            {docTab === 'PF' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">CPF do titular</label>
                <input type="text" inputMode="numeric" value={cpf}
                  onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]"/>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">CPF do sócio/responsável</label>
                  <input type="text" inputMode="numeric" value={cpf}
                    onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">CNPJ da empresa</label>
                  <input type="text" inputMode="numeric" value={cnpj}
                    onChange={e => setCnpj(formatCnpj(e.target.value))} placeholder="00.000.000/0000-00"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]"/>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 cursor-pointer"
              onClick={() => setDocConsent(c => !c)}>
              <div className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 border-2 flex items-center justify-center transition-colors ${docConsent ? 'bg-[#065f46] border-[#065f46]' : 'border-slate-300 bg-white'}`}>
                {docConsent && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                )}
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Autorizo</strong> o AgroRate a consultar meu perfil de crédito junto ao bureau parceiro, conforme a <strong>LGPD</strong>. Dados armazenados criptografados, nunca compartilhados com terceiros.
              </p>
            </div>

            <button onClick={handleVerificar}
              disabled={quodLoading || !docConsent || (docTab === 'PF' ? cpf.replace(/\D/g,'').length !== 11 : cnpj.replace(/\D/g,'').length !== 14)}
              className="w-full py-2.5 rounded-xl bg-[#065f46] text-white text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {quodLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Verificando...
                </>
              ) : `Verificar ${docTab === 'PF' ? 'CPF' : 'CNPJ'} e enriquecer score`}
            </button>
          </div>
        )}
      </div>

      {/* Simulador */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Simule seu crédito</h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <label className="block text-sm text-slate-600 mb-2">Qual valor você precisa?</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm select-none">R$</span>
              <input
                type="number"
                min="10000"
                step="1000"
                value={amount}
                onChange={e => {
                  const v = Number(e.target.value)
                  if (v >= 0) setAmount(v)
                }}
                onBlur={e => {
                  if (Number(e.target.value) < 10000) setAmount(10000)
                }}
                placeholder="Digite o valor"
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-lg font-bold text-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#065f46] focus:border-transparent transition-all"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Mínimo R$ 10.000 · Sem limite máximo</p>
          </div>
          <div className="w-px h-16 bg-slate-200 hidden md:block" />
          <div className="text-center flex-shrink-0">
            <div className="text-xs text-slate-500 mb-1">Melhor taxa — Pronaf</div>
            <div className="text-2xl font-black text-[#065f46]">0,04% a.m.</div>
            <div className="text-xs text-slate-400">2% a.a. · BNB Agroamigo</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {['todos', 'Banco', 'Cooperativa', 'Fintech'].map(f => (
          <button key={f} onClick={() => setFilterType(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === f ? 'bg-[#065f46] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#065f46]/30'}`}>
            {f === 'todos' ? 'Todos' : f}
          </button>
        ))}
      </div>

      {/* Ofertas */}
      <div className="space-y-3">
        {eligible.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            Nenhuma oferta disponível para esse filtro.
          </div>
        )}
        {eligible.map(offer => {
          const val = Math.min(amount, offer.amount)
          const parcela = calcParcela(val, offer.rate, offer.term)
          const isSelected = selected?.id === offer.id
          return (
            <div key={offer.id}
              className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all ${isSelected ? 'border-[#065f46] ring-2 ring-[#065f46]/20' : 'border-slate-100 hover:border-slate-200'} ${offer.featured ? 'relative overflow-hidden' : ''}`}
              onClick={() => setSelected(isSelected ? null : offer)}>
              {offer.featured && (
                <div className="absolute top-0 right-0 bg-[#065f46] text-white text-xs px-3 py-1 rounded-bl-xl font-semibold">
                  Recomendado
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-slate-900">{offer.partner}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">{offer.partnerType}</span>
                  </div>
                  <div className="text-slate-600 text-sm mb-3">{offer.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {offer.requirements.map((req, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-slate-50 text-slate-500 rounded-lg">{req}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-black text-[#065f46]">{offer.rate}%</div>
                  <div className="text-xs text-slate-500">ao mês</div>
                  <div className="mt-1.5 font-semibold text-slate-800 text-sm">até {fmt(offer.amount)}</div>
                  <div className="text-xs text-slate-500">em até {offer.term}x</div>
                </div>
              </div>

              {isSelected && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  {val < amount && (
                    <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2">
                      <span>⚠️</span>
                      <span>Simulação ajustada para {fmt(val)} — limite máximo deste parceiro. Para o valor completo de {fmt(amount)}, consulte diretamente a instituição.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Valor simulado</div>
                      <div className="font-bold text-slate-900 text-sm">{fmt(val)}</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Parcela</div>
                      <div className="font-bold text-slate-900 text-sm">{fmt(parcela)}</div>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Total</div>
                      <div className="font-bold text-[#065f46] text-sm">{fmt(parcela * offer.term)}</div>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setModal(true) }}
                    className="w-full py-3 bg-[#065f46] text-white rounded-xl font-bold hover:bg-[#047857] transition-colors">
                    Solicitar este crédito
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-lg mb-1">Confirmar Solicitação</h3>
            <p className="text-xs text-slate-400 mb-4">Revise os dados antes de enviar ao parceiro.</p>

            {/* Oferta */}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Oferta selecionada</div>
            <div className="space-y-0 mb-4 border border-slate-100 rounded-xl overflow-hidden">
              {[
                { label: 'Instituição', value: selected.partner },
                { label: 'Linha', value: selected.name },
                { label: 'Valor', value: fmt(Math.min(amount, selected.amount)) },
                { label: 'Taxa', value: `${selected.rate}% a.m.` },
                { label: 'Prazo', value: `${selected.term} meses` },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className={`flex justify-between px-4 py-2.5 text-sm ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {/* Dados compartilhados */}
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dados compartilhados com {selected.partner}</div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl overflow-hidden mb-5">
              {[
                { label: 'Score AgroRate', value: score !== null ? `${score} pts` : '—' },
                { label: 'Verificação bureau', value: quodVerifiedAt ? `Verificado (${quodTipo})` : 'Não verificado' },
                ...(propertyName ? [{ label: 'Produtor', value: propertyName }] : []),
                { label: 'Receita total', value: totalRevenue > 0 ? fmt(totalRevenue) : '—' },
                { label: 'Atividades registradas', value: activityCount > 0 ? `${activityCount} ativ.` : '—' },
              ].map(({ label, value }, i, arr) => (
                <div key={label} className={`flex justify-between px-4 py-2.5 text-sm ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-semibold ${label === 'Score AgroRate' ? 'text-[#065f46]' : label === 'Verificação bureau' && quodVerifiedAt ? 'text-blue-600' : 'text-slate-900'}`}>{value}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 mb-5">Ao confirmar, você autoriza o compartilhamento desses dados com {selected.partner} para análise de crédito, conforme a LGPD.</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(false)} disabled={submitting} className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors disabled:opacity-40">Cancelar</button>
              <button onClick={handleRequest} disabled={submitting} className="flex-1 py-3 bg-[#065f46] text-white rounded-xl font-bold hover:bg-[#047857] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                    Enviando...
                  </>
                ) : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
