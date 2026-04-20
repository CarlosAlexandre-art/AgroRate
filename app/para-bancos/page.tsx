import Link from 'next/link'

const STATS = [
  { value: 'R$ 605 bi', label: 'Plano Safra 2025/26' },
  { value: '63%', label: 'Execução BB em custeio' },
  { value: '20%', label: 'Propostas rejeitadas por doc' },
  { value: '30x', label: 'Mais rápido que análise manual' },
]

const PROBLEMS = [
  { icon: '📋', title: 'Documentação incompleta', desc: 'Até 20% das propostas são rejeitadas por inconsistências no CAR ou pendências no CAF, gerando retrabalho para toda a esteira.' },
  { icon: '⏱️', title: 'Análise de risco lenta', desc: 'O modelo de análise manual é lento e caro. Com a Selic a 14-15%, cada dia de atraso tem custo financeiro real.' },
  { icon: '📊', title: 'Dados agrícolas não padronizados', desc: 'Receitas, custos e histórico produtivo chegam em formatos inconsistentes, dificultando a precificação de risco.' },
  { icon: '🔍', title: 'Sem histórico digital do produtor', desc: 'A maioria dos produtores rurais não tem histórico de crédito formal, tornando a análise subjetiva e arriscada.' },
]

const SOLUTIONS = [
  {
    step: '01',
    title: 'Score pré-qualificado',
    desc: 'Receba leads já com score AgroRate calculado (0–1000), dimensionado em 4 eixos: Produção, Eficiência, Comportamento e Operacional. Análise em segundos, não dias.',
    color: 'bg-emerald-50 border-emerald-100',
  },
  {
    step: '02',
    title: 'Perfil documental verificado',
    desc: 'CAR, CAF, ITR, CCIR e demais documentos validados e organizados pelo produtor na plataforma. Você recebe um checklist atualizado junto à proposta.',
    color: 'bg-blue-50 border-blue-100',
  },
  {
    step: '03',
    title: 'Dados financeiros do AgroOS',
    desc: 'Receitas, custos, margem e histórico produtivo diretamente do sistema operacional da fazenda — dados reais, não declaratórios.',
    color: 'bg-violet-50 border-violet-100',
  },
  {
    step: '04',
    title: 'Integração via API',
    desc: 'Receba propostas diretamente no seu sistema via REST API (JSON/OAuth2). Compatível com BNDES Online, Semear e sistemas legados via webhook.',
    color: 'bg-amber-50 border-amber-100',
  },
]

const TIERS = [
  {
    name: 'Starter',
    price: 'R$ 2.000/mês',
    desc: 'Ideal para cooperativas regionais',
    features: ['Até 100 leads/mês', 'Score detalhado por produtor', 'Checklist documental', 'Suporte por e-mail'],
    cta: 'Começar teste gratuito',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 'R$ 6.000/mês',
    desc: 'Para bancos e cooperativas em expansão',
    features: ['Leads ilimitados', 'API REST completa + webhooks', 'Score histórico + tendência', 'Dados do AgroCore incluídos', 'Suporte dedicado'],
    cta: 'Falar com nosso time',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    desc: 'Bancos de grande porte e fintechs',
    features: ['White label disponível', 'Integração BNDES Online', 'SLA garantido', 'Treinamento e onboarding', 'Score customizado por critério'],
    cta: 'Agendar reunião',
    highlight: false,
  },
]

