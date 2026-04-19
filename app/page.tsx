import Link from 'next/link'
import Nav from '@/components/Nav'
import ScrollReveal from '@/components/ScrollReveal'
import FeatureCard3D from '@/components/FeatureCard3D'
import RevealOnScroll from '@/components/RevealOnScroll'

function ScoreGaugeDemo({ score }: { score: number }) {
  const pct = score / 1000
  const r = 70, cx = 90, cy = 92
  const start = Math.PI * 0.75
  const total = Math.PI * 1.5
  const px = (a: number) => cx + r * Math.cos(a)
  const py = (a: number) => cy + r * Math.sin(a)
  const arc = (f: number, t: number) => {
    const lg = t - f > Math.PI ? 1 : 0
    return `M ${px(f)} ${py(f)} A ${r} ${r} 0 ${lg} 1 ${px(t)} ${py(t)}`
  }
  return (
    <svg viewBox="0 0 180 125" className="w-full max-w-[180px]">
      <path d={arc(start, start + total)} fill="none" stroke="#d1fae5" strokeWidth="13" strokeLinecap="round" />
      <path d={arc(start, start + total * pct)} fill="none" stroke="#065f46" strokeWidth="13" strokeLinecap="round"
        className="gauge-path" />
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#065f46" fontSize="28" fontWeight="800">{score}</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#94a3b8" fontSize="9">de 1000 pontos</text>
    </svg>
  )
}

