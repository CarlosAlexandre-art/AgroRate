'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type ScoreData = {
  score: number; category: string
  productionScore: number; efficiencyScore: number
  behaviorScore: number; operationalScore: number
  totalRevenue: number; totalCosts: number
  marginRate: number; activityCount: number
  dataCompleteness: number; lastCalculated: string
}

const CAT: Record<string, { label: string; color: string; bg: string; border: string; desc: string; hex: string }> = {
  ELITE:    { label: 'Elite',    hex: '#b45309', color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300',   desc: 'Operação exemplar — acesso às melhores condições do mercado' },
  HIGH:     { label: 'Alto',     hex: '#065f46', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', desc: 'Gestão eficiente — excelentes ofertas de crédito disponíveis' },
  GOOD:     { label: 'Bom',      hex: '#0d9488', color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-300',    desc: 'Boa performance — boas condições de financiamento' },
  REGULAR:  { label: 'Regular',  hex: '#1d4ed8', color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300',    desc: 'Desempenho médio — melhorias podem abrir novas linhas' },
  LOW:      { label: 'Baixo',    hex: '#c2410c', color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-300',  desc: 'Pontos de melhoria identificados — siga as dicas abaixo' },
  CRITICAL: { label: 'Crítico',  hex: '#b91c1c', color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-300',     desc: 'Score crítico — complete seus dados para melhorar' },
}

const CREDIT_COUNT = (s: number) => s >= 900 ? 12 : s >= 750 ? 9 : s >= 600 ? 6 : s >= 450 ? 3 : 1
const CREDIT_RATE  = (s: number) => s >= 750 ? '1,0%' : s >= 600 ? '1,2%' : s >= 450 ? '1,5%' : '1,8%'

function Gauge({ score }: { score: number }) {
  const pct = Math.min(score / 1000, 1)
  const r = 68, cx = 88, cy = 88
  const start = Math.PI * 0.75
  const total = Math.PI * 1.5
  const px = (a: number) => cx + r * Math.cos(a)
  const py = (a: number) => cy + r * Math.sin(a)
  const arc = (f: number, t: number) => {
    const lg = t - f > Math.PI ? 1 : 0
    return `M ${px(f)} ${py(f)} A ${r} ${r} 0 ${lg} 1 ${px(t)} ${py(t)}`
  }
  const cat = CAT[score >= 900 ? 'ELITE' : score >= 750 ? 'HIGH' : score >= 600 ? 'GOOD' : score >= 450 ? 'REGULAR' : score >= 300 ? 'LOW' : 'CRITICAL']
  return (
    <svg viewBox="0 0 176 126" className="w-44 h-32">
      <path d={arc(start, start + total)} fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round"/>
      {score > 0 && (
        <path d={arc(start, start + total * pct)} fill="none" stroke={cat.hex} strokeWidth="14" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${cat.hex}60)` }}/>
      )}
      <text x={cx} y={cx + 8} textAnchor="middle" fill={cat.hex} fontSize="28" fontWeight="800">{score}</text>
      <text x={cx} y={cx + 24} textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="600">de 1000 pontos</text>
    </svg>
  )
}

function MiniBar({ score, icon, label, weight, hex }: { score: number; icon: string; label: string; weight: number; hex: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">{icon} {label}<span className="text-slate-300">({weight}%)</span></span>
        <span className="font-bold" style={{ color: hex }}>{score}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(score/1000)*100}%`, background: hex, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }}/>
      </div>
    </div>
  )
}

function getTips(d: ScoreData) {
  const tips: { icon: string; text: string; action: string; hi: boolean }[] = []
  if (d.productionScore < 600)  tips.push({ icon: '🌾', text: 'Registre receitas das culturas no AgroOS para aumentar Produção', action: 'Ir ao AgroOS', hi: true })
  if (d.efficiencyScore < 600)  tips.push({ icon: '💰', text: 'Reduza custos ou aumente receita para melhorar a Eficiência', action: 'Ver dicas', hi: true })
  if (d.behaviorScore < 600)    tips.push({ icon: '📋', text: 'Lance custos todo mês — consistência melhora Comportamento', action: 'Entender', hi: false })
  if (d.operationalScore < 600) tips.push({ icon: '⚙️', text: 'Cadastre talhões e membros da equipe para subir Operacional', action: 'Configurar', hi: false })
  if (d.dataCompleteness < 80)  tips.push({ icon: '📊', text: 'Complete o perfil da propriedade (talhões, culturas, equipe)', action: 'Completar', hi: false })
  if (tips.length === 0)        tips.push({ icon: '🏆', text: 'Parabéns! Continue registrando dados para manter o score alto', action: 'Ver crédito', hi: false })
  return tips.slice(0, 3)
}

const SCORES_MOCK = [340, 380, 440, 490, 560, 600]

function Sparkline({ current }: { current: number }) {
  const vals = [...SCORES_MOCK, current]
  const min = Math.min(...vals) - 20
  const max = Math.max(...vals) + 20
  const W = 240, H = 52
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / (max - min)) * H
    return `${x},${y}`
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-13 overflow-visible">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#065f46" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#065f46" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts.join(' ')} ${W},${H}`} fill="url(#sg)"/>
      <polyline points={pts.join(' ')} fill="none" stroke="#065f46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={(vals.length - 1) / (vals.length - 1) * W} cy={H - ((current - min) / (max - min)) * H} r="4" fill="#065f46"/>
    </svg>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setError('Não autenticado'); setLoading(false); return }
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao calcular score'); setLoading(false); return }
      setData(json); setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid md:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse"/>)}
      </div>
      <p className="text-center text-sm text-slate-400 mt-6">Calculando seu AgroRate...</p>
    </div>
  )

  if (error || !data) return (
    <div className="p-5 max-w-2xl mx-auto pt-8 space-y-4">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">🌾</div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Configure sua fazenda para gerar o score</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Seu score AgroRate é calculado automaticamente com base nos dados da sua propriedade no AgroOS. Siga os 3 passos abaixo para começar.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { step: '01', icon: '🖥️', title: 'Acesse o AgroOS', desc: 'Entre em agros-os.vercel.app com o mesmo e-mail e senha do AgroRate. É a mesma conta.', href: 'https://agros-os.vercel.app', action: 'Abrir AgroOS' },
            { step: '02', icon: '🏡', title: 'Cadastre sua propriedade', desc: 'Crie uma propriedade, adicione os talhões (áreas de cultivo) e registre os membros da equipe.', href: null, action: null },
            { step: '03', icon: '💰', title: 'Registre receitas e custos', desc: 'Adicione pelo menos uma receita de colheita e seus custos operacionais. O score é calculado automaticamente em segundos.', href: null, action: null },
          ].map((s, i) => (
            <div key={s.step} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-xl bg-[#065f46] flex items-center justify-center text-white text-xs font-black flex-shrink-0">{s.step}</div>
                {i < 2 && <div className="w-px h-4 bg-slate-200"/>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span>{s.icon}</span>
                  <div className="font-semibold text-slate-800 text-sm">{s.title}</div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                {s.href && (
                  <a href={s.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-white bg-[#065f46] px-3 py-1.5 rounded-lg hover:bg-[#047857] transition-colors">
                    {s.action} →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">💡</span>
        <div>
          <div className="font-semibold text-blue-800 text-sm mb-0.5">Já tem dados no AgroOS?</div>
          <p className="text-xs text-blue-700 leading-relaxed">
            Se você já cadastrou sua propriedade e tem receitas registradas, o score pode levar até 1 minuto para carregar. Recarregue a página após alguns instantes.
          </p>
          <button onClick={() => window.location.reload()} className="mt-2 text-xs font-bold text-blue-700 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
            Recarregar agora
          </button>
        </div>
      </div>
    </div>
  )

  const cat = CAT[data.category] ?? CAT.REGULAR
  const tips = getTips(data)
  const marginPct = Math.round(data.marginRate * 100)
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

  return (
    <div className="p-5 max-w-4xl mx-auto space-y-4">

      {/* Row 1: Gauge + Composição + Crédito */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Score gauge */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col items-center shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">AgroRate</div>
          <Gauge score={data.score} />
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border mt-2 ${cat.color} ${cat.bg} ${cat.border}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>
            {cat.label}
          </div>
          <p className="text-xs text-slate-400 text-center mt-2 leading-snug">{cat.desc}</p>
        </div>

        {/* Composição */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Composição</div>
          <MiniBar score={data.productionScore}  icon="🌾" label="Produção"     weight={30} hex="#065f46"/>
          <MiniBar score={data.efficiencyScore}  icon="💰" label="Eficiência"   weight={25} hex="#0d9488"/>
          <MiniBar score={data.behaviorScore}    icon="📋" label="Comportamento" weight={25} hex="#7c3aed"/>
          <MiniBar score={data.operationalScore} icon="⚙️" label="Operacional"  weight={20} hex="#d97706"/>
          <p className="text-[10px] text-slate-300 pt-1 border-t border-slate-50">Atualizado em {new Date(data.lastCalculated).toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Crédito disponível */}
        <div className="flex flex-col gap-3">
          <div className="bg-gradient-to-br from-[#065f46] to-emerald-600 rounded-2xl p-5 text-white flex-1">
            <div className="text-xs text-emerald-200 mb-0.5">Disponível agora</div>
            <div className="text-3xl font-black">{CREDIT_COUNT(data.score)}</div>
            <div className="text-sm text-emerald-100 mb-3">ofertas de crédito</div>
            <div className="bg-white/15 rounded-xl p-3 text-xs space-y-1 mb-3">
              <div className="flex justify-between"><span>Melhor taxa</span><span className="font-bold">{CREDIT_RATE(data.score)} a.m.</span></div>
              <div className="flex justify-between"><span>Prazo máx.</span><span className="font-bold">18 meses</span></div>
            </div>
            <Link href="/dashboard/credito"
              className="block text-center bg-white text-[#065f46] text-xs font-bold py-2.5 rounded-xl hover:bg-emerald-50 transition-colors">
              Ver todas as ofertas →
            </Link>
          </div>
          <Link href="/dashboard/ia" className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-[#065f46]/30 hover:shadow-md transition-all group">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center text-lg flex-shrink-0">🤖</div>
            <div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-[#065f46] transition-colors">Conselheiro IA</div>
              <div className="text-xs text-slate-400">Dicas personalizadas</div>
            </div>
            <svg className="w-4 h-4 text-slate-300 ml-auto group-hover:text-[#065f46] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* Row 2: Métricas da fazenda */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Receita total', value: fmt(data.totalRevenue), icon: '💵', good: data.totalRevenue > 0 },
          { label: 'Margem operacional', value: `${marginPct}%`, icon: '📈', good: marginPct >= 20 },
          { label: 'Atividades', value: `${data.activityCount} concluídas`, icon: '✅', good: data.activityCount >= 5 },
          { label: 'Completude', value: `${data.dataCompleteness}%`, icon: '📋', good: data.dataCompleteness >= 70 },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{m.icon}</span>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{m.label}</div>
            </div>
            <div className={`font-bold text-lg ${m.good ? 'text-slate-800' : 'text-orange-600'}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Row 3: Evolução + Dicas */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Evolução do score */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Evolução do score</div>
            <Link href="/dashboard/historico" className="text-xs font-semibold text-[#065f46] hover:underline">Ver histórico →</Link>
          </div>
          <Sparkline current={data.score} />
          <div className="flex justify-between text-[10px] text-slate-300 mt-2">
            <span>Nov/25</span><span>Dez</span><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span className="text-[#065f46] font-bold">Hoje</span>
          </div>
        </div>

        {/* Dicas */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Como melhorar</div>
          <div className="space-y-2.5">
            {tips.map((tip, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${tip.hi ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50'}`}>
                <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                <p className="text-xs text-slate-600 leading-snug flex-1">{tip.text}</p>
                {tip.hi && <span className="text-[9px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5">urgente</span>}
              </div>
            ))}
          </div>
          <Link href="/dashboard/ia"
            className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#065f46] hover:text-[#047857] transition-colors">
            <span>🤖</span> Pedir análise personalizada à IA
          </Link>
        </div>
      </div>

      {/* Row 4: Tabela de classificação */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Classificação</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(CAT).map(([key, cfg]) => {
            const ranges: Record<string, string> = { ELITE:'900–1000', HIGH:'750–899', GOOD:'600–749', REGULAR:'450–599', LOW:'300–449', CRITICAL:'0–299' }
            const isMe = key === data.category
            return (
              <div key={key} className={`rounded-xl p-2.5 text-center border transition-all ${isMe ? `${cfg.bg} ${cfg.border}` : 'border-slate-100 text-slate-400'}`}
                style={isMe ? { outline: `2px solid ${cfg.hex}`, outlineOffset: '2px' } : {}}>
                <div className={`text-xs font-bold ${isMe ? cfg.color : ''}`}>{cfg.label}</div>
                <div className={`text-[11px] mt-0.5 ${isMe ? cfg.color : 'text-slate-400'} font-semibold`}>{ranges[key]}</div>
                {isMe && <div className="mt-1 text-[9px] font-bold" style={{ color: cfg.hex }}>← você</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