export default function ParaBancosPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
        <Link href="/" className="font-black text-[#065f46] text-xl">AgroRate</Link>
        <div className="flex items-center gap-4">
          <Link href="/para-cooperativas" className="text-sm text-slate-600 hover:text-slate-900">Para Cooperativas</Link>
          <Link href="/login" className="text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">Entrar</Link>
          <a href="mailto:parceiros@agrorate.com.br" className="text-sm font-bold bg-[#065f46] text-white px-4 py-2 rounded-xl hover:bg-[#047857] transition-colors">Falar com vendas</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
          Plano Safra 2025/26 · R$ 605 bilhões em operação
        </div>
        <h1 className="text-5xl font-black text-slate-900 leading-tight mb-6 max-w-3xl mx-auto">
          Análise de risco rural em <span className="text-[#065f46]">segundos,</span><br/> não em semanas
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          O AgroRate entrega leads de crédito rural pré-qualificados com score 0–1000, documentação verificada e dados financeiros reais — direto do sistema operacional da fazenda.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="mailto:parceiros@agrorate.com.br" className="px-8 py-4 bg-[#065f46] text-white rounded-2xl font-bold text-lg hover:bg-[#047857] transition-colors shadow-lg shadow-emerald-900/20">
            Quero receber leads qualificados
          </a>
          <Link href="#como-funciona" className="px-8 py-4 border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-colors">
            Ver como funciona
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#065f46] py-14">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-emerald-200 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problemas */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-black text-slate-900 text-center mb-3">O problema que você enfrenta hoje</h2>
        <p className="text-slate-500 text-center mb-12">Gargalos que travam a esteira de crédito rural no Brasil</p>
        <div className="grid md:grid-cols-2 gap-5">
          {PROBLEMS.map(p => (
            <div key={p.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <span className="text-3xl mb-4 block">{p.icon}</span>
              <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-3">Como o AgroRate resolve</h2>
          <p className="text-slate-500 text-center mb-12 max-w-2xl mx-auto">Da coleta de dados ao lead qualificado na sua esteira — tudo automatizado</p>
          <div className="grid md:grid-cols-2 gap-5">
            {SOLUTIONS.map(s => (
              <div key={s.step} className={`rounded-2xl p-6 border ${s.color}`}>
                <div className="text-xs font-black text-slate-400 tracking-widest mb-3">ETAPA {s.step}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Score detalhado */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">Score com 4 dimensões de risco</h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Diferente de um score genérico de crédito, o AgroRate é construído sobre dados agropecuários reais, correlacionados com os critérios do Plano Safra 2025/26 e do Manual de Crédito Rural (MCR).
            </p>
            <div className="space-y-3">
              {[
                { label: 'Produção', weight: '30%', desc: 'Receita/ha, volume, diversificação' },
                { label: 'Eficiência', weight: '25%', desc: 'Margem operacional, custo/ha' },
                { label: 'Comportamento', weight: '25%', desc: 'Regularidade, adimplência, histórico' },
                { label: 'Operacional', weight: '20%', desc: 'CAR, CAF, CCIR, ITR, completeness' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs font-black text-[#065f46] w-8 flex-shrink-0">{d.weight}</div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{d.label}</div>
                    <div className="text-xs text-slate-500">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#065f46] rounded-2xl p-8 text-white">
            <div className="text-xs font-bold opacity-60 uppercase tracking-widest mb-6">Exemplo de lead recebido via API</div>
            <pre className="text-xs font-mono leading-relaxed opacity-90 overflow-x-auto">{`{
  "score": 724,
  "category": "GOOD",
  "productionScore": 81,
  "efficiencyScore": 74,
  "behaviorScore": 68,
  "operationalScore": 90,
  "totalRevenue": 380000,
  "marginRate": 0.34,
  "agrocoreConnected": true,
  "agrocoreBonus": 45,
  "documents": {
    "CAR": "valid",
    "CAF": "valid",
    "ITR": "expiring_soon",
    "CCIR": "valid"
  },
  "eligibleLines": [
    "Pronamp Custeio",
    "Moderinfra"
  ]
}`}</pre>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-3">Planos para instituições</h2>
          <p className="text-slate-500 text-center mb-12">Além do SaaS, operamos por % de originação — fale conosco</p>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map(tier => (
              <div key={tier.name} className={`rounded-2xl p-6 border-2 ${tier.highlight ? 'bg-[#065f46] border-[#065f46] text-white' : 'bg-white border-slate-100'}`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${tier.highlight ? 'text-emerald-300' : 'text-slate-400'}`}>{tier.name}</div>
                <div className={`text-2xl font-black mb-1 ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>{tier.price}</div>
                <div className={`text-xs mb-5 ${tier.highlight ? 'text-emerald-200' : 'text-slate-500'}`}>{tier.desc}</div>
                <ul className="space-y-2 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${tier.highlight ? 'text-emerald-100' : 'text-slate-600'}`}>
                      <svg className={`w-4 h-4 flex-shrink-0 ${tier.highlight ? 'text-emerald-300' : 'text-[#065f46]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="mailto:parceiros@agrorate.com.br"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${tier.highlight ? 'bg-white text-[#065f46] hover:bg-emerald-50' : 'bg-[#065f46] text-white hover:bg-[#047857]'}`}>
                  {tier.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Pronto para receber leads de qualidade?</h2>
          <p className="text-slate-600 mb-8">Entre em contato com nosso time de parcerias. Integração em menos de 5 dias úteis.</p>
          <a href="mailto:parceiros@agrorate.com.br"
            className="inline-block px-10 py-4 bg-[#065f46] text-white rounded-2xl font-bold text-lg hover:bg-[#047857] transition-colors shadow-lg shadow-emerald-900/20">
            Falar com o time comercial →
          </a>
          <div className="mt-6 text-xs text-slate-400">parceiros@agrorate.com.br · Resposta em até 24h</div>
        </div>
      </section>

      <footer className="border-t border-slate-100 px-6 py-6 text-center text-xs text-slate-400">
        AgroRate · Parte do ecossistema AgroCore · AgroOS · AgroRate · Plano Safra 2025/26
      </footer>
    </div>
  )
}
