'use client'

import { useEffect, useState } from 'react'

interface Certidao {
  id: string
  tipo: string
  numero?: string
  emissao?: string
  validade?: string
  status: string
  observacoes?: string
}

const TIPOS_CERTIDAO = [
  'CND Federal (Receita/PGFN)',
  'CND Estadual',
  'CND Municipal (ISS/IPTU)',
  'CND FGTS (CEF)',
  'CND Trabalhista (TST)',
  'CND INSS',
  'CND ITR (Imposto Territorial Rural)',
  'Certidão do CAR',
  'Certidão de Matrícula do Imóvel',
  'Licença Ambiental',
  'Outro',
]

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  VALIDA:    { label: 'Válida',   color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  VENCENDO:  { label: 'Vencendo', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  VENCIDA:   { label: 'Vencida',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  PENDENTE:  { label: 'Pendente', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function calcStatus(validade?: string): string {
  if (!validade) return 'PENDENTE'
  const diff = (new Date(validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'VENCIDA'
  if (diff <= 30) return 'VENCENDO'
  return 'VALIDA'
}

export default function CertidoesPage() {
  const [certidoes, setCertidoes] = useState<Certidao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tipo: 'CND Federal (Receita/PGFN)',
    numero: '',
    emissao: '',
    validade: '',
    observacoes: '',
  })

  async function load() {
    try {
      const r = await fetch('/api/certidoes')
      if (r.ok) { const d = await r.json(); setCertidoes(d.certidoes ?? []) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function salvar() {
    setSaving(true)
    try {
      const r = await fetch('/api/certidoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: calcStatus(form.validade) }),
      })
      if (r.ok) { setShowForm(false); setForm({ tipo: 'CND Federal (Receita/PGFN)', numero: '', emissao: '', validade: '', observacoes: '' }); load() }
    } finally { setSaving(false) }
  }

  async function excluir(id: string) {
    await fetch(`/api/certidoes?id=${id}`, { method: 'DELETE' })
    setCertidoes(prev => prev.filter(c => c.id !== id))
  }

  const validas = certidoes.filter(c => calcStatus(c.validade) === 'VALIDA').length
  const vencendo = certidoes.filter(c => calcStatus(c.validade) === 'VENCENDO').length
  const vencidas = certidoes.filter(c => calcStatus(c.validade) === 'VENCIDA').length

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #080314 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(167,139,250,0.06) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="text-xs font-bold tracking-widest text-purple-400/70 uppercase mb-1">Regularidade Fiscal</div>
            <h1 className="text-3xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #e9d5ff 0%, #a78bfa 50%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Certidões Fiscais</h1>
            <p className="text-sm text-slate-400 mt-1">Gerencie CNDs e certidões obrigatórias para operações de crédito</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex-shrink-0"
            style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nova Certidão
          </button>
        </div>

        {/* Status summary */}
        {certidoes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Válidas', val: validas, color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
              { label: 'Vencendo (30 dias)', val: vencendo, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
              { label: 'Vencidas / Pendentes', val: vencidas, color: '#f87171', bg: 'rgba(248,113,113,0.08)' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center border"
                style={{ background: s.bg, borderColor: `${s.color}20` }}>
                <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {vencendo > 0 && (
          <div className="rounded-2xl p-4 border" style={{ background: 'rgba(251,191,36,0.07)', borderColor: 'rgba(251,191,36,0.2)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0"/>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Atenção</span>
              <span className="text-sm text-slate-300 ml-1">{vencendo} certidão(ões) vencendo em 30 dias — renove antes de solicitar crédito.</span>
            </div>
          </div>
        )}

        {/* Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-lg rounded-2xl p-6 border space-y-4" style={{ background: '#0d1b2a', borderColor: 'rgba(167,139,250,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Nova Certidão</span>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Tipo de Certidão</label>
                  <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {TIPOS_CERTIDAO.map(t => <option key={t} value={t} style={{ background: '#0d1b2a' }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Número / Código</label>
                  <input type="text" value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Emissão</label>
                    <input type="date" value={form.emissao} onChange={e => setForm(f => ({ ...f, emissao: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Validade</label>
                    <input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                    rows={2} placeholder="Opcional"
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none resize-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
              </div>
              <button onClick={salvar} disabled={saving}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                {saving ? 'Salvando...' : 'Salvar Certidão'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"/>
          </div>
        )}

        {!loading && certidoes.length === 0 && (
          <div className="rounded-2xl p-12 text-center border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-5xl mb-4">📋</div>
            <div className="font-bold text-slate-400 mb-2">Nenhuma certidão cadastrada</div>
            <p className="text-sm text-slate-600 mb-4">Bancos exigem CNDs válidas para aprovar crédito rural. Cadastre e acompanhe as validades aqui.</p>
            <button onClick={() => setShowForm(true)}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#a78bfa' }}>
              + Adicionar certidão
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {certidoes.map(c => {
            const statusKey = calcStatus(c.validade)
            const meta = STATUS_META[statusKey] ?? STATUS_META.PENDENTE
            const diasRestantes = c.validade
              ? Math.ceil((new Date(c.validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null
            return (
              <div key={c.id} className="rounded-2xl p-5 border transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-bold text-white text-sm leading-snug">{c.tipo}</div>
                    {c.numero && <div className="text-xs font-mono text-slate-500 mt-0.5">{c.numero}</div>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs mb-3">
                  {c.emissao && (
                    <div className="text-slate-500">Emitida: <span className="text-slate-300">{new Date(c.emissao).toLocaleDateString('pt-BR')}</span></div>
                  )}
                  {c.validade && (
                    <div className="text-slate-500">Validade: <span className="font-semibold" style={{ color: meta.color }}>{new Date(c.validade).toLocaleDateString('pt-BR')}</span></div>
                  )}
                </div>
                {diasRestantes !== null && diasRestantes > 0 && (
                  <div className="mb-3">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (diasRestantes / 180) * 100)}%`,
                          background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
                        }}/>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{diasRestantes} dias restantes</div>
                  </div>
                )}
                {c.observacoes && <div className="text-xs text-slate-600 mb-3">{c.observacoes}</div>}
                <div className="flex justify-end">
                  <button onClick={() => excluir(c.id)} className="text-xs text-slate-600 hover:text-red-400 transition-colors">Remover</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
