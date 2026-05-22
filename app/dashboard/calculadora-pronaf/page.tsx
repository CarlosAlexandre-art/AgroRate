'use client'

import { useState, useMemo } from 'react'

interface Linha {
  id: string
  banco: string
  linha: string
  perfil: string
  taxa: number
  prazoMax: number
  limiteMax: number
  requisito: string
  descricao: string
}

const LINHAS: Linha[] = [
  { id: 'pronaf-a', banco: 'Banco do Brasil / Sicredi', linha: 'PRONAF A', perfil: 'Pronaf', taxa: 0.005, prazoMax: 120, limiteMax: 55000, requisito: 'DAP / CAF obrigatório', descricao: 'Para produtores recém-assentados ou que acessam o PRONAF pela primeira vez.' },
  { id: 'pronaf-a-c', banco: 'Banco do Brasil', linha: 'PRONAF A/C', perfil: 'Pronaf', taxa: 0.0025, prazoMax: 24, limiteMax: 5000, requisito: 'DAP ativa', descricao: 'Custeio para beneficiários do PRONAF A.' },
  { id: 'pronaf-b', banco: 'BNB – Agroamigo', linha: 'PRONAF B (Microcrédito)', perfil: 'Pronaf', taxa: 0.005, prazoMax: 24, limiteMax: 6000, requisito: 'DAP / CAF obrigatório', descricao: 'Microcrédito produtivo para os mais baixos da agricultura familiar.' },
  { id: 'pronaf-custeio-alim', banco: 'Banco do Brasil / Sicoob', linha: 'PRONAF Custeio – Alimentos', perfil: 'Pronaf', taxa: 0.0025, prazoMax: 12, limiteMax: 250000, requisito: 'DAP ativa', descricao: 'Custeio de safra de alimentos (arroz, feijão, mandioca, horticultura).' },
  { id: 'pronaf-custeio', banco: 'Banco do Brasil / Sicredi', linha: 'PRONAF Custeio – Demais', perfil: 'Pronaf', taxa: 0.0052, prazoMax: 12, limiteMax: 250000, requisito: 'DAP ativa', descricao: 'Custeio de demais culturas para agricultura familiar.' },
  { id: 'pronaf-mais-alimentos', banco: 'Sicoob / BB', linha: 'PRONAF Mais Alimentos', perfil: 'Pronaf', taxa: 0.0021, prazoMax: 36, limiteMax: 250000, requisito: 'DAP ativa', descricao: 'Investimento para ampliação e modernização da produção de alimentos.' },
  { id: 'pronamp-custeio', banco: 'BB / Sicredi / BNB', linha: 'PRONAMP Custeio', perfil: 'Pronamp', taxa: 0.0069, prazoMax: 12, limiteMax: 1500000, requisito: 'Renda bruta ≤ R$2,4 mi/ano', descricao: 'Custeio agrícola e pecuário para médios produtores.' },
  { id: 'pronamp-invest', banco: 'BB / Sicredi', linha: 'PRONAMP Investimento', perfil: 'Pronamp', taxa: 0.0064, prazoMax: 60, limiteMax: 2000000, requisito: 'Renda bruta ≤ R$2,4 mi/ano', descricao: 'Investimento em máquinas, equipamentos e infraestrutura.' },
  { id: 'moderinfra', banco: 'Banco do Brasil', linha: 'Moderinfra – Irrigação', perfil: 'Investimento', taxa: 0.008, prazoMax: 60, limiteMax: 3000000, requisito: 'Produtor rural PF/PJ', descricao: 'Financiamento para sistemas de irrigação e infraestrutura hídrica.' },
  { id: 'cpr-digital', banco: 'Agrolend', linha: 'CPR Digital', perfil: 'Fintech', taxa: 0.0115, prazoMax: 6, limiteMax: 500000, requisito: 'Score AgroRate min. 600', descricao: 'Cédula de Produto Rural digital com liquidação em commodities ou dinheiro.' },
]

