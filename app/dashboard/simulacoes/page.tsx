'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Simulation {
  id: string
  name: string
  partner: string
  line: string
  amount: number
  rateMonthly: number
  term: number
  createdAt: string
  status: 'saved' | 'requested' | 'approved'
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
const fmtRate = (r: number) => {
  const annual = (Math.pow(1 + r / 100, 12) - 1) * 100
  return { monthly: `${r.toFixed(2)}% a.m.`, annual: `${annual.toFixed(1)}% a.a.` }
}
const calcParcela = (p: number, r: number, n: number) => {
  const rate = r / 100
  return (p * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1)
}

const STATUS_META = {
  saved:     { label: 'Salva',     bg: 'bg-slate-100',   text: 'text-slate-600' },
  requested: { label: 'Solicitada', bg: 'bg-amber-50',    text: 'text-amber-700' },
  approved:  { label: 'Aprovada',  bg: 'bg-emerald-50',  text: 'text-emerald-700' },
}

const INITIAL_SIMS: Simulation[] = [
  { id: '1', name: 'Custeio Safra Soja', partner: 'Sicredi', line: 'Pronamp Custeio', amount: 250000, rateMonthly: 0.69, term: 12, createdAt: '2026-04-10', status: 'requested' },
  { id: '2', name: 'Irrigação pivô central', partner: 'Banco do Brasil', line: 'Moderinfra', amount: 800000, rateMonthly: 0.80, term: 60, createdAt: '2026-04-08', status: 'saved' },
  { id: '3', name: 'Compra de trator', partner: 'Sicoob', line: 'Pronaf Mais Alimentos', amount: 95000, rateMonthly: 0.21, term: 36, createdAt: '2026-04-01', status: 'approved' },
]

// All available lines from Plano Safra 2025/26
const LINES = [
  { partner: 'Banco do Brasil', line: 'Pronaf Custeio – Alimentos', rateMonthly: 0.25, term: 12, max: 250000, profile: 'Pronaf' },
  { partner: 'Banco do Brasil', line: 'Pronaf Custeio – Demais', rateMonthly: 0.52, term: 12, max: 250000, profile: 'Pronaf' },
  { partner: 'Banco do Brasil', line: 'Pronamp Custeio', rateMonthly: 0.69, term: 12, max: 1500000, profile: 'Pronamp' },
  { partner: 'Sicredi', line: 'Pronamp Custeio', rateMonthly: 0.69, term: 12, max: 1500000, profile: 'Pronamp' },
  { partner: 'Sicredi', line: 'Pronamp Investimento', rateMonthly: 0.64, term: 60, max: 2000000, profile: 'Pronamp' },
  { partner: 'Sicoob', line: 'Pronaf Mais Alimentos', rateMonthly: 0.21, term: 36, max: 250000, profile: 'Pronaf' },
  { partner: 'Sicoob', line: 'Custeio Livre', rateMonthly: 1.05, term: 12, max: 5000000, profile: 'Mercado' },
  { partner: 'Bradesco E-agro', line: 'Custeio Geral', rateMonthly: 0.82, term: 10, max: 3000000, profile: 'Empresarial' },
  { partner: 'Banco do Brasil', line: 'Moderinfra Irrigação', rateMonthly: 0.80, term: 60, max: 3000000, profile: 'Investimento' },
  { partner: 'Agrolend', line: 'CPR Digital', rateMonthly: 1.15, term: 6, max: 500000, profile: 'Fintech' },
  { partner: 'TerraMagna', line: 'Financiamento Terra', rateMonthly: 1.10, term: 24, max: 2000000, profile: 'Fintech' },
  { partner: 'BNB – Agroamigo', line: 'Microcrédito Pronaf B', rateMonthly: 0.04, term: 24, max: 12000, profile: 'Pronaf' },
]

const PROFILE_COLORS: Record<string, string> = {
  Pronaf: 'bg-emerald-50 text-emerald-700',
  Pronamp: 'bg-blue-50 text-blue-700',
  Empresarial: 'bg-slate-100 text-slate-600',
  Investimento: 'bg-violet-50 text-violet-700',
  Mercado: 'bg-amber-50 text-amber-700',
  Fintech: 'bg-orange-50 text-orange-700',
}

