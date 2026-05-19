'use client'

import { useState, useMemo } from 'react'

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`

function calcParcela(principal: number, taxa: number, prazo: number) {
  if (prazo <= 0 || principal <= 0) return 0
  if (taxa === 0) return principal / prazo
  return (principal * taxa * Math.pow(1 + taxa, prazo)) / (Math.pow(1 + taxa, prazo) - 1)
}

type Estrategia = {
  id: string
  nome: string
  descricao: string
  color: string
  taxaDesconto: number
  prazoExtra: number
  carencia?: number
}

const ESTRATEGIAS: Estrategia[] = [
  { id: 'pronamp-prorrogacao', nome: 'Prorrogação de Vencimento', descricao: 'Extensão do prazo sem redução da dívida. Mantém o valor principal e estende parcelas.', color: '#60a5fa', taxaDesconto: 0, prazoExtra: 24, carencia: 6 },
  { id: 'refis-agro', nome: 'REFIS Agro (Repactuação)', descricao: 'Repactuação por crise comprovada (seca, geada, inundação). Juro reduzido a 0% por 2 anos.', color: '#34d399', taxaDesconto: 0.02, prazoExtra: 36, carencia: 12 },
  { id: 'renegociacao-banco', nome: 'Renegociação Direta com Banco', descricao: 'Negociação da taxa e prazo diretamente com o banco. Desconto de multa e juros moratórios.', color: '#a78bfa', taxaDesconto: 0.30, prazoExtra: 12, carencia: 3 },
  { id: 'cpr-liquidacao', nome: 'Liquidação via CPR', descricao: 'Liquidação em produto (sacas de soja, milho) ao invés de dinheiro. Elimina exposição cambial.', color: '#fbbf24', taxaDesconto: 0.15, prazoExtra: 0, carencia: 0 },
]

export default function RenegociacaoPage() {
  const [saldoDevedor, setSaldoDevedor] = useState(180000)
  const [taxaAtual, setTaxaAtual] = useState(1.5)
  const [parcelasRestantes, setParcelasRestantes] = useState(18)
  const [estrategiaId, setEstrategiaId] = useState('refis-agro')
  const [motivoRenegociacao, setMotivoRenegociacao] = useState('seca')

  const estrategia = ESTRATEGIAS.find(e => e.id === estrategiaId)!
  const taxaAtualMensal = taxaAtual / 100

  const cenarioAtual = useMemo(() => {
    const p = calcParcela(saldoDevedor, taxaAtualMensal, parcelasRestantes)
    return { parcela: p, total: p * parcelasRestantes, custo: p * parcelasRestantes - saldoDevedor }
  }, [saldoDevedor, taxaAtualMensal, parcelasRestantes])

  const cenarioRenegociado = useMemo(() => {
    const saldoComDesconto = saldoDevedor * (1 - estrategia.taxaDesconto)
    const novaTaxa = Math.max(0, taxaAtualMensal - 0.005)
    const novoPrazo = parcelasRestantes + estrategia.prazoExtra
    const carenciaValor = estrategia.carencia ? saldoComDesconto * novaTaxa * estrategia.carencia : 0
    const p = calcParcela(saldoComDesconto + carenciaValor, novaTaxa, novoPrazo)
    return {
      parcela: p,
      total: p * novoPrazo,
      custo: p * novoPrazo - saldoComDesconto,
      saldoComDesconto,
      novaTaxa,
      novoPrazo,
      economia: cenarioAtual.total - p * novoPrazo,
      descontoDivida: saldoDevedor * estrategia.taxaDesconto,
    }
  }, [saldoDevedor, taxaAtualMensal, parcelasRestantes, estrategia, cenarioAtual])

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #0c0a04 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(251,191,36,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.03) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(251,191,36,0.06) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pt-2">
          <div className="text-xs font-bold tracking-widest text-amber-400/70 uppercase mb-1">Gestão de Passivo</div>
          <h1 className="text-3xl font-black tracking-tight" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #d97706 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Simulador de Renegociação</h1>
          <p className="text-sm text-slate-400 mt-1">Compare cenários de renegociação — prorrogação, REFIS Agro e repactuação</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl p-5 border space-y-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dados da Dívida Atual</div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Saldo devedor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                  <input type="number" min="1000" step="1000" value={saldoDevedor} onChange={e => setSaldoDevedor(Number(e.target.value))}
                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-white focus:outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Taxa atual a.m. (%)</label>
                <input type="number" min="0" max="5" step="0.1" value={taxaAtual} onChange={e => setTaxaAtual(Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Parcelas restantes: <span className="text-white">{parcelasRestantes}</span>
                </label>
                <input type="range" min="1" max="120" value={parcelasRestantes} onChange={e => setParcelasRestantes(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#fbbf24' }}/>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>1</span><span>120 meses</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Motivo</label>
                <select value={motivoRenegociacao} onChange={e => setMotivoRenegociacao(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {[
                    { id: 'seca', label: 'Seca / Estiagem prolongada' },
                    { id: 'geada', label: 'Geada / Granizo' },
                    { id: 'praga', label: 'Praga / Doença na lavoura' },
                    { id: 'preco', label: 'Queda no preço da commodity' },
                    { id: 'outro', label: 'Outro / Dificuldade financeira' },
                  ].map(m => <option key={m.id} value={m.id} style={{ background: '#0f172a' }}>{m.label}</option>)}
                </select>
              </div>
            </div>

            {/* Estratégias */}
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Estratégia de Renegociação</div>
              <div className="space-y-2">
                {ESTRATEGIAS.map(e => (
                  <button key={e.id} onClick={() => setEstrategiaId(e.id)}
                    className="w-full text-left p-3 rounded-xl border transition-all"
                    style={{
                      background: estrategiaId === e.id ? `${e.color}12` : 'rgba(255,255,255,0.03)',
                      borderColor: estrategiaId === e.id ? `${e.color}35` : 'rgba(255,255,255,0.06)',
                    }}>
                    <div className="font-bold text-sm" style={{ color: e.color }}>{e.nome}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{e.descricao}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-3 space-y-4">
            {/* Comparativo */}
            <div className="grid grid-cols-2 gap-4">
              {/* Cenário atual */}
              <div className="rounded-2xl p-5 border" style={{ background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.2)' }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(248,113,113,0.7)' }}>Situação Atual</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Parcela mensal</div>
                    <div className="text-2xl font-black text-white">{fmt(cenarioAtual.parcela)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Total a pagar</div>
                    <div className="text-lg font-bold text-white">{fmt(cenarioAtual.total)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Custo financeiro</div>
                    <div className="text-lg font-bold" style={{ color: '#f87171' }}>{fmt(cenarioAtual.custo)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Prazo restante</div>
                    <div className="text-sm font-bold text-slate-300">{parcelasRestantes} meses</div>
                  </div>
                </div>
              </div>

              {/* Cenário renegociado */}
              <div className="rounded-2xl p-5 border" style={{
                background: `${estrategia.color}0a`,
                borderColor: `${estrategia.color}30`,
                boxShadow: `0 0 30px ${estrategia.color}08`,
              }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: `${estrategia.color}90` }}>{estrategia.nome}</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Nova parcela</div>
                    <div className="text-2xl font-black" style={{ color: estrategia.color }}>{fmt(cenarioRenegociado.parcela)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Total a pagar</div>
                    <div className="text-lg font-bold text-white">{fmt(cenarioRenegociado.total)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Novo prazo</div>
                    <div className="text-sm font-bold text-slate-300">{cenarioRenegociado.novoPrazo} meses</div>
                  </div>
                  {estrategia.carencia > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">Carência</div>
                      <div className="text-sm font-bold text-slate-300">{estrategia.carencia} meses</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Economia */}
            <div className="rounded-2xl p-5 border" style={{
              background: cenarioRenegociado.economia > 0 ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
              borderColor: cenarioRenegociado.economia > 0 ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)',
            }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Economia total', val: fmt(Math.abs(cenarioRenegociado.economia)), color: cenarioRenegociado.economia > 0 ? '#34d399' : '#f87171', prefix: cenarioRenegociado.economia > 0 ? '−' : '+' },
                  { label: 'Alívio na parcela', val: fmt(Math.abs(cenarioAtual.parcela - cenarioRenegociado.parcela)), color: cenarioAtual.parcela > cenarioRenegociado.parcela ? '#34d399' : '#f87171', prefix: cenarioAtual.parcela > cenarioRenegociado.parcela ? '−' : '+' },
                  { label: 'Desconto na dívida', val: fmt(cenarioRenegociado.descontoDivida), color: '#fbbf24', prefix: '−' },
                  { label: 'Meses extras', val: estrategia.prazoExtra.toString(), color: '#a78bfa', prefix: '+' },
                ].map(item => (
                  <div key={item.label} className="text-center">
                    <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                    <div className="text-xl font-black" style={{ color: item.color }}>{item.prefix}{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info estratégia */}
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="font-semibold text-white text-sm mb-2">{estrategia.nome}</div>
              <p className="text-xs text-slate-400 mb-3">{estrategia.descricao}</p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { label: 'Desconto na dívida', val: fmtPct(estrategia.taxaDesconto) },
                  { label: 'Prazo extra', val: `${estrategia.prazoExtra} meses` },
                  { label: 'Carência', val: estrategia.carencia ? `${estrategia.carencia} meses` : 'Sem carência' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-slate-500 mb-0.5">{item.label}</div>
                    <div className="font-bold text-white">{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dica */}
            <div className="rounded-2xl p-4 border" style={{ background: 'rgba(52,211,153,0.04)', borderColor: 'rgba(52,211,153,0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Recomendação</span>
              </div>
              <p className="text-xs text-slate-400">
                {motivoRenegociacao === 'seca' || motivoRenegociacao === 'geada'
                  ? 'Em caso de evento climático comprovado (seca, geada, granizo), o PROAGRO ou REFIS Agro são as melhores opções — garanta a documentação do sinistro com a seguradora e a prefeitura.'
                  : motivoRenegociacao === 'preco'
                  ? 'Para queda de preço de commodities, a Prorrogação de Vencimento é geralmente mais viável — o banco exige nota fiscal de venda da safra como comprovante.'
                  : 'Procure seu gerente agrícola com a documentação: balanço dos últimos 2 anos, nota fiscal da safra e comprovante do evento que causou a dificuldade.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