const PERFIL_COLORS: Record<string, { bg: string; color: string }> = {
  Pronaf:      { bg: 'rgba(52,211,153,0.12)', color: '#34d399' },
  Pronamp:     { bg: 'rgba(96,165,250,0.12)', color: '#60a5fa' },
  Investimento: { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
  Fintech:     { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24' },
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`

function calcParcela(principal: number, taxa: number, prazo: number) {
  if (taxa === 0) return principal / prazo
  return (principal * taxa * Math.pow(1 + taxa, prazo)) / (Math.pow(1 + taxa, prazo) - 1)
}

export default function CalculadoraPRONAFPage() {
  const [valorDesejado, setValorDesejado] = useState(150000)
  const [prazo, setPrazo] = useState(12)
  const [linhaId, setLinhaId] = useState('pronaf-custeio-alim')
  const [filtroPerfi, setFiltroPerfi] = useState<string>('todos')

  const linha = LINHAS.find(l => l.id === linhaId) ?? LINHAS[0]
  const valorEfetivo = Math.min(valorDesejado, linha.limiteMax)
  const parcela = useMemo(() => calcParcela(valorEfetivo, linha.taxa, prazo), [valorEfetivo, linha.taxa, prazo])
  const totalPagar = parcela * prazo
  const custoTotal = totalPagar - valorEfetivo
  const taxaAnual = (Math.pow(1 + linha.taxa, 12) - 1)
  const prazoEfetivo = Math.min(prazo, linha.prazoMax)

  const linhasFiltradas = filtroPerfi === 'todos' ? LINHAS : LINHAS.filter(l => l.perfil === filtroPerfi)

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #0a0414 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(167,139,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(167,139,250,0.08) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pt-2">
          <div className="text-xs font-bold tracking-widest text-purple-400/70 uppercase mb-1">Plano Safra 2025/26</div>
          <h1 className="text-3xl font-black tracking-tight" style={{
            background: 'linear-gradient(135deg, #e9d5ff 0%, #a78bfa 50%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Calculadora PRONAF</h1>
          <p className="text-sm text-slate-400 mt-1">Simule todas as linhas do crédito rural oficial — taxas e prazos do Plano Safra vigente</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure</div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Valor desejado</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                  <input type="number" min="5000" step="5000" value={valorDesejado}
                    onChange={e => setValorDesejado(Number(e.target.value))}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
                {valorDesejado > linha.limiteMax && (
                  <p className="text-xs text-amber-400 mt-1.5">
                    Acima do limite — ajustado para {fmt(linha.limiteMax)}
                  </p>
                )}
              </div>

              {/* Linha */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Linha de crédito</label>
                <select value={linhaId} onChange={e => { setLinhaId(e.target.value); const l = LINHAS.find(x => x.id === e.target.value); if (l) setPrazo(Math.min(prazo, l.prazoMax)) }}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {LINHAS.map(l => (
                    <option key={l.id} value={l.id} style={{ background: '#0f172a' }}>
                      {l.linha} — {fmtPct(l.taxa)} a.m.
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs px-2 py-1 rounded-lg w-fit font-semibold"
                  style={PERFIL_COLORS[linha.perfil] ?? { bg: '#1e293b', color: '#94a3b8' }}>
                  {linha.perfil} · {linha.banco}
                </div>
              </div>

              {/* Prazo */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Prazo: <span className="text-white">{prazoEfetivo} meses</span>
                  {prazo > linha.prazoMax && <span className="text-amber-400 ml-1">(máx. {linha.prazoMax} meses)</span>}
                </label>
                <input type="range" min="1" max={linha.prazoMax} step="1" value={prazoEfetivo}
                  onChange={e => setPrazo(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#a78bfa' }}/>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>1 mês</span><span>{linha.prazoMax} meses</span>
                </div>
              </div>
            </div>

            {/* Requisito */}
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Requisito</div>
              <div className="text-sm text-slate-300">{linha.requisito}</div>
              <div className="text-xs text-slate-500 mt-2">{linha.descricao}</div>
            </div>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-3 space-y-4">
            {/* Card principal */}
            <div className="rounded-2xl p-6 border" style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(109,40,217,0.08) 100%)',
              borderColor: 'rgba(167,139,250,0.25)',
              boxShadow: '0 0 40px rgba(124,58,237,0.1), inset 0 0 40px rgba(124,58,237,0.03)',
            }}>
              <div className="text-xs font-bold text-purple-400/70 uppercase tracking-widest mb-4">{linha.linha}</div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Valor financiado</div>
                  <div className="text-3xl font-black text-white">{fmt(valorEfetivo)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Parcela mensal</div>
                  <div className="text-3xl font-black" style={{ color: '#a78bfa', textShadow: '0 0 20px rgba(167,139,250,0.5)' }}>
                    {fmt(parcela)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Taxa mensal', val: fmtPct(linha.taxa), color: '#34d399' },
                  { label: 'Taxa anual', val: fmtPct(taxaAnual), color: '#60a5fa' },
                  { label: 'Prazo', val: `${prazoEfetivo}x`, color: '#fbbf24' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${item.color}20` }}>
                    <div className="text-lg font-black" style={{ color: item.color }}>{item.val}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/8 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Total a pagar</div>
                  <div className="text-xl font-bold text-white">{fmt(totalPagar)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Custo do crédito</div>
                  <div className="text-xl font-bold text-amber-400">{fmt(custoTotal)}</div>
                </div>
              </div>
            </div>

            {/* Tabela comparativa */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Comparar linhas</div>
                <div className="flex flex-wrap gap-1">
                  {['todos', 'Pronaf', 'Pronamp', 'Investimento', 'Fintech'].map(p => (
                    <button key={p} onClick={() => setFiltroPerfi(p)}
                      className="text-xs px-2 py-0.5 rounded-lg font-medium transition-colors"
                      style={filtroPerfi === p
                        ? { background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }
                        : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }}>
                      {p === 'todos' ? 'Todos' : p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Linha', 'Taxa a.m.', 'Prazo', 'Limite', 'Parcela'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-slate-500 font-semibold uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhasFiltradas.map(l => {
                      const p = calcParcela(Math.min(valorEfetivo, l.limiteMax), l.taxa, Math.min(prazoEfetivo, l.prazoMax))
                      const isSelected = l.id === linhaId
                      return (
                        <tr key={l.id}
                          onClick={() => setLinhaId(l.id)}
                          className="cursor-pointer transition-colors"
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: isSelected ? 'rgba(167,139,250,0.08)' : 'transparent',
                          }}>
                          <td className="px-4 py-2.5">
                            <div className="font-semibold text-white text-xs">{l.linha}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{l.banco}</div>
                          </td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: '#34d399' }}>{fmtPct(l.taxa)}</td>
                          <td className="px-4 py-2.5 text-slate-300">{l.prazoMax}m</td>
                          <td className="px-4 py-2.5 text-slate-300">{fmt(l.limiteMax)}</td>
                          <td className="px-4 py-2.5 font-bold" style={{ color: '#a78bfa' }}>{fmt(p)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
