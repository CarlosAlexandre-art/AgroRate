'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Interval = 'monthly' | 'quarterly' | 'annual'

const INTERVAL_LABEL: Record<Interval, string> = {
  monthly:   'Mensal',
  quarterly: 'Trimestral',
  annual:    'Anual',
}

const PLANS = [
  {
    key: 'pro',
    name: 'Pro',
    color: '#0d9488',
    bg: '#0d948810',
    border: '#0d948830',
    prices: { monthly: 49, quarterly: 44, annual: 40 },
    billing: { monthly: 49, quarterly: 132, annual: 480 },
    billingNote: { monthly: '/mês', quarterly: '/trimestre  (~R$44/mês)', annual: '/ano  (~R$40/mês)' },
    description: 'Score completo com QUOD Agro Score integrado',
    features: [
      'Score AgroRate completo',
      'QUOD Score (1x/mês)',
      'Simulação de crédito ilimitada',
      'Conselheiro IA',
      'Relatório PDF',
      'Documentos digitais',
    ],
    notIncluded: [
      'CAFIR / CAR / CAF',
      'DAP PF / DAP PJ',
      'Dossiê QUOD',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    color: '#b45309',
    bg: '#b4530910',
    border: '#b4530930',
    prices: { monthly: 149, quarterly: 134, annual: 120 },
    billing: { monthly: 149, quarterly: 402, annual: 1440 },
    billingNote: { monthly: '/mês', quarterly: '/trimestre  (~R$134/mês)', annual: '/ano  (~R$120/mês)' },
    description: 'Bundle completo de verificações rurais',
    badge: 'Mais completo',
    features: [
      'Tudo do Pro',
      'CAFIR — Registro INCRA (1x/ano)',
      'CAR — Ambiental SICAR (1x/ano)',
      'CAF PJ — Agricultura Familiar (1x/6 meses)',
      'DAP PF / DAP PJ — PRONAF (1x/6 meses)',
      'Dossiê QUOD — Crédito 360° (1x/6 meses)',
      'Score AgroRate com todos os bônus',
      'Renovação forçada liberada',
    ],
    notIncluded: [],
  },
]

function AssinaturasContent() {
  const [interval, setInterval] = useState<Interval>('monthly')
  const [userPlan, setUserPlan] = useState<string>('starter')
  const [hasCustomer, setHasCustomer] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const res = await fetch('/api/perfil/me')
      if (res.ok) {
        const j = await res.json()
        setUserPlan(j.plan ?? 'starter')
        setHasCustomer(!!j.stripeCustomerId)
      }
    })
  }, [])

  async function handleSubscribe(plan: string) {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, interval }),
      })
      const { url, error } = await res.json()
      if (error) { alert(error); return }
      window.location.href = url
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setLoading('portal')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) { alert(error); return }
      window.location.href = url
    } finally {
      setLoading(null)
    }
  }

  const success  = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Toast success/cancel */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-sm font-medium">
          Assinatura ativada com sucesso! Seu plano foi atualizado.
        </div>
      )}
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3 rounded-xl text-sm font-medium">
          Pagamento cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Assinaturas</h2>
        <p className="text-sm text-slate-500 mt-1">
          Escolha o plano ideal e desbloqueie verificações que elevam seu score de crédito rural.
        </p>
      </div>

      {/* Interval toggle */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['monthly', 'quarterly', 'annual'] as Interval[]).map(i => (
          <button key={i} onClick={() => setInterval(i)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              interval === i ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {INTERVAL_LABEL[i]}
            {i === 'annual' && <span className="ml-1.5 text-[10px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full">-18%</span>}
            {i === 'quarterly' && <span className="ml-1.5 text-[10px] font-black text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded-full">-10%</span>}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLANS.map(plan => {
          const isCurrent = userPlan === plan.key
          return (
            <div key={plan.key}
              className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col gap-5 transition-all ${
                isCurrent ? 'border-[#065f46] shadow-lg' : 'border-slate-200 hover:border-slate-300'
              }`}>

              {/* Badge */}
              {plan.badge && !isCurrent && (
                <div className="absolute -top-3 left-6 text-[11px] font-black px-3 py-1 rounded-full text-white"
                  style={{ background: plan.color }}>
                  {plan.badge}
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-6 text-[11px] font-black px-3 py-1 rounded-full bg-[#065f46] text-white">
                  Plano atual
                </div>
              )}

              {/* Plan name & price */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-black text-slate-800">{plan.name}</span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black" style={{ color: plan.color }}>
                    R$ {plan.billing[interval].toLocaleString('pt-BR')}
                  </span>
                  <span className="text-sm text-slate-500 mb-1">{plan.billingNote[interval]}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: plan.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                disabled={isCurrent || loading === plan.key}
                onClick={() => isCurrent ? handlePortal() : handleSubscribe(plan.key)}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  isCurrent
                    ? 'bg-[#065f46] text-white cursor-default'
                    : loading === plan.key
                    ? 'opacity-60 cursor-wait text-white'
                    : 'text-white hover:opacity-90'
                }`}
                style={{ background: isCurrent ? '#065f46' : plan.color }}>
                {loading === plan.key ? 'Aguarde...' : isCurrent ? 'Plano ativo' : `Assinar ${plan.name}`}
              </button>
            </div>
          )
        })}
      </div>

      {/* Free plan */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-700 text-sm">Free</span>
          <span className="text-slate-500 text-sm ml-2">— Score interno básico, sem verificações Direct Data</span>
        </div>
        {userPlan === 'starter' && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-600">Atual</span>
        )}
      </div>

      {/* Gerenciar assinatura */}
      {hasCustomer && userPlan !== 'starter' && (
        <div className="text-center">
          <button onClick={handlePortal} disabled={loading === 'portal'}
            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors">
            {loading === 'portal' ? 'Abrindo portal...' : 'Gerenciar assinatura / cancelar'}
          </button>
        </div>
      )}

      {/* Cache windows info */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Como funcionam os limites de consulta</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'QUOD Score', window: '30 dias', plan: 'Pro' },
            { label: 'Dossiê QUOD', window: '6 meses', plan: 'Enterprise' },
            { label: 'CAF / DAP', window: '6 meses', plan: 'Enterprise' },
            { label: 'CAFIR', window: '1 ano', plan: 'Enterprise' },
            { label: 'CAR', window: '1 ano', plan: 'Enterprise' },
          ].map(item => (
            <div key={item.label} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5">
              <div className="text-xs font-bold text-slate-700">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">Validade: {item.window}</div>
              <div className="text-[10px] font-semibold mt-1 text-teal-600">{item.plan}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Dentro da janela de validade, os dados ficam em cache — sem nova cobrança na API.
        </p>
      </div>
    </div>
  )
}

export default function AssinaturasPage() {
  return (
    <Suspense>
      <AssinaturasContent />
    </Suspense>
  )
}
