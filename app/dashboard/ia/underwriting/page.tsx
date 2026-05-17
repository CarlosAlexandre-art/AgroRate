'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type LinhaRecomendada = {
  linha: string; entidade: string; valorMax: string
  taxaEstimada: string; prazoMax: string; requisito: string
}
type CapacidadePagamento = {
  avaliacao: string; dscr: string; observacao: string
}
type Parecer = {
  veredicto: 'APROVADO' | 'CONDICIONAL' | 'RECUSADO'
  pontuacaoRisco: number; classeRisco: string
  resumoExecutivo: string
  capacidadePagamento: CapacidadePagamento
  garantiasRecomendadas: string[]; condicoesEspecificas: string[]
  linhasRecomendadas: LinhaRecomendada[]
  fatoresPositivos: string[]; fatoresRisco: string[]
  pendenciasDocumentais: string[]; proximosPassos: string[]
  validadeParecerDias: number
}
type Data = {
  ok: boolean; geradoEm: string; produtor: string
  propriedade: string; scoreAgroRate: number; categoria: string
  parecer: Parecer
}

const VEREDICTO_STYLE = {
  APROVADO:    { color: '#10b981', glow: '#10b98166', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.4)',  label: 'APROVADO',    icon: '✅' },
  CONDICIONAL: { color: '#f59e0b', glow: '#f59e0b66', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.4)',  label: 'CONDICIONAL', icon: '🔐' },
  RECUSADO:    { color: '#ef4444', glow: '#ef444466', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.4)',   label: 'RECUSADO',    icon: '⛔' },
}

const CLASSE_COLOR: Record<string, string> = {
  A: '#10b981', B: '#34d399', C: '#f59e0b', D: '#f97316', E: '#ef4444',
}

function use3D(intensity = 16) {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState({})
  function onMove(e: React.MouseEvent) {
    const el = ref.current; if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width  - 0.5) * intensity
    const y = ((e.clientY - r.top)  / r.height - 0.5) * intensity
    setStyle({ transform: `perspective(900px) rotateY(${x}deg) rotateX(${-y}deg) scale3d(1.025,1.025,1.025)`, transition: 'transform 0.05s ease' })
  }
  function onLeave() { setStyle({ transform: 'perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)', transition: 'transform 0.4s ease' }) }
  return { ref, style, onMove, onLeave }
}

function GlassPanel({ children, style: extra = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{
      background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1.25rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      padding: '1.5rem', ...extra,
    }}>{children}</div>
  )
}

function ScoreRing({ score, color, glow, label }: { score: number; color: string; glow: string; label: string }) {
  const r = 40, cx = 48, cy = 48, circ = 2 * Math.PI * r
  const pct = Math.min(score, 1000) / 1000
  const offset = circ - pct * circ
  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 96 96" className="w-28 h-28 -rotate-90" style={{ filter: `drop-shadow(0 0 14px ${glow})` }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[9px] text-white/40 uppercase tracking-widest">{label}</span>
      </div>
    </div>
  )
}

