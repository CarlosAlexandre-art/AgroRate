'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'agrorate_onboarding_v1'

const STEPS = [
  {
    icon: '🌾',
    title: 'Bem-vindo ao AgroRate',
    desc: 'O AgroRate é o seu score de crédito rural inteligente. Quanto mais dados da sua fazenda você registra no AgroOS, maior e mais preciso fica o seu score.',
    detail: 'O score vai de 0 a 1.000 pontos e é calculado automaticamente com base na sua produção, eficiência, comportamento financeiro e dados operacionais.',
    cta: null,
  },
  {
    icon: '📊',
    title: 'Como o score é calculado',
    desc: 'Seu AgroRate é composto por 4 dimensões: Produção (30%), Eficiência (25%), Comportamento financeiro (25%) e Operacional (20%).',
    detail: 'Cada dimensão é alimentada pelos dados que você registra no AgroOS — receitas de safra, custos operacionais, atividades concluídas e equipe cadastrada.',
    cta: { href: 'https://agros-os.vercel.app', label: 'Abrir AgroOS', external: true },
  },
  {
    icon: '💳',
    title: 'Acesse crédito com condições melhores',
    desc: 'Com um AgroRate alto, você desbloqueia ofertas de crédito rural com taxas mais baixas e prazos maiores junto aos nossos parceiros financeiros.',
    detail: 'Score acima de 750 dá acesso às melhores condições do mercado — até 18 meses e taxas a partir de 1,0% a.m.',
    cta: { href: '/dashboard/credito', label: 'Ver ofertas', external: false },
  },
  {
    icon: '📁',
    title: 'Envie documentos para aumentar o score',
    desc: 'Documentos verificados adicionam até 80 pontos ao seu score. Envie ITR, CAR, contratos de arrendamento e comprovantes de produção.',
    detail: 'Cada documento aprovado pela equipe AgroRate contribui com pontos adicionais, além de aumentar a confiança dos parceiros financeiros.',
    cta: { href: '/dashboard/documentos', label: 'Enviar documentos', external: false },
  },
  {
    icon: '🤖',
    title: 'Use o Conselheiro IA',
    desc: 'O Conselheiro IA analisa seu score e te diz exatamente o que fazer para subir de categoria — com sugestões contextualizadas para sua realidade.',
    detail: 'Disponível em Conselheiro IA no menu lateral. Basta perguntar e você recebe um plano personalizado para maximizar seu score.',
    cta: { href: '/dashboard/ia', label: 'Falar com o conselheiro', external: false },
  },
]

export default function OnboardingTutorial() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const timer = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(timer)
  }, [])

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else finish()
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  if (!visible) return null

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={finish} />

      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-[#065f46] transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-5">
            <div className="text-5xl mb-4">{current.icon}</div>
            <h2 className="text-xl font-black text-slate-800 mb-2">{current.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{current.desc}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mb-5">
            <p className="text-xs text-slate-500 leading-relaxed">{current.detail}</p>
          </div>

          {current.cta && (
            <div className="mb-4 text-center">
              {current.cta.external ? (
                <a
                  href={current.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#065f46] border border-[#065f46]/30 px-4 py-2 rounded-xl hover:bg-[#065f46]/5 transition-colors"
                >
                  {current.cta.label} →
                </a>
              ) : (
                <Link
                  href={current.cta.href}
                  onClick={finish}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#065f46] border border-[#065f46]/30 px-4 py-2 rounded-xl hover:bg-[#065f46]/5 transition-colors"
                >
                  {current.cta.label} →
                </Link>
              )}
            </div>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${i === step ? 'w-5 h-2 bg-[#065f46]' : 'w-2 h-2 bg-slate-200 hover:bg-slate-300'}`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex-1 bg-slate-100 text-slate-600 font-semibold py-3 rounded-2xl text-sm hover:bg-slate-200 transition-colors"
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 bg-[#065f46] text-white font-bold py-3 rounded-2xl text-sm hover:bg-[#047857] transition-colors"
            >
              {isLast ? 'Começar agora' : 'Próximo →'}
            </button>
          </div>

          <button onClick={finish} className="mt-2 w-full text-slate-400 font-medium py-1.5 text-xs hover:text-slate-600 transition-colors">
            Pular tutorial
          </button>
        </div>
      </div>
    </div>
  )
}
