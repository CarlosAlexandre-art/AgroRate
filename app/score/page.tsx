import Link from 'next/link'
import Nav from '@/components/Nav'

const LAYERS = [
  {
    icon: '🌾',
    label: 'Produção',
    weight: 30,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    bar: 'bg-emerald-500',
    title: 'Quanto sua fazenda produz',
    desc: 'Mede a capacidade produtiva real da propriedade com base em receitas e volume de atividades concluídas.',
    metrics: [
      { label: 'Receita por hectare', desc: 'Quanto você gera por área plantada (50% do peso)' },
      { label: 'Atividades concluídas', desc: 'Volume de operações realizadas nos últimos 12 meses (30%)' },
      { label: 'Área total da propriedade', desc: 'Tamanho da operação como indicador de escala (20%)' },
    ],
    tip: 'Registre todas as receitas de colheita no AgroOS. Quanto mais detalhado, mais alto o score.',
  },
  {
    icon: '💰',
    label: 'Eficiência',
    weight: 25,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    bar: 'bg-blue-500',
    title: 'Como você gerencia recursos',
    desc: 'Analisa a relação entre receita e custos. Quem gasta menos para produzir mais tem score mais alto.',
    metrics: [
      { label: 'Margem operacional', desc: 'Percentual de lucro sobre a receita total (60% do peso)' },
      { label: 'Relação custo-receita', desc: 'Quanto cada real de custo gera de receita (40%)' },
    ],
    tip: 'Cadastre todos os custos no AgroOS (insumos, mão de obra, maquinário) para ter uma margem real calculada.',
  },
  {
    icon: '📋',
    label: 'Comportamento',
    weight: 25,
    color: 'text-violet-700 bg-violet-50 border-violet-200',
    bar: 'bg-violet-500',
    title: 'Regularidade financeira',
    desc: 'Mede se você registra custos de forma contínua e consistente — o que indica disciplina financeira.',
    metrics: [
      { label: 'Regularidade de lançamentos', desc: 'Com que frequência você registra custos (30%)' },
      { label: 'Pontualidade de registros', desc: 'Se os registros são feitos no prazo correto (70%)' },
    ],
    tip: 'Lance custos mensalmente no AgroOS, não deixe acumular. Consistência vale mais do que volume.',
  },
  {
    icon: '⚙️',
    label: 'Operacional',
    weight: 20,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    bar: 'bg-amber-500',
    title: 'Estrutura e completude',
    desc: 'Avalia o quanto sua propriedade está estruturada: talhões, equipe, atividades recentes e dados cadastrados.',
    metrics: [
      { label: 'Talhões cadastrados', desc: 'Divisão da fazenda em áreas produtivas (20%)' },
      { label: 'Equipe registrada', desc: 'Membros ativos na propriedade (20%)' },
      { label: 'Custos lançados', desc: 'Histórico financeiro disponível (30%)' },
      { label: 'Receitas registradas', desc: 'Entradas financeiras documentadas (30%)' },
    ],
    tip: 'Complete o cadastro da propriedade no AgroOS: adicione talhões, equipe e registre pelo menos uma receita.',
  },
]

const CATEGORIES = [
  { label: 'Elite', range: '900–1000', color: 'text-amber-700 bg-amber-50 border-amber-300', desc: 'Melhores taxas do mercado. Bancos competem por você.', offers: '12+' },
  { label: 'Alto', range: '750–899', color: 'text-emerald-700 bg-emerald-50 border-emerald-300', desc: 'Excelentes condições. Acesso a todas as linhas de crédito.', offers: '9' },
  { label: 'Bom', range: '600–749', color: 'text-teal-700 bg-teal-50 border-teal-300', desc: 'Boas ofertas disponíveis. Taxas competitivas.', offers: '6' },
  { label: 'Regular', range: '450–599', color: 'text-blue-700 bg-blue-50 border-blue-300', desc: 'Crédito disponível com condições padrão de mercado.', offers: '3' },
  { label: 'Baixo', range: '300–449', color: 'text-orange-700 bg-orange-50 border-orange-300', desc: 'Crédito limitado. Foco em melhorar os dados da fazenda.', offers: '1' },
  { label: 'Crítico', range: '0–299', color: 'text-red-700 bg-red-50 border-red-300', desc: 'Complete seu cadastro no AgroOS para subir o score.', offers: '0' },
]

