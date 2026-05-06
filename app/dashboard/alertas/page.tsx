'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type AlertType = 'score' | 'credito' | 'documento' | 'sistema'
type AlertPriority = 'alta' | 'media' | 'baixa'

interface Alert {
  id: string
  type: AlertType
  priority: AlertPriority
  title: string
  desc: string
  time: string
  read: boolean
  action?: { label: string; href: string }
  createdAt?: string
}

const TYPE_META: Record<AlertType, { icon: string; bg: string; text: string; label: string }> = {
  score:     { icon: '📊', bg: 'bg-emerald-50',  text: 'text-emerald-700', label: 'Score' },
  credito:   { icon: '💰', bg: 'bg-blue-50',     text: 'text-blue-700',   label: 'Crédito' },
  documento: { icon: '📄', bg: 'bg-amber-50',    text: 'text-amber-700',  label: 'Documento' },
  sistema:   { icon: '⚙️', bg: 'bg-slate-100',   text: 'text-slate-600',  label: 'Sistema' },
}

const PRIORITY_META: Record<AlertPriority, { dot: string; label: string }> = {
  alta:  { dot: 'bg-red-400',    label: 'Alta' },
  media: { dot: 'bg-amber-400',  label: 'Média' },
  baixa: { dot: 'bg-slate-300',  label: 'Baixa' },
}

function guessType(message: string): AlertType {
  const m = message.toLowerCase()
  if (m.includes('score') || m.includes('ponto')) return 'score'
  if (m.includes('crédito') || m.includes('credito') || m.includes('oferta') || m.includes('parceiro')) return 'credito'
  if (m.includes('document') || m.includes('venc') || m.includes('prazo')) return 'documento'
  return 'sistema'
}

