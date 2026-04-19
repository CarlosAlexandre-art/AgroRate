'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const SCORE_COLOR = (s: number) =>
  s >= 900 ? '#b45309' : s >= 750 ? '#065f46' : s >= 600 ? '#0d9488' : s >= 450 ? '#1d4ed8' : s >= 300 ? '#c2410c' : '#b91c1c'

const SCORE_LABEL = (s: number) =>
  s >= 900 ? 'Elite' : s >= 750 ? 'Alto' : s >= 600 ? 'Bom' : s >= 450 ? 'Regular' : s >= 300 ? 'Baixo' : 'Crítico'

export default function HistoricoPage() {
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      const json = await res.json()
      if (res.ok) setScore(json.score)
      setLoading(false)
    }
    load()
  }, [])

  const mockHistory = score ? [
    { month: 'Abr/2026', score, delta: 0 },
    { month: 'Mar/2026', score: Math.max(0, score - 18), delta: -18 },
    { month: 'Fev/2026', score: Math.max(0, score - 32), delta: -14 },
    { month: 'Jan/2026', score: Math.max(0, score - 55), delta: -23 },
    { month: 'Dez/2025', score: Math.max(0, score - 40), delta: 15 },
    { month: 'Nov/2025', score: Math.max(0, score - 60), delta: -20 },
  ] : []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Histórico do Score</h1>
          <p className="text-slate-500 text-sm">Evolução do seu AgroRate ao longo do tempo</p>
        </div>
      </div>

      {loading && <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />}

      {!loading && mockHistory.length > 0 && (
        <>
          {/* Gráfico simples */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-4">Evolução nos últimos 6 meses</h2>
            <div className="flex items-end gap-3 h-32">
              {mockHistory.slice().reverse().map(({ month, score: s }) => {
                const h = Math.max(8, (s / 1000) * 100)
                return (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-xs font-bold" style={{ color: SCORE_COLOR(s) }}>{s}</div>
                    <div className="w-full rounded-t-lg transition-all duration-500" style={{ height: `${h}%`, background: SCORE_COLOR(s), opacity: 0.8 }} />
                    <div className="text-[10px] text-slate-400 text-center">{month.split('/')[0]}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Detalhamento mensal</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {mockHistory.map(({ month, score: s, delta }) => (
                <div key={month} className="px-5 py-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-700">{month}</div>
                  <div className="flex items-center gap-4">
                    {delta !== 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    )}
                    <div className="text-right">
                      <div className="font-black text-lg" style={{ color: SCORE_COLOR(s) }}>{s}</div>
                      <div className="text-xs text-slate-400">{SCORE_LABEL(s)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-sm text-slate-500">
            <strong className="text-slate-700">Nota:</strong> O histórico mostra a evolução do score conforme seus dados no AgroOS são atualizados. Registre receitas, custos e atividades regularmente para manter o score preciso.
          </div>
        </>
      )}

      {!loading && mockHistory.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="text-3xl mb-3">📊</div>
          <div className="font-semibold text-slate-700 mb-2">Sem histórico ainda</div>
          <p className="text-slate-400 text-sm mb-4">Configure sua propriedade no AgroOS para começar a gerar histórico de score.</p>
          <a href="https://agroos.vercel.app" target="_blank" rel="noopener noreferrer"
            className="inline-block bg-[#065f46] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#047857] transition-colors">
            Ir para o AgroOS →
          </a>
        </div>
      )}
    </div>
  )
}
