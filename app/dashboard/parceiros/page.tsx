'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const PARCEIROS = [
  {
    name: 'Sicredi', type: 'Cooperativa', minScore: 750,
    maxCredit: 200000, rate: '1,0%', prazo: '12 meses',
    linhas: ['Crédito Rural Premium', 'Custeio Agrícola', 'Investimento em Maquinário'],
    desc: 'Principal cooperativa de crédito rural do Brasil. Taxas competitivas para produtores com boa gestão.',
    color: 'border-blue-200', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700', hex: '#1d4ed8',
  },
  {
    name: 'Banco do Brasil', type: 'Banco Público', minScore: 600,
    maxCredit: 150000, rate: '1,2%', prazo: '10 meses',
    linhas: ['Finagro Moderinfra', 'Pronaf', 'ABC+ Baixo Carbono'],
    desc: 'Líder nacional em crédito rural. Linhas subsidiadas para custeio, investimento e modernização.',
    color: 'border-yellow-200', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', hex: '#d97706',
  },
  {
    name: 'Sicoob', type: 'Cooperativa', minScore: 600,
    maxCredit: 100000, rate: '1,4%', prazo: '8 meses',
    linhas: ['Crédito de Insumos', 'Custeio de Safra', 'Capital de Giro Rural'],
    desc: 'Cooperativa financeira com forte presença no interior do Brasil. Condições especiais para cooperados.',
    color: 'border-green-200', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700', hex: '#065f46',
  },
  {
    name: 'Bradesco', type: 'Banco Privado', minScore: 500,
    maxCredit: 180000, rate: '1,5%', prazo: '18 meses',
    linhas: ['Financiamento Agro', 'Crédito para Irrigação', 'Modernização de Frota'],
    desc: 'Financiamento agrícola para médios e grandes produtores com prazo de carência.',
    color: 'border-red-200', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', hex: '#dc2626',
  },
  {
    name: 'Santander', type: 'Banco Privado', minScore: 450,
    maxCredit: 80000, rate: '1,6%', prazo: '6 meses',
    linhas: ['Custeio Agrícola', 'Capital de Giro', 'Crédito para Safra'],
    desc: 'Custeio agrícola e capital de giro com histórico de produção comprovado via AgroRate.',
    color: 'border-orange-200', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', hex: '#ea580c',
  },
  {
    name: 'AgroCred', type: 'Fintech', minScore: 300,
    maxCredit: 50000, rate: '1,8%', prazo: '3 meses',
    linhas: ['Antecipação de Recebíveis', 'Crédito Express', 'Capital de Giro Rápido'],
    desc: 'Fintech especializada no agro. Aprovação em horas para produtores com contratos no AgroCore.',
    color: 'border-purple-200', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-700', hex: '#7c3aed',
  },
]

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function ParceirosPage() {
  const [score, setScore] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      if (res.ok) { const j = await res.json(); setScore(j.score) }
    }
    load()
  }, [])

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-4">

      {/* Header banner */}
      <div className="bg-gradient-to-r from-[#065f46] to-emerald-600 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-emerald-200 mb-0.5">Rede de parceiros financeiros</div>
          <div className="text-2xl font-black">{PARCEIROS.length} instituições</div>
          <div className="text-emerald-100 text-sm">aceitam o score AgroRate</div>
        </div>
        {score !== null && (
          <div className="text-right flex-shrink-0">
            <div className="text-4xl font-black">{score}</div>
            <div className="text-emerald-200 text-xs">seu score atual</div>
            <div className="text-emerald-100 text-xs mt-1">
              {PARCEIROS.filter(p => p.minScore <= score).length} parceiros qualificados
            </div>
          </div>
        )}
      </div>

      {/* Parceiros */}
      <div className="space-y-3">
        {PARCEIROS.map(p => {
          const qualified = score !== null && score >= p.minScore
          const gap = score !== null ? Math.max(0, p.minScore - score) : null
          const pct = score !== null ? Math.min(100, (score / p.minScore) * 100) : 0
          const isOpen = expanded === p.name

          return (
            <div key={p.name} className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${qualified ? p.color : 'border-slate-100'}`}>
              <button className="w-full text-left p-5 flex items-center gap-4" onClick={() => setExpanded(isOpen ? null : p.name)}>
                {/* Status indicator */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${qualified ? p.bg : 'bg-slate-50'}`}>
                  {qualified ? '✅' : '🔒'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${p.badge}`}>{p.type}</span>
                    {qualified
                      ? <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">Qualificado ✓</span>
                      : gap !== null && <span className="text-xs font-semibold text-slate-500">Faltam {gap} pontos</span>
                    }
                  </div>
                  {/* Barra de progresso */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: qualified ? p.hex : '#94a3b8' }}/>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="font-black text-xl" style={{ color: p.hex }}>{p.rate}</div>
                  <div className="text-xs text-slate-400">ao mês</div>
                </div>

                <svg className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              {isOpen && (
                <div className={`px-5 pb-5 border-t border-slate-50 pt-4 ${p.bg}`}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">{p.desc}</p>
                      <div className="space-y-1">
                        {[
                          { label: 'Score mínimo', value: p.minScore.toString() },
                          { label: 'Crédito máximo', value: fmt(p.maxCredit) },
                          { label: 'Taxa', value: `${p.rate} a.m.` },
                          { label: 'Prazo', value: p.prazo },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between text-sm py-1.5 border-b border-white/50">
                            <span className="text-slate-500">{label}</span>
                            <span className="font-semibold text-slate-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Linhas disponíveis</div>
                      <div className="space-y-1.5 mb-4">
                        {p.linhas.map(l => (
                          <div key={l} className="flex items-center gap-2 text-sm text-slate-700">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: p.hex }}/>
                            {l}
                          </div>
                        ))}
                      </div>
                      {qualified
                        ? <Link href="/dashboard/credito"
                            className="flex items-center justify-center gap-1.5 w-full py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity"
                            style={{ background: p.hex }}>
                            Ver ofertas deste parceiro →
                          </Link>
                        : <div className="bg-white/80 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 text-center">
                            Aumente seu score em {gap} pontos para desbloquear este parceiro
                          </div>
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Como funciona */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Como funcionam as parcerias</div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '📊', title: 'Score compartilhado', desc: 'Seus dados são enviados ao parceiro somente com seu consentimento expresso' },
            { icon: '⚡', title: 'Análise em até 48h', desc: 'Resposta muito mais rápida do que o modelo tradicional de semanas' },
            { icon: '🔒', title: 'LGPD compliant', desc: 'Você controla quais dados são compartilhados. Nenhum dado é vendido.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <div className="font-semibold text-slate-800 text-sm mb-0.5">{title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
