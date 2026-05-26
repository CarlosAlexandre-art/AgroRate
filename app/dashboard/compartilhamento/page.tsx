'use client'

import { useEffect, useState } from 'react'

interface Share {
  id: string
  email: string
  nome?: string
  role: string
  status: string
  invitedAt: string
  acceptedAt?: string
  inviteToken: string
}

const ROLES = [
  { id: 'VISUALIZADOR', label: 'Visualizador', desc: 'Pode ver score, documentos e relatórios. Não edita dados.' },
  { id: 'CONTADOR', label: 'Contador', desc: 'Acesso completo a certidões, fluxo de caixa e documentos fiscais.' },
  { id: 'COLABORADOR', label: 'Colaborador', desc: 'Pode editar dados financeiros da fazenda.' },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Convite Enviado', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  ACTIVE:   { label: 'Ativo', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  REVOKED:  { label: 'Revogado', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
}

function diasAtras(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (d === 0) return 'hoje'
  if (d === 1) return 'ontem'
  return `há ${d} dias`
}

export default function CompartilhamentoPage() {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [confirmRevogar, setConfirmRevogar] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', nome: '', role: 'CONTADOR' })

  async function load() {
    try {
      const r = await fetch('/api/compartilhamento')
      if (r.ok) { const d = await r.json(); setShares(d.shares ?? []) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function convidar() {
    if (!form.email) return
    setFormError('')
    setSaving(true)
    try {
      const r = await fetch('/api/compartilhamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) { setFormError(d.error ?? 'Erro ao enviar convite'); return }
      setShowForm(false); setForm({ email: '', nome: '', role: 'CONTADOR' }); load()
    } finally { setSaving(false) }
  }

  async function revogar(id: string) {
    await fetch(`/api/compartilhamento?id=${id}`, { method: 'DELETE' })
    setShares(prev => prev.filter(s => s.id !== id))
    setConfirmRevogar(null)
  }

  function copiarLink(token: string, id: string) {
    const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/acesso/${token}`
    navigator.clipboard.writeText(link).then(() => { setCopied(id); setTimeout(() => setCopied(null), 2000) })
  }

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #041410 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(52,211,153,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      <div className="absolute top-0 left-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(52,211,153,0.05) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="text-xs font-bold tracking-widest text-emerald-400/70 uppercase mb-1">Acesso Colaborativo</div>
            <h1 className="text-3xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Acesso Contador</h1>
            <p className="text-sm text-slate-400 mt-1">Convide contadores e colaboradores para acessar sua conta com segurança</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex-shrink-0"
            style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Convidar
          </button>
        </div>

        {/* Níveis de acesso */}
        <div className="grid grid-cols-3 gap-3">
          {ROLES.map(r => (
            <div key={r.id} className="rounded-2xl p-4 border"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="font-bold text-white text-sm mb-1">{r.label}</div>
              <div className="text-xs text-slate-500">{r.desc}</div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-md rounded-2xl p-6 border space-y-4" style={{ background: '#0d1b2a', borderColor: 'rgba(52,211,153,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Convidar Colaborador</span>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="contador@escritorio.com.br"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Nome (opcional)</label>
                  <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                    placeholder="Dr. João Silva CRC/SP 12345"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Nível de acesso</label>
                  <div className="space-y-2">
                    {ROLES.map(r => (
                      <label key={r.id} className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-all"
                        style={{ background: form.role === r.id ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${form.role === r.id ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
                        <input type="radio" name="role" value={r.id} checked={form.role === r.id}
                          onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                          className="mt-0.5 accent-emerald-400 flex-shrink-0"/>
                        <div>
                          <div className="text-sm font-semibold text-white">{r.label}</div>
                          <div className="text-xs text-slate-500">{r.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              {formError && (
                <div className="text-xs font-semibold px-3 py-2 rounded-xl" style={{ background: 'rgba(248,113,113,0.12)', color: '#f87171' }}>
                  {formError}
                </div>
              )}
              <button onClick={convidar} disabled={saving || !form.email}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
                {saving ? 'Enviando convite...' : 'Enviar Convite'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"/>
          </div>
        )}

        {!loading && shares.length === 0 && (
          <div className="rounded-2xl p-12 text-center border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-5xl mb-4">👥</div>
            <div className="font-bold text-slate-400 mb-2">Nenhum colaborador ainda</div>
            <p className="text-sm text-slate-600 mb-4">Convide seu contador para acessar certidões e fluxo de caixa sem precisar compartilhar sua senha.</p>
            <button onClick={() => setShowForm(true)}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
              style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399' }}>
              + Convidar primeiro colaborador
            </button>
          </div>
        )}

        <div className="space-y-3">
          {shares.map(s => {
            const meta = STATUS_META[s.status] ?? { label: s.status, color: '#64748b', bg: 'rgba(100,116,139,0.12)' }
            const role = ROLES.find(r => r.id === s.role)
            return (
              <div key={s.id} className="rounded-2xl p-5 border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    {(s.nome || s.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm">{s.nome || s.email}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399' }}>
                        {role?.label ?? s.role}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-xs text-slate-600">
                        {s.status === 'ACTIVE' && s.acceptedAt
                          ? `Aceitou ${diasAtras(s.acceptedAt)}`
                          : `Convidado ${diasAtras(s.invitedAt)}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.status === 'PENDING' && (
                      <button onClick={() => copiarLink(s.inviteToken, s.id)}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                        style={{ background: 'rgba(96,165,250,0.12)', color: copied === s.id ? '#34d399' : '#60a5fa' }}>
                        {copied === s.id ? 'Copiado!' : 'Copiar link'}
                      </button>
                    )}
                    {s.status === 'ACTIVE' && (
                      <button
                        onClick={() => { const url = `${window.location.origin}/colaborador/${s.inviteToken}`; navigator.clipboard.writeText(url).then(() => { setCopied(s.id + '_portal'); setTimeout(() => setCopied(null), 2000) }) }}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
                        style={{ background: 'rgba(52,211,153,0.08)', color: copied === s.id + '_portal' ? '#4ade80' : '#34d399' }}>
                        {copied === s.id + '_portal' ? 'Copiado!' : 'Portal'}
                      </button>
                    )}
                    {s.status !== 'REVOKED' && (
                      confirmRevogar === s.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => revogar(s.id)} className="text-xs px-2 py-1 rounded-lg font-bold transition-colors" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Confirmar</button>
                          <button onClick={() => setConfirmRevogar(null)} className="text-xs text-slate-600 hover:text-white transition-colors px-1">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmRevogar(s.id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors">Revogar</button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
