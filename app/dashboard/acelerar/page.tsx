'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Checklist = {
  hasProperty: boolean
  hasFields: boolean
  hasRevenues: boolean
  hasCosts: boolean
  hasTeam: boolean
  hasActivities: boolean
  hasDocuments: boolean
  hasQuod: boolean
  sizeHectares: number
}

type ScoreData = {
  score: number
  productionScore: number
  efficiencyScore: number
  behaviorScore: number
  operationalScore: number
  dataCompleteness: number
}

type Step = {
  id: string
  icon: string
  title: string
  desc: string
  impact: string
  impactPts: number
  done: boolean
  href: string | null
  external: boolean
  priority: 'alta' | 'media' | 'baixa'
}

const AGROOS_URL = 'https://agros-os.vercel.app'

function buildSteps(cl: Checklist, sd: ScoreData): Step[] {
  return [
    {
      id: 'property',
      icon: '🏡',
      title: 'Cadastre sua propriedade no AgroOS',
      desc: 'A propriedade é a base do score. Informe nome, localização e tamanho em hectares.',
      impact: '+até 200 pts Operacional',
      impactPts: 200,
      done: cl.hasProperty,
      href: AGROOS_URL,
      external: true,
      priority: 'alta',
    },
    {
      id: 'revenues',
      icon: '💵',
      title: 'Registre ao menos uma receita',
      desc: 'Receitas de colheita são o principal motor do score de Produção (30% do total). Mesmo uma entrada antiga já conta.',
      impact: '+até 300 pts Produção',
      impactPts: 300,
      done: cl.hasRevenues,
      href: AGROOS_URL + '/dashboard/financeiro',
      external: true,
      priority: 'alta',
    },
    {
      id: 'costs',
      icon: '📋',
      title: 'Registre seus custos operacionais',
      desc: 'Custos são usados para calcular margem (Eficiência) e regularidade de gestão (Comportamento). Juntos valem 50% do score.',
      impact: '+até 250 pts Eficiência + Comportamento',
      impactPts: 250,
      done: cl.hasCosts,
      href: AGROOS_URL + '/dashboard/financeiro',
      external: true,
      priority: 'alta',
    },
    {
      id: 'fields',
      icon: '🌿',
      title: 'Cadastre os talhões (áreas de cultivo)',
      desc: 'Talhões determinam a área produtiva. A produtividade por hectare é um fator-chave no score de Produção.',
      impact: '+até 150 pts Produção',
      impactPts: 150,
      done: cl.hasFields,
      href: AGROOS_URL + '/dashboard/propriedades',
      external: true,
      priority: 'media',
    },
    {
      id: 'activities',
      icon: '✅',
      title: 'Registre atividades concluídas',
      desc: 'Atividades concluídas demonstram operação ativa. Cada atividade finalizada aumenta tanto Produção quanto Operacional.',
      impact: '+até 200 pts Produção + Operacional',
      impactPts: 200,
      done: cl.hasActivities,
      href: AGROOS_URL + '/dashboard/atividades',
      external: true,
      priority: 'media',
    },
    {
      id: 'team',
      icon: '👥',
      title: 'Adicione membros da equipe',
      desc: 'Equipe cadastrada aumenta o score Operacional. Indica escala e capacidade de gestão da propriedade.',
      impact: '+até 80 pts Operacional',
      impactPts: 80,
      done: cl.hasTeam,
      href: AGROOS_URL + '/dashboard/equipe',
      external: true,
      priority: 'media',
    },
    {
      id: 'documents',
      icon: '📄',
      title: 'Faça upload de documentos',
      desc: 'CCIR, ITR, CAR e DAP/CAF adicionam pontos ao score Operacional e desbloqueiam linhas de crédito como Pronaf.',
      impact: '+até 540 pts documentais',
      impactPts: 540,
      done: cl.hasDocuments,
      href: '/dashboard/documentos',
      external: false,
      priority: 'media',
    },
    {
      id: 'quod',
      icon: '🔐',
      title: 'Vincule seu CPF/CNPJ (bureau de crédito)',
      desc: 'A verificação de bureau adiciona 30% de peso ao score final via consulta ao parceiro de crédito. É o maior salto individual possível.',
      impact: '+30% no score híbrido',
      impactPts: 999,
      done: cl.hasQuod,
      href: '/dashboard/credito',
      external: false,
      priority: sd.score < 500 ? 'alta' : 'baixa',
    },
  ]
}