function VeredictoCard({ data, parecer }: { data: Data; parecer: Parecer }) {
  const vs = VEREDICTO_STYLE[parecer.veredicto]
  const { ref, style, onMove, onLeave } = use3D(12)
  const classeColor = CLASSE_COLOR[parecer.classeRisco] ?? '#94a3b8'
  return (
    <div ref={ref} style={{
      ...style, transformStyle: 'preserve-3d', cursor: 'default',
      background: `linear-gradient(135deg, ${vs.bg}, rgba(10,18,35,0.95))`,
      border: `2px solid ${vs.border}`,
      boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 60px ${vs.glow}, inset 0 1px 0 rgba(255,255,255,0.08)`,
      borderRadius: '1.5rem', padding: '2rem',
    }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="text-5xl" style={{ filter: `drop-shadow(0 0 16px ${vs.color})` }}>{vs.icon}</div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-3xl font-black" style={{ color: vs.color, textShadow: `0 0 20px ${vs.glow}` }}>
              {vs.label}
            </span>
            <span className="text-sm font-bold px-2.5 py-1 rounded-full" style={{
              background: `${classeColor}22`, color: classeColor, border: `1px solid ${classeColor}55`
            }}>
              Classe {parecer.classeRisco}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full" style={{
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              Risco {parecer.pontuacaoRisco}/100
            </span>
          </div>
          <p className="text-sm" style={{ color: `${vs.color}bb` }}>
            Score AgroRate <span className="font-bold text-white/80">{data.scoreAgroRate}/1000</span> — {data.categoria}
          </p>
        </div>
        <div className="text-right text-xs text-white/30 hidden sm:block shrink-0">
          <div>Válido {parecer.validadeParecerDias} dias</div>
          <div>{new Date(data.geradoEm).toLocaleDateString('pt-BR')}</div>
        </div>
      </div>
    </div>
  )
}

function LinhaCard({ l }: { l: LinhaRecomendada }) {
  const { ref, style, onMove, onLeave } = use3D(10)
  return (
    <div ref={ref} style={{
      ...style, transformStyle: 'preserve-3d', cursor: 'default',
      background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      borderRadius: '1rem', padding: '1.25rem',
    }} onMouseMove={onMove} onMouseLeave={onLeave}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-white text-sm">{l.linha}</div>
          <div className="text-xs text-white/40 mt-0.5">{l.entidade}</div>
        </div>
        <span className="text-base font-black" style={{ color: '#10b981', textShadow: '0 0 12px #10b98166' }}>{l.valorMax}</span>
      </div>
      <div className="flex gap-3 text-xs mt-3 flex-wrap">
        <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
          {l.taxaEstimada}
        </span>
        <span className="px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {l.prazoMax}m
        </span>
      </div>
      {l.requisito && (
        <div className="mt-2.5 text-xs text-white/30">{l.requisito}</div>
      )}
    </div>
  )
}

export default function UnderwritingPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [solicitado, setSolicitado] = useState(false)

  async function gerar() {
    setLoading(true); setErro(''); setSolicitado(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/ai/underwriting', {
        headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {},
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error ?? 'Erro ao gerar parecer'); return }
      setData(json)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  const p = data?.parecer

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg, #060b14 0%, #0c1525 50%, #070e1c 100%)' }}>

      {/* Mesh fundo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #10b981, transparent)', top: '-15%', right: '-10%' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)', bottom: '-5%', left: '-5%' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-6 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', top: '40%', left: '30%' }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header 3D */}
        <div style={{ transform: 'perspective(1200px) rotateX(2deg)', transformStyle: 'preserve-3d' }}>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/30 text-xs mb-2">
                <span>IA</span><span>/</span><span>Underwriting</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight" style={{
                background: 'linear-gradient(135deg, #fff 0%, #10b981 60%, #34d399 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textShadow: 'none', filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.4))',
              }}>Underwriting Agrícola IA</h1>
              <p className="text-white/40 text-sm mt-1.5">Parecer automático de crédito rural baseado no perfil completo da propriedade</p>
            </div>
            <div className="flex gap-2.5 print:hidden">
              {data && (
                <button onClick={() => window.print()}
                  className="px-4 py-2.5 text-sm font-semibold rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  Imprimir PDF
                </button>
              )}
              <button onClick={gerar} disabled={loading}
                className="px-6 py-2.5 font-bold text-sm rounded-xl disabled:opacity-50 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 8px 24px rgba(16,185,129,0.4), 0 0 40px rgba(16,185,129,0.2)',
                  color: 'white', transform: loading ? 'scale(0.97)' : 'scale(1)',
                }}>
                {loading ? '⏳ Analisando...' : data ? '🔄 Atualizar' : '🏦 Gerar Parecer'}
              </button>
            </div>
          </div>
        </div>

        {/* Estado inicial */}
        {!solicitado && !loading && (
          <GlassPanel style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <div className="text-6xl mb-5 inline-block" style={{ filter: 'drop-shadow(0 0 20px #10b98166)' }}>🏦</div>
            <h2 className="text-xl font-bold text-white mb-3">Parecer de Crédito Inteligente</h2>
            <p className="text-white/40 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              A IA analisa score, documentação, histórico financeiro e perfil da propriedade para emitir um parecer formal de crédito rural.
            </p>
            <button onClick={gerar} className="px-8 py-4 font-bold rounded-2xl text-white"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 32px rgba(16,185,129,0.5)' }}>
              Gerar Underwriting
            </button>
          </GlassPanel>
        )}

        {/* Loading */}
        {loading && (
          <GlassPanel style={{ padding: '5rem 2rem', textAlign: 'center' }}>
            <div className="flex justify-center gap-2 mb-5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 rounded-full" style={{
                  background: '#10b981', animation: 'bounce 1s ease infinite',
                  animationDelay: `${i * 0.15}s`, boxShadow: '0 0 8px #10b981',
                }} />
              ))}
            </div>
            <p className="text-white/40 text-sm">Analisando perfil de crédito completo...</p>
          </GlassPanel>
        )}

        {/* Erro */}
        {erro && !loading && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>{erro}</div>
        )}

        {/* Resultado */}
        {p && data && !loading && (
          <>
            {/* Veredicto 3D */}
            <VeredictoCard data={data} parecer={p} />

            {/* Score + Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GlassPanel style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem' }}>
                <ScoreRing score={data.scoreAgroRate} color="#10b981" glow="#10b98166" label="AgroRate" />
                <div className="text-xs text-white/40 mt-2">{data.categoria}</div>
              </GlassPanel>
              <GlassPanel style={{ padding: '1.25rem' }}>
                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Produtor</div>
                <div className="font-bold text-white text-sm">{data.produtor}</div>
                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1 mt-3">Propriedade</div>
                <div className="font-semibold text-white/80 text-sm">{data.propriedade}</div>
              </GlassPanel>
              <GlassPanel style={{ padding: '1.25rem' }}>
                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Capacidade de Pagamento</div>
                <div className="font-black text-lg capitalize mb-1" style={{
                  color: { forte: '#10b981', adequada: '#34d399', limitada: '#f59e0b', insuficiente: '#ef4444' }[p.capacidadePagamento.avaliacao] ?? '#94a3b8'
                }}>
                  {p.capacidadePagamento.avaliacao}
                </div>
                <div className="text-xs text-white/40">DSCR {p.capacidadePagamento.dscr}</div>
                <p className="text-white/50 text-xs mt-2 leading-relaxed">{p.capacidadePagamento.observacao}</p>
              </GlassPanel>
            </div>

            {/* Resumo Executivo */}
            <GlassPanel>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">📊</span>
                <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Resumo Executivo</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{p.resumoExecutivo}</p>
            </GlassPanel>

            {/* Fatores positivos + Riscos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div style={{
                background: 'rgba(16,185,129,0.06)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(16,185,129,0.25)', borderRadius: '1.25rem',
                boxShadow: '0 4px 24px rgba(16,185,129,0.1)', padding: '1.5rem',
              }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#34d399' }}>✅ Fatores Positivos</h3>
                <ul className="space-y-2">
                  {p.fatoresPositivos.map((f, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'rgba(52,211,153,0.85)' }}>
                      <span style={{ color: '#10b981' }}>•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{
                background: 'rgba(239,68,68,0.06)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(239,68,68,0.25)', borderRadius: '1.25rem',
                boxShadow: '0 4px 24px rgba(239,68,68,0.1)', padding: '1.5rem',
              }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#f87171' }}>⚠️ Fatores de Risco</h3>
                <ul className="space-y-2">
                  {p.fatoresRisco.map((f, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'rgba(248,113,113,0.85)' }}>
                      <span style={{ color: '#ef4444' }}>•</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Condições + Garantias */}
            {(p.condicoesEspecificas.length > 0 || p.garantiasRecomendadas.length > 0) && (
              <div style={{
                background: 'rgba(245,158,11,0.06)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(245,158,11,0.25)', borderRadius: '1.25rem',
                boxShadow: '0 4px 24px rgba(245,158,11,0.1)', padding: '1.5rem',
              }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#fbbf24' }}>🔐 Condições e Garantias</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {p.condicoesEspecificas.length > 0 && (
                    <div>
                      <div className="text-[10px] text-amber-400/60 font-medium uppercase tracking-widest mb-2">Condições específicas</div>
                      <ul className="space-y-1.5">
                        {p.condicoesEspecificas.map((c, i) => (
                          <li key={i} className="text-sm flex gap-2" style={{ color: 'rgba(251,191,36,0.8)' }}><span>•</span>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.garantiasRecomendadas.length > 0 && (
                    <div>
                      <div className="text-[10px] text-amber-400/60 font-medium uppercase tracking-widest mb-2">Garantias recomendadas</div>
                      <ul className="space-y-1.5">
                        {p.garantiasRecomendadas.map((g, i) => (
                          <li key={i} className="text-sm flex gap-2" style={{ color: 'rgba(251,191,36,0.8)' }}><span>•</span>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Linhas de crédito — cards 3D */}
            {p.linhasRecomendadas.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xl">💳</span>
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Linhas de Crédito Recomendadas</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.linhasRecomendadas.map((l, i) => <LinhaCard key={i} l={l} />)}
                </div>
              </div>
            )}

            {/* Pendências documentais */}
            {p.pendenciasDocumentais.length > 0 && (
              <div style={{
                background: 'rgba(249,115,22,0.06)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(249,115,22,0.25)', borderRadius: '1.25rem',
                boxShadow: '0 4px 24px rgba(249,115,22,0.1)', padding: '1.5rem',
              }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: '#fb923c' }}>📋 Pendências Documentais</h3>
                <ul className="space-y-2">
                  {p.pendenciasDocumentais.map((d, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: 'rgba(251,146,60,0.85)' }}><span>•</span>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Próximos passos */}
            <GlassPanel style={{ background: 'rgba(15,23,42,0.6)' }}>
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Próximos Passos</h3>
              <ol className="space-y-3">
                {p.proximosPassos.map((s, i) => (
                  <li key={i} className="text-sm flex gap-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <span className="font-black shrink-0 w-5" style={{ color: '#10b981' }}>{i + 1}.</span>{s}
                  </li>
                ))}
              </ol>
            </GlassPanel>

            {/* Rodapé */}
            <p className="text-center text-xs text-white/25">
              Parecer gerado por ORYON IA em {new Date(data.geradoEm).toLocaleString('pt-BR')} — válido por {p.validadeParecerDias} dias.
              Este documento é de apoio e não substitui análise bancária formal.
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @media print { body { background: white !important; } }
      `}</style>
    </div>
  )
}