function MiniGauge({ score, color }: { score: number; color: string }) {
  const pct = score / 1000
  const r = 40, cx = 50, cy = 52
  const start = Math.PI * 0.75
  const total = Math.PI * 1.5
  const px = (a: number) => cx + r * Math.cos(a)
  const py = (a: number) => cy + r * Math.sin(a)
  const arc = (f: number, t: number) => {
    const lg = t - f > Math.PI ? 1 : 0
    return `M ${px(f)} ${py(f)} A ${r} ${r} 0 ${lg} 1 ${px(t)} ${py(t)}`
  }
  return (
    <svg viewBox="0 0 100 70" className="w-24 h-16">
      <path d={arc(start, start + total)} fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
      {score > 0 && <path d={arc(start, start + total * pct)} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize="16" fontWeight="800">{score}</text>
    </svg>
  )
}

export default function ScorePage() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,95,70,0.08), transparent)' }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-emerald-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Meu Score
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight mb-4">
            4 dimensões que medem<br />
            <span style={{ background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              quem realmente produz
            </span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            O AgroRate vai muito além do histórico bancário. Analisa sua fazenda por dentro, em tempo real, com dados que nenhum banco consegue ver.
          </p>
        </div>
      </section>

      {/* Score overview */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-12 mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Produção', score: 850, color: '#10b981' },
                { label: 'Eficiência', score: 780, color: '#3b82f6' },
                { label: 'Comportamento', score: 830, color: '#8b5cf6' },
                { label: 'Operacional', score: 790, color: '#f59e0b' },
              ].map(({ label, score, color }) => (
                <div key={label} className="text-center">
                  <MiniGauge score={score} color={color} />
                  <div className="text-white font-semibold text-sm mt-1">{label}</div>
                  <div className="text-slate-400 text-xs mt-0.5">Score parcial</div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <div className="text-slate-400 text-sm mb-1">Score AgroRate final (média ponderada)</div>
              <div className="text-5xl font-black text-emerald-400">820</div>
              <div className="text-slate-400 text-sm mt-1">Categoria: Alto · 9 ofertas de crédito disponíveis</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Layers detail */}
      <section className="px-6 pb-20 bg-slate-50">
        <div className="max-w-5xl mx-auto pt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Como cada dimensão é calculada</h2>
            <p className="text-slate-500">Entenda exatamente o que aumenta ou diminui cada parte do seu score</p>
          </div>
          <div className="space-y-5">
            {LAYERS.map(l => (
              <div key={l.label} className={`bg-white border-2 rounded-3xl p-7 ${l.color}`}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center text-3xl mb-2">{l.icon}</div>
                    <div className="text-center">
                      <div className="font-black text-2xl text-slate-900">{l.weight}%</div>
                      <div className="text-xs text-slate-500">do score total</div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-xl mb-1">{l.label} — {l.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{l.desc}</p>
                    <div className="space-y-2 mb-4">
                      {l.metrics.map((m) => (
                        <div key={m.label} className="flex gap-2 text-sm">
                          <svg className="w-4 h-4 text-[#065f46] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <div><span className="font-semibold text-slate-800">{m.label}</span> — <span className="text-slate-500">{m.desc}</span></div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/70 rounded-xl p-3 text-xs text-slate-600 flex gap-2">
                      <span className="flex-shrink-0">💡</span>
                      <span><strong>Dica:</strong> {l.tip}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Tabela de classificação</h2>
            <p className="text-slate-500">Cada nível abre portas para novas condições de crédito</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {CATEGORIES.map(cat => (
              <div key={cat.label} className={`border-2 rounded-2xl p-5 ${cat.color}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-bold text-xl">{cat.label}</div>
                    <div className="text-2xl font-black">{cat.range}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black">{cat.offers}</div>
                    <div className="text-xs opacity-70">ofertas</div>
                  </div>
                </div>
                <p className="text-sm opacity-80">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-slate-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Qual é o seu score agora?</h2>
          <p className="text-slate-500 mb-8">Calcule grátis em menos de 2 minutos com os dados da sua fazenda.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro" className="bg-[#065f46] text-white font-bold px-8 py-4 rounded-2xl hover:bg-[#047857] transition-all shadow-lg hover:-translate-y-0.5">
              Calcular meu score grátis
            </Link>
            <Link href="/parceiros" className="border-2 border-slate-200 text-slate-700 font-semibold px-8 py-4 rounded-2xl hover:border-[#065f46] hover:text-[#065f46] transition-all">
              Ver parceiros financeiros →
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
