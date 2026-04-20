'use client'

import { useState } from 'react'
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

const INITIAL_ALERTS: Alert[] = [
  {
    id: '1', type: 'score', priority: 'alta', read: false, time: 'Há 5 min',
    title: 'Seu score subiu 42 pontos!',
    desc: 'Novas receitas registradas no AgroOS foram processadas. Seu score passou de 634 para 676.',
    action: { label: 'Ver score', href: '/dashboard' },
  },
  {
    id: '2', type: 'credito', priority: 'alta', read: false, time: 'Há 2h',
    title: 'Nova oferta: Sicredi Crédito Rural Premium',
    desc: 'Com seu score atual, você se qualificou para a linha premium do Sicredi com taxa de 1,0% a.m. e até R$ 200.000.',
    action: { label: 'Ver oferta', href: '/dashboard/credito' },
  },
  {
    id: '3', type: 'documento', priority: 'media', read: false, time: 'Há 1 dia',
    title: 'ITR vence em 15 dias',
    desc: 'O Imposto Territorial Rural da sua propriedade vence em 15 dias. Renove para manter seu score operacional.',
    action: { label: 'Ver documentos', href: '/dashboard/documentos' },
  },
  {
    id: '4', type: 'score', priority: 'media', read: true, time: 'Há 3 dias',
    title: 'Dica: melhore seu score de eficiência',
    desc: 'Seu score de Eficiência está em 58/100. Registre seus custos detalhados no AgroOS para melhorar essa dimensão.',
    action: { label: 'Ir ao AgroOS', href: 'https://agros-os.vercel.app' },
  },
  {
    id: '5', type: 'credito', priority: 'baixa', read: true, time: 'Há 5 dias',
    title: 'Simulação salva expira em breve',
    desc: 'Você tem 2 simulações salvas que expiram em 7 dias. Acesse para revisar ou solicitar.',
    action: { label: 'Ver simulações', href: '/dashboard/simulacoes' },
  },
  {
    id: '6', type: 'sistema', priority: 'baixa', read: true, time: 'Há 1 semana',
    title: 'AgroRate sincronizado com AgroOS',
    desc: 'Sincronização automática concluída. 3 novos registros de produção foram incorporados ao seu score.',
  },
]

const ALL_TYPES: AlertType[] = ['score', 'credito', 'documento', 'sistema']

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS)
  const [filter, setFilter] = useState<'todos' | AlertType>('todos')
  const [onlyUnread, setOnlyUnread] = useState(false)

  const unread = alerts.filter(a => !a.read).length

  function markRead(id: string) {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  function markAllRead() {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  function dismiss(id: string) {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  const visible = alerts.filter(a => {
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
            <button onClick={markAllRead}
              className="text-xs font-semibold text-[#065f46] hover:underline">
              Marcar todas como lidas
            </button>
          </div>
        )}
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
        <div className="ml-auto flex items-center gap-2">
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
        {visible.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="font-semibold text-slate-700 mb-1">Tudo em dia!</div>
            <div className="text-sm text-slate-400">Nenhuma notificação para este filtro.</div>
          </div>
        )}
        {visible.map(alert => {
          const meta = TYPE_META[alert.type]
          const pri = PRIORITY_META[alert.priority]
          return (
            <div key={alert.id}
              className={`bg-white rounded-2xl border p-5 transition-all ${alert.read ? 'border-slate-100 opacity-70' : 'border-slate-200 shadow-sm'}`}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center text-xl flex-shrink-0`}>
                  {meta.icon}
                </div>

                {/* Content */}
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
                    <button onClick={() => dismiss(alert.id)}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors ml-auto">
                      Dispensar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Configurar alertas */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-slate-600 font-semibold text-sm">Preferências de alertas</span>
          <span className="text-xs text-slate-400">(em breve: push no WhatsApp e e-mail)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Mudanças no score', active: true },
            { label: 'Novas ofertas de crédito', active: true },
            { label: 'Vencimento de documentos', active: true },
            { label: 'Atualizações do sistema', active: false },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
              <div className={`w-8 h-4 rounded-full transition-colors relative ${item.active ? 'bg-[#065f46]' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${item.active ? 'left-4' : 'left-0.5'}`}/>
              </div>
              <span className="text-xs text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
