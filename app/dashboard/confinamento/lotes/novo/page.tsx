'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NovoLotePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nome: '',
    especie: 'BOVINO',
    raca: '',
    objetivo: 'ABATE',
    dataEntrada: new Date().toISOString().slice(0, 10),
    dataPrevistaAbate: '',
    cabecasEntrada: '',
    pesoMedioEntrada: '',
    custoEntrada: '',
    metaGMD: '1.2',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function salvar() {
    if (!form.nome || !form.cabecasEntrada) {
      setErro('Nome e número de cabeças são obrigatórios')
      return
    }
    setSaving(true)
    setErro('')
    try {
      const res = await fetch('/api/confinamento/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao salvar'); return }
      router.push(`/dashboard/confinamento/lotes/${data.id}`)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/confinamento" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
        <h1 className="text-xl font-bold text-slate-800">Novo Lote</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Identificação</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nome do Lote *</label>
            <input value={form.nome} onChange={e => set('nome', e.target.value)}
              placeholder="Ex: Lote 01 — Nelore Abate"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Espécie</label>
              <select value={form.especie} onChange={e => set('especie', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
                <option value="BOVINO">Bovino</option>
                <option value="OVINO">Ovino</option>
                <option value="CAPRINO">Caprino</option>
                <option value="SUINO">Suíno</option>
                <option value="AVE">Ave</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Raça</label>
              <input value={form.raca} onChange={e => set('raca', e.target.value)}
                placeholder="Ex: Nelore, Angus..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Objetivo</label>
            <select value={form.objetivo} onChange={e => set('objetivo', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="ABATE">Abate</option>
              <option value="LEITE">Leite</option>
              <option value="REPRODUCAO">Reprodução</option>
              <option value="RECRIA">Recria</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Entrada no Confinamento</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Data de Entrada</label>
            <input type="date" value={form.dataEntrada} onChange={e => set('dataEntrada', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Previsão de Abate</label>
            <input type="date" value={form.dataPrevistaAbate} onChange={e => set('dataPrevistaAbate', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nº de Cabeças *</label>
            <input type="number" value={form.cabecasEntrada} onChange={e => set('cabecasEntrada', e.target.value)}
              placeholder="Ex: 120"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Peso Médio Entrada (kg)</label>
            <input type="number" step="0.1" value={form.pesoMedioEntrada} onChange={e => set('pesoMedioEntrada', e.target.value)}
              placeholder="Ex: 320"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Custo de Entrada (R$)</label>
            <input type="number" step="0.01" value={form.custoEntrada} onChange={e => set('custoEntrada', e.target.value)}
              placeholder="Ex: 85000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Meta GMD (kg/dia)</label>
            <input type="number" step="0.01" value={form.metaGMD} onChange={e => set('metaGMD', e.target.value)}
              placeholder="Ex: 1.2"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

      <div className="flex gap-3">
        <Link href="/dashboard/confinamento"
          className="flex-1 text-center border border-slate-200 rounded-xl py-3 text-sm text-slate-600 hover:bg-slate-50 font-medium">
          Cancelar
        </Link>
        <button onClick={salvar} disabled={saving}
          className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Criar Lote'}
        </button>
      </div>
    </div>
  )
}
