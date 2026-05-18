'use client'

import { useState, useEffect, useCallback } from 'react'

type AgentRun = { id: string; status: string; startedAt: string; finishedAt?: string; resultado?: string; erro?: string | null }
type Agent = { id: string; nome: string; role: string; tipo: string; ativo: boolean; trigger: string; tools: string[]; runs: AgentRun[]; createdAt: string }

const TEMPLATES = [
  {
    nome: 'Coach de Score',
    role: 'consultoria de score AgroRate e melhoria de crédito rural',
    icon: '📈',
    desc: 'Analisa seus 4 sub-scores, identifica gargalos e cria um plano de ação para aumentar seu AgroRate.',
    tools: ['buscar_score_desagregado', 'buscar_historico_score', 'criar_alerta_credito'],
    color: '#10b981',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.2)',
  },
  {
    nome: 'Consultor de Crédito',
    role: 'análise de ofertas de crédito rural e elegibilidade',
    icon: '💳',
    desc: 'Busca as melhores ofertas compatíveis com seu score e analisa qual linha de crédito é mais vantajosa.',
    tools: ['buscar_score_desagregado', 'buscar_ofertas_credito', 'criar_alerta_credito'],
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
  },
  {
    nome: 'Monitor de Risco',
    role: 'monitoramento de riscos de crédito e score',
    icon: '🛡️',
    desc: 'Detecta riscos que podem reduzir seu score: documentos vencidos, verificações pendentes, tendências negativas.',
    tools: ['buscar_score_desagregado', 'buscar_documentos_propriedade', 'buscar_verificacoes_oficiais', 'criar_alerta_credito'],
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.2)',
  },
  {
    nome: 'Preparador Documental',
    role: 'gestão e preparação documental para crédito rural',
    icon: '📋',
    desc: 'Lista documentos faltantes ou vencidos, prioriza pelo impacto no score e orienta como regularizar.',
    tools: ['buscar_documentos_propriedade', 'buscar_verificacoes_oficiais', 'criar_alerta_credito'],
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.2)',
  },
  {
    nome: 'Analista de Elegibilidade',
    role: 'análise de elegibilidade para linhas de crédito rural',
    icon: '🎯',
    desc: 'Cruza seu score com todas as ofertas disponíveis e determina o que já é acessível e o que falta.',
    tools: ['buscar_score_desagregado', 'buscar_ofertas_credito', 'buscar_historico_score'],
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
    border: 'rgba(6,182,212,0.2)',
  },
  {
    nome: 'Estrategista Financeiro',
    role: 'planejamento financeiro e estratégia de crédito rural',
    icon: '🏦',
    desc: 'Analisa sua margem financeira, projeta a evolução do score e define estratégia para acessar crédito rural.',
    tools: ['buscar_margem_financeira', 'buscar_score_desagregado', 'buscar_historico_score', 'buscar_ofertas_credito'],
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.2)',
  },
]

function tmplFor(agent: Agent) {
  return TEMPLATES.find(t => t.nome === agent.nome)
}

function RunBadge({ status }: { status: string }) {
  if (status === 'COMPLETED') return (
    <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Concluído</span>
  )
  if (status === 'RUNNING') return (
    <span style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }} className="animate-pulse">Executando…</span>
  )
  return (
    <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>Falhou</span>
  )
}

