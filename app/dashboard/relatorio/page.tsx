'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ScoreData = {
  score: number; category: string
  productionScore: number; efficiencyScore: number
  behaviorScore: number; operationalScore: number
  totalRevenue: number; marginRate: number
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  ELITE:    { label: 'Elite',    color: '#7c3aed', bg: 'bg-violet-100' },
  HIGH:     { label: 'Alto',     color: '#065f46', bg: 'bg-emerald-100' },
  GOOD:     { label: 'Bom',      color: '#0369a1', bg: 'bg-sky-100' },
  REGULAR:  { label: 'Regular',  color: '#b45309', bg: 'bg-amber-100' },
  LOW:      { label: 'Baixo',    color: '#dc2626', bg: 'bg-red-100' },
  CRITICAL: { label: 'Crítico',  color: '#991b1b', bg: 'bg-red-200' },
}

const DIMENSIONS = [
  { key: 'productionScore',  label: 'Produção',    weight: '30%', desc: 'Volume, diversificação e regularidade da produção agropecuária' },
  { key: 'efficiencyScore',  label: 'Eficiência',  weight: '25%', desc: 'Margem operacional, custo por hectare e produtividade' },
  { key: 'behaviorScore',    label: 'Comportamento', weight: '25%', desc: 'Histórico de pagamentos, adimplência e uso de crédito' },
  { key: 'operationalScore', label: 'Operacional', weight: '20%', desc: 'Documentação, regularidade ambiental e fundiária' },
]

const ELIGIBLE_LINES = [
  { name: 'Pronaf Custeio', minScore: 0, rate: '3–6% a.a.', max: 'R$ 250 mil', institution: 'BB / Sicoob' },
  { name: 'Pronamp Custeio', minScore: 500, rate: '8–10% a.a.', max: 'R$ 1,5 mi', institution: 'BB / Sicredi' },
  { name: 'Moderinfra', minScore: 600, rate: '~10% a.a.', max: 'R$ 3 mi', institution: 'Banco do Brasil' },
  { name: 'Pronamp Investimento', minScore: 550, rate: '8–10% a.a.', max: 'R$ 2 mi', institution: 'Sicredi' },
  { name: 'Crédito Livre (mercado)', minScore: 300, rate: '12–18% a.a.', max: 'Sem limite', institution: 'Bradesco / Santander' },
  { name: 'CPR Digital (Fintech)', minScore: 250, rate: '12–16% a.a.', max: 'R$ 500 mil', institution: 'Agrolend / TerraMagna' },
]

const RECOMMENDATIONS: Record<string, string[]> = {
  ELITE:    ['Negocie taxas personalizadas com gerentes', 'Acesse Moderinfra e PCA para grandes investimentos', 'Explore CPR Digital para liquidez imediata'],
  HIGH:     ['Solicite revisão de limite no Pronamp', 'Formalize documentação para Moderinfra', 'Mantenha pagamentos em dia para manter o score'],
  GOOD:     ['Registre todos os custos no AgroOS para subir eficiência', 'Renove CAR e ITR antes do vencimento', 'Solicite Pronamp com score atual'],
  REGULAR:  ['Prioridade: regularizar documentos vencidos', 'Registre safras anteriores no AgroOS', 'Considere Pronaf enquanto reconstrói score'],
  LOW:      ['Regularize pendências ambientais (CAR)', 'Comece com microcrédito (Pronaf B)', 'Use a IA para um plano de recuperação'],
  CRITICAL: ['Entre em contato com a equipe AgroRate', 'Foco em regularização fundiária', 'Evite solicitar crédito agora — reconstrua o score'],
}