function guessPriority(message: string, type: AlertType): AlertPriority {
  const m = message.toLowerCase()
  if (m.includes('urgent') || m.includes('vence') || m.includes('vencendo') || type === 'documento') return 'alta'
  if (type === 'score' || type === 'credito') return 'media'
  return 'baixa'
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'Agora'
  if (mins < 60) return `Há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Há ${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Ontem'
  if (days < 30) return `Há ${days} dias`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function parseDbAlerts(raw: Array<{ id: string; message: string; type: string; isRead: boolean; createdAt: string }>): Alert[] {
  return raw.map(a => {
    const type = (['score','credito','documento','sistema'].includes(a.type) ? a.type : guessType(a.message)) as AlertType
    return {
      id: a.id,
      type,
      priority: guessPriority(a.message, type),
      title: a.message.split('\n')[0].replace(/^[✅❌🤝⚙️📊💰📄🚜]+\s*/, '').trim() || a.message,
      desc: a.message,
      time: formatRelative(a.createdAt),
      read: a.isRead,
      createdAt: a.createdAt,
    }
  })
}

const ALL_TYPES: AlertType[] = ['score', 'credito', 'documento', 'sistema']

const PREF_LABELS = ['Mudanças no score', 'Novas ofertas de crédito', 'Vencimento de documentos', 'Atualizações do sistema']
const DEFAULT_PREFS: Record<string, boolean> = {
  'Mudanças no score': true,
  'Novas ofertas de crédito': true,
  'Vencimento de documentos': true,
  'Atualizações do sistema': false,
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todos' | AlertType>('todos')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT_PREFS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('agrorate_alert_prefs')
      if (stored) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) })
    } catch { /* ignore */ }
  }, [])

  const loadAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/alertas')
      if (res.ok) {
        const { alerts: raw } = await res.json()
        setAlerts(parseDbAlerts(raw))
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  const unread = alerts.filter(a => !a.read).length

  useEffect(() => {
    try { localStorage.setItem('agrorate_unread_count', String(unread)) } catch { /* ignore */ }
    window.dispatchEvent(new StorageEvent('storage', { key: 'agrorate_unread_count', newValue: String(unread) }))
  }, [unread])

  function togglePref(label: string) {
    setPrefs(prev => {
      const next = { ...prev, [label]: !prev[label] }
      try { localStorage.setItem('agrorate_alert_prefs', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  async function markRead(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
    await fetch('/api/alertas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ alertId: id }) })
  }

  async function markAllRead() {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
    await fetch('/api/alertas', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) })
  }

  const recent = alerts.filter(a => {
    const daysOld = a.createdAt ? (Date.now() - new Date(a.createdAt).getTime()) / 86400000 : 0
    return daysOld <= 30
  })
  const history = alerts.filter(a => {
    const daysOld = a.createdAt ? (Date.now() - new Date(a.createdAt).getTime()) / 86400000 : 0
    return daysOld > 30
  })

  const source = showHistory ? history : recent
  const visible = source.filter(a => {
    const typeOk = filter === 'todos' || a.type === filter
    const readOk = !onlyUnread || !a.read
    return typeOk && readOk
  })

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alertas & Notificações</h1>
          <p className="text-slate-500 text-sm">Fique por dentro das atualizações do seu perfil</p>
        </div>
        {unread > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-500">{unread} não lidas</span>
            <button onClick={markAllRead} className="text-xs font-semibold text-[#065f46] hover:underline">
              Marcar todas como lidas
            </button>
          </div>
        )}
      </div>

      {/* Abas recente / histórico */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button onClick={() => setShowHistory(false)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${!showHistory ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          Recentes {unread > 0 && !showHistory && <span className="ml-1 bg-[#065f46] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
        </button>
        <button onClick={() => setShowHistory(true)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${showHistory ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
          Histórico {history.length > 0 && <span className="ml-1 text-[10px] text-slate-400">({history.length})</span>}
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={() => setFilter('todos')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filter === 'todos' ? 'bg-[#065f46] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#065f46]/30'}`}>
          Todos
        </button>
        {ALL_TYPES.map(t => {
          const meta = TYPE_META[t]
          return (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filter === t ? 'bg-[#065f46] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#065f46]/30'}`}>
              {meta.icon} {meta.label}
            </button>
          )
        })}
        <div className="ml-auto">
          <button onClick={() => setOnlyUnread(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${onlyUnread ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}>
            <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${onlyUnread ? 'border-white bg-white' : 'border-slate-400'}`}>
              {onlyUnread && <div className="w-1.5 h-1.5 bg-slate-800 rounded-sm"/>}
            </div>
            Não lidas
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse"/>)
        ) : visible.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="text-4xl mb-3">{showHistory ? '📚' : '🎉'}</div>
            <div className="font-semibold text-slate-700 mb-1">
              {showHistory ? 'Nenhum alerta antigo' : 'Tudo em dia!'}
            </div>
            <div className="text-sm text-slate-400">
              {showHistory ? 'Alertas com mais de 30 dias aparecerão aqui.' : 'Nenhuma notificação para este filtro.'}
            </div>
          </div>
        ) : visible.map(alert => {
          const meta = TYPE_META[alert.type]
          const pri = PRIORITY_META[alert.priority]
          return (
            <div key={alert.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${alert.read ? 'border-slate-100 opacity-70' : 'border-slate-200 shadow-sm'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${meta.bg} ${meta.text}`}>{meta.label}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`}/>
                      {pri.label}
                    </span>
                    {!alert.read && <span className="w-2 h-2 rounded-full bg-[#065f46] ml-auto flex-shrink-0"/>}
                  </div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">{alert.title}</div>
                  <div className="text-slate-500 text-xs leading-relaxed mb-3">{alert.desc}</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-slate-400">{alert.time}</span>
                    {alert.action && (
                      <Link href={alert.action.href}
                        className="text-xs font-semibold text-[#065f46] hover:underline"
                        onClick={() => markRead(alert.id)}>
                        {alert.action.label} →
                      </Link>
                    )}
                    {!alert.read && (
                      <button onClick={() => markRead(alert.id)}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preferências */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-slate-600 font-semibold text-sm">Preferências de alertas</span>
          <span className="text-xs text-slate-400">(em breve: push no WhatsApp e e-mail)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PREF_LABELS.map(label => (
            <button key={label} onClick={() => togglePref(label)}
              className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 w-full text-left hover:bg-slate-50 transition-colors cursor-pointer">
              <div className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${prefs[label] ? 'bg-[#065f46]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${prefs[label] ? 'left-4' : 'left-0.5'}`}/>
              </div>
              <span className="text-xs text-slate-600">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