function AgentCard({ agent, onRun, onDelete, runningId }: { agent: Agent; onRun: (a: Agent) => void; onDelete: (id: string) => void; runningId: string | null }) {
  const t = tmplFor(agent)
  const color = t?.color ?? '#10b981'
  const lastRun = agent.runs[0]
  const isRunning = runningId === agent.id

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${isRunning ? color + '60' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 18,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: t?.bg ?? 'rgba(255,255,255,0.05)', border: `1px solid ${t?.border ?? 'rgba(255,255,255,0.1)'}`, flexShrink: 0 }}>
            {t?.icon ?? '🤖'}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{agent.nome}</div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{agent.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {agent.trigger === 'CRON' && (
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 20 }}>Diário</span>
          )}
          <button onClick={() => onDelete(agent.id)} style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#334155', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Last run */}
      {lastRun && (
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <RunBadge status={lastRun.status} />
            <span style={{ fontSize: 10, color: '#334155' }}>{new Date(lastRun.startedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {lastRun.status === 'COMPLETED' && lastRun.resultado && (
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lastRun.resultado}</p>
          )}
          {lastRun.status === 'FAILED' && (
            <p style={{ fontSize: 12, color: '#f87171', opacity: 0.8 }}>{lastRun.erro ?? 'Erro desconhecido'}</p>
          )}
        </div>
      )}

      {/* Run button */}
      <button
        onClick={() => onRun(agent)}
        disabled={isRunning}
        style={{
          width: '100%', padding: '9px 16px', borderRadius: 12, border: `1px solid ${color}40`,
          background: isRunning ? 'rgba(255,255,255,0.03)' : `${color}15`,
          color: isRunning ? '#475569' : color,
          fontSize: 13, fontWeight: 700, cursor: isRunning ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s',
        }}>
        {isRunning ? (
          <><div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${color}40`, borderTopColor: color, animation: 'spin 0.8s linear infinite' }} />Executando…</>
        ) : (
          <><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>Executar</>
        )}
      </button>
    </div>
  )
}

function RunModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error' | 'rate_limit'>('loading')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const doRun = useCallback(async (a: Agent) => {
    setStatus('loading'); setResult(null); setError(null); setCountdown(0)
    try {
      const r = await fetch(`/api/agents/${a.id}/run`, { method: 'POST' })
      const d = await r.json()
      if (d.ok) { setStatus('done'); setResult(d.resultado) }
      else if (d.error === 'RATE_LIMIT') { setStatus('rate_limit'); setCountdown(d.retryAfter ?? 15) }
      else { setStatus('error'); setError(d.error ?? 'Erro desconhecido') }
    } catch (e: any) { setStatus('error'); setError(e.message) }
  }, [])

  useEffect(() => { if (agent) doRun(agent) }, [agent, doRun])

  useEffect(() => {
    if (countdown <= 0) {
      if (status === 'rate_limit' && agent) doRun(agent)
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, status, agent, doRun])

  if (!agent) return null
  const t = tmplFor(agent)
  const color = t?.color ?? '#10b981'

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 560, borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(160deg,#0f172a 0%,#071a10 100%)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: t?.bg ?? 'rgba(255,255,255,0.05)', border: `1px solid ${t?.border ?? 'rgba(255,255,255,0.1)'}`, flexShrink: 0 }}>
            {t?.icon ?? '🤖'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{agent.nome}</div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              {status === 'loading' ? 'Consultando dados reais…' : status === 'done' ? 'Análise concluída' : status === 'rate_limit' ? 'Alta demanda — aguardando' : 'Erro na execução'}
            </div>
          </div>
          <button onClick={onClose} style={{ padding: 8, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {status === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
              <div style={{ position: 'relative', width: 48, height: 48 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid rgba(255,255,255,0.05)` }} />
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid transparent`, borderTopColor: color, animation: 'spin 0.9s linear infinite' }} />
                <div style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: t?.bg ?? 'rgba(16,185,129,0.1)' }} />
              </div>
              <p style={{ fontSize: 13, color: '#64748b' }}>Agente analisando seus dados…</p>
            </div>
          )}
          {status === 'rate_limit' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '24px 0' }}>
              <div style={{ fontSize: 40 }}>⏳</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#f1f5f9', marginBottom: 6 }}>Alta demanda dos agentes autônomos</div>
                <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Aguarde a recuperação — retentando automaticamente</p>
                <div style={{ fontSize: 44, fontWeight: 900, color: '#f59e0b', letterSpacing: '-2px', lineHeight: 1 }}>{countdown}s</div>
              </div>
            </div>
          )}
          {status === 'error' && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: 16 }}>
              <p style={{ fontSize: 13, color: '#f87171', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}
          {status === 'done' && result && (
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 16, maxHeight: 320, overflowY: 'auto' }}>
              <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{result}</p>
            </div>
          )}
        </div>

        {(status === 'done' || status === 'error') && (
          <div style={{ padding: '0 20px 20px' }}>
            <button onClick={onClose} style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#f1f5f9'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
              Fechar
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function EquipeIAPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<Agent | null>(null)
  const [runningId, setRunningId] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [newAgent, setNewAgent] = useState({ nome: '', role: '', trigger: 'MANUAL' })
  const [saving, setSaving] = useState(false)

  const loadAgents = useCallback(async () => {
    const r = await fetch('/api/agents')
    if (r.ok) setAgents(await r.json())
    setLoading(false)
  }, [])

  useEffect(() => { loadAgents() }, [loadAgents])

  async function handleRun(agent: Agent) {
    setRunningId(agent.id)
    setRunning(agent)
  }

  async function handleRunClose() {
    setRunning(null)
    setRunningId(null)
    await loadAgents()
  }

  async function addFromTemplate(tmpl: typeof TEMPLATES[0]) {
    setAddError(null)
    const r = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: tmpl.nome, role: tmpl.role, tipo: 'PRONTO', tools: tmpl.tools, trigger: 'MANUAL' }),
    })
    if (r.ok) {
      await loadAgents()
      setShowPicker(false)
    } else {
      const d = await r.json().catch(() => ({}))
      setAddError(d.error ?? `Erro ${r.status}`)
    }
  }

  async function addCustom() {
    if (!newAgent.nome.trim() || !newAgent.role.trim()) return
    setSaving(true)
    const r = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAgent, tipo: 'PERSONALIZADO', tools: [] }),
    })
    setSaving(false)
    if (r.ok) { await loadAgents(); setShowCustom(false); setNewAgent({ nome: '', role: '', trigger: 'MANUAL' }) }
  }

  async function deleteAgent(id: string) {
    await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    setAgents(a => a.filter(x => x.id !== id))
  }

  const templateNomes = TEMPLATES.map(t => t.nome)
  const available = TEMPLATES.filter(t => !agents.find(a => a.nome === t.nome))

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#06111f 0%,#0a1628 60%,#050e06 100%)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px', margin: 0 }}>Equipe IA</h1>
            <p style={{ fontSize: 12, color: '#475569', margin: '4px 0 0' }}>Especialistas autônomos de crédito rural</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>{agents.length} agente{agents.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setShowPicker(p => !p); setShowCustom(false) }}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 14, border: showPicker ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)', background: showPicker ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', color: showPicker ? '#34d399' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Adicionar Especialista {available.length > 0 && <span style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>{available.length}</span>}
          </button>
          <button
            onClick={() => { setShowCustom(p => !p); setShowPicker(false) }}
            style={{ padding: '10px 16px', borderRadius: 14, border: showCustom ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)', background: showCustom ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', color: showCustom ? '#818cf8' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Personalizado
          </button>
        </div>

        {/* Picker de especialistas */}
        {showPicker && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Especialistas disponíveis</div>
            {addError && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>{addError}</div>}
            {available.length === 0 ? (
              <p style={{ fontSize: 13, color: '#334155', textAlign: 'center', padding: '16px 0' }}>Todos os especialistas já foram adicionados.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                {available.map(tmpl => (
                  <button key={tmpl.nome} onClick={() => addFromTemplate(tmpl)}
                    style={{ textAlign: 'left', padding: 14, borderRadius: 14, border: `1px solid ${tmpl.border}`, background: tmpl.bg, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{tmpl.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: tmpl.color, fontSize: 13, marginBottom: 3 }}>{tmpl.nome}</div>
                      <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{tmpl.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Form agente personalizado */}
        {showCustom && (
          <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Novo agente personalizado</div>
            <input value={newAgent.nome} onChange={e => setNewAgent(p => ({ ...p, nome: e.target.value }))}
              placeholder="Nome do agente (ex: Consultor PRONAF)"
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
            <input value={newAgent.role} onChange={e => setNewAgent(p => ({ ...p, role: e.target.value }))}
              placeholder="Especialidade (ex: análise de elegibilidade PRONAF)"
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' }} />
            <select value={newAgent.trigger} onChange={e => setNewAgent(p => ({ ...p, trigger: e.target.value }))}
              style={{ width: '100%', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#f1f5f9', outline: 'none' }}>
              <option value="MANUAL">Execução manual</option>
              <option value="CRON">Automático (diário às 8h)</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={addCustom} disabled={saving || !newAgent.nome.trim() || !newAgent.role.trim()}
                style={{ flex: 1, padding: '10px 0', borderRadius: 12, border: 'none', background: saving ? 'rgba(99,102,241,0.3)' : '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Criando…' : 'Criar agente'}
              </button>
              <button onClick={() => setShowCustom(false)}
                style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de agentes */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#10b981', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Nenhum agente na equipe</p>
            <p style={{ fontSize: 12, color: '#1e293b' }}>Adicione um especialista para começar.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {agents.map(a => (
              <AgentCard key={a.id} agent={a} onRun={handleRun} onDelete={deleteAgent} runningId={runningId} />
            ))}
          </div>
        )}
      </div>

      <RunModal agent={running} onClose={handleRunClose} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
