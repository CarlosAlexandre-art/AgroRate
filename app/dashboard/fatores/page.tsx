'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ScoreData {
  score: number
  productionScore: number
  efficiencyScore: number
  behaviorScore: number
  operationalScore: number
  agrocoreBonus: number
  verificacaoBonus: number
  documentBonus: number
  totalRevenue: number
  totalCosts: number
  marginRate: number
  dataCompleteness: number
}

interface TerritorialData {
  territorialScore: number | null
  bonus: number
  hasCoords: boolean
  detectedFields?: number
  detectedHa?: number
  declaredHa?: number
  matchRatio?: number
  avgNdvi?: number
  avgConf?: number
  ndviLabel?: string
  ndviColor?: string
  source?: string
  message?: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const FATORES = [
  {
    key: 'productionScore',
    label: 'Produção',
    weight: 0.40,
    color: '#34d399',
    glow: 'rgba(52,211,153,0.3)',
    desc: 'Receita por hectare, atividades concluídas e área total da propriedade.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    key: 'efficiencyScore',
    label: 'Eficiência',
    weight: 0.20,
    color: '#60a5fa',
    glow: 'rgba(96,165,250,0.3)',
    desc: 'Margem de lucro, relação custo-receita e retorno sobre investimento.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    key: 'behaviorScore',
    label: 'Comportamento',
    weight: 0.20,
    color: '#a78bfa',
    glow: 'rgba(167,139,250,0.3)',
    desc: 'Regularidade de registros, consistência financeira e histórico de pagamentos.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M3 3h18v18H3z" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    key: 'operationalScore',
    label: 'Operacional',
    weight: 0.10,
    color: '#fbbf24',
    glow: 'rgba(251,191,36,0.3)',
    desc: 'Completude dos dados da fazenda, equipe cadastrada e atividades recentes.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

const BONUS = [
  { key: 'agrocoreBonus', label: 'Bônus AgroCore', color: '#34d399', desc: 'Reputação de serviços e avaliações no marketplace' },
  { key: 'verificacaoBonus', label: 'Verificações DAP/CAR/CAFIR/CAF', color: '#60a5fa', desc: 'Documentos regulatórios verificados' },
  { key: 'documentBonus', label: 'Documentos Enviados', color: '#fbbf24', desc: 'Score de impacto dos documentos válidos' },
]

export default function FatoresPage() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [territorial, setTerritorial] = useState<TerritorialData | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      try {
        const [scoreRes, terrRes] = await Promise.all([
          fetch(`/api/agrorate/score?userId=${session.user.id}`),
          fetch(`/api/agrorate/score-territorial?userId=${session.user.id}`),
        ])
        if (scoreRes.ok) setData(await scoreRes.json())
        if (terrRes.ok) setTerritorial(await terrRes.json())
      } finally {
        setLoading(false)
      }
    })
  }, [])

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #041a0c 45%, #020c14 100%)',
    }}>
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      {/* Radial glow top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(52,211,153,0.08) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pt-2">
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest text-emerald-500/70 uppercase mb-1">Análise Detalhada</div>
            <h1 className="text-3xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Fatores de Impacto</h1>
            <p className="text-sm text-slate-400 mt-1">Entenda o que move seu AgroRate Score</p>
          </div>
          {data && (
            <div className="flex-shrink-0 text-center px-5 py-3 rounded-2xl border"
              style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)', boxShadow: '0 0 30px rgba(52,211,153,0.1)' }}>
              <div className="text-xs font-bold text-emerald-400/70 uppercase tracking-widest mb-1">Score Atual</div>
              <div className="text-4xl font-black" style={{ color: '#34d399', textShadow: '0 0 20px rgba(52,211,153,0.5)' }}>
                {data.score}
              </div>
              <div className="text-xs text-slate-500 mt-1">de 1000</div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"/>
          </div>
        )}

        {data && (
          <>
            {/* Score breakdown */}
            <div>
              <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Componentes do Score</div>
              <div className="space-y-3">
                {FATORES.map(f => {
                  const raw = data[f.key as keyof ScoreData] as number
                  const contribution = Math.round(raw * f.weight)
                  const pct = Math.round((raw / 1000) * 100)
                  return (
                    <div key={f.key} className="rounded-2xl p-5 border transition-all hover:scale-[1.01]"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${f.glow.replace('0.3', '0.12')}`, color: f.color, border: `1px solid ${f.color}30` }}>
                          {f.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-white text-sm">{f.label}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: `${f.color}15`, color: f.color }}>
                              Peso {Math.round(f.weight * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mb-3">{f.desc}</p>
                          {/* Bar */}
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${f.color}aa, ${f.color})`,
                                boxShadow: `0 0 8px ${f.color}60`,
                              }}/>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="text-2xl font-black" style={{ color: f.color }}>{raw}</div>
                          <div className="text-xs text-slate-500">+{contribution} pts</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Bônus */}
            <div>
              <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Bônus Adicionais</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {BONUS.map(b => {
                  const val = data[b.key as keyof ScoreData] as number
                  return (
                    <div key={b.key} className="rounded-2xl p-4 border text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="text-3xl font-black mb-1" style={{ color: b.color }}>
                        {val > 0 ? `+${val}` : val}
                      </div>
                      <div className="text-xs font-bold text-white mb-1">{b.label}</div>
                      <div className="text-xs text-slate-500">{b.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Score Territorial Satelital */}
            {territorial && (
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Validação Territorial Satelital</div>
                {!territorial.hasCoords ? (
                  <div className="rounded-2xl p-5 border flex items-start gap-4"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
                      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white mb-1">Localização não configurada</div>
                      <p className="text-xs text-slate-500">{territorial.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl p-5 border"
                    style={{ background: 'rgba(52,211,153,0.04)', borderColor: 'rgba(52,211,153,0.15)', boxShadow: '0 0 40px rgba(52,211,153,0.04)' }}>
                    <div className="flex items-start gap-4 mb-5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#34d399" strokeWidth={1.8}>
                          <circle cx="11" cy="11" r="4"/><path strokeLinecap="round" d="M11 7V4M11 18v-3M7 11H4M18 11h-3M8.4 8.4 6.3 6.3M15.6 15.6l-2.1-2.1M15.6 8.4l2.1-2.1M8.4 15.6 6.3 17.7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-bold text-white">Score Territorial</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                            FTW · Sentinel-2
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Validação satelital da atividade produtiva via detecção automática de campos agrícolas</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-black" style={{ color: '#34d399' }}>{territorial.territorialScore}</div>
                        <div className="text-xs text-slate-500">de 100</div>
                        <div className="text-xs font-bold mt-0.5" style={{ color: '#34d399' }}>+{territorial.bonus} pts</div>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="h-2 rounded-full overflow-hidden mb-4" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${territorial.territorialScore ?? 0}%`,
                          background: 'linear-gradient(90deg, #34d399aa, #34d399)',
                          boxShadow: '0 0 8px rgba(52,211,153,0.6)',
                        }} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-xl font-black mb-0.5" style={{ color: '#34d399' }}>
                          {territorial.detectedFields}
                        </div>
                        <div className="text-[10px] text-slate-500">Campos detect.</div>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-xl font-black mb-0.5" style={{ color: '#6ee7b7' }}>
                          {territorial.detectedHa} ha
                        </div>
                        <div className="text-[10px] text-slate-500">Área detectada</div>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-xl font-black mb-0.5" style={{ color: territorial.ndviColor }}>
                          {territorial.avgNdvi?.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">NDVI · {territorial.ndviLabel}</div>
                      </div>
                      <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="text-xl font-black mb-0.5" style={{ color: '#a7f3d0' }}>
                          {((territorial.matchRatio ?? 0) * 100).toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-slate-500">Conformidade</div>
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-slate-600 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                      {territorial.source}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dados Financeiros */}
            <div>
              <div className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-3">Dados Financeiros</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Receita Total', val: fmt(data.totalRevenue), color: '#34d399' },
                  { label: 'Custos Totais', val: fmt(data.totalCosts), color: '#f87171' },
                  { label: 'Margem Líquida', val: `${(data.marginRate * 100).toFixed(1)}%`, color: '#60a5fa' },
                  { label: 'Completude', val: `${data.dataCompleteness}%`, color: '#fbbf24' },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl p-4 border text-center"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="text-xl font-black mb-1" style={{ color: item.color }}>{item.val}</div>
                    <div className="text-xs text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Como melhorar */}
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(52,211,153,0.05)', borderColor: 'rgba(52,211,153,0.15)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Dica de Melhoria</span>
              </div>
              {data.productionScore < 600 && (
                <p className="text-sm text-slate-300">Registre mais receitas e atividades concluídas no SmartAgroOS para aumentar o componente de <span className="text-emerald-400 font-bold">Produção</span>, o maior fator do seu score (peso 40%).</p>
              )}
              {data.productionScore >= 600 && data.efficiencyScore < 600 && (
                <p className="text-sm text-slate-300">Reduza custos ou aumente receitas para melhorar sua <span className="text-blue-400 font-bold">Eficiência</span>. Uma margem de 30%+ gera score máximo neste componente.</p>
              )}
              {data.productionScore >= 600 && data.efficiencyScore >= 600 && data.verificacaoBonus < 80 && (
                <p className="text-sm text-slate-300">Verifique seus documentos DAP, CAR, CAFIR e CAF na seção <span className="text-blue-400 font-bold">Verificação</span> para ganhar até +125 pontos de bônus.</p>
              )}
              {data.productionScore >= 600 && data.efficiencyScore >= 600 && data.verificacaoBonus >= 80 && (
                <p className="text-sm text-slate-300">Seu perfil está bem completo! Continue registrando atividades regularmente para manter o componente de <span className="text-purple-400 font-bold">Comportamento</span> alto.</p>
              )}
            </div>
          </>
        )}

        {!loading && !data && (
          <div className="rounded-2xl p-12 text-center border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="text-slate-500 mb-3">Nenhum dado de score encontrado.</div>
            <p className="text-xs text-slate-600">Configure sua fazenda no SmartAgroOS e importe os dados para calcular seu score.</p>
          </div>
        )}
      </div>
    </div>
  )
}
