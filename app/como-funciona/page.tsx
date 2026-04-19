import Link from 'next/link'
import Nav from '@/components/Nav'

const STEPS = [
  {
    step: '01',
    icon: '🌾',
    title: 'Conecte sua fazenda',
    desc: 'Importe os dados do AgroOS ou cadastre sua propriedade diretamente no AgroRate. Produção, custos, atividades e equipe alimentam o algoritmo de forma automática.',
    details: [
      'Integração automática com AgroOS — sem retrabalho',
      'Cadastro manual para quem está começando',
      'Propriedade, talhões, culturas e equipe',
      'Dados históricos dos últimos 12 meses',
    ],
    color: 'bg-emerald-50 border-emerald-100',
    iconBg: 'bg-emerald-100',
  },
  {
    step: '02',
    icon: '🤖',
    title: 'IA calcula seu AgroRate',
    desc: 'Nosso algoritmo de inteligência artificial analisa 4 dimensões da sua operação e gera um score de 0 a 1000. Atualizado automaticamente a cada 7 dias.',
    details: [
      'Análise de produção — receita por hectare e histórico',
      'Eficiência — margem operacional e controle de custos',
      'Comportamento — regularidade de registros financeiros',
      'Operacional — completude do cadastro e atividades',
    ],
    color: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100',
  },
  {
    step: '03',
    icon: '💳',
    title: 'Acesse crédito real',
    desc: 'Com seu score em mãos, bancos e cooperativas parceiras fazem ofertas personalizadas para o seu perfil. Você compara, simula e escolhe — sem sair da plataforma.',
    details: [
      'Ofertas de bancos, cooperativas e fintechs',
      'Simulador de parcelas e juros totais',
      'Solicitação em um clique com assinatura digital',
      'Resposta em até 48h (vs semanas no modelo tradicional)',
    ],
    color: 'bg-violet-50 border-violet-100',
    iconBg: 'bg-violet-100',
  },
]

const FAQ = [
  { q: 'Preciso pagar para usar o AgroRate?', a: 'Não. O cálculo do score e a visualização do dashboard são gratuitos. A plataforma é sustentada por comissões das instituições financeiras parceiras quando o crédito é contratado.' },
  { q: 'Meus dados ficam seguros?', a: 'Sim. Seguimos a LGPD (Lei Geral de Proteção de Dados). Seus dados são enviados a parceiros financeiros somente com seu consentimento expresso.' },
  { q: 'Já uso AgroOS. Preciso recadastrar tudo?', a: 'Não. O AgroRate usa o mesmo banco de dados e login do AgroOS. Sua propriedade e dados já estão lá — o score é calculado automaticamente.' },
  { q: 'Com que frequência o score atualiza?', a: 'O score é recalculado a cada 7 dias ou sempre que você solicitar manualmente. Quanto mais dados você registrar no AgroOS, mais preciso e alto tende a ser seu score.' },
  { q: 'O AgroRate substitui análise de crédito bancária?', a: 'Não substitui — complementa. O score AgroRate é enviado ao banco junto com seu perfil e acelera drasticamente a análise, que seria feita de forma manual e demorada.' },
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,95,70,0.08), transparent)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Como funciona
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-4">
            Do campo ao crédito<br />em 3 passos
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Sem burocracia, sem papelada. Seus dados de produção valem mais do que qualquer documento bancário.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto space-y-6">
          {STEPS.map((s, i) => (
            <div key={s.step} className={`border-2 rounded-3xl p-8 md:p-10 ${s.color}`}>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 rounded-2xl ${s.iconBg} flex items-center justify-center text-3xl mb-3`}>{s.icon}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Passo {s.step}</div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{s.title}</h2>
                  <p className="text-slate-600 leading-relaxed mb-5">{s.desc}</p>
                  <ul className="space-y-2">
                    {s.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg className="w-4 h-4 text-[#065f46] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className="mt-6 flex justify-center">
                  <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Perguntas frequentes</h2>
            <p className="text-slate-500">Dúvidas comuns sobre o AgroRate</p>
          </div>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-slate-100 p-6">
                <h3 className="font-bold text-slate-900 mb-2">{q}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Pronto para começar?</h2>
          <p className="text-slate-500 mb-8">Calcule seu score agora — é grátis e leva menos de 2 minutos.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro" className="bg-[#065f46] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#047857] transition-all shadow-lg hover:-translate-y-0.5">
              Calcular meu score grátis
            </Link>
            <Link href="/score" className="border-2 border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-2xl hover:border-[#065f46] hover:text-[#065f46] transition-all">
              Entender o score →
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