const FEATURES = [
  { icon: '📊', title: 'Score em tempo real', desc: 'Calculado automaticamente com base nos dados reais da sua fazenda. Atualiza a cada 7 dias.', color: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
  { icon: '💳', title: 'Marketplace de crédito', desc: 'Compare ofertas de bancos, cooperativas e fintechs. Escolha a melhor condição para o seu perfil.', color: 'bg-blue-50', iconBg: 'bg-blue-100' },
  { icon: '🤖', title: 'Conselheiro IA', desc: 'Inteligência artificial que analisa seu perfil e recomenda o caminho mais rápido para melhorar o score.', color: 'bg-violet-50', iconBg: 'bg-violet-100' },
  { icon: '📈', title: 'Histórico de evolução', desc: 'Acompanhe mês a mês como seu score cresce conforme você registra dados da fazenda.', color: 'bg-amber-50', iconBg: 'bg-amber-100' },
  { icon: '🏦', title: 'Parceiros financeiros', desc: 'Sicredi, Banco do Brasil, Sicoob, Bradesco e fintechs especializadas no agro.', color: 'bg-teal-50', iconBg: 'bg-teal-100' },
  { icon: '🔗', title: 'Ecossistema integrado', desc: 'Dados do AgroOS (gestão) e AgroCore (execução) alimentam automaticamente seu score.', color: 'bg-rose-50', iconBg: 'bg-rose-100' },
]

const STEPS = [
  { step: '01', icon: '🌾', title: 'Conecte sua fazenda', desc: 'Importe os dados do AgroOS ou cadastre sua propriedade. Produção, custos e atividades alimentam o score.' },
  { step: '02', icon: '🤖', title: 'IA calcula seu AgroRate', desc: 'Nosso algoritmo analisa 4 dimensões: produção, eficiência, comportamento financeiro e operacional. Score de 0 a 1000.' },
  { step: '03', icon: '💳', title: 'Acesse crédito real', desc: 'Com seu score, bancos e cooperativas fazem ofertas personalizadas. Compare e escolha o melhor em segundos.' },
]

const LAYERS = [
  { icon: '🌾', pct: 30, label: 'Produção', desc: 'Receita por hectare, volume de colheita e histórico de atividades concluídas.' },
  { icon: '💰', pct: 25, label: 'Eficiência', desc: 'Margem operacional, relação custo-receita e gestão de insumos.' },
  { icon: '📋', pct: 25, label: 'Comportamento', desc: 'Regularidade de registros financeiros e consistência ao longo do tempo.' },
  { icon: '⚙️', pct: 20, label: 'Operacional', desc: 'Completude do cadastro, membros de equipe, talhões e atividades em andamento.' },
]

const CATEGORIES = [
  { label: 'Elite', range: '900–1000', color: 'text-amber-700 bg-amber-50 border-amber-200', desc: 'Melhores taxas do mercado' },
  { label: 'Alto', range: '750–899', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Excelentes condições' },
  { label: 'Bom', range: '600–749', color: 'text-teal-700 bg-teal-50 border-teal-200', desc: 'Boas ofertas disponíveis' },
  { label: 'Regular', range: '450–599', color: 'text-blue-700 bg-blue-50 border-blue-200', desc: 'Crédito disponível' },
  { label: 'Baixo', range: '300–449', color: 'text-orange-700 bg-orange-50 border-orange-200', desc: 'Em desenvolvimento' },
  { label: 'Crítico', range: '0–299', color: 'text-red-700 bg-red-50 border-red-200', desc: 'Complete seus dados' },
]

const PARTNERS = [
  { name: 'Sicredi', type: 'Cooperativa', minScore: 750, color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { name: 'Banco do Brasil', type: 'Banco', minScore: 600, color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
  { name: 'Sicoob', type: 'Cooperativa', minScore: 600, color: 'border-green-200 bg-green-50 text-green-700' },
  { name: 'Bradesco', type: 'Banco', minScore: 500, color: 'border-red-200 bg-red-50 text-red-700' },
  { name: 'Santander', type: 'Banco', minScore: 450, color: 'border-orange-200 bg-orange-50 text-orange-700' },
  { name: 'AgroCred', type: 'Fintech', minScore: 300, color: 'border-purple-200 bg-purple-50 text-purple-700' },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Nav />

      {/* ── HERO ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,95,70,0.10), transparent)' }} className="absolute inset-0" />
          <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-30 anim-float" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-50 anim-float" style={{ animationDelay: '-2s' }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="anim-fade-up opacity-0 anim-d1 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-emerald-200 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Infraestrutura de Crédito do Agro Moderno
          </div>

          <h1 className="anim-fade-up opacity-0 anim-d2 text-4xl sm:text-6xl md:text-7xl font-bold text-[#0f172a] leading-[1.05] tracking-tight mb-6">
            Sua produção<br />
            <span className="text-shimmer">vira crédito.</span>
          </h1>

          <p className="anim-fade-up opacity-0 anim-d3 text-base sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            O AgroRate transforma dados reais da sua fazenda em score de crédito rural. Quem produz bem, paga menos juros. Sem papel. Sem burocracia.
          </p>

          <div className="anim-fade-up opacity-0 anim-d4 flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/cadastro"
              className="inline-flex items-center justify-center bg-[#065f46] text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-[#047857] transition-all shadow-xl shadow-emerald-900/20 hover:shadow-emerald-900/30 hover:-translate-y-1 hover:scale-[1.02]">
              Calcular meu score grátis
            </Link>
            <Link href="/como-funciona"
              className="inline-flex items-center justify-center gap-2 border-2 border-slate-200 text-slate-700 font-semibold text-base px-8 py-4 rounded-2xl hover:border-[#065f46] hover:text-[#065f46] transition-all bg-white hover:-translate-y-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#065f46]" />
              Como funciona
            </Link>
          </div>

          {/* Stats */}
          <div className="anim-fade-up opacity-0 anim-d5 grid grid-cols-3 gap-3 sm:gap-8 max-w-2xl mx-auto">
            {[
              { value: '6+', label: 'Parceiros financeiros' },
              { value: '1000', label: 'Pontos máximos de score' },
              { value: 'R$ 10B+', label: 'Em crédito disponibilizado' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#0f172a]">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-200 anim-scale-in">
            {/* Browser chrome */}
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-2 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4 bg-white rounded-lg px-3 py-1 text-xs text-slate-400 text-center border border-slate-200">
                agro-rate.vercel.app/dashboard
              </div>
            </div>
            {/* Dashboard UI mock */}
            <div className="bg-slate-50 p-6">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Score card */}
                <div className="bg-white rounded-2xl border border-emerald-100 p-5 flex flex-col items-center">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Meu AgroRate</div>
                  <ScoreGaugeDemo score={820} />
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full mt-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Alto
                  </div>
                  <p className="text-xs text-slate-400 text-center mt-2">Gestão eficiente — excelentes ofertas disponíveis</p>
                </div>
                {/* Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Composição</div>
                  {[
                    { label: '🌾 Produção', score: 850, pct: 30 },
                    { label: '💰 Eficiência', score: 780, pct: 25 },
                    { label: '📋 Comportamento', score: 830, pct: 25 },
                    { label: '⚙️ Operacional', score: 790, pct: 20 },
                  ].map(({ label, score, pct }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{label} <span className="text-slate-300">({pct}%)</span></span>
                        <span className="font-bold text-[#065f46]">{score}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#065f46] rounded-full" style={{ width: `${(score / 1000) * 100}%`, opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Credit CTA mock */}
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-[#065f46] to-emerald-600 rounded-2xl p-5 text-white">
                    <div className="text-xs text-emerald-200 mb-1">Com seu score atual</div>
                    <div className="font-bold text-lg leading-tight mb-3">9 ofertas de crédito disponíveis</div>
                    <div className="bg-white/15 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex justify-between"><span>Sicredi</span><span className="font-bold">1,0% a.m.</span></div>
                      <div className="flex justify-between"><span>Banco do Brasil</span><span className="font-bold">1,2% a.m.</span></div>
                      <div className="flex justify-between"><span>Sicoob</span><span className="font-bold">1,4% a.m.</span></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className="text-xs text-slate-400 mb-2">Dica prioritária</div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-base">🌾</span>
                      <span className="text-slate-600 leading-snug">Registre receitas das suas culturas para aumentar o score de produção</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section id="como-funciona" className="px-6 py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <div className="text-sm font-semibold text-[#065f46] uppercase tracking-wider mb-3">Como funciona</div>
            <h2 className="text-4xl font-bold text-slate-900">Do campo ao crédito em 3 passos</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Sem burocracia, sem papelada. Seus dados de produção valem mais do que qualquer documento.</p>
          </ScrollReveal>

          <RevealOnScroll>
            <div className="grid md:grid-cols-3 gap-6">
              {STEPS.map((s, i) => (
                <div key={s.step} className="reveal bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all" style={{ transitionDelay: `${i * 120}ms` }}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl mb-4">{s.icon}</div>
                  <div className="text-xs font-bold text-[#065f46] mb-1 uppercase tracking-wide">Passo {s.step}</div>
                  <h3 className="font-bold text-slate-900 mb-2 text-lg">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── O SCORE (4 CAMADAS) ── */}
      <section id="score" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <div className="text-sm font-semibold text-[#065f46] uppercase tracking-wider mb-3">O Score</div>
            <h2 className="text-4xl font-bold text-slate-900">4 dimensões que medem<br />quem realmente produz</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">O AgroRate vai muito além do histórico bancário. Analisa a fazenda por dentro, em tempo real.</p>
          </ScrollReveal>

          <RevealOnScroll>
            <div className="grid md:grid-cols-2 gap-5 mb-12">
              {LAYERS.map((l, i) => (
                <div key={l.label} className="reveal bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all flex gap-5" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">{l.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">{l.label}</h3>
                      <span className="text-xs font-bold text-[#065f46] bg-emerald-50 px-2 py-0.5 rounded-lg">{l.pct}% do peso</span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{l.desc}</p>
                    <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#065f46] to-emerald-500 rounded-full" style={{ width: `${l.pct * 3}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          {/* Tabela de categorias */}
          <ScrollReveal>
            <div className="bg-slate-900 rounded-3xl p-8 md:p-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Tabela de classificação</h3>
                <p className="text-slate-400 text-sm">Cada nível abre portas para novas condições de crédito</p>
              </div>
              <RevealOnScroll>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CATEGORIES.map((cat, i) => (
                    <div key={cat.label} className={`reveal border-2 rounded-2xl p-4 hover:scale-[1.03] transition-transform cursor-default ${cat.color}`} style={{ transitionDelay: `${i * 80}ms` }}>
                      <div className="font-bold text-lg">{cat.label}</div>
                      <div className="text-2xl font-black my-1">{cat.range}</div>
                      <div className="text-xs opacity-75">{cat.desc}</div>
                    </div>
                  ))}
                </div>
              </RevealOnScroll>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="px-6 py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <div className="text-sm font-semibold text-[#065f46] uppercase tracking-wider mb-3">Funcionalidades</div>
            <h2 className="text-4xl font-bold text-slate-900">Tudo que você precisa para acessar crédito</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Uma plataforma completa construída para o produtor rural brasileiro.</p>
          </ScrollReveal>

          <RevealOnScroll>
            <div className="grid md:grid-cols-3 gap-5">
              {FEATURES.map((f, i) => (
                <FeatureCard3D key={f.title} {...f} delay={i * 90} />
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── PARCEIROS ── */}
      <section id="parceiros" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-16">
            <div className="text-sm font-semibold text-[#065f46] uppercase tracking-wider mb-3">Parceiros</div>
            <h2 className="text-4xl font-bold text-slate-900">Score aceito pelas principais<br />instituições do agro</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Banco, cooperativa ou fintech — cada parceiro define suas condições com base no seu AgroRate.</p>
          </ScrollReveal>

          <RevealOnScroll>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {PARTNERS.map((p, i) => (
                <div key={p.name} className={`reveal border-2 rounded-2xl p-5 hover:shadow-md hover:-translate-y-1 transition-all ${p.color}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div className="font-bold text-slate-900 text-base mb-1">{p.name}</div>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-lg border inline-block mb-3 ${p.color}`}>{p.type}</div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">Score mínimo</div>
                    <div className="font-black text-xl text-slate-800">{p.minScore}</div>
                  </div>
                </div>
              ))}
            </div>
          </RevealOnScroll>

          <ScrollReveal>
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 grid md:grid-cols-3 gap-6 text-center">
              {[
                { icon: '📊', title: 'Score compartilhado', desc: 'Seus dados são enviados ao parceiro somente com seu consentimento' },
                { icon: '⚡', title: 'Análise em horas', desc: 'Resposta em até 48h ao invés de semanas no modelo tradicional' },
                { icon: '🔒', title: 'LGPD compliant', desc: 'Você controla quais dados são compartilhados e com quem' },
              ].map(({ icon, title, desc }) => (
                <div key={title}>
                  <div className="text-3xl mb-2">{icon}</div>
                  <div className="font-semibold text-slate-800 mb-1">{title}</div>
                  <div className="text-sm text-slate-500">{desc}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── ECOSSISTEMA ── */}
      <section id="ecossistema" className="px-6 py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="bg-[#0f172a] rounded-3xl p-10 md:p-16 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 bg-emerald-900/50 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ecossistema completo do agro
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-4">Três sistemas.<br />Uma plataforma.</h2>
                  <p className="text-slate-400 leading-relaxed mb-8">
                    O AgroCore executa serviços. O AgroOS controla a operação. O AgroRate transforma tudo isso em crédito. Juntos, formam a infraestrutura digital completa da fazenda moderna.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="https://agrolink-opal.vercel.app" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#065f46] text-white font-bold px-5 py-3 rounded-xl hover:bg-[#047857] transition-colors text-sm">
                      Acessar AgroCore
                    </a>
                    <a href="https://agros-os.vercel.app" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-5 py-3 rounded-xl hover:bg-white/15 transition-colors text-sm border border-white/10">
                      Acessar AgroOS
                    </a>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: 'AgroCore', role: 'Marketplace de serviços', desc: 'Execução · Prestadores · Serviços · Pagamentos', color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                    { name: 'AgroOS', role: 'Sistema Operacional', desc: 'Planejamento · Financeiro · Equipe · IA', color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
                    { name: 'AgroRate', role: 'Score de Crédito Rural', desc: 'Score · Crédito · Parceiros · Fintech', color: 'bg-blue-500/10 border-blue-500/20 text-blue-400', active: true },
                  ].map(s => (
                    <div key={s.name} className={`border rounded-2xl p-4 hover:scale-[1.02] transition-transform ${s.color} ${s.active ? 'ring-2 ring-blue-500/30' : ''}`}>
                      <div className="flex items-center gap-3 mb-1">
                        <div className="font-bold text-white">{s.name}</div>
                        {s.active && <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">você está aqui</span>}
                      </div>
                      <div className="text-xs font-semibold mb-1">{s.role}</div>
                      <div className="text-xs text-slate-500">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <div style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' }}
              className="rounded-3xl p-14 md:p-20 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative">
                <h2 className="text-4xl font-bold mb-4">Seu crédito vem<br />da sua produção.</h2>
                <p className="text-emerald-200 mb-8 text-lg">Menos papel. Mais resultado. Comece grátis agora.</p>
                <Link href="/cadastro"
                  className="inline-flex items-center gap-2 bg-white text-[#065f46] font-bold px-10 py-4 rounded-2xl hover:bg-emerald-50 hover:-translate-y-1 hover:scale-[1.02] transition-all shadow-2xl text-lg">
                  Calcular meu score grátis →
                </Link>
                <p className="text-emerald-300 text-xs mt-5">Já usa AgroOS? Use o mesmo login.</p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-100 px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#065f46] rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-xs">AR</span>
              </div>
              <div>
                <div className="font-bold text-slate-800">AgroRate</div>
                <div className="text-xs text-slate-400">Parte do ecossistema AgroCore</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              <Link href="/como-funciona" className="hover:text-slate-600 transition-colors">Como funciona</Link>
              <Link href="/score" className="hover:text-slate-600 transition-colors">Meu Score</Link>
              <Link href="/parceiros" className="hover:text-slate-600 transition-colors">Parceiros</Link>
              <a href="https://agrolink-opal.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">AgroCore</a>
              <a href="https://agros-os.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">AgroOS</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-300">
            © 2026 AgroRate · Infraestrutura de crédito do agro moderno
          </div>
        </div>
      </footer>
    </div>
  )
}
