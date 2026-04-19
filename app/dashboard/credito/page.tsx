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

const MOCK_OFFERS: Offer[] = [
  { id: '1', partner: 'Sicredi', partnerType: 'Cooperativa', name: 'Crédito Rural Premium', amount: 200000, rate: 1.0, term: 12, requirements: ['Score AgroRate acima de 750', 'Propriedade documentada'], featured: true, minScore: 750 },
  { id: '2', partner: 'Banco do Brasil', partnerType: 'Banco', name: 'Finagro Moderinfra', amount: 150000, rate: 1.2, term: 10, requirements: ['Score AgroRate acima de 600'], minScore: 600 },
  { id: '3', partner: 'Sicoob', partnerType: 'Cooperativa', name: 'Crédito de Insumos', amount: 100000, rate: 1.4, term: 8, requirements: ['Score AgroRate acima de 600'], minScore: 600 },
  { id: '4', partner: 'Bradesco', partnerType: 'Banco', name: 'Financiamento Agro', amount: 180000, rate: 1.5, term: 18, requirements: ['Score AgroRate acima de 500'], minScore: 500 },
  { id: '5', partner: 'AgroCred', partnerType: 'Fintech', name: 'Antecipação de Recebíveis', amount: 50000, rate: 1.8, term: 3, requirements: ['Contratos firmados no AgroCore'], minScore: 300 },
  { id: '6', partner: 'Santander', partnerType: 'Banco', name: 'Custeio Agrícola', amount: 80000, rate: 1.6, term: 6, requirements: ['Score acima de 450'], minScore: 450 },
]

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const calcParcela = (p: number, r: number, n: number) => {
  const rate = r / 100
  return (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
}

export default function CreditoPage() {
  const [score, setScore] = useState<number | null>(null)
  const [amount, setAmount] = useState(100000)
  const [selected, setSelected] = useState<Offer | null>(null)
  const [modal, setModal] = useState(false)
  const [sent, setSent] = useState(false)
  const [filterType, setFilterType] = useState<string>('todos')

  useEffect(() => {
    async function loadScore() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      const json = await res.json()
      if (res.ok) setScore(json.score)
    }
    loadScore()
  }, [])

  const eligible = MOCK_OFFERS.filter(o => {
    const scoreOk = score === null || (o.minScore ?? 0) <= score
    const typeOk = filterType === 'todos' || o.partnerType === filterType
    return scoreOk && typeOk
  })

  function handleRequest() {
    setModal(false)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
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

      {/* Simulador */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-4">Simule seu crédito</h2>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 w-full">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>Valor desejado</span>
              <span className="font-bold text-[#065f46] text-lg">{fmt(amount)}</span>
            </div>
            <input
              type="range" min="10000" max="1000000" step="10000" value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#065f46]"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>R$ 10k</span><span>R$ 1M</span>
            </div>
          </div>
          <div className="w-px h-12 bg-slate-200 hidden md:block" />
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">Melhor taxa disponível</div>
            <div className="text-2xl font-black text-[#065f46]">1,0% a.m.</div>
            <div className="text-xs text-slate-400">Sicredi</div>
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
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">Valor</div>
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
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-bold text-slate-900 text-lg mb-4">Confirmar Solicitação</h3>
            <div className="space-y-3 mb-6">
              {[
                { label: 'Instituição', value: selected.partner },
                { label: 'Linha', value: selected.name },
                { label: 'Valor', value: fmt(Math.min(amount, selected.amount)) },
                { label: 'Taxa', value: `${selected.rate}% a.m.` },
                { label: 'Prazo', value: `${selected.term} meses` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-slate-100 text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mb-5">Seus dados e score AgroRate serão compartilhados com {selected.partner} para análise.</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(false)} className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleRequest} className="flex-1 py-3 bg-[#065f46] text-white rounded-xl font-bold hover:bg-[#047857] transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
