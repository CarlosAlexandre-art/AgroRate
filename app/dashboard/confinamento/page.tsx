'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Lote = {
  id: string
  nome: string
  especie: string
  raca?: string
  objetivo: string
  status: string
  cabecasEntrada: number
  cabecasAtuais: number
  pesoMedioEntrada: number
  pesoAtual: number
  gmd: number
  metaGMD: number
  custoArroba: number
  margemEstimada: number
  scoreLote: number
  diasConfinado?: number
  atingindoMeta?: boolean
  totalAnimais: number
  dataEntrada: string
}

const OBJ_LABEL: Record<string, string> = {
  ABATE: 'Abate', LEITE: 'Leite', REPRODUCAO: 'Reprodução', RECRIA: 'Recria'
}
const ESP_ICON: Record<string, string> = {
  BOVINO: '🐄', OVINO: '🐑', CAPRINO: '🐐', SUINO: '🐷', AVE: '🐔', OUTRO: '🐾'
}

function ScoreBadge({ score }: { score: number }) {
  const cor = score >= 80 ? 'bg-emerald-100 text-emerald-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cor}`}>{score}/100</span>
}

export default function ConfinamentoPage() {
  const [lotes, setLotes] = useState<Lote[]>([])
  const [loading, setLoading] = useState(true)
  const [iaTexto, setIaTexto] = useState('')
  const [iaLoading, setIaLoading] = useState(false)

  useEffect(() => {
    fetch('/api/confinamento/lotes')
      .then(r => r.json())
      .then(data => { setLotes(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function analisarIA() {
    setIaLoading(true)
    setIaTexto('')
    try {
      const res = await fetch('/api/ai/confinamento', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data:'))
        for (const line of lines) {
          try {
            const json = JSON.parse(line.replace('data: ', ''))
            const delta = json.choices?.[0]?.delta?.content
            if (delta) setIaTexto(p => p + delta)
          } catch { /* skip */ }
        }
      }
    } finally {
      setIaLoading(false)
    }
  }

  const lotesAtivos = lotes.filter(l => l.status === 'ATIVO')
  const totalCabecas = lotesAtivos.reduce((s, l) => s + (l.cabecasAtuais || 0), 0)
  const mediaScore = lotesAtivos.length > 0
    ? Math.round(lotesAtivos.reduce((s, l) => s + l.scoreLote, 0) / lotesAtivos.length)
    : 0
  const margemTotal = lotesAtivos.reduce((s, l) => s + (l.margemEstimada || 0), 0)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Confinamento Inteligente</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestão de lotes, GMD e análise preditiva</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/confinamento/animais" className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50">
            Animais
          </Link>
          <Link href="/dashboard/confinamento/lotes/novo" className="text-sm bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 font-medium">
            + Novo Lote
          </Link>
        </div>
      </div>

      {/* KPIs gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Lotes Ativos', valor: lotesAtivos.length, icon: '🗂️', cor: 'bg-blue-50 border-blue-100' },
          { label: 'Cabeças Totais', valor: totalCabecas.toLocaleString('pt-BR'), icon: '🐄', cor: 'bg-emerald-50 border-emerald-100' },
          { label: 'Score Médio', valor: `${mediaScore}/100`, icon: '📊', cor: mediaScore >= 70 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100' },
          { label: 'Margem Estimada', valor: `R$ ${(margemTotal / 1000).toFixed(0)}k`, icon: '💰', cor: margemTotal >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-3 ${k.cor}`}>
            <div className="text-xl mb-1">{k.icon}</div>
            <div className="text-lg font-bold text-slate-800">{k.valor}</div>
            <div className="text-xs text-slate-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de lotes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Lotes</h2>
          <Link href="/dashboard/confinamento/lotes" className="text-xs text-emerald-600 hover:underline">Ver todos</Link>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        )}

        {!loading && lotes.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
            <div className="text-4xl mb-3">🐄</div>
            <p className="font-medium text-slate-700">Nenhum lote cadastrado</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">Cadastre seu primeiro lote para começar o acompanhamento</p>
            <Link href="/dashboard/confinamento/lotes/novo" className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700">
              Cadastrar Lote
            </Link>
          </div>
        )}

        {lotes.map(lote => (
          <Link key={lote.id} href={`/dashboard/confinamento/lotes/${lote.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base">{ESP_ICON[lote.especie] || '🐾'}</span>
                  <span className="font-semibold text-slate-800 truncate">{lote.nome}</span>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{OBJ_LABEL[lote.objetivo]}</span>
                  {lote.status !== 'ATIVO' && (
                    <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{lote.status}</span>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                  <span>{lote.cabecasAtuais ?? lote.cabecasEntrada} cabeças</span>
                  {lote.gmd > 0 && (
                    <span className={lote.gmd >= lote.metaGMD ? 'text-emerald-600 font-medium' : 'text-red-500 font-medium'}>
                      GMD {lote.gmd.toFixed(2)} kg/dia {lote.gmd >= lote.metaGMD ? '✓' : '↓'}
                    </span>
                  )}
                  {lote.pesoAtual > 0 && <span>{lote.pesoAtual.toFixed(0)} kg médio</span>}
                  {lote.raca && <span>{lote.raca}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <ScoreBadge score={lote.scoreLote} />
                <span className="text-xs text-slate-400">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Análise IA */}
      {lotes.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="font-semibold text-slate-800">Análise IA dos Lotes</span>
            </div>
            <button onClick={analisarIA} disabled={iaLoading}
              className="text-xs bg-emerald-600 text-white rounded-lg px-3 py-1.5 hover:bg-emerald-700 disabled:opacity-50 font-medium">
              {iaLoading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
          {iaTexto ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{iaTexto}</p>
          ) : (
            <p className="text-sm text-slate-500">Clique em &quot;Analisar&quot; para receber insights sobre seus lotes — GMD, custos, alertas e previsões.</p>
          )}
        </div>
      )}
    </div>
  )
}
