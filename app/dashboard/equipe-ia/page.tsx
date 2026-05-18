'use client'

import { useState, useEffect, useCallback } from 'react'

type AgentRun = { id: string; status: string; startedAt: string; finishedAt?: string; resultado?: string; erro?: string | null }
type Agent = { id: string; nome: string; role: string; tipo: string; ativo: boolean; trigger: string; tools: string[]; runs: AgentRun[]; createdAt: string }

const TEMPLATES = [
  {
    tipo: 'COACH_SCORE',
    nome: 'Coach de Score',
    role: 'consultoria de score AgroRate e melhoria de crédito rural',
    icon: '📈',
    desc: 'Analisa seus 4 sub-scores, identifica gargalos e cria um plano de ação para aumentar seu AgroRate.',
    tools: ['buscar_score_desagregado', 'buscar_historico_score', 'criar_alerta_credito'],
    color: 'from-emerald-500/20 to-teal-500/10',
    accent: '#10b981',
  },
  {
    tipo: 'CONSULTOR_CREDITO',
    nome: 'Consultor de Crédito',
    role: 'análise de ofertas de crédito rural e elegibilidade',
    icon: '💳',
    desc: 'Busca as melhores ofertas de crédito compatíveis com seu score e analisa qual linha mais vantajosa.',
    tools: ['buscar_score_desagregado', 'buscar_ofertas_credito', 'criar_alerta_credito'],
    color: 'from-blue-500/20 to-indigo-500/10',
    accent: '#3b82f6',
  },
  {
    tipo: 'MONITOR_RISCO',
    nome: 'Monitor de Risco',
    role: 'monitoramento de riscos de crédito e score',
    icon: '🛡️',
    desc: 'Identifica riscos que podem reduzir seu score: documentos vencidos, verificações pendentes, tendência negativa.',
    tools: ['buscar_score_desagregado', 'buscar_documentos_propriedade', 'buscar_verificacoes_oficiais', 'criar_alerta_credito'],
    color: 'from-amber-500/20 to-orange-500/10',
    accent: '#f59e0b',
  },
  {
    tipo: 'PREPARADOR_DOCUMENTAL',
    nome: 'Preparador Documental',
    role: 'gestão e preparação documental para crédito rural',
    icon: '📋',
    desc: 'Lista documentos faltantes ou vencidos, prioriza pelo impacto no score e orienta como regularizar.',
    tools: ['buscar_documentos_propriedade', 'buscar_verificacoes_oficiais', 'criar_alerta_credito'],
    color: 'from-purple-500/20 to-violet-500/10',
    accent: '#8b5cf6',
  },
  {
    tipo: 'ANALISTA_ELEGIBILIDADE',
    nome: 'Analista de Elegibilidade',
    role: 'análise de elegibilidade para linhas de crédito rural',
    icon: '🎯',
    desc: 'Cruza seu score com todas as ofertas disponíveis, determina o que já é acessível e quanto falta para avançar.',
    tools: ['buscar_score_desagregado', 'buscar_ofertas_credito', 'buscar_historico_score'],
    color: 'from-cyan-500/20 to-sky-500/10',
    accent: '#06b6d4',
  },
  {
    tipo: 'ESTRATEGISTA_FINANCEIRO',
    nome: 'Estrategista Financeiro',
    role: 'planejamento financeiro e estratégia de crédito rural',
    icon: '🏦',
    desc: 'Analisa sua margem financeira, projeta a evolução do score e define estratégia para acessar crédito rural.',
    tools: ['buscar_margem_financeira', 'buscar_score_desagregado', 'buscar_historico_score', 'buscar_ofertas_credito'],
    color: 'from-rose-500/20 to-pink-500/10',
    accent: '#f43f5e',
  },
]

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    COMPLETED: { label: 'Concluído', cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    RUNNING:   { label: 'Executando…', cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' },
    FAILED:    { label: 'Falhou', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}

function AgentCard({ agent, onRun, onDelete }: { agent: Agent; onRun: (a: Agent) => void; onDelete: (id: string) => void }) {
  const lastRun = agent.runs[0]
  const tmpl = TEMPLATES.find(t => t.tipo === agent.tipo)
  const accent = tmpl?.accent ?? '#10b981'

  return (
    <div className="relative rounded-2xl border border-white/8 bg-white/4 hover:bg-white/6 transition-all overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${tmpl?.color ?? 'from-slate-500/10 to-slate-600/5'} opacity-60`} />
      <div className="relative p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
              {tmpl?.icon ?? '🤖'}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{agent.nome}</div>
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{agent.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {agent.trigger === 'CRON' && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-white/10">Diário</span>
            )}
            <div className={`w-2 h-2 rounded-full ${agent.ativo ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          </div>
        </div>

        {lastRun && (
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <div className="flex items-center justify-between mb-1.5">
              <StatusBadge status={lastRun.status} />
              <span className="text-[10px] text-slate-600">{new Date(lastRun.startedAt).toLocaleString('pt-BR')}</span>
            </div>
            {lastRun.status === 'COMPLETED' && lastRun.resultado && (
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{lastRun.resultado}</p>
            )}
            {lastRun.status === 'FAILED' && (
              <p className="text-xs text-red-400/70 line-clamp-2">{lastRun.erro ?? 'Erro desconhecido'}</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onRun(agent)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl transition-all"
            style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
            </svg>
            Executar
          </button>
          <button
            onClick={() => onDelete(agent.id)}
            className="p-2 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function ResultModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!agent) return
    setLoading(true)
    setResult(null)
    setError(null)
    fetch(`/api/agents/${agent.id}/run`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.ok) setResult(d.resultado)
        else setError(d.error ?? 'Erro desconhecido')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [agent])

  if (!agent) return null

  const tmpl = TEMPLATES.find(t => t.tipo === agent.tipo)
  const accent = tmpl?.accent ?? '#10b981'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #062418 100%)' }}>
        <div className="p-5 border-b border-white/8 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${accent}20`, border: `1px solid ${accent}40` }}>
            {tmpl?.icon ?? '🤖'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm">{agent.nome}</div>
            <div className="text-xs text-slate-500">Executando análise…</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/8 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: accent }}/>
                <div className="absolute inset-2 rounded-full" style={{ background: `${accent}20` }}/>
              </div>
              <p className="text-sm text-slate-400">Agente consultando dados reais…</p>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {result && (
            <div className="bg-black/30 rounded-xl p-4 border border-white/5 max-h-80 overflow-y-auto">
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>
        {!loading && (
          <div className="px-5 pb-5">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white border border-white/8 hover:bg-white/5 transition-all">
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function EquipeIAPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tab, setTab] = useState<'especialistas' | 'personalizados'>('especialistas')
  const [running, setRunning] = useState<Agent | null>(null)
  const [creating, setCreating] = useState(false)
  const [newAgent, setNewAgent] = useState({ nome: '', role: '', trigger: 'MANUAL' })
  const [loading, setLoading] = useState(true)
  const [addError, setAddError] = useState<string | null>(null)

  const loadAgents = useCallback(async () => {
    try {
      const r = await fetch('/api/agents')
      if (r.ok) setAgents(await r.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAgents() }, [loadAgents])

  async function addFromTemplate(tmpl: typeof TEMPLATES[0]) {
    setAddError(null)
    const r = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: tmpl.nome, role: tmpl.role, tipo: tmpl.tipo, tools: tmpl.tools, trigger: 'MANUAL' }),
    })
    if (r.ok) {
      await loadAgents()
    } else {
      const body = await r.json().catch(() => ({}))
      setAddError(body.error ?? `Erro ${r.status} ao adicionar especialista`)
    }
  }

  async function addCustom() {
    if (!newAgent.nome.trim() || !newAgent.role.trim()) return
    const r = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAgent, tipo: 'CUSTOMIZADO', tools: [] }),
    })
    if (r.ok) { await loadAgents(); setCreating(false); setNewAgent({ nome: '', role: '', trigger: 'MANUAL' }) }
  }

  async function deleteAgent(id: string) {
    await fetch(`/api/agents/${id}`, { method: 'DELETE' })
    setAgents(a => a.filter(x => x.id !== id))
  }

  const myAgents = agents
  const templateTipos = TEMPLATES.map(t => t.tipo)
  const customAgents = myAgents.filter(a => !templateTipos.includes(a.tipo))
  const specialistAgents = myAgents.filter(a => templateTipos.includes(a.tipo))

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #06180e 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Equipe IA</h1>
            <p className="text-sm text-slate-500 mt-1">Agentes de crédito rural que trabalham enquanto você dorme</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
            <span className="text-xs font-bold text-emerald-400">{agents.length} agente{agents.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/8 w-fit">
          {(['especialistas', 'personalizados'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${tab === t ? 'bg-[#065f46] text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>
              {t === 'especialistas' ? 'Especialistas' : 'Personalizados'}
            </button>
          ))}
        </div>

        {/* Templates / Specialists */}
        {tab === 'especialistas' && (
          <div className="space-y-4">
            {addError && (
              <div className="rounded-xl px-4 py-3 text-sm text-red-300 border border-red-500/30 bg-red-500/10">
                {addError}
              </div>
            )}
            <p className="text-xs text-slate-500">Escolha um especialista pré-configurado para adicionar à sua equipe:</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {TEMPLATES.map(tmpl => {
                const already = specialistAgents.find(a => a.tipo === tmpl.tipo)
                return (
                  <div key={tmpl.tipo} className={`relative rounded-2xl border overflow-hidden transition-all ${already ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-white/20 cursor-pointer group'}`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${tmpl.color}`} />
                    <div className="relative p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                          style={{ background: `${tmpl.accent}20`, border: `1px solid ${tmpl.accent}40` }}>
                          {tmpl.icon}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{tmpl.nome}</div>
                          {already && <span className="text-[10px] font-bold text-emerald-400">Ativo</span>}
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{tmpl.desc}</p>
                      <div className="flex flex-wrap gap-1">
                        {tmpl.tools.map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-black/30 text-slate-500 border border-white/5">
                            {t.replace('buscar_', '').replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                      {!already && (
                        <button onClick={() => addFromTemplate(tmpl)}
                          className="mt-1 w-full py-2 rounded-xl text-xs font-bold transition-all"
                          style={{ background: `${tmpl.accent}20`, color: tmpl.accent, border: `1px solid ${tmpl.accent}40` }}>
                          Adicionar especialista
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {specialistAgents.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sua equipe</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {specialistAgents.map(a => (
                    <AgentCard key={a.id} agent={a} onRun={setRunning} onDelete={deleteAgent} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom */}
        {tab === 'personalizados' && (
          <div className="space-y-4">
            <button onClick={() => setCreating(true)}
              className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Criar agente personalizado
            </button>

            {creating && (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
                <div className="text-sm font-bold text-white">Novo agente personalizado</div>
                <div className="space-y-3">
                  <input value={newAgent.nome} onChange={e => setNewAgent(p => ({ ...p, nome: e.target.value }))}
                    placeholder="Nome do agente (ex: Consultor PRONAF)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"/>
                  <input value={newAgent.role} onChange={e => setNewAgent(p => ({ ...p, role: e.target.value }))}
                    placeholder="Especialidade (ex: análise de elegibilidade para PRONAF)"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"/>
                  <select value={newAgent.trigger} onChange={e => setNewAgent(p => ({ ...p, trigger: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                    <option value="MANUAL">Execução manual</option>
                    <option value="CRON">Automático (diário às 8h)</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={addCustom} className="flex-1 py-2 rounded-xl text-sm font-bold bg-[#065f46] text-white hover:bg-[#047857] transition-all">
                    Criar agente
                  </button>
                  <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-white border border-white/8 transition-all">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {customAgents.length === 0 && !creating ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
                <div className="text-4xl mb-3">🤖</div>
                <p className="text-sm text-slate-500">Nenhum agente personalizado criado ainda.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {customAgents.map(a => (
                  <AgentCard key={a.id} agent={a} onRun={setRunning} onDelete={deleteAgent} />
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"/>
          </div>
        )}
      </div>

      <ResultModal agent={running} onClose={async () => { setRunning(null); await loadAgents() }} />
    </div>
  )
}
