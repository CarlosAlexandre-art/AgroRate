import Link from 'next/link'
import Nav from '@/components/Nav'

const PARCEIROS = [
  {
    name: 'Sicredi',
    type: 'Cooperativa',
    minScore: 750,
    maxCredit: 'R$ 200.000',
    rate: 'A partir de 1,0% a.m.',
    lines: ['Crédito Rural Premium', 'Custeio Agrícola', 'Investimento em Maquinário'],
    desc: 'Principal sistema cooperativo de crédito rural do Brasil. Foco em produtores de médio e grande porte com gestão estruturada.',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'text-blue-700 bg-blue-100',
    featured: true,
  },
  {
    name: 'Banco do Brasil',
    type: 'Banco Público',
    minScore: 600,
    maxCredit: 'R$ 150.000',
    rate: 'A partir de 1,2% a.m.',
    lines: ['Finagro Moderinfra', 'Pronaf', 'ABC+ (Agricultura de Baixo Carbono)'],
    desc: 'Líder nacional em crédito rural. Oferece linhas subsidiadas para custeio, investimento e modernização de propriedades.',
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'text-yellow-700 bg-yellow-100',
    featured: false,
  },
  {
    name: 'Sicoob',
    type: 'Cooperativa',
    minScore: 600,
    maxCredit: 'R$ 100.000',
    rate: 'A partir de 1,4% a.m.',
    lines: ['Crédito de Insumos', 'Custeio de Safra', 'Capital de Giro Rural'],
    desc: 'Cooperativa financeira com forte presença no interior do Brasil. Condições diferenciadas para cooperados com bom histórico.',
    bg: 'bg-green-50 border-green-200',
    badge: 'text-green-700 bg-green-100',
    featured: false,
  },
  {
    name: 'Bradesco',
    type: 'Banco Privado',
    minScore: 500,
    maxCredit: 'R$ 180.000',
    rate: 'A partir de 1,5% a.m.',
    lines: ['Financiamento Agro', 'Crédito para Irrigação', 'Modernização de Frota'],
    desc: 'Financiamento agrícola para médios e grandes produtores. Prazo de até 18 meses com carência para início de pagamento.',
    bg: 'bg-red-50 border-red-200',
    badge: 'text-red-700 bg-red-100',
    featured: false,
  },
  {
    name: 'Santander',
    type: 'Banco Privado',
    minScore: 450,
    maxCredit: 'R$ 80.000',
    rate: 'A partir de 1,6% a.m.',
    lines: ['Custeio Agrícola', 'Capital de Giro', 'Crédito para Safra'],
    desc: 'Custeio agrícola e capital de giro para produtores rurais com histórico de produção comprovado via AgroRate.',
    bg: 'bg-orange-50 border-orange-200',
    badge: 'text-orange-700 bg-orange-100',
    featured: false,
  },
  {
    name: 'AgroCred',
    type: 'Fintech',
    minScore: 300,
    maxCredit: 'R$ 50.000',
    rate: 'A partir de 1,8% a.m.',
    lines: ['Antecipação de Recebíveis', 'Crédito Express', 'Capital de Giro Rápido'],
    desc: 'Fintech especializada no agro. Aprovação em horas para produtores e prestadores com contratos firmados no AgroCore.',
    bg: 'bg-purple-50 border-purple-200',
    badge: 'text-purple-700 bg-purple-100',
    featured: false,
  },
]

const HOW = [
  { icon: '📊', title: 'Score compartilhado', desc: 'Seu AgroRate é enviado ao parceiro com seu consentimento expresso. Você controla quem vê seus dados.' },
  { icon: '⚡', title: 'Análise em horas', desc: 'Resposta em até 48h ao invés de semanas no modelo tradicional. Dados reais aceleram a aprovação.' },
  { icon: '🔒', title: 'LGPD compliant', desc: 'Conformidade total com a Lei Geral de Proteção de Dados. Seus dados nunca são vendidos.' },
  { icon: '💬', title: 'Suporte dedicado', desc: 'Nossa equipe acompanha cada solicitação de crédito do início ao contrato assinado.' },
]

export default function ParceirosPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,95,70,0.08), transparent)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Parceiros Financeiros
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-4">
            Score aceito pelas principais<br />
            <span style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              instituições do agro
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Banco, cooperativa ou fintech — cada parceiro define condições com base no seu AgroRate. Quanto maior seu score, mais opções e melhores taxas.
          </p>
        </div>
      </section>

      {/* Partners grid */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-4">
          {PARCEIROS.map(p => (
            <div key={p.name} className={`border-2 rounded-3xl p-7 relative overflow-hidden ${p.bg} ${p.featured ? 'ring-2 ring-[#065f46]/30' : ''}`}>
              {p.featured && (
                <div className="absolute top-0 right-0 bg-[#065f46] text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                  Recomendado
                </div>
              )}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 md:w-48">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-black text-slate-900 text-xl">{p.name}</div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg inline-block mb-3 ${p.badge}`}>{p.type}</span>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-slate-500">Score mínimo</div>
                      <div className="font-black text-2xl text-slate-900">{p.minScore}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Crédito máximo</div>
                      <div className="font-bold text-slate-800">{p.maxCredit}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Taxa</div>
                      <div className="font-bold text-[#065f46] text-sm">{p.rate}</div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{p.desc}</p>
                  <div className="mb-4">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Linhas disponíveis</div>
                    <div className="flex flex-wrap gap-2">
                      {p.lines.map(l => (
                        <span key={l} className="text-xs bg-white/80 border border-slate-200 text-slate-600 px-3 py-1 rounded-lg">{l}</span>
                      ))}
                    </div>
                  </div>
                  <Link href="/dashboard/credito"
                    className="inline-flex items-center gap-2 bg-[#065f46] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#047857] transition-colors">
                    Ver ofertas deste parceiro →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How partnerships work */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Como funcionam as parcerias</h2>
            <p className="text-slate-500">Transparência e segurança em cada etapa</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {HOW.map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
                <div className="text-3xl mb-3">{icon}</div>
                <div className="font-bold text-slate-800 mb-2">{title}</div>
                <div className="text-sm text-slate-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Pronto para acessar crédito?</h2>
          <p className="text-slate-500 mb-8">Calcule seu score agora e veja quais parceiros têm ofertas para você.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro" className="bg-[#065f46] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#047857] transition-all shadow-lg hover:-translate-y-0.5">
              Calcular meu score grátis
            </Link>
            <Link href="/dashboard/credito" className="border-2 border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-2xl hover:border-[#065f46] hover:text-[#065f46] transition-all">
              Ver todas as ofertas →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600 transition-colors">← Voltar para o início</Link>
      </footer>
    </div>
  )
}
