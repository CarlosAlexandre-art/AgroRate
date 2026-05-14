'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

type Dashboard = {
  loteId: string
  nome: string
  objetivo: string
  status: string
  especie: string
  raca?: string
  diasConfinado: number
  cabecasEntrada: number
  cabecasAtuais: number
  mortalidadeTotal: number
  mortalidadeRate: number
  pesoMedioEntrada: number
  pesoAtual: number
  ganhoTotal: number
  gmd: number
  metaGMD: number
  atingindoMeta: boolean
  eficienciaAlimentar: number
  custoEntrada: number
  custoArroba: number
  margemEstimada: number
  previsaoAbate?: string
  scoreLote: number
  tendenciaGMD: { data: string; peso: number; ganho: number }[]
  totalRegistrosDiarios: number
}

const OBJ_LABEL: Record<string, string> = {
  ABATE: 'Abate', LEITE: 'Leite', REPRODUCAO: 'Reprodução', RECRIA: 'Recria'
}

function KPI({ label, valor, sub, cor }: { label: string; valor: string; sub?: string; cor?: string }) {
  return (
    <div className={`rounded-xl border p-3 ${cor || 'bg-slate-50 border-slate-100'}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-800">{valor}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function LoteDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/confinamento/lotes/${id}/dashboard`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Lote não encontrado</p>
        <Link href="/dashboard/confinamento" className="text-emerald-600 text-sm hover:underline mt-2 block">← Voltar</Link>
      </div>
    )
  }

  const previsaoFormatada = data.previsaoAbate
    ? new Date(data.previsaoAbate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sem dados suficientes'

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/confinamento" className="text-slate-400 hover:text-slate-600 text-sm">← Confinamento</Link>
          </div>
          <h1 className="text-xl font-bold text-slate-800">{data.nome}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 flex-wrap">
            <span>{data.especie}{data.raca ? ` · ${data.raca}` : ''}</span>
            <span>·</span>
            <span>{OBJ_LABEL[data.objetivo]}</span>
            <span>·</span>
            <span>{data.diasConfinado} dias confinado</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/dashboard/confinamento/lotes/${id}/diario`}
            className="text-sm bg-emerald-600 text-white rounded-lg px-3 py-2 hover:bg-emerald-700 font-medium">
            + Lançar Diário
          </Link>
        </div>
      </div>

      {/* Score */}
      <div className={`rounded-xl border p-4 flex items-center gap-4 ${data.scoreLote >= 70 ? 'bg-emerald-50 border-emerald-200' : data.scoreLote >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
        <div className="text-4xl font-black text-slate-800">{data.scoreLote}<span className="text-lg font-normal text-slate-400">/100</span></div>
        <div>
          <div className="font-semibold text-slate-800">Score do Lote</div>
          <div className="text-sm text-slate-600">
            {data.atingindoMeta
              ? '✅ Atingindo a meta de GMD'
              : `⚠️ GMD abaixo da meta (${data.gmd.toFixed(2)} / ${data.metaGMD} kg/dia)`}
          </div>
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Cabeças" valor={`${data.cabecasAtuais}`} sub={`Entrada: ${data.cabecasEntrada} | Mortes: ${data.mortalidadeTotal}`} />
        <KPI label="Peso Médio Atual" valor={`${data.pesoAtual.toFixed(1)} kg`} sub={`+${data.ganhoTotal.toFixed(1)} kg desde entrada`}
          cor={data.ganhoTotal > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'} />
        <KPI label="GMD" valor={`${data.gmd.toFixed(3)} kg/dia`} sub={`Meta: ${data.metaGMD} kg/dia`}
          cor={data.atingindoMeta ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} />
        <KPI label="Efic. Alimentar" valor={data.eficienciaAlimentar.toFixed(3)} sub="kg ganho / kg ração" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPI label="Custo/Arroba" valor={`R$ ${data.custoArroba.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          cor={data.custoArroba > 0 ? 'bg-slate-50 border-slate-100' : 'bg-slate-50 border-slate-100'} />
        <KPI label="Margem Estimada" valor={`R$ ${(data.margemEstimada / 1000).toFixed(0)}k`}
          cor={data.margemEstimada >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-red-50 border-red-100'} />
        <KPI label="Previsão de Abate" valor={previsaoFormatada} cor="bg-blue-50 border-blue-100" />
      </div>

      {/* Gráfico tendência de peso */}
      {data.tendenciaGMD.length >= 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h2 className="font-semibold text-slate-700 mb-3">Evolução de Peso</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.tendenciaGMD}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="data" tickFormatter={v => new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                formatter={(v: number) => [`${v.toFixed(1)} kg`, 'Peso médio']}
                labelFormatter={v => new Date(v).toLocaleDateString('pt-BR')}
              />
              <Line type="monotone" dataKey="peso" stroke="#059669" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alertas */}
      <div className="space-y-2">
        {data.mortalidadeRate > 3 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <span>🚨</span>
            <span>Taxa de mortalidade acima de 3% ({data.mortalidadeRate.toFixed(1)}%). Verifique sanidade do lote.</span>
          </div>
        )}
        {!data.atingindoMeta && data.gmd > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
            <span>⚠️</span>
            <span>GMD abaixo da meta. Revise dieta, saúde animal e densidade do lote.</span>
          </div>
        )}
        {data.totalRegistrosDiarios === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
            <span>📋</span>
            <span>Nenhum registro diário ainda. <Link href={`/dashboard/confinamento/lotes/${id}/diario`} className="underline font-medium">Lançar primeiro registro</Link></span>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/dashboard/confinamento/animais?loteId=${id}`}
          className="border border-slate-200 rounded-xl p-3 text-center text-sm text-slate-700 hover:bg-slate-50">
          Ver Animais do Lote
        </Link>
        <Link href={`/dashboard/confinamento/lotes/${id}/diario`}
          className="border border-emerald-200 bg-emerald-50 rounded-xl p-3 text-center text-sm text-emerald-700 hover:bg-emerald-100 font-medium">
          Lançar Registro Diário
        </Link>
      </div>
    </div>
  )
}
