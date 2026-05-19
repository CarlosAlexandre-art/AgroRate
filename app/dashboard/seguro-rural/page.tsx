'use client'

import { useState, useMemo } from 'react'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`

const CULTURAS = [
  { id: 'soja', nome: 'Soja', producaoMedia: 65, valorSaca: 120, sacasPorHectare: 50 },
  { id: 'milho', nome: 'Milho', producaoMedia: 60, valorSaca: 75, sacasPorHectare: 140 },
  { id: 'cana', nome: 'Cana-de-Açúcar', producaoMedia: 75, valorSaca: 110, sacasPorHectare: 800 },
  { id: 'algodao', nome: 'Algodão', producaoMedia: 55, valorSaca: 720, sacasPorHectare: 8 },
  { id: 'cafe', nome: 'Café', producaoMedia: 70, valorSaca: 1200, sacasPorHectare: 5 },
  { id: 'trigo', nome: 'Trigo', producaoMedia: 50, valorSaca: 85, sacasPorHectare: 55 },
  { id: 'arroz', nome: 'Arroz', producaoMedia: 60, valorSaca: 80, sacasPorHectare: 130 },
  { id: 'feijao', nome: 'Feijão', producaoMedia: 55, valorSaca: 280, sacasPorHectare: 25 },
]

const MODALIDADES = [
  {
    id: 'proagro',
    nome: 'PROAGRO',
    descricao: 'Programa de Garantia da Atividade Agropecuária — custeio básico',
    taxaBase: 0.03,
    franquia: 0.30,
    limiteHa: 3500,
    beneficiarios: 'Agricultores familiares (DAP obrigatória)',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.1)',
  },
  {
    id: 'proagro-mais',
    nome: 'PROAGRO Mais',
    descricao: 'Extensão do PROAGRO para agricultores familiares com cobertura ampliada',
    taxaBase: 0.04,
    franquia: 0.20,
    limiteHa: 5000,
    beneficiarios: 'Agricultores familiares com DAP e CAF',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.1)',
  },
  {
    id: 'psr-basico',
    nome: 'PSR Básico',
    descricao: 'Programa de Subvenção ao Prêmio do Seguro Rural — governo subsidia parte do prêmio',
    taxaBase: 0.055,
    franquia: 0.10,
    limiteHa: 50000,
    beneficiarios: 'Todos os produtores rurais',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.1)',
  },
  {
    id: 'psr-premium',
    nome: 'PSR Multirrisco',
    descricao: 'Seguro multirrisco completo com cobertura contra seca, granizo, geada e doenças',
    taxaBase: 0.08,
    franquia: 0.05,
    limiteHa: 100000,
    beneficiarios: 'Produtores médios e grandes',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.1)',
  },
]

const RISCOS = ['Seca', 'Excesso de chuva', 'Granizo', 'Geada', 'Vendaval', 'Doença / Praga', 'Incêndio']

export default function SeguroRuralPage() {
  const [culturaId, setCulturaId] = useState('soja')
  const [modalidadeId, setModalidadeId] = useState('proagro')
  const [area, setArea] = useState(100)
  const [valorPorHa, setValorPorHa] = useState(0)
  const [subvencao, setSubvencao] = useState(0.40)

  const cultura = CULTURAS.find(c => c.id === culturaId)!
  const modalidade = MODALIDADES.find(m => m.id === modalidadeId)!

  const valorRcuperacao = useMemo(() => {
    const v = valorPorHa > 0 ? valorPorHa : cultura.sacasPorHectare * cultura.valorSaca
    return v
  }, [valorPorHa, cultura])

  const lmiTotal = valorRcuperacao * area
  const franquiaValor = lmiTotal * modalidade.franquia
  const indenizacaoMax = lmiTotal - franquiaValor
  const premioBase = lmiTotal * modalidade.taxaBase
  const premioSubvenc = premioBase * (1 - subvencao)
  const premioHa = premioSubvenc / area

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #041408 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
      }}/>
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top right, rgba(52,211,153,0.06) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pt-2">
          <div className="text-xs font-bold tracking-widest text-emerald-400/70 uppercase mb-1">Proteção da Safra</div>
          <h1 className="text-3xl font-black tracking-tight" style={{
            background: 'linear-gradient(135deg, #a7f3d0 0%, #34d399 50%, #059669 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Seguro Rural</h1>
          <p className="text-sm text-slate-400 mt-1">Simule PROAGRO e PSR — calcule cobertura, prêmio e subvenção federal</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Configuração */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configure a simulação</div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Cultura</label>
                <select value={culturaId} onChange={e => setCulturaId(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {CULTURAS.map(c => <option key={c.id} value={c.id} style={{ background: '#0f172a' }}>{c.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Área segurada: {area} ha</label>
                <input type="range" min="10" max={modalidade.limiteHa} step="10" value={area}
                  onChange={e => setArea(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#34d399' }}/>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>10 ha</span><span>{modalidade.limiteHa.toLocaleString('pt-BR')} ha</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Valor por ha (R$) <span className="text-slate-600 font-normal">— deixe 0 para calcular automaticamente</span>
                </label>
                <input type="number" min="0" step="100" value={valorPorHa} onChange={e => setValorPorHa(Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                {valorPorHa === 0 && (
                  <p className="text-xs text-slate-500 mt-1">Auto: {fmt(cultura.sacasPorHectare * cultura.valorSaca)}/ha ({cultura.sacasPorHectare} sc × {fmt(cultura.valorSaca)})</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Subvenção federal: {fmtPct(subvencao)}
                </label>
                <input type="range" min="0" max="0.70" step="0.05" value={subvencao}
                  onChange={e => setSubvencao(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#34d399' }}/>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>0% (sem subvenção)</span><span>70% (máximo PSR)</span>
                </div>
              </div>
            </div>

            {/* Riscos cobertos */}
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Riscos cobertos</div>
              <div className="flex flex-wrap gap-1.5">
                {RISCOS.map(r => (
                  <span key={r} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399' }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-3 space-y-4">
            {/* Seleção de modalidade */}
            <div className="grid grid-cols-2 gap-2">
              {MODALIDADES.map(m => (
                <button key={m.id} onClick={() => setModalidadeId(m.id)}
                  className="rounded-2xl p-3 text-left border transition-all"
                  style={{
                    background: modalidadeId === m.id ? m.bg : 'rgba(255,255,255,0.02)',
                    borderColor: modalidadeId === m.id ? `${m.color}40` : 'rgba(255,255,255,0.06)',
                    boxShadow: modalidadeId === m.id ? `0 0 20px ${m.color}15` : 'none',
                  }}>
                  <div className="font-bold text-sm mb-0.5" style={{ color: m.color }}>{m.nome}</div>
                  <div className="text-xs text-slate-500">{fmtPct(m.taxaBase)} · franquia {fmtPct(m.franquia)}</div>
                </button>
              ))}
            </div>

            {/* Resultado principal */}
            <div className="rounded-2xl p-6 border" style={{
              background: `linear-gradient(135deg, ${modalidade.bg} 0%, rgba(255,255,255,0.02) 100%)`,
              borderColor: `${modalidade.color}30`,
              boxShadow: `0 0 40px ${modalidade.color}10`,
            }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: `${modalidade.color}90` }}>
                {modalidade.nome}
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">LMI (Limite Máximo de Indenização)</div>
                  <div className="text-3xl font-black text-white">{fmt(lmiTotal)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Indenização máxima (- franquia)</div>
                  <div className="text-3xl font-black" style={{ color: modalidade.color, textShadow: `0 0 20px ${modalidade.color}50` }}>
                    {fmt(indenizacaoMax)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Prêmio total', val: fmt(premioBase), color: '#f87171' },
                  { label: `Subvenção ${fmtPct(subvencao)}`, val: fmt(premioBase - premioSubvenc), color: '#34d399' },
                  { label: 'Prêmio líquido', val: fmt(premioSubvenc), color: modalidade.color },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 text-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${item.color}20` }}>
                    <div className="text-lg font-black" style={{ color: item.color }}>{item.val}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/8 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 mb-1">Prêmio por hectare</div>
                  <div className="font-bold text-white">{fmt(premioHa)}/ha</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Franquia ({fmtPct(modalidade.franquia)})</div>
                  <div className="font-bold text-amber-400">{fmt(franquiaValor)}</div>
                </div>
              </div>
            </div>

            {/* Info modalidade */}
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="font-semibold text-white text-sm mb-2">{modalidade.nome}</div>
              <p className="text-xs text-slate-400 mb-3">{modalidade.descricao}</p>
              <div className="text-xs">
                <span className="text-slate-500">Beneficiários: </span>
                <span className="text-slate-300">{modalidade.beneficiarios}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
