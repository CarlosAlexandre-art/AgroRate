'use client'

import { useEffect, useState } from 'react'

interface Garantia {
  id: string
  tipo: string
  descricao: string
  valorEstimado?: number | string
  identificador?: string
  vinculado?: string
  status: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const TIPOS = ['Imóvel Rural', 'Imóvel Urbano', 'Veículo', 'Máquina Agrícola', 'Estoque de Grãos', 'CPR', 'Seguro Rural', 'Fiança', 'Outro']

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  DISPONIVEL:  { label: 'Disponível',  color: '#34d399', bg: 'rgba(52,211,153,0.12)',  icon: '✓' },
  VINCULADO:   { label: 'Vinculado',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  icon: '🔗' },
  EM_ANALISE:  { label: 'Em Análise',  color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  icon: '⏳' },
  LIBERADO:    { label: 'Liberado',    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '✅' },
}

const TIPO_ICONS: Record<string, string> = {
  'Imóvel Rural': '🏡', 'Imóvel Urbano': '🏢', 'Veículo': '🚗', 'Máquina Agrícola': '🚜',
  'Estoque de Grãos': '🌾', 'CPR': '📄', 'Seguro Rural': '🛡️', 'Fiança': '🤝', 'Outro': '📦',
}

export default function GarantiasPage() {
  const [garantias, setGarantias] = useState<Garantia[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: 'Imóvel Rural',
    descricao: '',
    valorEstimado: '',
    identificador: '',
    vinculado: '',
    status: 'DISPONIVEL',
  })

  async function load() {
    try {
      const r = await fetch('/api/garantias')
      if (r.ok) { const d = await r.json(); setGarantias(d.garantias ?? []) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function salvar() {
    setSaving(true)
    try {
      const r = await fetch('/api/garantias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, valorEstimado: form.valorEstimado ? parseFloat(form.valorEstimado) : null }),
      })
      if (r.ok) { setShowForm(false); setForm({ tipo: 'Imóvel Rural', descricao: '', valorEstimado: '', identificador: '', vinculado: '', status: 'DISPONIVEL' }); load() }
    } finally { setSaving(false) }
  }

  async function excluir(id: string) {
    await fetch(`/api/garantias?id=${id}`, { method: 'DELETE' })
    setGarantias(prev => prev.filter(g => g.id !== id))
  }

  const totalDisponivel = garantias.filter(g => g.status === 'DISPONIVEL').reduce((s, g) => s + Number(g.valorEstimado || 0), 0)
  const totalVinculado = garantias.filter(g => g.status === 'VINCULADO').reduce((s, g) => s + Number(g.valorEstimado || 0), 0)

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #141004 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(251,191,36,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.03) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(251,191,36,0.07) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="text-xs font-bold tracking-widest text-amber-400/70 uppercase mb-1">Portfolio de Garantias</div>
            <h1 className="text-3xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #d97706 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Garantias</h1>
            <p className="text-sm text-slate-400 mt-1">Gerencie bens e ativos disponíveis para garantir crédito rural</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex-shrink-0"
            style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nova Garantia
          </button>
        </div>

        {/* Stats */}
        {garantias.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Disponível', val: fmt(totalDisponivel), color: '#34d399' },
              { label: 'Vinculado', val: fmt(totalVinculado), color: '#fbbf24' },
              { label: 'Total de Ativos', val: garantias.length.toString(), color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-lg rounded-2xl p-6 border space-y-4" style={{ background: '#0d1b2a', borderColor: 'rgba(251,191,36,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Nova Garantia</span>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Tipo de Garantia</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {TIPOS.map(t => <option key={t} value={t} style={{ background: '#0d1b2a' }}>{TIPO_ICONS[t]} {t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Descrição</label>
                  <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                    placeholder="Ex: Fazenda Santa Fé, 250 ha, matrícula 12345 - CRI Barretos"
                    rows={2} className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Valor Estimado (R$)</label>
                    <input type="number" value={form.valorEstimado} onChange={e => setForm(f => ({ ...f, valorEstimado: e.target.value }))}
                      placeholder="500000"
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Identificador</label>
                    <input type="text" value={form.identificador} onChange={e => setForm(f => ({ ...f, identificador: e.target.value }))}
                      placeholder="Matrícula / Placa / NIRF"
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <option key={k} value={k} style={{ background: '#0d1b2a' }}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={salvar} disabled={saving || !form.descricao}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                {saving ? 'Salvando...' : 'Salvar Garantia'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"/>
          </div>
        )}

        {!loading && garantias.length === 0 && (
          <div className="rounded-2xl p-12 text-center border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-5xl mb-4">🔒</div>
            <div className="font-bold text-slate-400 mb-2">Nenhuma garantia cadastrada</div>
            <p className="text-sm text-slate-600 mb-4">Registre seus ativos disponíveis para garantir operações de crédito rural.</p>
            <button onClick={() => setShowForm(true)}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24' }}>
              + Adicionar garantia
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {garantias.map(g => {
            const meta = STATUS_META[g.status] ?? { label: g.status, color: '#64748b', bg: 'rgba(100,116,139,0.12)', icon: '?' }
            const icon = TIPO_ICONS[g.tipo] ?? '📦'
            return (
              <div key={g.id} className="rounded-2xl p-5 border transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{icon}</div>
                    <div>
                      <div className="font-bold text-white text-sm">{g.tipo}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{g.descricao}</div>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                {g.valorEstimado && Number(g.valorEstimado) > 0 && (
                  <div className="text-xl font-black mb-2" style={{ color: '#fbbf24' }}>{fmt(Number(g.valorEstimado))}</div>
                )}
                {g.identificador && (
                  <div className="text-xs font-mono text-slate-500 mb-2">{g.identificador}</div>
                )}
                <div className="flex justify-end">
                  <button onClick={() => excluir(g.id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors">Remover</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