export default function RelatorioPage() {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('Produtor')
  const [printing, setPrinting] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Produtor'
      setUserName(name)
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      if (res.ok) setScoreData(await res.json())
      setLoading(false)
    }
    load()
  }, [])

  function handlePrint() {
    setPrinting(true)
    setTimeout(() => { window.print(); setPrinting(false) }, 100)
  }

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const catMeta = scoreData ? (CATEGORY_META[scoreData.category] ?? CATEGORY_META.REGULAR) : null
  const eligible = scoreData ? ELIGIBLE_LINES.filter(l => l.minScore <= scoreData.score) : []
  const recs = scoreData ? (RECOMMENDATIONS[scoreData.category] ?? RECOMMENDATIONS.REGULAR) : []

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="h-8 w-64 bg-slate-200 rounded-xl animate-pulse mb-4"/>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"/>)}
        </div>
      </div>
    )
  }

  if (!scoreData) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📄</div>
          <div className="font-bold text-amber-800 mb-2">Score não calculado</div>
          <p className="text-amber-700 text-sm">Registre sua propriedade e receitas no AgroOS para gerar seu relatório.</p>
          <a href="https://agros-os.vercel.app" target="_blank" rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-2 bg-[#065f46] text-white rounded-xl text-sm font-semibold">
            Acessar AgroOS →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5 print:p-0 print:space-y-4">
      {/* Toolbar (não aparece no print) */}
      <div className="flex items-center gap-4 print:hidden">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Relatório AgroRate</h1>
          <p className="text-slate-500 text-sm">Perfil completo de crédito rural · {today}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={handlePrint} disabled={printing}
            className="flex items-center gap-2 px-4 py-2 bg-[#065f46] text-white rounded-xl text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-60">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            {printing ? 'Preparando...' : 'Salvar PDF'}
          </button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-5">
        {/* Header do relatório */}
        <div className="bg-[#065f46] rounded-2xl p-6 text-white print:rounded-none">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-bold opacity-60 uppercase tracking-widest mb-1">Relatório de Score de Crédito Rural</div>
              <div className="text-2xl font-black mb-1">{userName}</div>
              <div className="text-sm opacity-70">Gerado em {today} · AgroRate v1.0</div>
              <div className="text-xs opacity-50 mt-1">Parte do ecossistema AgroOS · AgroCore · AgroRate</div>
            </div>
            <div className="text-right">
              <div className="text-7xl font-black leading-none">{scoreData.score}</div>
              <div className={`inline-block text-sm font-bold px-3 py-1 rounded-xl mt-2 ${catMeta?.bg} text-slate-800`}>
                {catMeta?.label}
              </div>
            </div>
          </div>
        </div>

        {/* Score gauge visual */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Posicionamento no Ranking</div>
          <div className="relative h-4 bg-gradient-to-r from-red-400 via-amber-400 via-sky-400 to-violet-500 rounded-full mb-3">
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white border-4 border-[#065f46] rounded-full shadow-lg transition-all"
              style={{ left: `${(scoreData.score / 1000) * 100}%` }}/>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            {['Crítico', 'Baixo', 'Regular', 'Bom', 'Alto', 'Elite'].map(l => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>

        {/* Dimensões */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="font-bold text-slate-900 mb-5 text-sm uppercase tracking-wider">Análise por Dimensão</div>
          <div className="space-y-4">
            {DIMENSIONS.map(dim => {
              const val = scoreData[dim.key as keyof ScoreData] as number
              const pct = Math.round(val)
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">{dim.label}</span>
                      <span className="ml-2 text-xs text-slate-400">peso {dim.weight}</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">{val}/100</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 75 ? '#065f46' : pct >= 50 ? '#0284c7' : pct >= 35 ? '#d97706' : '#dc2626'
                      }}/>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{dim.desc}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Linhas elegíveis */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="font-bold text-slate-900 mb-5 text-sm uppercase tracking-wider">Linhas de Crédito Disponíveis — Plano Safra 2025/26</div>
          <div className="space-y-2">
            {ELIGIBLE_LINES.map(line => {
              const ok = line.minScore <= scoreData.score
              return (
                <div key={line.name} className={`flex items-center gap-4 p-3 rounded-xl ${ok ? 'bg-emerald-50' : 'bg-slate-50 opacity-50'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                    {ok
                      ? <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      : <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    }
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800 text-sm">{line.name}</div>
                    <div className="text-xs text-slate-500">{line.institution}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-semibold text-slate-700">{line.rate}</div>
                    <div className="text-slate-400">até {line.max}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-400 mt-3">Dados do Plano Safra 2025/26 · Taxas sujeitas à disponibilidade das instituições</p>
        </div>

        {/* Recomendações */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Recomendações Personalizadas</div>
          <div className="space-y-3">
            {recs.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#065f46]/5 rounded-xl">
                <span className="w-6 h-6 rounded-full bg-[#065f46] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-slate-700">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dados financeiros */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Dados Financeiros (via AgroOS)</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Receita total registrada</div>
              <div className="text-xl font-black text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(scoreData.totalRevenue)}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Margem operacional</div>
              <div className="text-xl font-black text-[#065f46]">
                {(scoreData.marginRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center text-xs text-slate-300 py-4 border-t border-slate-100">
          AgroRate · Score calculado com base em dados do AgroOS · Relatório gerado em {today}
          <br/>Este documento é informativo. Aprovações de crédito são de responsabilidade das instituições financeiras.
        </div>
      </div>
    </div>
  )
}