export default function SimulacoesPage() {
  const [sims, setSims] = useState<Simulation[]>(INITIAL_SIMS)
  const [tab, setTab] = useState<'saved' | 'new' | 'compare'>('saved')
  const [compareIds, setCompareIds] = useState<string[]>([])

  // New simulation form
  const [newAmount, setNewAmount] = useState(200000)
  const [newLineIdx, setNewLineIdx] = useState(0)
  const [newTerm, setNewTerm] = useState(LINES[0].term)
  const [newName, setNewName] = useState('')
  const [saved, setSaved] = useState(false)

  const selectedLine = LINES[newLineIdx]
  const effectiveAmount = Math.min(newAmount, selectedLine.max)
  const parcela = calcParcela(effectiveAmount, selectedLine.rateMonthly, newTerm)
  const rates = fmtRate(selectedLine.rateMonthly)

  function saveSimulation() {
    const sim: Simulation = {
      id: Date.now().toString(),
      name: newName || `Simulação ${sims.length + 1}`,
      partner: selectedLine.partner,
      line: selectedLine.line,
      amount: effectiveAmount,
      rateMonthly: selectedLine.rateMonthly,
      term: newTerm,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'saved',
    }
    setSims(prev => [sim, ...prev])
    setSaved(true)
    setTimeout(() => { setSaved(false); setTab('saved') }, 1500)
  }

  function toggleCompare(id: string) {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  const compareSims = sims.filter(s => compareIds.includes(s.id))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Simulações de Crédito</h1>
          <p className="text-slate-500 text-sm">Simule, salve e compare linhas do Plano Safra 2025/26</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => setTab('new')}
            className="px-4 py-2 bg-[#065f46] text-white rounded-xl text-sm font-semibold hover:bg-[#047857] transition-colors">
            + Nova simulação
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['saved', 'new', 'compare'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'saved' ? `Salvas (${sims.length})` : t === 'new' ? 'Nova simulação' : `Comparar${compareIds.length > 0 ? ` (${compareIds.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab: Salvas */}
      {tab === 'saved' && (
        <div className="space-y-3">
          {compareIds.length > 0 && (
            <div className="bg-[#065f46]/5 border border-[#065f46]/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-[#065f46] font-semibold">{compareIds.length} simulação{compareIds.length > 1 ? 'ões' : ''} selecionada{compareIds.length > 1 ? 's' : ''} para comparar</span>
              <button onClick={() => setTab('compare')}
                className="text-sm font-bold text-[#065f46] underline">Comparar agora →</button>
            </div>
          )}
          {sims.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="text-4xl mb-3">📊</div>
              <div className="font-semibold text-slate-700 mb-1">Nenhuma simulação salva</div>
              <div className="text-sm text-slate-400 mb-4">Crie uma nova simulação para começar.</div>
              <button onClick={() => setTab('new')} className="text-sm font-semibold text-[#065f46] hover:underline">Nova simulação →</button>
            </div>
          )}
          {sims.map(sim => {
            const p = calcParcela(sim.amount, sim.rateMonthly, sim.term)
            const r = fmtRate(sim.rateMonthly)
            const meta = STATUS_META[sim.status]
            const isSelected = compareIds.includes(sim.id)
            return (
              <div key={sim.id}
                className={`bg-white rounded-2xl border-2 p-5 transition-all ${isSelected ? 'border-[#065f46]' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleCompare(sim.id)}
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#065f46] border-[#065f46]' : 'border-slate-300'}`}>
                      {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                    </button>
                    <div>
                      <div className="font-bold text-slate-900 text-sm mb-1">{sim.name}</div>
                      <div className="text-xs text-slate-500">{sim.partner} · {sim.line}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{new Date(sim.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${meta.bg} ${meta.text}`}>{meta.label}</span>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {[
                    { label: 'Valor', val: fmt(sim.amount) },
                    { label: 'Taxa', val: r.annual },
                    { label: 'Prazo', val: `${sim.term}x` },
                    { label: 'Parcela', val: fmt(p) },
                  ].map(item => (
                    <div key={item.label} className="text-center p-3 bg-slate-50 rounded-xl">
                      <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                      <div className="font-bold text-slate-800 text-sm">{item.val}</div>
                    </div>
                  ))}
                </div>
                {sim.status === 'saved' && (
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 py-2.5 bg-[#065f46] text-white rounded-xl text-sm font-semibold hover:bg-[#047857] transition-colors">
                      Solicitar crédito
                    </button>
                    <button onClick={() => setSims(prev => prev.filter(s => s.id !== sim.id))}
                      className="px-4 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm hover:bg-slate-50 transition-colors">
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tab: Nova simulação */}
      {tab === 'new' && (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-5">
            <div className="font-bold text-slate-900">Configure sua simulação</div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Nome da simulação</label>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Custeio Safra 2025/26"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] transition-all"/>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Valor desejado</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                <input type="number" min="10000" step="1000" value={newAmount}
                  onChange={e => setNewAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-[#065f46] focus:outline-none focus:ring-2 focus:ring-[#065f46] transition-all"/>
              </div>
              {newAmount > selectedLine.max && (
                <p className="text-xs text-amber-600 mt-1.5">Acima do limite desta linha ({fmt(selectedLine.max)}). Simulação ajustada automaticamente.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Linha de crédito</label>
              <select value={newLineIdx} onChange={e => { setNewLineIdx(Number(e.target.value)); setNewTerm(LINES[Number(e.target.value)].term) }}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46] transition-all bg-white">
                {LINES.map((l, i) => (
                  <option key={i} value={i}>{l.partner} – {l.line} ({fmtRate(l.rateMonthly).annual})</option>
                ))}
              </select>
              <div className="mt-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${PROFILE_COLORS[selectedLine.profile] || 'bg-slate-100 text-slate-600'}`}>
                  {selectedLine.profile}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Prazo: {newTerm} meses</label>
              <input type="range" min="1" max="84" step="1" value={newTerm}
                onChange={e => setNewTerm(Number(e.target.value))}
                className="w-full accent-[#065f46]"/>
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>1 mês</span><span>84 meses</span>
              </div>
            </div>

            <button onClick={saveSimulation} disabled={saved}
              className="w-full py-3 bg-[#065f46] text-white rounded-xl font-bold hover:bg-[#047857] transition-colors disabled:opacity-60">
              {saved ? '✅ Salvo!' : 'Salvar simulação'}
            </button>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <div className="bg-[#065f46] rounded-2xl p-5 text-white">
              <div className="text-sm font-semibold opacity-80 mb-4">Resultado da simulação</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs opacity-70 mb-1">Valor simulado</div>
                  <div className="text-2xl font-black">{fmt(effectiveAmount)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70 mb-1">Parcela mensal</div>
                  <div className="text-2xl font-black">{fmt(parcela)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70 mb-1">Taxa mensal</div>
                  <div className="text-lg font-bold">{rates.monthly}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70 mb-1">Taxa anual</div>
                  <div className="text-lg font-bold">{rates.annual}</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs opacity-70 mb-1">Total a pagar</div>
                  <div className="text-lg font-bold">{fmt(parcela * newTerm)}</div>
                </div>
                <div>
                  <div className="text-xs opacity-70 mb-1">Custo total</div>
                  <div className="text-lg font-bold text-amber-300">{fmt(parcela * newTerm - effectiveAmount)}</div>
                </div>
              </div>
            </div>

            {/* Linha info */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="font-semibold text-slate-800 text-sm mb-3">{selectedLine.partner}</div>
              <div className="text-xs text-slate-500 mb-3">{selectedLine.line}</div>
              <div className="space-y-2">
                {[
                  { label: 'Limite máximo', val: fmt(selectedLine.max) },
                  { label: 'Perfil', val: selectedLine.profile },
                  { label: 'Prazo padrão', val: `${selectedLine.term} meses` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs py-1.5 border-b border-slate-50">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold text-slate-700">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Comparar */}
      {tab === 'compare' && (
        <div>
          {compareSims.length < 2 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <div className="text-4xl mb-3">⚖️</div>
              <div className="font-semibold text-slate-700 mb-1">Selecione ao menos 2 simulações</div>
              <div className="text-sm text-slate-400 mb-4">Volte para "Salvas" e marque as simulações que deseja comparar.</div>
              <button onClick={() => setTab('saved')} className="text-sm font-semibold text-[#065f46] hover:underline">Voltar para salvas →</button>
            </div>
          ) : (
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${compareSims.length}, 1fr)` }}>
              {compareSims.map((sim, idx) => {
                const p = calcParcela(sim.amount, sim.rateMonthly, sim.term)
                const r = fmtRate(sim.rateMonthly)
                const total = p * sim.term
                const custo = total - sim.amount
                const isBest = compareSims.every(s => {
                  const pp = calcParcela(s.amount, s.rateMonthly, s.term)
                  return (pp * s.term - s.amount) >= custo
                })
                return (
                  <div key={sim.id} className={`bg-white rounded-2xl border-2 p-5 ${isBest && compareSims.length > 1 ? 'border-[#065f46]' : 'border-slate-100'}`}>
                    {isBest && compareSims.length > 1 && (
                      <div className="text-xs font-bold text-[#065f46] mb-3">Menor custo total ✓</div>
                    )}
                    <div className="font-bold text-slate-900 text-sm mb-1">{sim.name}</div>
                    <div className="text-xs text-slate-400 mb-4">{sim.partner}</div>
                    <div className="space-y-3">
                      {[
                        { label: 'Valor', val: fmt(sim.amount) },
                        { label: 'Taxa a.a.', val: r.annual },
                        { label: 'Prazo', val: `${sim.term}x` },
                        { label: 'Parcela', val: fmt(p) },
                        { label: 'Total', val: fmt(total) },
                        { label: 'Custo', val: fmt(custo), highlight: true },
                      ].map(item => (
                        <div key={item.label} className="flex flex-col gap-0.5">
                          <span className="text-xs text-slate-400">{item.label}</span>
                          <span className={`font-bold text-sm ${item.highlight ? (isBest && compareSims.length > 1 ? 'text-[#065f46]' : 'text-slate-800') : 'text-slate-800'}`}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
