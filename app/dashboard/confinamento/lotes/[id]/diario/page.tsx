'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Diario = {
  id: string
  data: string
  pesoMedio?: number | null
  consumoRacao: number
  consumoAgua: number
  mortalidade: number
  medicacao?: string | null
  observacoes?: string | null
}

export default function DiarioPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [historico, setHistorico] = useState<Diario[]>([])
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    pesoMedio: '',
    consumoRacao: '',
    consumoAgua: '',
    mortalidade: '0',
    medicacao: '',
    observacoes: '',
  })

  useEffect(() => {
    fetch(`/api/confinamento/lotes/${id}/diario`)
      .then(r => r.json())
      .then(d => setHistorico(Array.isArray(d) ? d.slice(0, 5) : []))
      .catch(() => {})
  }, [id])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function salvar() {
    if (!form.consumoRacao) { setErro('Consumo de ração é obrigatório'); return }
    setSaving(true)
    setErro('')
    try {
      const res = await fetch(`/api/confinamento/lotes/${id}/diario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          pesoMedio: form.pesoMedio ? Number(form.pesoMedio) : null,
          consumoRacao: Number(form.consumoRacao),
          consumoAgua: Number(form.consumoAgua || 0),
          mortalidade: Number(form.mortalidade || 0),
        }),
      })
      if (!res.ok) { const d = await res.json(); setErro(d.error || 'Erro'); return }
      router.push(`/dashboard/confinamento/lotes/${id}`)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href={`/dashboard/confinamento/lotes/${id}`} className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
        <h1 className="text-xl font-bold text-slate-800">Registro Diário</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Data do Registro</label>
          <input type="date" value={form.data} onChange={e => set('data', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Peso Médio do Lote (kg)</label>
          <input type="number" step="0.1" value={form.pesoMedio} onChange={e => set('pesoMedio', e.target.value)}
            placeholder="Deixe em branco se não houve pesagem"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          <p className="text-xs text-slate-400 mt-1">Pesagem do lote — usado para calcular GMD</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Consumo de Ração (kg) *</label>
            <input type="number" step="0.1" value={form.consumoRacao} onChange={e => set('consumoRacao', e.target.value)}
              placeholder="Total do lote"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Consumo de Água (L)</label>
            <input type="number" step="0.1" value={form.consumoAgua} onChange={e => set('consumoAgua', e.target.value)}
              placeholder="Total do lote"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Mortalidade (cabeças)</label>
          <input type="number" min="0" value={form.mortalidade} onChange={e => set('mortalidade', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Medicação Aplicada</label>
          <input value={form.medicacao} onChange={e => set('medicacao', e.target.value)}
            placeholder="Ex: Ivermectina 1% — 5ml/cab"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={e => set('observacoes', e.target.value)}
            rows={2} placeholder="Comportamento, condições climáticas, outros..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none" />
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

      <button onClick={salvar} disabled={saving}
        className="w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
        {saving ? 'Salvando...' : 'Salvar Registro'}
      </button>

      {historico.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-600">Últimos Registros</h2>
          {historico.map(d => (
            <div key={d.id} className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium">{new Date(d.data).toLocaleDateString('pt-BR')}</span>
                {d.pesoMedio != null && <span>⚖️ {d.pesoMedio.toFixed(1)} kg</span>}
              </div>
              <div className="flex gap-3 mt-0.5 text-slate-400">
                <span>🌾 {d.consumoRacao} kg ração</span>
                {d.mortalidade > 0 && <span className="text-red-500">💀 {d.mortalidade}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
