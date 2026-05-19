'use client'

import { useEffect, useState } from 'react'

interface Contrato {
  id: string
  banco: string
  linha: string
  valor: string | number
  taxaAnual: string | number
  prazo: number
  dataContratacao: string
  dataVencimento?: string
  valorParcela?: string | number
  parcelasPagas: number
  status: string
  observacoes?: string
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  ATIVO:     { label: 'Ativo',     color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  QUITADO:   { label: 'Quitado',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  ATRASADO:  { label: 'Atrasado',  color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  RENEGOCIADO: { label: 'Renegociado', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
}

const BANCOS = ['Banco do Brasil', 'Sicredi', 'Sicoob', 'Bradesco', 'Agrolend', 'BNB', 'Caixa', 'Santander', 'Outro']
const LINHAS = ['PRONAF Custeio', 'PRONAF Investimento', 'PRONAMP Custeio', 'PRONAMP Investimento', 'Moderinfra', 'CPR Digital', 'Custeio Livre', 'Outro']

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    banco: 'Banco do Brasil',
    linha: 'PRONAF Custeio',
    valor: '',
    taxaAnual: '',
    prazo: '12',
    dataContratacao: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    valorParcela: '',
    status: 'ATIVO',
    observacoes: '',
  })

  async function load() {
    try {
      const r = await fetch('/api/contratos')
      if (r.ok) { const d = await r.json(); setContratos(d.contratos ?? []) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function salvar() {
    setSaving(true)
    try {
      const r = await fetch('/api/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          valor: parseFloat(form.valor) || 0,
          taxaAnual: parseFloat(form.taxaAnual) || 0,
          prazo: parseInt(form.prazo) || 12,
          valorParcela: parseFloat(form.valorParcela) || null,
        }),
      })
      if (r.ok) { setShowForm(false); setForm({ banco: 'Banco do Brasil', linha: 'PRONAF Custeio', valor: '', taxaAnual: '', prazo: '12', dataContratacao: new Date().toISOString().split('T')[0], dataVencimento: '', valorParcela: '', status: 'ATIVO', observacoes: '' }); load() }
    } finally { setSaving(false) }
  }

  async function excluir(id: string) {
    await fetch(`/api/contratos?id=${id}`, { method: 'DELETE' })
    setContratos(prev => prev.filter(c => c.id !== id))
  }

  const totalAtivo = contratos.filter(c => c.status === 'ATIVO').reduce((s, c) => s + Number(c.valor), 0)

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #0a0414 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(96,165,250,0.07) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="text-xs font-bold tracking-widest text-blue-400/70 uppercase mb-1">Gestão de Crédito</div>
            <h1 className="text-3xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #bfdbfe 0%, #60a5fa 50%, #2563eb 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Histórico de Contratos</h1>
            <p className="text-sm text-slate-400 mt-1">Gerencie todos os seus contratos de crédito rural</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 flex-shrink-0"
            style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Novo Contrato
          </button>
        </div>

        {/* Stats */}
        {contratos.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Contratos Ativos', val: contratos.filter(c => c.status === 'ATIVO').length.toString(), color: '#34d399' },
              { label: 'Total Financiado', val: fmt(totalAtivo), color: '#60a5fa' },
              { label: 'Total de Contratos', val: contratos.length.toString(), color: '#a78bfa' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 text-center border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.val}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-lg rounded-2xl p-6 border space-y-4" style={{ background: '#0d1b2a', borderColor: 'rgba(96,165,250,0.2)' }}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Novo Contrato de Crédito</span>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Banco</label>
                  <select value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {BANCOS.map(b => <option key={b} value={b} style={{ background: '#0d1b2a' }}>{b}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Linha de Crédito</label>
                  <select value={form.linha} onChange={e => setForm(f => ({ ...f, linha: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {LINHAS.map(l => <option key={l} value={l} style={{ background: '#0d1b2a' }}>{l}</option>)}
                  </select>
                </div>
                {[
                  { label: 'Valor (R$)', key: 'valor', type: 'number', placeholder: '250000' },
                  { label: 'Taxa Anual (%)', key: 'taxaAnual', type: 'number', placeholder: '7.5' },
                  { label: 'Prazo (meses)', key: 'prazo', type: 'number', placeholder: '12' },
                  { label: 'Parcela (R$)', key: 'valorParcela', type: 'number', placeholder: 'Opcional' },
                  { label: 'Contratação', key: 'dataContratacao', type: 'date', placeholder: '' },
                  { label: 'Vencimento', key: 'dataVencimento', type: 'date', placeholder: '' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">{f.label}</label>
                    <input type={f.type} value={form[f.key as keyof typeof form]} placeholder={f.placeholder}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <option key={k} value={k} style={{ background: '#0d1b2a' }}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button onClick={salvar} disabled={saving || !form.valor}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'rgba(96,165,250,0.2)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)' }}>
                {saving ? 'Salvando...' : 'Salvar Contrato'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"/>
          </div>
        )}

        {!loading && contratos.length === 0 && (
          <div className="rounded-2xl p-12 text-center border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="text-5xl mb-4">📋</div>
            <div className="font-bold text-slate-400 mb-2">Nenhum contrato cadastrado</div>
            <p className="text-sm text-slate-600 mb-4">Registre seus contratos de crédito para acompanhar parcelas, vencimentos e impacto no score.</p>
            <button onClick={() => setShowForm(true)}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all"
              style={{ background: 'rgba(96,165,250,0.15)', color: '#60a5fa' }}>
              + Adicionar primeiro contrato
            </button>
          </div>
        )}

        <div className="space-y-3">
          {contratos.map(c => {
            const meta = STATUS_META[c.status] ?? { label: c.status, color: '#64748b', bg: 'rgba(100,116,139,0.12)' }
            const restante = c.prazo - c.parcelasPagas
            const progresso = c.prazo > 0 ? (c.parcelasPagas / c.prazo) * 100 : 0
            return (
              <div key={c.id} className="rounded-2xl p-5 border transition-all hover:scale-[1.005]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm">{c.banco}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">{c.linha}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{new Date(c.dataContratacao).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-black" style={{ color: '#60a5fa' }}>{fmt(Number(c.valor))}</div>
                    {c.valorParcela && <div className="text-xs text-slate-500">{fmt(Number(c.valorParcela))}/mês</div>}
                  </div>
                </div>
                {/* Progresso */}
                {c.prazo > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{c.parcelasPagas} de {c.prazo} parcelas pagas</span>
                      <span>{restante} restantes</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full rounded-full"
                        style={{ width: `${progresso}%`, background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})` }}/>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-xs text-slate-500">
                    {c.taxaAnual > 0 && <span>{Number(c.taxaAnual).toFixed(1)}% a.a.</span>}
                    {c.dataVencimento && <span>Venc. {new Date(c.dataVencimento).toLocaleDateString('pt-BR')}</span>}
                  </div>
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
