'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

interface Lancamento {
  id: string
  tipo: 'RECEITA' | 'CUSTO'
  descricao: string
  amount: number
  date: string
  category?: string
}

interface MonthData {
  mes: string
  receitas: number
  custos: number
  saldo: number
  acumulado: number
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function FluxoCaixaPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [loading, setLoading] = useState(true)
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())
  const [viewMode, setViewMode] = useState<'mensal' | 'categoria'>('mensal')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return setLoading(false)
      try {
        const res = await fetch(`/api/agrorate/fluxo?userId=${session.user.id}&ano=${anoSelecionado}`)
        if (res.ok) {
          const d = await res.json()
          setLancamentos(d.lancamentos ?? [])
        }
      } catch { /* sem dados */ }
      setLoading(false)
    })
  }, [anoSelecionado])

  const monthData = useMemo<MonthData[]>(() => {
    const byMonth: Record<number, { receitas: number; custos: number }> = {}
    for (let i = 0; i < 12; i++) byMonth[i] = { receitas: 0, custos: 0 }
    lancamentos.forEach(l => {
      const m = new Date(l.date).getMonth()
      if (l.tipo === 'RECEITA') byMonth[m].receitas += Number(l.amount)
      else byMonth[m].custos += Number(l.amount)
    })
    let acumulado = 0
    return MESES.map((mes, i) => {
      const saldo = byMonth[i].receitas - byMonth[i].custos
      acumulado += saldo
      return { mes, receitas: byMonth[i].receitas, custos: byMonth[i].custos, saldo, acumulado }
    })
  }, [lancamentos])

  const totalReceitas = monthData.reduce((s, m) => s + m.receitas, 0)
  const totalCustos = monthData.reduce((s, m) => s + m.custos, 0)
  const totalSaldo = totalReceitas - totalCustos
  const maxVal = Math.max(...monthData.map(m => Math.max(m.receitas, m.custos)), 1)

  const mesAtual = new Date().getMonth()
  const receitasMes = monthData[mesAtual]?.receitas ?? 0
  const custosMes = monthData[mesAtual]?.custos ?? 0

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #04140a 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(52,211,153,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }}/>
      <div className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom left, rgba(52,211,153,0.05) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="text-xs font-bold tracking-widest text-emerald-400/70 uppercase mb-1">SmartAgroOS Sync</div>
            <h1 className="text-3xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Fluxo de Caixa da Safra</h1>
            <p className="text-sm text-slate-400 mt-1">Dados sincronizados do SmartAgroOS — receitas e custos por safra</p>
          </div>
          <select value={anoSelecionado} onChange={e => setAnoSelecionado(Number(e.target.value))}
            className="rounded-xl px-4 py-2 text-sm text-white focus:outline-none flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y} style={{ background: '#0d1b2a' }}>{y}</option>)}
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Receitas Totais', val: fmt(totalReceitas), color: '#34d399', icon: '↑' },
            { label: 'Custos Totais', val: fmt(totalCustos), color: '#f87171', icon: '↓' },
            { label: 'Resultado', val: fmt(totalSaldo), color: totalSaldo >= 0 ? '#34d399' : '#f87171', icon: '=' },
            { label: `${MESES[mesAtual]} — Saldo`, val: fmt(receitasMes - custosMes), color: (receitasMes - custosMes) >= 0 ? '#60a5fa' : '#f87171', icon: '◉' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl p-4 border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-sm" style={{ color: k.color }}>{k.icon}</span>
                <span className="text-xs text-slate-500">{k.label}</span>
              </div>
              <div className="text-xl font-black" style={{ color: k.color }}>{k.val}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"/>
          </div>
        )}

        {!loading && (
          <>
            {/* Gráfico de barras */}
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Receitas vs Custos</div>
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#34d399' }}/> Receitas</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f87171' }}/> Custos</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-40">
                {monthData.map((m, i) => (
                  <div key={m.mes} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: '120px' }}>
                      <div className="flex-1 rounded-t-sm transition-all duration-700"
                        style={{ height: `${(m.receitas / maxVal) * 100}%`, background: 'linear-gradient(180deg, #34d399, #059669)', minHeight: m.receitas > 0 ? 2 : 0 }}/>
                      <div className="flex-1 rounded-t-sm transition-all duration-700"
                        style={{ height: `${(m.custos / maxVal) * 100}%`, background: 'linear-gradient(180deg, #f87171, #dc2626)', minHeight: m.custos > 0 ? 2 : 0 }}/>
                    </div>
                    <div className="text-xs text-slate-600" style={{ fontSize: '10px' }}>{m.mes}</div>
                    {i === mesAtual && <div className="w-1 h-1 rounded-full bg-blue-400"/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Linha de saldo acumulado */}
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Saldo Mensal</div>
              <div className="space-y-2">
                {monthData.filter(m => m.receitas > 0 || m.custos > 0).map((m, i) => {
                  const isPositive = m.saldo >= 0
                  const barWidth = Math.min(100, Math.abs(m.saldo) / Math.max(1, ...monthData.map(x => Math.abs(x.saldo))) * 100)
                  return (
                    <div key={m.mes} className="flex items-center gap-3">
                      <div className="w-8 text-xs text-slate-500 text-right flex-shrink-0">{m.mes}</div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-6 rounded-lg overflow-hidden flex items-center relative"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="h-full rounded-lg transition-all duration-700 absolute"
                            style={{
                              width: `${barWidth}%`,
                              background: isPositive ? 'linear-gradient(90deg, #34d39950, #34d399)' : 'linear-gradient(90deg, #f8717150, #f87171)',
                              left: isPositive ? 0 : 'auto',
                              right: isPositive ? 'auto' : 0,
                            }}/>
                        </div>
                        <div className="w-24 text-right text-xs font-bold flex-shrink-0"
                          style={{ color: isPositive ? '#34d399' : '#f87171' }}>
                          {fmt(m.saldo)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {totalReceitas === 0 && totalCustos === 0 && (
              <div className="rounded-2xl p-10 text-center border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="text-4xl mb-3">📊</div>
                <div className="font-bold text-slate-400 mb-2">Nenhum lançamento encontrado</div>
                <p className="text-sm text-slate-600">Registre receitas e custos no SmartAgroOS para visualizar seu fluxo de caixa aqui.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
