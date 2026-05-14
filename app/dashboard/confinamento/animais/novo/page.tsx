'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

type Lote = { id: string; nome: string }

function NovoAnimalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const loteIdParam = searchParams.get('loteId') || ''
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [lotes, setLotes] = useState<Lote[]>([])
  const [form, setForm] = useState({
    loteId: loteIdParam,
    sisbovNumero: '',
    brincoNumero: '',
    nome: '',
    especie: 'BOVINO',
    raca: '',
    sexo: 'MACHO',
    dataNascimento: '',
    pesoEntrada: '',
    origemFazenda: '',
    origemUF: '',
  })

  useEffect(() => {
    fetch('/api/confinamento/lotes')
      .then(r => r.json())
      .then(d => setLotes(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function salvar() {
    if (!form.sexo) { setErro('Sexo é obrigatório'); return }
    setSaving(true)
    setErro('')
    try {
      const res = await fetch('/api/confinamento/animais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro'); return }
      router.push(`/dashboard/confinamento/animais/${data.id}`)
    } catch {
      setErro('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/confinamento/animais" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
        <h1 className="text-xl font-bold text-slate-800">Cadastrar Animal</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Identificação</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nº SISBOV</label>
            <input value={form.sisbovNumero} onChange={e => set('sisbovNumero', e.target.value)}
              placeholder="15 dígitos"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nº Brinco</label>
            <input value={form.brincoNumero} onChange={e => set('brincoNumero', e.target.value)}
              placeholder="Identificação do brinco"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Nome/Apelido</label>
          <input value={form.nome} onChange={e => set('nome', e.target.value)}
            placeholder="Opcional"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
        </div>

        <div className="grid grid-cols-3 gap-3">
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
              placeholder="Ex: Nelore"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Sexo *</label>
            <select value={form.sexo} onChange={e => set('sexo', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="MACHO">Macho</option>
              <option value="FEMEA">Fêmea</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Data de Nascimento</label>
            <input type="date" value={form.dataNascimento} onChange={e => set('dataNascimento', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Peso de Entrada (kg)</label>
            <input type="number" step="0.1" value={form.pesoEntrada} onChange={e => set('pesoEntrada', e.target.value)}
              placeholder="Ex: 320"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Origem & Lote</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Fazenda de Origem</label>
            <input value={form.origemFazenda} onChange={e => set('origemFazenda', e.target.value)}
              placeholder="Nome da fazenda"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">UF de Origem</label>
            <input value={form.origemUF} onChange={e => set('origemUF', e.target.value)}
              placeholder="Ex: MT"
              maxLength={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Associar a Lote</label>
          <select value={form.loteId} onChange={e => set('loteId', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="">Sem lote</option>
            {lotes.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

      <div className="flex gap-3">
        <Link href="/dashboard/confinamento/animais"
          className="flex-1 text-center border border-slate-200 rounded-xl py-3 text-sm text-slate-600 hover:bg-slate-50 font-medium">
          Cancelar
        </Link>
        <button onClick={salvar} disabled={saving}
          className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Cadastrar Animal'}
        </button>
      </div>
    </div>
  )
}

export default function NovoAnimalPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-slate-400">Carregando...</div>}>
      <NovoAnimalContent />
    </Suspense>
  )
}
