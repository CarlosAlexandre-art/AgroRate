'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Animal = {
  id: string
  sisbovNumero?: string | null
  brincoNumero?: string | null
  nome?: string | null
  especie: string
  raca?: string | null
  sexo: string
  pesoEntrada: number
  pesoAtual: number
  ativo: boolean
  lote?: { id: string; nome: string; objetivo: string } | null
  createdAt: string
}

const ESP_ICON: Record<string, string> = {
  BOVINO: '🐄', OVINO: '🐑', CAPRINO: '🐐', SUINO: '🐷', AVE: '🐔', OUTRO: '🐾'
}

function AnimaisContent() {
  const searchParams = useSearchParams()
  const loteId = searchParams.get('loteId')
  const [animais, setAnimais] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = loteId
      ? `/api/confinamento/animais?loteId=${loteId}`
      : '/api/confinamento/animais'
    fetch(url)
      .then(r => r.json())
      .then(d => { setAnimais(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [loteId])

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/confinamento" className="text-slate-400 hover:text-slate-600 text-sm">← Confinamento</Link>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Animais</h1>
          {loteId && <p className="text-sm text-slate-500 mt-0.5">Filtrado por lote</p>}
        </div>
        <Link href="/dashboard/confinamento/animais/novo"
          className="text-sm bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 font-medium">
          + Cadastrar Animal
        </Link>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!loading && animais.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
          <div className="text-4xl mb-3">🐄</div>
          <p className="font-medium text-slate-700">Nenhum animal cadastrado</p>
          <p className="text-sm text-slate-500 mt-1 mb-4">Cadastre animais individualmente para o Passaporte Digital</p>
          <Link href="/dashboard/confinamento/animais/novo"
            className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700">
            Cadastrar Animal
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {animais.map(animal => (
          <Link key={animal.id} href={`/dashboard/confinamento/animais/${animal.id}`}
            className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-emerald-300 hover:shadow-sm transition-all">
            <span className="text-2xl">{ESP_ICON[animal.especie] || '🐾'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-800 text-sm">
                {animal.nome || animal.brincoNumero || animal.sisbovNumero || `Animal #${animal.id.slice(-6)}`}
              </div>
              <div className="flex gap-3 text-xs text-slate-500 mt-0.5 flex-wrap">
                {animal.raca && <span>{animal.raca}</span>}
                <span>{animal.sexo === 'MACHO' ? '♂ Macho' : '♀ Fêmea'}</span>
                <span>{animal.pesoAtual.toFixed(0)} kg</span>
                {animal.sisbovNumero && <span className="text-blue-600">SISBOV: {animal.sisbovNumero}</span>}
                {animal.lote && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">{animal.lote.nome}</span>}
              </div>
            </div>
            <span className="text-slate-300 text-sm">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function AnimaisPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Carregando...</div>}>
      <AnimaisContent />
    </Suspense>
  )
}