function ScoreDimension({ label, score, hex }: { label: string; score: number; hex: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600">{label}</span>
        <span className="font-bold" style={{ color: hex }}>{score}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(score / 1000) * 100}%`, background: hex }} />
      </div>
    </div>
  )
}

export default function AcelerarPage() {
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      const uid = session.user.id

      const [clRes, sdRes] = await Promise.all([
        fetch(`/api/agrorate/checklist?userId=${uid}`),
        fetch(`/api/agrorate/score?userId=${uid}`),
      ])
      if (clRes.ok) setChecklist(await clRes.json())
      if (sdRes.ok) setScoreData(await sdRes.json())
      setLoading(false)
    }
    load()
  }, [])

  const steps = checklist && scoreData ? buildSteps(checklist, scoreData) : []
  const done = steps.filter(s => s.done).length
  const total = steps.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const potentialGain = steps.filter(s => !s.done && s.impactPts < 999).reduce((s, st) => s + st.impactPts, 0)

  const priorityOrder = { alta: 0, media: 1, baixa: 2 }
  const sorted = [...steps].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Acelere seu Score</h1>
          <p className="text-slate-500 text-sm">Siga o plano abaixo para desbloquear seu potencial de crédito</p>
        </div>
      </div>

      {loading && (
        <div className="text-center text-slate-400 py-16 text-sm">
          <div className="w-8 h-8 border-2 border-[#065f46] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Analisando seu perfil...
        </div>
      )}

      {!loading && scoreData && checklist && (
        <>
          {/* Score atual + progresso */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Score atual</div>
                <div className="text-5xl font-black text-[#065f46]">{scoreData.score}</div>
                <div className="text-slate-400 text-xs mt-0.5">de 1000 pontos</div>
              </div>
              <div className="flex-1 max-w-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Perfil preenchido</div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#065f46] rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm font-bold text-[#065f46] w-10 text-right">{pct}%</span>
                </div>
                <div className="text-xs text-slate-400">{done}/{total} passos concluídos</div>
                {potentialGain > 0 && (
                  <div className="mt-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1.5 rounded-lg inline-block">
                    ⚡ +{potentialGain} pts potenciais disponíveis
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-50">
              <ScoreDimension label="🌾 Produção (30%)" score={scoreData.productionScore} hex="#065f46" />
              <ScoreDimension label="💰 Eficiência (25%)" score={scoreData.efficiencyScore} hex="#0d9488" />
              <ScoreDimension label="📋 Comportamento (25%)" score={scoreData.behaviorScore} hex="#7c3aed" />
              <ScoreDimension label="⚙️ Operacional (20%)" score={scoreData.operationalScore} hex="#d97706" />
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            {sorted.map((step, i) => (
              <div key={step.id}
                className={`bg-white rounded-2xl border-2 p-4 transition-all ${step.done ? 'border-emerald-100 opacity-70' : step.priority === 'alta' ? 'border-orange-200' : 'border-slate-100'}`}>
                <div className="flex items-start gap-4">
                  {/* Check circle */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${step.done ? 'bg-emerald-100' : step.priority === 'alta' ? 'bg-orange-50' : 'bg-slate-50'}`}>
                    {step.done
                      ? <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      : step.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      <span className={`font-semibold text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {step.title}
                      </span>
                      {!step.done && step.priority === 'alta' && (
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full flex-shrink-0">prioridade</span>
                      )}
                    </div>
                    {!step.done && (
                      <p className="text-xs text-slate-500 leading-relaxed mb-2">{step.desc}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-semibold ${step.done ? 'text-emerald-600' : 'text-[#065f46]'}`}>
                        {step.done ? '✅ Concluído' : step.impact}
                      </span>
                      {!step.done && step.href && (
                        step.external ? (
                          <a href={step.href} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-bold text-white bg-[#065f46] px-3 py-1.5 rounded-lg hover:bg-[#047857] transition-colors">
                            Fazer agora
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                          </a>
                        ) : (
                          <Link href={step.href}
                            className="text-xs font-bold text-white bg-[#065f46] px-3 py-1.5 rounded-lg hover:bg-[#047857] transition-colors">
                            Fazer agora
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dica final */}
          <div className="bg-gradient-to-r from-[#065f46] to-emerald-600 rounded-2xl p-5 text-white">
            <div className="font-bold mb-1">🚀 Dica de aceleração</div>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Completar os 3 primeiros passos (receita, custos e propriedade) normalmente eleva o score em <strong>200–400 pontos</strong> nos primeiros 7 dias. O score é recalculado automaticamente toda vez que novos dados são inseridos no AgroOS.
            </p>
            <Link href="/dashboard/ia"
              className="inline-flex items-center gap-2 mt-3 text-sm font-bold bg-white text-[#065f46] px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors">
              🤖 Pedir plano personalizado à IA
            </Link>
          </div>
        </>
      )}

      {!loading && !scoreData && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
          <div className="text-4xl mb-3">🌾</div>
          <p className="text-sm">Configure sua conta no AgroOS para gerar o score.</p>
          <a href={AGROOS_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-white bg-[#065f46] px-4 py-2.5 rounded-xl hover:bg-[#047857] transition-colors">
            Abrir AgroOS →
          </a>
        </div>
      )}
    </div>
  )
}
