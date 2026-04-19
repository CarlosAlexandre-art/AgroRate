'use client'

import Link from 'next/link'

const PARCEIROS = [
  { name: 'Sicredi', type: 'Cooperativa', desc: 'Principal cooperativa de crédito rural do Brasil. Taxas a partir de 1,0% a.m. para score acima de 750.', minScore: 750, offers: 3, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { name: 'Banco do Brasil', type: 'Banco', desc: 'Líder em crédito rural. Finagro, Pronaf e Moderinfra para produtores de todos os portes.', minScore: 600, offers: 5, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { name: 'Sicoob', type: 'Cooperativa', desc: 'Cooperativa financeira com foco no agro. Crédito de custeio e investimento com condições diferenciadas.', minScore: 600, offers: 2, color: 'text-green-700 bg-green-50 border-green-200' },
  { name: 'Bradesco', type: 'Banco', desc: 'Financiamento agrícola para médios e grandes produtores. Prazo de até 18 meses.', minScore: 500, offers: 2, color: 'text-red-700 bg-red-50 border-red-200' },
  { name: 'Santander', type: 'Banco', desc: 'Custeio agrícola e capital de giro para produtores rurais com histórico de produção.', minScore: 450, offers: 2, color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { name: 'AgroCred', type: 'Fintech', desc: 'Fintech especializada em antecipação de recebíveis para prestadores e produtores do AgroCore.', minScore: 300, offers: 1, color: 'text-purple-700 bg-purple-50 border-purple-200' },
]

export default function ParceirosPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Parceiros Financeiros</h1>
          <p className="text-slate-500 text-sm">Instituições que aceitam o score AgroRate</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#065f46] to-emerald-600 rounded-2xl p-6 text-white">
        <h2 className="font-bold text-lg mb-1">Score AgroRate aceito por {PARCEIROS.length} instituições</h2>
        <p className="text-emerald-100 text-sm">Cada parceiro define o score mínimo para aprovação. Melhore seu score para desbloquear mais ofertas.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {PARCEIROS.map(p => (
          <div key={p.name} className={`bg-white rounded-2xl border-2 p-5 hover:shadow-md transition-all ${p.color}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-bold text-slate-900 text-lg">{p.name}</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${p.color}`}>{p.type}</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Score mínimo</div>
                <div className="font-black text-xl text-slate-800">{p.minScore}</div>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">{p.desc}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{p.offers}</span> {p.offers === 1 ? 'linha disponível' : 'linhas disponíveis'}
              </div>
              <Link href="/dashboard/credito"
                className="text-sm font-semibold text-[#065f46] hover:underline">
                Ver ofertas →
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-bold text-slate-900 mb-3">Como funcionam as parcerias</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: '📊', title: 'Score compartilhado', desc: 'Seu AgroRate é enviado ao parceiro com seu consentimento' },
            { icon: '⚡', title: 'Análise rápida', desc: 'Resposta em até 48h ao invés de semanas no modelo tradicional' },
            { icon: '🔒', title: 'Dados protegidos', desc: 'LGPD compliant — você controla quais dados são compartilhados' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="text-center p-4 bg-slate-50 rounded-xl">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-semibold text-slate-800 text-sm mb-1">{title}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
