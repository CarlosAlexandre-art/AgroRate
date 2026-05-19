'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Plano {
  id: string
  safra: string
  cultura?: string
  areaHectares?: number
  necessidades?: string
  totalNecessidade?: number
  status: string
  iaAnalise?: string
  createdAt: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const CULTURAS_LIST = ['Soja', 'Milho', 'Algodão', 'Café', 'Cana', 'Trigo', 'Feijão', 'Arroz', 'Horticultura', 'Fruticultura', 'Pecuária', 'Outro']

type AnaliseState = 'idle' | 'loading' | 'done' | 'error' | 'rate_limit'

export default function PlannerCreditoPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState<number | null>(null)
  const [analiseState, setAnaliseState] = useState<AnaliseState>('idle')
  const [analise, setAnalise] = useState('')
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [planoAtivo, setPlanoAtivo] = useState<Plano | null>(null)

  const [form, setForm] = useState({
    safra: '2025/26',
    cultura: 'Soja',
    areaHectares: '',
    necessidades: '',
    totalNecessidade: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      try {
        const s = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
        if (s.ok) { const d = await s.json(); setScore(d.score) }
      } catch { /* ok */ }
    })
    load()
  }, [])

  async function load() {
    try {
      const r = await fetch('/api/planner-credito')
      if (r.ok) { const d = await r.json(); setPlanos(d.planos ?? []) }
    } finally { setLoading(false) }
  }

  const analisar = useCallback(async () => {
    setAnaliseState('loading'); setAnalise(''); setError(''); setCountdown(0)
    try {
      const r = await fetch('/api/planner-credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          action: 'analisar',
          areaHectares: form.areaHectares ? parseFloat(form.areaHectares) : null,
          totalNecessidade: form.totalNecessidade ? parseFloat(form.totalNecessidade) : null,
          scoreAtual: score,
        }),
      })
      const d = await r.json()
      if (r.status === 429 && d.error === 'RATE_LIMIT') {
        setAnaliseState('rate_limit'); setCountdown(d.retryAfter ?? 15)
      } else if (r.ok) {
        setAnaliseState('done'); setAnalise(d.analise); setPlanoAtivo(d.plano); load()
      } else {
        setAnaliseState('error'); setError(d.error ?? 'Erro ao analisar')
      }
    } catch (e: any) { setAnaliseState('error'); setError(e.message) }
  }, [form, score])

  useEffect(() => {
    if (countdown <= 0) {
      if (analiseState === 'rate_limit') analisar()
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, analiseState, analisar])

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #04100a 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      {/* Glow central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(52,211,153,0.04) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pt-2">
          <div className="text-xs font-bold tracking-widest text-emerald-400/70 uppercase mb-1">IA + Crédito Rural</div>
          <h1 className="text-3xl font-black tracking-tight" style={{
            background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Planner de Crédito</h1>
          <p className="text-sm text-slate-400 mt-1">IA analisa suas necessidades e recomenda a estratégia de crédito ideal para a safra</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plano da Safra</div>
                {score && (
                  <div className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
                    Score: {score}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Safra</label>
                <select value={form.safra} onChange={e => setForm(f => ({ ...f, safra: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {['2024/25', '2025/26', '2026/27'].map(s => <option key={s} value={s} style={{ background: '#0f172a' }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Cultura principal</label>
                <select value={form.cultura} onChange={e => setForm(f => ({ ...f, cultura: e.target.value }))}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {CULTURAS_LIST.map(c => <option key={c} value={c} style={{ background: '#0f172a' }}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Área (ha)</label>
                  <input type="number" value={form.areaHectares} onChange={e => setForm(f => ({ ...f, areaHectares: e.target.value }))}
                    placeholder="100"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Total necessário (R$)</label>
                  <input type="number" value={form.totalNecessidade} onChange={e => setForm(f => ({ ...f, totalNecessidade: e.target.value }))}
                    placeholder="300000"
                    className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Necessidades detalhadas</label>
                <textarea value={form.necessidades} onChange={e => setForm(f => ({ ...f, necessidades: e.target.value }))}
                  placeholder="Ex: R$200k custeio de insumos para soja (fertilizantes, defensivos), R$80k manutenção de maquinário, R$20k irrigação..."
                  rows={3} className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
              </div>
              <button onClick={analisar} disabled={analiseState === 'loading' || analiseState === 'rate_limit'}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(5,150,105,0.3))', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 0 20px rgba(52,211,153,0.1)' }}>
                {analiseState === 'loading' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"/>
                    Analisando com IA...
                  </>
                ) : analiseState === 'rate_limit' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"/>
                    Aguardando... {countdown}s
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Analisar com IA
                  </>
                )}
              </button>
              {analiseState === 'rate_limit' && (
                <p className="text-xs text-amber-400/70 text-center">Alta demanda — reconectando automaticamente</p>
              )}
            </div>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-3 space-y-4">
            {analiseState === 'done' && analise && (
              <div className="rounded-2xl p-5 border" style={{
                background: 'rgba(52,211,153,0.05)',
                borderColor: 'rgba(52,211,153,0.2)',
                boxShadow: '0 0 40px rgba(52,211,153,0.05)',
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(52,211,153,0.15)' }}>
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Análise da IA</span>
                  <span className="text-xs text-slate-500 ml-auto">Groq · LLaMA 3.3 70B</span>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{analise}</div>
              </div>
            )}

            {analiseState === 'error' && (
              <div className="rounded-2xl p-4 border" style={{ background: 'rgba(248,113,113,0.07)', borderColor: 'rgba(248,113,113,0.2)' }}>
                <div className="text-sm text-red-400">{error}</div>
              </div>
            )}

            {analiseState === 'idle' && (
              <div className="rounded-2xl p-10 text-center border flex flex-col items-center gap-4"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
                  <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-300 mb-1">IA pronta para analisar</div>
                  <p className="text-sm text-slate-500">Preencha o formulário com as necessidades da safra e clique em Analisar para receber uma estratégia de crédito personalizada.</p>
                </div>
              </div>
            )}

            {/* Histórico */}
            {!loading && planos.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Planos Anteriores</div>
                <div className="space-y-2">
                  {planos.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => { setPlanoAtivo(p); setAnalise(p.iaAnalise ?? ''); setAnaliseState(p.iaAnalise ? 'done' : 'idle') }}
                      className="w-full rounded-2xl p-4 border text-left transition-all hover:scale-[1.01]"
                      style={{
                        background: planoAtivo?.id === p.id ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)',
                        borderColor: planoAtivo?.id === p.id ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
                      }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-sm">Safra {p.safra}</span>
                          {p.cultura && <span className="text-xs text-slate-500 ml-2">— {p.cultura}</span>}
                        </div>
                        <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
                      </div>
                      {p.totalNecessidade && (
                        <div className="text-xs text-emerald-400 mt-1">{fmt(Number(p.totalNecessidade))}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
