'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Tab = 'overview' | 'users' | 'scores' | 'commissions' | 'webhooks'

interface Summary {
  totalUsers: number
  totalScores: number
  avgScore: number
  totalRequests: number
  pendingCommissions: number
  totalCommissionPending: number
  totalCommissionApproved: number
  totalCommissionPaid: number
}

interface ScoreEntry {
  id: string; score: number; category: string
  property: { name: string; user: { name: string; email: string } }
  lastCalculated: string
  agrocoreConnected?: boolean
}

interface CommissionEntry {
  id: string; partnerName: string; lineOfCredit: string
  requestedAmount: number; approvedAmount: number | null
  commissionRate: number; commissionValue: number
  status: string; createdAt: string
  property: { name: string; user: { name: string } }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PAID: 'bg-[#065f46]/10 text-[#065f46]',
  REJECTED: 'bg-red-50 text-red-700',
}

const CATEGORY_COLORS: Record<string, string> = {
  ELITE: 'text-violet-600', HIGH: 'text-emerald-600', GOOD: 'text-sky-600',
  REGULAR: 'text-amber-600', LOW: 'text-orange-600', CRITICAL: 'text-red-600',
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [commissions, setCommissions] = useState<CommissionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      // Verifica se é admin (email ou role) — simplificado
      const email = session.user.email || ''
      const isAdmin = email.includes('admin') || email === 'alexandre@parceirosdeproposito.com'
      if (!isAdmin) { router.push('/dashboard'); return }
      setAuthorized(true)
      await loadData()
    }
    checkAuth()
  }, [router])

  async function loadData() {
    try {
      const [summaryRes, commissionsRes] = await Promise.all([
        fetch('/api/admin/summary'),
        fetch('/api/commissions'),
      ])
      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (commissionsRes.ok) {
        const data = await commissionsRes.json()
        setCommissions(data.commissions || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function updateCommissionStatus(id: string, status: string) {
    await fetch('/api/commissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-[#065f46] border-t-transparent rounded-full animate-spin"/>
      </div>
    )
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Visão geral', icon: '📊' },
    { id: 'scores', label: 'Scores', icon: '🎯' },
    { id: 'commissions', label: 'Comissões', icon: '💰' },
    { id: 'webhooks', label: 'Webhooks n8n', icon: '⚡' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-[#065f46] text-white px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-emerald-300 hover:text-white transition-colors text-sm">← Dashboard</Link>
        <div className="h-4 w-px bg-white/20"/>
        <div className="font-bold">Painel Administrativo AgroRate</div>
        <div className="ml-auto flex gap-2">
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full">Admin</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1 w-fit border border-slate-200 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === t.id ? 'bg-[#065f46] text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-slate-100"/>)}
              </div>
            ) : summary ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Produtores', val: summary.totalUsers, icon: '👨‍🌾', sub: 'usuários ativos' },
                    { label: 'Score médio', val: summary.avgScore, icon: '📊', sub: 'plataforma' },
                    { label: 'Solicitações', val: summary.totalRequests, icon: '📋', sub: 'crédito total' },
                    { label: 'Comissões aprovadas', val: fmt(summary.totalCommissionApproved), icon: '💰', sub: 'a receber' },
                  ].map(card => (
                    <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-5">
                      <div className="text-2xl mb-2">{card.icon}</div>
                      <div className="text-2xl font-black text-slate-900">{card.val}</div>
                      <div className="text-xs text-slate-500 mt-1">{card.label} · {card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Comissões por status */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="font-bold text-slate-900 mb-4">Pipeline de comissões</div>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Pendentes', val: summary.totalCommissionPending, color: 'bg-slate-100' },
                      { label: 'Aprovadas', val: summary.totalCommissionApproved, color: 'bg-emerald-50' },
                      { label: 'Pagas', val: summary.totalCommissionPaid, color: 'bg-[#065f46]/10' },
                    ].map(item => (
                      <div key={item.label} className={`${item.color} rounded-xl p-4 text-center`}>
                        <div className="text-lg font-black text-slate-900">{fmt(item.val)}</div>
                        <div className="text-xs text-slate-500 mt-1">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* n8n quick actions */}
                <div className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="font-bold text-slate-900 mb-4">Ações rápidas</div>
                  <div className="flex gap-3 flex-wrap">
                    {[
                      { label: 'Verificar n8n', icon: '⚡', action: () => setTab('webhooks') },
                      { label: 'Ver comissões', icon: '💰', action: () => setTab('commissions') },
                      { label: 'Ver scores', icon: '📊', action: () => setTab('scores') },
                    ].map(a => (
                      <button key={a.label} onClick={a.action}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-100 transition-colors">
                        <span>{a.icon}</span> {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
                <div className="font-semibold text-amber-800 mb-2">API /api/admin/summary não encontrada</div>
                <p className="text-amber-700 text-sm">Os dados de resumo serão exibidos após implementação da rota admin.</p>
              </div>
            )}
          </div>
        )}

        {/* Scores */}
        {tab === 'scores' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="font-bold text-slate-900 mb-1">Scores de produtores</div>
              <p className="text-xs text-slate-500">Dados diretos do banco de dados AgroRate</p>
            </div>
            <ScoresTable />
          </div>
        )}

        {/* Commissions */}
        {tab === 'commissions' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Comissões por originação</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Taxa: 0.8% bancos · 1.0% cooperativas · 1.5% fintechs
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-black text-[#065f46]">
                  {fmt(commissions.filter(c => ['APPROVED','PAID'].includes(c.status)).reduce((s, c) => s + c.commissionValue, 0))}
                </div>
                <div className="text-xs text-slate-500">total aprovado</div>
              </div>
            </div>
            {commissions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400">
                Nenhuma comissão registrada ainda.
              </div>
            ) : (
              <div className="space-y-2">
                {commissions.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{c.partnerName}</span>
                          <span className="text-xs text-slate-400">{c.lineOfCredit}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600'}`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.property?.user?.name} · {c.property?.name} · {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-slate-800 text-sm">{fmt(c.requestedAmount)}</div>
                        <div className="text-xs text-slate-400">solicitado</div>
                        {c.commissionValue > 0 && (
                          <div className="text-xs font-bold text-[#065f46] mt-1">
                            +{fmt(c.commissionValue)} comissão
                          </div>
                        )}
                      </div>
                    </div>
                    {c.status === 'PENDING' && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => updateCommissionStatus(c.id, 'CONFIRMED')}
                          className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors">
                          Confirmar
                        </button>
                        <button onClick={() => updateCommissionStatus(c.id, 'REJECTED')}
                          className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors">
                          Rejeitar
                        </button>
                      </div>
                    )}
                    {c.status === 'CONFIRMED' && (
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => updateCommissionStatus(c.id, 'APPROVED')}
                          className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-100 transition-colors">
                          Marcar aprovado
                        </button>
                      </div>
                    )}
                    {c.status === 'APPROVED' && (
                      <div className="mt-3">
                        <button onClick={() => updateCommissionStatus(c.id, 'PAID')}
                          className="text-xs px-3 py-1.5 bg-[#065f46] text-white rounded-lg font-semibold hover:bg-[#047857] transition-colors">
                          Marcar pago
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Webhooks */}
        {tab === 'webhooks' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="font-bold text-slate-900 mb-1">Configuração n8n</div>
              <p className="text-sm text-slate-500 mb-4">Configure esses valores no seu workflow n8n para conectar os sistemas.</p>
              <div className="space-y-3">
                {[
                  { label: 'Webhook URL', val: `${typeof window !== 'undefined' ? window.location.origin : 'https://sua-url.vercel.app'}/api/webhooks/n8n` },
                  { label: 'Header', val: 'x-webhook-secret' },
                  { label: 'Secret (env N8N_WEBHOOK_SECRET)', val: '••••••••••••' },
                  { label: 'Método', val: 'POST · Content-Type: application/json' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="text-xs font-semibold text-slate-500 w-40 flex-shrink-0">{item.label}</div>
                    <code className="text-xs font-mono text-[#065f46] break-all">{item.val}</code>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="font-bold text-slate-900 mb-4">Eventos disponíveis</div>
              <div className="space-y-3">
                {[
                  { event: 'score.recalculate', desc: 'Recalcula score quando AgroOS atualiza dados. Payload: { userId }', trigger: 'AgroOS → n8n → AgroRate' },
                  { event: 'score.threshold', desc: 'Verifica se score cruzou limiar. Payload: { userId, threshold }', trigger: 'Cron diário' },
                  { event: 'agrocore.sync', desc: 'Sincroniza novo contrato/avaliação do AgroCore. Payload: { supabaseId, eventType }', trigger: 'AgroCore → n8n → AgroRate' },
                  { event: 'offer.broadcast', desc: 'Retorna lista de produtores elegíveis para uma oferta. Payload: { minScore, partnerName }', trigger: 'Manual ou agendado' },
                  { event: 'commission.update', desc: 'Atualiza status de comissão após resposta do banco. Payload: { commissionId, status, approvedAmount? }', trigger: 'Webhook do banco → n8n → AgroRate' },
                ].map(e => (
                  <div key={e.event} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-1">
                      <code className="text-xs font-mono font-bold text-[#065f46]">{e.event}</code>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{e.trigger}</span>
                    </div>
                    <div className="text-xs text-slate-500">{e.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <WebhookTester />
          </div>
        )}
      </div>
    </div>
  )
}

function ScoresTable() {
  const [data, setData] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/scores').then(r => r.json()).then(d => {
      setData(d.scores || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100"/>

  if (!data.length) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
      Nenhum score calculado ainda. Produtores precisam ter dados no AgroOS.
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {['Produtor', 'Propriedade', 'Score', 'Categoria', 'AgroCore', 'Atualizado'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3">
                <div className="font-semibold text-slate-800 text-xs">{s.property?.user?.name}</div>
                <div className="text-[10px] text-slate-400">{s.property?.user?.email}</div>
              </td>
              <td className="px-4 py-3 text-xs text-slate-600">{s.property?.name}</td>
              <td className="px-4 py-3 font-black text-lg text-slate-900">{s.score}</td>
              <td className="px-4 py-3">
                <span className={`text-xs font-bold ${CATEGORY_COLORS[s.category] || 'text-slate-600'}`}>{s.category}</span>
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs font-semibold ${s.agrocoreConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {s.agrocoreConnected ? '✓ Conectado' : '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {new Date(s.lastCalculated).toLocaleDateString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WebhookTester() {
  const [event, setEvent] = useState('score.threshold')
  const [payload, setPayload] = useState('{ "userId": "SEU_SUPABASE_ID", "threshold": 600 }')
  const [result, setResult] = useState('')
  const [testing, setTesting] = useState(false)

  async function test() {
    setTesting(true)
    try {
      const res = await fetch('/api/webhooks/n8n', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'agrorate-n8n-secret',
        },
        body: JSON.stringify({ event, payload: JSON.parse(payload) }),
      })
      const json = await res.json()
      setResult(JSON.stringify(json, null, 2))
    } catch (e) {
      setResult(`Erro: ${e}`)
    }
    setTesting(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="font-bold text-slate-900 mb-4">Testar webhook</div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Evento</label>
          <select value={event} onChange={e => setEvent(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] bg-white">
            {['score.recalculate', 'score.threshold', 'agrocore.sync', 'offer.broadcast', 'commission.update'].map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Payload (JSON)</label>
          <textarea value={payload} onChange={e => setPayload(e.target.value)} rows={4}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#065f46] resize-none"/>
        </div>
        <button onClick={test} disabled={testing}
          className="px-4 py-2 bg-[#065f46] text-white rounded-xl text-sm font-semibold hover:bg-[#047857] transition-colors disabled:opacity-60">
          {testing ? 'Testando...' : 'Disparar webhook'}
        </button>
        {result && (
          <pre className="bg-slate-900 text-emerald-300 rounded-xl p-4 text-xs overflow-x-auto">{result}</pre>
        )}
      </div>
    </div>
  )
}
