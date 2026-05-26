'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DadosColaborador {
  role: string
  nomeColaborador?: string
  property: { name: string; location?: string; sizeHectares: number }
  owner: { name: string; phone?: string; email: string }
  score: {
    score: number; category: string
    productionScore: number; efficiencyScore: number; behaviorScore: number; operationalScore: number
    paymentOnTimeRate: number; dataCompleteness: number
    trendHistory: any; updatedAt: string
  } | null
  agroRate?: {
    quodScore?: number; quodFaixa?: string
    cafirNumero?: string; cafirSituacao?: string
    carNumero?: string; carSituacao?: string
    dapNumero?: string; dapSituacao?: string
    cafNumero?: string; cafSituacao?: string
  } | null
  certidoes?: any[]
  revenues?: { amount: number; date: string; category: string; description?: string }[]
  costs?: { amount: number; date: string; category: string; description?: string }[]
  documents?: { id: string; name: string; category: string; fileUrl?: string; fileName?: string; expiry?: string; createdAt?: string }[]
  loanContracts?: any[]
  garantias?: any[]
}

const SCORE_COLOR = (s: number) =>
  s >= 900 ? '#b45309' : s >= 750 ? '#059669' : s >= 600 ? '#0d9488' : s >= 450 ? '#2563eb' : s >= 300 ? '#c2410c' : '#b91c1c'

const SCORE_BG = (s: number) =>
  s >= 900 ? 'rgba(180,83,9,.15)' : s >= 750 ? 'rgba(5,150,105,.15)' : s >= 600 ? 'rgba(13,148,136,.15)' : s >= 450 ? 'rgba(37,99,235,.15)' : 'rgba(185,28,28,.15)'

const CAT_LABEL: Record<string, string> = { ELITE: 'Elite', HIGH: 'Alto', GOOD: 'Bom', REGULAR: 'Regular', LOW: 'Baixo', CRITICAL: 'Crítico' }

function monthLabel(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function ScoreBar({ label, val, max = 250 }: { label: string; val: number; max?: number }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.55)' }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>{val}<span style={{ color: 'rgba(255,255,255,.3)', fontWeight: 400 }}>/{max}</span></span>
      </div>
      <div style={{ height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,.08)' }}>
        <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg,#059669,#34d399)', width: `${(val / max) * 100}%`, transition: 'width 1s ease' }} />
      </div>
    </div>
  )
}

function CertidaoRow({ icon, label, numero, situacao }: { icon: string; label: string; numero?: string | null; situacao?: string | null }) {
  const ok = situacao && !['PENDENTE', 'IRREGULAR', 'CANCELADA'].includes(situacao.toUpperCase())
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px' }}>{icon}</span>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{label}</div>
          {numero && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)' }}>{numero}</div>}
        </div>
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', background: numero ? (ok ? 'rgba(52,211,153,.15)' : 'rgba(248,113,113,.15)') : 'rgba(255,255,255,.06)', color: numero ? (ok ? '#34d399' : '#f87171') : 'rgba(255,255,255,.35)' }}>
        {numero ? (situacao ?? 'Verificado') : 'Não verificado'}
      </span>
    </div>
  )
}

