import Link from 'next/link'

const SCORE_STEPS = [
  { icon: '🌾', title: 'Conecte sua fazenda', desc: 'Importe dados do AgroOS ou cadastre sua propriedade. Produção, custos e atividades alimentam o score.' },
  { icon: '🤖', title: 'IA calcula seu AgroRate', desc: 'Nosso algoritmo analisa 4 dimensões: produção, eficiência, comportamento financeiro e operacional.' },
  { icon: '💳', title: 'Acesse crédito real', desc: 'Com seu score, bancos e cooperativas fazem ofertas personalizadas. Você compara e escolhe o melhor.' },
]

const CATEGORIES = [
  { label: 'Elite', range: '900–1000', color: 'text-amber-700 bg-amber-50 border-amber-200', desc: 'Melhores taxas do mercado' },
  { label: 'Alto', range: '750–899', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Excelentes condições' },
  { label: 'Bom', range: '600–749', color: 'text-teal-700 bg-teal-50 border-teal-200', desc: 'Boas ofertas disponíveis' },
  { label: 'Regular', range: '450–599', color: 'text-blue-700 bg-blue-50 border-blue-200', desc: 'Crédito disponível' },
  { label: 'Baixo', range: '300–449', color: 'text-orange-700 bg-orange-50 border-orange-200', desc: 'Em desenvolvimento' },
  { label: 'Crítico', range: '0–299', color: 'text-red-700 bg-red-50 border-red-200', desc: 'Complete seus dados' },
]

const PARTNERS = ['Banco do Brasil', 'Sicredi', 'Sicoob', 'Bradesco', 'AgroCred', 'Santander']

function ScoreGaugeDemo() {
  const score = 820
  const pct = score / 1000
  const r = 70, cx = 90, cy = 90
  const startAngle = Math.PI * 0.75
  const totalArc = Math.PI * 1.5
  const filled = totalArc * pct

  const polarX = (a: number) => cx + r * Math.cos(a)
  const polarY = (a: number) => cy + r * Math.sin(a)
  const arc = (from: number, to: number) => {
    const large = to - from > Math.PI ? 1 : 0
    return `M ${polarX(from)} ${polarY(from)} A ${r} ${r} 0 ${large} 1 ${polarX(to)} ${polarY(to)}`
  }

  return (
    <svg viewBox="0 0 180 120" className="w-40 h-28">
      <path d={arc(startAngle, startAngle + totalArc)} fill="none" stroke="#d1fae5" strokeWidth="14" strokeLinecap="round" />
      <path d={arc(startAngle, startAngle + filled)} fill="none" stroke="#065f46" strokeWidth="14" strokeLinecap="round" />
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#065f46" fontSize="26" fontWeight="800">{score}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#94a3b8" fontSize="9">de 1000</text>
    </svg>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-slate-100 bg-white/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#065f46] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">AR</span>
            </div>
            <span className="font-bold text-slate-900 text-lg">AgroRate</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              Entrar
            </Link>
            <Link href="/cadastro" className="bg-[#065f46] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#047857] transition-colors">
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          Ecossistema AgroCore · AgroOS · AgroRate
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 leading-tight mb-6">
          Sua produção<br />
          <span className="text-[#065f46]">vira crédito.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          O AgroRate transforma dados reais da sua fazenda em score de crédito. Quem produz bem, paga menos juros.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/cadastro" className="w-full sm:w-auto bg-[#065f46] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#047857] transition-colors text-lg">
            Calcular meu score grátis
          </Link>
          <Link href="/login" className="w-full sm:w-auto border-2 border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-2xl hover:border-slate-300 transition-colors text-lg">
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Score demo */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0">
              <ScoreGaugeDemo />
              <div className="text-center mt-2">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Alto
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Score AgroRate: 820</h2>
              <p className="text-slate-500 mb-6">Gestão eficiente — excelentes ofertas de crédito disponíveis</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Produção', score: 850, icon: '🌾' },
                  { label: 'Eficiência', score: 780, icon: '💰' },
                  { label: 'Comportamento', score: 830, icon: '📋' },
                  { label: 'Operacional', score: 790, icon: '⚙️' },
                ].map(({ label, score, icon }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <span>{icon}</span> {label}
                    </div>
                    <div className="font-bold text-slate-800">{score}</div>
                    <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#065f46] rounded-full" style={{ width: `${(score / 1000) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 bg-gradient-to-r from-[#065f46] to-emerald-600 rounded-xl p-4 text-white">
                <div className="text-sm text-emerald-100 mb-1">Com esse score você acessa</div>
                <div className="font-bold text-lg">9 ofertas de crédito · a partir de 1,0% a.m.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 mb-3">Como funciona</h2>
          <p className="text-slate-500">Três passos para transformar sua produção em crédito</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {SCORE_STEPS.map((step, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-[#065f46]/30 hover:shadow-md transition-all">
              <div className="text-3xl mb-4">{step.icon}</div>
              <div className="text-xs font-bold text-[#065f46] mb-2 uppercase tracking-wide">Passo {i + 1}</div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Score categories */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-white mb-3">Tabela de classificação</h2>
            <p className="text-slate-400">Cada nível abre portas para novas condições de crédito</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.label} className={`border rounded-2xl p-4 ${cat.color}`}>
                <div className="font-bold text-lg mb-1">{cat.label}</div>
                <div className="text-2xl font-black mb-2">{cat.range}</div>
                <div className="text-sm opacity-75">{cat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Parceiros */}
      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-3">Parceiros financeiros</h2>
        <p className="text-slate-500 mb-10">Score aceito pelas principais instituições do agro</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {PARTNERS.map((p) => (
            <div key={p} className="bg-white border border-slate-200 rounded-xl px-6 py-3 text-slate-700 font-semibold text-sm hover:border-[#065f46]/30 transition-colors">
              {p}
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-br from-[#065f46] to-emerald-700 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-white mb-4">
            Seu crédito vem da sua produção.
          </h2>
          <p className="text-emerald-100 text-lg mb-8">
            Menos papel. Mais resultado. Comece grátis agora.
          </p>
          <Link href="/cadastro" className="inline-block bg-white text-[#065f46] font-bold text-lg px-10 py-4 rounded-2xl hover:bg-emerald-50 transition-colors">
            Calcular meu score grátis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#065f46] rounded flex items-center justify-center">
              <span className="text-white font-black text-xs">AR</span>
            </div>
            <span className="font-semibold text-slate-600">AgroRate</span>
            <span>— Parte do ecossistema AgroCore</span>
          </div>
          <div className="flex gap-6">
            <Link href="https://agrolink-opal.vercel.app" className="hover:text-slate-600 transition-colors">AgroCore</Link>
            <Link href="https://agroos.vercel.app" className="hover:text-slate-600 transition-colors">AgroOS</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
