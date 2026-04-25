'use client'

import { useEffect, useState, useRef } from 'react'

const SCORE_COLOR = (s: number) =>
  s >= 900 ? '#b45309' : s >= 750 ? '#065f46' : s >= 600 ? '#0d9488' : s >= 450 ? '#1d4ed8' : s >= 300 ? '#c2410c' : '#b91c1c'
const SCORE_LABEL = (s: number) =>
  s >= 900 ? 'Elite' : s >= 750 ? 'Alto' : s >= 600 ? 'Bom' : s >= 450 ? 'Regular' : s >= 300 ? 'Baixo' : 'Crítico'

type HistEntry = { month: string; score: number; date: string }
type Event = { icon: string; desc: string; pts: string; date: string; rawDate: string }

function LineChart({ data }: { data: HistEntry[] }) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center h-[120px] text-slate-300 text-sm">
      Acumulando dados…
    </div>
  )

  const W = 480, H = 120, PAD = 20
  const scores = data.map(d => d.score)
  const min = Math.max(0, Math.min(...scores) - 60)
  const max = Math.min(1000, Math.max(...scores) + 60)
  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2)
  const y = (s: number) => H - PAD - ((s - min) / (max - min)) * (H - PAD * 2)
  const pts = data.map((d, i) => `${x(i)},${y(d.score)}`)
  const area = [`${x(0)},${H - PAD}`, ...pts, `${x(data.length - 1)},${H - PAD}`].join(' ')
  const lastColor = SCORE_COLOR(data[data.length - 1].score)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lastColor} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={lastColor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[300, 450, 600, 750, 900].map(v => {
        if (v < min || v > max) return null
        return (
          <g key={v}>
            <line x1={PAD} y1={y(v)} x2={W - PAD} y2={y(v)} stroke="#f1f5f9" strokeWidth="1"/>
            <text x={PAD - 4} y={y(v) + 3} textAnchor="end" fill="#cbd5e1" fontSize="8">{v}</text>
          </g>
        )
      })}
      <polygon points={area} fill="url(#lg)"/>
      <polyline points={pts.join(' ')} fill="none" stroke={lastColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.score)} r="5" fill="white" stroke={SCORE_COLOR(d.score)} strokeWidth="2.5"/>
          <text x={x(i)} y={y(d.score) - 9} textAnchor="middle" fill={SCORE_COLOR(d.score)} fontSize="9" fontWeight="700">{d.score}</text>
        </g>
      ))}
    </svg>
  )
}

export default function HistoricoPage() {
  const [loading, setLoading] = useState(true)
  const [trendHistory, setTrendHistory] = useState<HistEntry[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [currentScore, setCurrentScore] = useState<number | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/agrorate/historico')
      .then(r => r.json())
      .then(data => {
        if (data.trendHistory) setTrendHistory(data.trendHistory)
        if (data.events) setEvents(data.events)
        if (data.currentScore) setCurrentScore(data.currentScore)
      })
      .finally(() => setLoading(false))
  }, [])

  function handlePrint() {
    window.print()
  }

  const gain = trendHistory.length >= 2
    ? trendHistory[trendHistory.length - 1].score - trendHistory[0].score
    : 0

  if (loading) return (
    <div className="p-5 max-w-4xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse"/>)}
    </div>
  )

  if (!currentScore) return (
    <div className="p-5 max-w-xl mx-auto pt-12 text-center">
      <div className="text-4xl mb-4">📊</div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Sem histórico ainda</h2>
      <p className="text-slate-500 text-sm">Configure sua propriedade no AgroOS para começar a gerar histórico de score.</p>
    </div>
  )

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: fixed; inset: 0; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div id="print-area" ref={printRef} className="p-5 max-w-4xl mx-auto space-y-4">

        {/* Header de impressão (oculto na tela) */}
        <div className="hidden print:block mb-4">
          <div className="text-xl font-black text-slate-800">Relatório de Score — AgroRate</div>
          <div className="text-sm text-slate-500">Gerado em {new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}</div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Score atual</div>
            <div className="text-4xl font-black" style={{ color: SCORE_COLOR(currentScore) }}>{currentScore}</div>
            <div className="text-sm font-semibold mt-1" style={{ color: SCORE_COLOR(currentScore) }}>{SCORE_LABEL(currentScore)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Evolução</div>
            <div className={`text-4xl font-black ${gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {gain >= 0 ? '+' : ''}{gain}
            </div>
            <div className="text-sm text-slate-400 mt-1">
              {trendHistory.length >= 2 ? `desde ${trendHistory[0].month}` : 'pontos ganhos'}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Score inicial</div>
            <div className="text-4xl font-black text-slate-400">{trendHistory[0]?.score ?? currentScore}</div>
            <div className="text-sm text-slate-400 mt-1">{trendHistory[0]?.month ?? 'Hoje'}</div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Evolução do score — {trendHistory.length > 1 ? `${trendHistory.length} meses` : 'histórico'}
            </div>
            <button
              onClick={handlePrint}
              className="no-print flex items-center gap-1.5 text-xs font-semibold text-[#065f46] border border-[#065f46]/30 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Exportar PDF
            </button>
          </div>
          <LineChart data={trendHistory} />
          {trendHistory.length >= 2 && (
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-4">
              {trendHistory.map(h => <span key={h.month}>{h.month}</span>)}
            </div>
          )}
          {trendHistory.length < 2 && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              O gráfico será exibido após o segundo mês de uso.
            </p>
          )}
        </div>

        {/* Tabela mensal */}
        {trendHistory.length >= 2 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detalhamento mensal</div>
            </div>
            <div className="divide-y divide-slate-50">
              {[...trendHistory].reverse().map(({ month, score: s }, i, arr) => {
                const prev = arr[i + 1]?.score
                const delta = prev != null ? s - prev : null
                return (
                  <div key={month} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="text-sm font-semibold text-slate-600 w-16">{month}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s/1000)*100}%`, background: SCORE_COLOR(s) }}/>
                    </div>
                    {delta !== null && delta !== 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${delta > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    )}
                    <div className="text-right flex-shrink-0 w-20">
                      <div className="font-black text-lg" style={{ color: SCORE_COLOR(s) }}>{s}</div>
                      <div className="text-[10px] text-slate-400">{SCORE_LABEL(s)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Eventos reais */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Eventos que impactaram o score</div>
          {events.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-slate-400">Nenhuma atividade ou receita registrada ainda.</p>
              <p className="text-xs text-slate-300 mt-1">Registre dados no AgroOS para ver o histórico aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-base flex-shrink-0">{ev.icon}</div>
                    {i < events.length - 1 && <div className="w-px h-4 bg-slate-100 mt-1"/>}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="text-sm text-slate-700">{ev.desc}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{ev.date}</div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg flex-shrink-0 mt-0.5">{ev.pts} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
