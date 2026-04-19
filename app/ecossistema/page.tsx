import Link from 'next/link'
import Nav from '@/components/Nav'

const SYSTEMS = [
  {
    name: 'AgroCore',
    tagline: 'O Marketplace do Agro',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
    href: 'https://agrolink-opal.vercel.app',
    desc: 'Conecta produtores rurais com prestadores de serviços agrícolas. Pulverização, colheita, tratoreação, análise de solo e muito mais — com pagamento seguro e avaliações reais.',
    role: 'Executa o serviço',
    contribution: 'Fornece dados de execução de serviços para o AgroRate',
    features: ['Marketplace de serviços', 'Prestadores verificados', 'Pagamento com escrow', 'Avaliações reais', 'Match automático por localização'],
  },
  {
    name: 'AgroOS',
    tagline: 'O Sistema Operacional da Fazenda',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
    href: 'https://agroos.vercel.app',
    desc: 'Centraliza planejamento, controle financeiro, gestão de equipe e operações da propriedade. Integrado com IA para alertas, relatórios e planejamento de safra.',
    role: 'Controla a operação',
    contribution: 'Fornece dados financeiros e operacionais que alimentam o score AgroRate',
    features: ['Controle operacional', 'Gestão financeira', 'Equipe e propriedades', 'Metas e alertas', 'Planejamento de safra com IA'],
  },
  {
    name: 'AgroRate',
    tagline: 'O Score de Crédito Rural',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    href: '/dashboard',
    desc: 'Transforma dados reais da fazenda em score de crédito. Conecta produtores a bancos, cooperativas e fintechs com taxas baseadas na performance real da operação.',
    role: 'Monetiza a produção',
    contribution: 'Processa dados do AgroCore e AgroOS para gerar score e acesso a crédito',
    features: ['Score de 0 a 1000', 'Marketplace de crédito', 'Conselheiro IA', 'Parceiros financeiros', 'Histórico de evolução'],
    active: true,
  },
]

const FLOW = [
  { from: 'AgroCore', to: 'AgroRate', data: 'Dados de serviços executados, frequência e volume de operações' },
  { from: 'AgroOS', to: 'AgroRate', data: 'Receitas, custos, atividades, equipe e histórico financeiro' },
  { from: 'AgroRate', to: 'Bancos', data: 'Score qualificado + perfil do produtor para análise de crédito' },
]

export default function EcossistemaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,95,70,0.08), transparent)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ecossistema
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-4">
            Três sistemas.<br />
            <span style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Uma plataforma completa.
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            O AgroCore executa serviços. O AgroOS controla a operação. O AgroRate transforma tudo isso em crédito rural. Juntos, formam a infraestrutura digital da fazenda moderna.
          </p>
        </div>
      </section>

      {/* Systems */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-5">
          {SYSTEMS.map(s => (
            <div key={s.name} className={`border-2 rounded-3xl p-8 relative ${s.color} ${s.active ? 'ring-2 ring-blue-400/30' : ''}`}>
              {s.active && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Você está aqui
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0 md:w-52">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${s.dot}`} />
                    <div className="font-black text-slate-900 text-2xl">{s.name}</div>
                  </div>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block mb-4 ${s.badge}`}>{s.tagline}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Papel no ecossistema</div>
                  <div className="font-semibold text-slate-800 text-sm mb-4">{s.role}</div>
                  <a href={s.href} target={s.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-[#065f46] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#047857] transition-colors">
                    Acessar {s.name}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
                <div className="flex-1">
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{s.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {s.features.map(f => (
                      <span key={f} className="text-xs bg-white/80 border border-slate-200 text-slate-600 px-3 py-1 rounded-lg">{f}</span>
                    ))}
                  </div>
                  <div className="bg-white/70 rounded-xl p-3 text-xs text-slate-600 flex gap-2">
                    <span className="flex-shrink-0">🔗</span>
                    <span><strong>Integração:</strong> {s.contribution}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Data flow */}
      <section className="px-6 py-20 bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Fluxo de dados do ecossistema</h2>
            <p className="text-slate-400">Como a informação flui entre os três sistemas</p>
          </div>
          <div className="space-y-4">
            {FLOW.map(({ from, to, data }) => (
              <div key={`${from}-${to}`} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg text-sm">{from}</span>
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg text-sm">{to}</span>
                </div>
                <div className="text-slate-400 text-sm md:ml-4">{data}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Faça parte do ecossistema</h2>
          <p className="text-slate-500 mb-8">Use os três sistemas e tenha a fazenda mais digitalizada do Brasil.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro" className="bg-[#065f46] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#047857] transition-all shadow-lg hover:-translate-y-0.5">
              Começar com o AgroRate
            </Link>
            <a href="https://agroos.vercel.app" target="_blank" rel="noopener noreferrer"
              className="border-2 border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-2xl hover:border-[#065f46] hover:text-[#065f46] transition-all">
              Conhecer o AgroOS →
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600 transition-colors">← Voltar para o início</Link>
      </footer>
    </div>
  )
}