export default function ColaboradorPortal({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [dados, setDados] = useState<DadosColaborador | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState<'score' | 'fluxo' | 'docs' | 'contratos'>('score')

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t)
      fetch(`/api/colaborador/${t}`)
        .then(r => r.json())
        .then(d => {
          if (d.error) {
            if (d.pendente) router.push(`/acesso/${t}`)
            else setErro(d.error)
          } else setDados(d)
        })
        .catch(() => setErro('Erro ao carregar dados.'))
        .finally(() => setLoading(false))
    })
  }, [params, router])

  // Fluxo de caixa agrupado por mês
  const fluxo = (() => {
    if (!dados?.revenues && !dados?.costs) return []
    const meses: Record<string, { receita: number; custo: number }> = {}
    for (const r of dados.revenues ?? []) {
      const k = r.date.slice(0, 7)
      meses[k] = { receita: (meses[k]?.receita ?? 0) + Number(r.amount), custo: meses[k]?.custo ?? 0 }
    }
    for (const c of dados.costs ?? []) {
      const k = c.date.slice(0, 7)
      meses[k] = { receita: meses[k]?.receita ?? 0, custo: (meses[k]?.custo ?? 0) + Number(c.amount) }
    }
    return Object.entries(meses).sort(([a], [b]) => a.localeCompare(b)).slice(-12)
  })()

  const maxFluxo = Math.max(...fluxo.map(([, v]) => Math.max(v.receita, v.custo)), 1)

  const totalReceita = (dados?.revenues ?? []).reduce((s, r) => s + Number(r.amount), 0)
  const totalCusto = (dados?.costs ?? []).reduce((s, c) => s + Number(c.amount), 0)
  const margem = totalReceita > 0 ? ((totalReceita - totalCusto) / totalReceita) * 100 : 0

  const isContador = dados?.role === 'CONTADOR' || dados?.role === 'COLABORADOR'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#020c14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '2px solid rgba(52,211,153,.3)', borderTopColor: '#34d399', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '14px' }}>Carregando portal…</div>
      </div>
    </div>
  )

  if (erro) return (
    <div style={{ minHeight: '100vh', background: '#020c14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#fca5a5' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: '16px' }}>{erro}</div>
      </div>
    </div>
  )

  if (!dados) return null

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#020c14 0%,#041410 50%,#020c14 100%)', fontFamily: 'system-ui,sans-serif', color: '#f0fdf4' }}>

      {/* Grid bg */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(52,211,153,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(52,211,153,.025) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(2,12,20,.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(52,211,153,.12)', padding: '0 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="7" fill="#22c55e" opacity=".9"/>
              <circle cx="16" cy="16" r="13" stroke="#22c55e" strokeWidth="1.5" strokeOpacity=".3"/>
            </svg>
            <span style={{ fontWeight: 800, color: '#a7f3d0', fontSize: '16px' }}>AgroRate</span>
            <span style={{ color: 'rgba(255,255,255,.2)', fontSize: '14px' }}>/</span>
            <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '14px', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dados.property.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: 'rgba(52,211,153,.12)', color: '#34d399', border: '1px solid rgba(52,211,153,.25)' }}>
              {dados.role === 'CONTADOR' ? 'Contador' : dados.role === 'COLABORADOR' ? 'Colaborador' : 'Visualizador'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>

        {/* Topo: propriedade + contato */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: '6px' }}>Propriedade</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{dados.property.name}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {dados.property.location && <span>📍 {dados.property.location}</span>}
              {dados.property.sizeHectares > 0 && <span>🌾 {dados.property.sizeHectares.toLocaleString('pt-BR')} ha</span>}
              <span>👤 Produtor: {dados.owner.name}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {dados.owner.phone && (
              <a
                href={`https://wa.me/55${dados.owner.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${dados.owner.name}! Sou seu ${dados.role === 'CONTADOR' ? 'contador' : 'colaborador'} com acesso ao AgroRate. Tenho uma dúvida sobre a propriedade ${dados.property.name}.`)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '12px', background: 'rgba(34,197,94,.12)', border: '1px solid rgba(34,197,94,.25)', color: '#4ade80', fontWeight: 700, fontSize: '13px', textDecoration: 'none', transition: 'all .2s' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            <a
              href={`mailto:${dados.owner.email}?subject=AgroRate - ${dados.property.name}&body=Olá ${dados.owner.name},%0A%0AEstou acessando os dados da propriedade ${dados.property.name} pelo AgroRate.%0A%0A`}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '12px', background: 'rgba(96,165,250,.10)', border: '1px solid rgba(96,165,250,.2)', color: '#93c5fd', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              E-mail
            </a>
          </div>
        </div>

        {/* Abas */}
        {isContador && (
          <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'rgba(255,255,255,.03)', borderRadius: '14px', padding: '4px', border: '1px solid rgba(255,255,255,.06)' }}>
            {([
              { id: 'score', label: 'Score & Certidões' },
              { id: 'fluxo', label: 'Fluxo de Caixa' },
              { id: 'docs', label: 'Documentos' },
              { id: 'contratos', label: 'Contratos' },
            ] as const).map(a => (
              <button key={a.id} onClick={() => setAba(a.id)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', transition: 'all .2s',
                  background: aba === a.id ? 'rgba(52,211,153,.15)' : 'transparent',
                  color: aba === a.id ? '#34d399' : 'rgba(255,255,255,.45)',
                }}>
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* ── ABA SCORE ── */}
        {(aba === 'score' || !isContador) && dados.score && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>

            {/* Score principal */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: '20px' }}>AgroRate Score</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '56px', fontWeight: 900, color: SCORE_COLOR(dados.score.score), lineHeight: 1 }}>{dados.score.score}</span>
                <span style={{ fontSize: '20px', color: 'rgba(255,255,255,.3)' }}>/1000</span>
              </div>
              <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, background: SCORE_BG(dados.score.score), color: SCORE_COLOR(dados.score.score) }}>
                {CAT_LABEL[dados.score.category] ?? dados.score.category}
              </span>
              <div style={{ marginTop: '24px' }}>
                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,.07)', marginBottom: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '4px', background: `linear-gradient(90deg,${SCORE_COLOR(dados.score.score)}80,${SCORE_COLOR(dados.score.score)})`, width: `${(dados.score.score / 1000) * 100}%`, transition: 'width 1.2s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,.25)' }}>
                  <span>0</span><span>250</span><span>500</span><span>750</span><span>1000</span>
                </div>
              </div>
              <div style={{ marginTop: '20px', fontSize: '11px', color: 'rgba(255,255,255,.3)' }}>
                Atualizado em {new Date(dados.score.updatedAt).toLocaleDateString('pt-BR')}
              </div>
            </div>

            {/* Sub-scores */}
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: '20px' }}>Composição do Score</div>
              <ScoreBar label="Produção" val={dados.score.productionScore} />
              <ScoreBar label="Eficiência" val={dados.score.efficiencyScore} />
              <ScoreBar label="Comportamento" val={dados.score.behaviorScore} />
              <ScoreBar label="Operacional" val={dados.score.operationalScore} />
              <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{Math.round(dados.score.paymentOnTimeRate * 100)}%</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>Pontualidade</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{Math.round(dados.score.dataCompleteness * 100)}%</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.4)', marginTop: '2px' }}>Completude</div>
                </div>
              </div>
            </div>

            {/* Certidões — apenas CONTADOR/COLABORADOR */}
            {isContador && dados.agroRate && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '28px', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: '16px' }}>Regularidade & Certidões</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 40px' }}>
                  <CertidaoRow icon="🌿" label="CAR" numero={dados.agroRate.carNumero} situacao={dados.agroRate.carSituacao} />
                  <CertidaoRow icon="🏛️" label="CAFIR" numero={dados.agroRate.cafirNumero} situacao={dados.agroRate.cafirSituacao} />
                  <CertidaoRow icon="📋" label="DAP / CAF" numero={dados.agroRate.dapNumero ?? dados.agroRate.cafNumero} situacao={dados.agroRate.dapSituacao ?? dados.agroRate.cafSituacao} />
                  <CertidaoRow icon="📊" label="QUOD Score" numero={dados.agroRate.quodScore ? String(dados.agroRate.quodScore) : undefined} situacao={dados.agroRate.quodFaixa} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ABA FLUXO DE CAIXA ── */}
        {aba === 'fluxo' && isContador && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Resumo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Receita Total', val: fmt(totalReceita), cor: '#34d399' },
                { label: 'Custo Total', val: fmt(totalCusto), cor: '#f87171' },
                { label: 'Margem', val: `${margem.toFixed(1)}%`, cor: margem >= 0 ? '#34d399' : '#f87171' },
              ].map(c => (
                <div key={c.label} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{c.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: c.cor }}>{c.val}</div>
                </div>
              ))}
            </div>

            {/* Gráfico de barras */}
            {fluxo.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '28px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: '24px' }}>Receitas vs Custos (últimos 12 meses)</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '160px' }}>
                  {fluxo.map(([mes, v]) => (
                    <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', display: 'flex', gap: '2px', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div title={fmt(v.receita)} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: '#059669', height: `${(v.receita / maxFluxo) * 140}px`, minHeight: v.receita > 0 ? '2px' : '0', transition: 'height .8s ease' }} />
                        <div title={fmt(v.custo)} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: '#dc2626', height: `${(v.custo / maxFluxo) * 140}px`, minHeight: v.custo > 0 ? '2px' : '0', transition: 'height .8s ease' }} />
                      </div>
                      <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.3)', textAlign: 'center', lineHeight: 1 }}>{monthLabel(mes + '-01')}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#059669' }}/><span style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)' }}>Receita</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#dc2626' }}/><span style={{ fontSize: '11px', color: 'rgba(255,255,255,.45)' }}>Custo</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ABA DOCUMENTOS ── */}
        {aba === 'docs' && isContador && (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: '20px' }}>Documentos da Propriedade</div>
            {(!dados.documents || dados.documents.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.3)', fontSize: '14px' }}>Nenhum documento disponível</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dados.documents.map(doc => {
                  const vencendo = doc.expiry && new Date(doc.expiry).getTime() - Date.now() < 30 * 86400000
                  return (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '14px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(52,211,153,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📄</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>{doc.name}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', marginTop: '2px', display: 'flex', gap: '10px' }}>
                            <span>{doc.category}</span>
                            {doc.expiry && <span style={{ color: vencendo ? '#fbbf24' : undefined }}>{vencendo ? '⚠️ ' : ''}Validade: {new Date(doc.expiry).toLocaleDateString('pt-BR')}</span>}
                          </div>
                        </div>
                      </div>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                          style={{ padding: '7px 14px', borderRadius: '10px', background: 'rgba(52,211,153,.1)', border: '1px solid rgba(52,211,153,.2)', color: '#34d399', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}>
                          Baixar
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ABA CONTRATOS ── */}
        {aba === 'contratos' && isContador && (
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '20px', padding: '28px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: '20px' }}>Contratos de Crédito Ativos</div>
            {(!dados.loanContracts || dados.loanContracts.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,.3)', fontSize: '14px' }}>Nenhum contrato cadastrado</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dados.loanContracts.map((c: any) => (
                  <div key={c.id} style={{ padding: '16px 20px', borderRadius: '14px', background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{c.banco} — {c.linha}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)', marginTop: '4px' }}>
                          Contratado em {new Date(c.dataContratacao).toLocaleDateString('pt-BR')}
                          {c.dataVencimento && ` · Vence ${new Date(c.dataVencimento).toLocaleDateString('pt-BR')}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#34d399' }}>{fmt(Number(c.valor))}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.35)', marginTop: '2px' }}>{Number(c.taxaAnual).toFixed(2)}% a.a. · {c.prazo} meses</div>
                      </div>
                    </div>
                    {c.parcelasPagas > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,.08)' }}>
                          <div style={{ height: '100%', borderRadius: '2px', background: '#059669', width: `${(c.parcelasPagas / c.prazo) * 100}%` }} />
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.3)', marginTop: '4px' }}>{c.parcelasPagas}/{c.prazo} parcelas pagas</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rodapé */}
        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,.2)', paddingBottom: '24px' }}>
          Acesso seguro via AgroRate · Os dados exibidos são de responsabilidade do produtor · {dados.property.name}
        </div>
      </div>
    </div>
  )
}
