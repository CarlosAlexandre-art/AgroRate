import Link from 'next/link'

const COOPS = [
  { name: 'Sicredi', share: '30%', volume: 'R$ 42 bi', highlight: true },
  { name: 'Sicoob', share: '57%', volume: 'R$ 60 bi', highlight: false },
  { name: 'Cresol', share: '100%', volume: 'Recursos equalizados', highlight: false },
]

const ADVANTAGES = [
  {
    icon: '🤝',
    title: 'Capilaridade local + inteligência digital',
    desc: 'Você tem o relacionamento com o produtor. Nós trazemos a análise de dados que falta. Juntos, aprovamos mais com menos risco.',
  },
  {
    icon: '⚡',
    title: 'Pré-aprovação em minutos',
    desc: 'Com o score AgroRate, seu gerente chega à reunião já sabendo o score, as linhas elegíveis e quais documentos faltam. Zero retrabalho.',
  },
  {
    icon: '🌿',
    title: 'Conformidade CAR automática',
    desc: 'A Resolução CMN nº 5.193 exige consulta ao PRODES antes de liberar crédito. O AgroRate sinaliza automaticamente imóveis com pendências ambientais.',
  },
  {
    icon: '📈',
    title: 'Cresça sua carteira com segurança',
    desc: 'Sicoob projeta R$ 60 bi para 25/26. Com mais produtores pré-qualificados na sua base, bater essa meta fica muito mais fácil.',
  },
]

const WORKFLOW = [
  { num: '1', title: 'Produtor se cadastra no AgroRate', desc: 'Usa o mesmo login do AgroOS. Score calculado automaticamente com dados reais da fazenda.' },
  { num: '2', title: 'Cooperativa recebe o lead', desc: 'Via API ou painel admin: score, documentos, histórico financeiro e linhas elegíveis — tudo em um JSON.' },
  { num: '3', title: 'Gerente faz análise final', desc: 'Com 80% do trabalho já feito pelo AgroRate, o gerente foca na visita e na relação com o associado.' },
  { num: '4', title: 'Crédito aprovado', desc: 'AgroRate recebe confirmação e registra a operação. Comissão calculada automaticamente.' },
]

const COMPLIANCE = [
  { norm: 'Res. CMN nº 5.193', desc: 'Obrigatoriedade de consulta PRODES — AgroRate verifica CAR ativo e sinaliza pendências.' },
  { norm: 'Res. CMN nº 5.229', desc: 'Novo limite Pronamp R$ 3,5 mi — AgroRate categoriza produtores por perfil automaticamente.' },
  { norm: 'LGPD', desc: 'Consentimento explícito do produtor antes de compartilhar qualquer dado com a cooperativa.' },
  { norm: 'MCR (Manual Crédito Rural)', desc: 'Checklist documental gerado conforme os 4 eixos do MCR vigente para o ciclo 2025/26.' },
]

export default function ParaCooperativasPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
        <Link href="/" className="font-black text-[#065f46] text-xl">AgroRate</Link>
        <div className="flex items-center gap-4">
          <Link href="/para-bancos" className="text-sm text-slate-600 hover:text-slate-900">Para Bancos</Link>
          <Link href="/login" className="text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">Entrar</Link>
          <a href="mailto:cooperativas@agrorate.com.br" className="text-sm font-bold bg-[#065f46] text-white px-4 py-2 rounded-xl hover:bg-[#047857] transition-colors">Falar com nosso time</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              Exclusivo para cooperativas de crédito rural
            </div>
            <h1 className="text-5xl font-black text-slate-900 leading-tight mb-6">
              Seu gerente já deveria saber o score antes da<br/>
              <span className="text-[#065f46]">primeira reunião</span>
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mb-8">
              O AgroRate entrega ao gerente da cooperativa um perfil completo do associado — score, documentos, dados financeiros reais e linhas elegíveis do Plano Safra — antes mesmo de ele ligar para marcar a visita.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a href="mailto:cooperativas@agrorate.com.br"
                className="px-8 py-4 bg-[#065f46] text-white rounded-2xl font-bold hover:bg-[#047857] transition-colors">
                Quero uma demonstração
              </a>
              <Link href="#como-funciona" className="px-8 py-4 border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-colors">
                Ver fluxo completo
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {COOPS.map(c => (
              <div key={c.name} className={`rounded-2xl p-5 border-2 ${c.highlight ? 'border-[#065f46] bg-[#065f46]/5' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">Execução custeio Plano Safra 25/26</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-[#065f46]">{c.share}</div>
                    <div className="text-xs text-slate-500">{c.volume}</div>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-400 text-center">Cooperativas lideram execução do crédito rural no Brasil</p>
          </div>
        </div>
      </section>

      {/* Vantagens */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Por que cooperativas escolhem o AgroRate</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {ADVANTAGES.map(a => (
              <div key={a.title} className="bg-white rounded-2xl p-6 border border-slate-100">
                <span className="text-3xl mb-4 block">{a.icon}</span>
                <h3 className="font-bold text-slate-900 mb-2">{a.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fluxo */}
      <section id="como-funciona" className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Fluxo de integração</h2>
        <div className="grid md:grid-cols-4 gap-5">
          {WORKFLOW.map((w, i) => (
            <div key={w.num} className="relative">
              {i < WORKFLOW.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-slate-200 z-0"/>
              )}
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#065f46] text-white font-black text-lg flex items-center justify-center mb-4">{w.num}</div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{w.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{w.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="bg-[#065f46] py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-white text-center mb-3">Conformidade regulatória incluída</h2>
          <p className="text-emerald-200 text-center mb-12">Resoluções do CMN 2025/26 e MCR já implementadas na plataforma</p>
          <div className="grid md:grid-cols-2 gap-4">
            {COMPLIANCE.map(c => (
              <div key={c.norm} className="bg-white/10 rounded-2xl p-5 border border-white/10">
                <div className="text-xs font-black text-emerald-300 mb-2">{c.norm}</div>
                <p className="text-emerald-100 text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modelo de monetização */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-4">Modelo de parceria simples</h2>
        <p className="text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Sem mensalidade inicial para cooperativas parceiras. Trabalhamos com <strong>% sobre o valor do crédito originado</strong> — você só paga quando aprova. Alinhamos os incentivos.
        </p>
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {[
            { type: 'Pronaf / Pronamp', rate: '0.8%', example: 'R$500k → R$4.000' },
            { type: 'Moderinfra / PCA', rate: '0.8%', example: 'R$1M → R$8.000' },
            { type: 'Crédito Livre', rate: '1.0%', example: 'R$2M → R$20.000' },
          ].map(m => (
            <div key={m.type} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">{m.type}</div>
              <div className="text-3xl font-black text-[#065f46] mb-1">{m.rate}</div>
              <div className="text-xs text-slate-400">Ex: {m.example}</div>
            </div>
          ))}
        </div>
        <a href="mailto:cooperativas@agrorate.com.br"
          className="inline-block px-10 py-4 bg-[#065f46] text-white rounded-2xl font-bold text-lg hover:bg-[#047857] transition-colors shadow-lg shadow-emerald-900/20">
          Quero ser uma cooperativa parceira →
        </a>
      </section>

      <footer className="border-t border-slate-100 px-6 py-6 text-center text-xs text-slate-400">
        AgroRate · cooperativas@agrorate.com.br · Parte do ecossistema AgroCore · AgroOS · AgroRate
      </footer>
    </div>
  )
}
