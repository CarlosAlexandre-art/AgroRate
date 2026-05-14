'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Passaporte = {
  id: string
  sisbovNumero?: string | null
  brincoNumero?: string | null
  nome?: string | null
  especie: string
  raca?: string | null
  sexo: string
  dataNascimento?: string | null
  pesoEntrada: number
  pesoAtual: number
  origemFazenda?: string | null
  origemUF?: string | null
  propriedade: string
  proprietario: string
  saudes: { tipo: string; descricao: string; produto?: string | null; data: string }[]
  movimentos: { tipo: string; origem?: string | null; destino?: string | null; pesoNaData?: number | null; data: string }[]
  lote?: { nome: string; objetivo: string; dataEntrada: string } | null
  geradoEm: string
}

const TIPO_SAUDE_ICON: Record<string, string> = {
  VACINA: '💉', MEDICACAO: '💊', EXAME: '🔬', CIRURGIA: '🏥', OBSERVACAO: '📝'
}
const TIPO_MOV_ICON: Record<string, string> = {
  ENTRADA: '✅', SAIDA: '🚛', TRANSFERENCIA: '🔄', ABATE: '🔴', VENDA: '💰'
}
const OBJ_LABEL: Record<string, string> = {
  ABATE: 'Abate', LEITE: 'Leite', REPRODUCAO: 'Reprodução', RECRIA: 'Recria'
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function AnimalPassaportePage() {
  const { id } = useParams<{ id: string }>()
  const [passaporte, setPassaporte] = useState<Passaporte | null>(null)
  const [qrUrl, setQrUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState<'passaporte' | 'saude' | 'movimentos'>('passaporte')
  const [adicionandoSaude, setAdicionandoSaude] = useState(false)
  const [formSaude, setFormSaude] = useState({ tipo: 'VACINA', descricao: '', produto: '', dose: '', data: new Date().toISOString().slice(0, 10) })
  const [savingSaude, setSavingSaude] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/confinamento/animais/${id}/passaporte`).then(r => r.json()),
    ]).then(([p]) => {
      setPassaporte(p)
      setQrUrl(`/api/confinamento/animais/${id}/qrcode`)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  async function salvarSaude() {
    if (!formSaude.descricao) return
    setSavingSaude(true)
    try {
      await fetch(`/api/confinamento/animais/${id}/saude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formSaude),
      })
      const p = await fetch(`/api/confinamento/animais/${id}/passaporte`).then(r => r.json())
      setPassaporte(p)
      setAdicionandoSaude(false)
      setFormSaude({ tipo: 'VACINA', descricao: '', produto: '', dose: '', data: new Date().toISOString().slice(0, 10) })
    } finally {
      setSavingSaude(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  if (!passaporte) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Animal não encontrado</p>
        <Link href="/dashboard/confinamento/animais" className="text-emerald-600 text-sm hover:underline mt-2 block">← Voltar</Link>
      </div>
    )
  }

  const idadeAnos = passaporte.dataNascimento
    ? Math.floor((Date.now() - new Date(passaporte.dataNascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/confinamento/animais" className="text-slate-400 hover:text-slate-600 text-sm">← Animais</Link>
        <h1 className="text-xl font-bold text-slate-800">Passaporte Digital Animal</h1>
      </div>

      {/* Card principal do passaporte */}
      <div className="bg-gradient-to-br from-emerald-700 to-teal-800 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-white/20 rounded px-2 py-0.5 font-mono">PASSAPORTE</span>
              {passaporte.sisbovNumero && (
                <span className="text-xs bg-white/20 rounded px-2 py-0.5">SISBOV</span>
              )}
            </div>
            <h2 className="text-xl font-bold">
              {passaporte.nome || passaporte.brincoNumero || passaporte.sisbovNumero || `Animal #${passaporte.id.slice(-8)}`}
            </h2>
            <p className="text-emerald-200 text-sm mt-0.5">
              {passaporte.especie}{passaporte.raca ? ` · ${passaporte.raca}` : ''} · {passaporte.sexo === 'MACHO' ? '♂ Macho' : '♀ Fêmea'}
              {idadeAnos != null ? ` · ${idadeAnos} ano${idadeAnos !== 1 ? 's' : ''}` : ''}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-emerald-100">
              {passaporte.sisbovNumero && <span>SISBOV: {passaporte.sisbovNumero}</span>}
              {passaporte.brincoNumero && <span>Brinco: {passaporte.brincoNumero}</span>}
              <span>Entrada: {passaporte.pesoEntrada} kg</span>
              <span>Atual: {passaporte.pesoAtual} kg</span>
              {passaporte.origemFazenda && <span>Origem: {passaporte.origemFazenda}{passaporte.origemUF ? `/${passaporte.origemUF}` : ''}</span>}
              {passaporte.lote && <span>Lote: {passaporte.lote.nome}</span>}
            </div>
          </div>

          {/* QR Code */}
          {qrUrl && (
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR Code do animal" className="w-20 h-20 rounded-lg bg-white p-1" />
              <a href={qrUrl} download={`qr-${passaporte.sisbovNumero || passaporte.id}.png`}
                className="block text-center text-xs text-emerald-300 mt-1 hover:text-white">
                Baixar QR
              </a>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-white/20 text-xs text-emerald-200 flex justify-between">
          <span>Propriedade: {passaporte.propriedade}</span>
          <span>Gerado: {fmt(passaporte.geradoEm)}</span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {([
          { key: 'passaporte', label: 'Dados' },
          { key: 'saude', label: `Saúde (${passaporte.saudes.length})` },
          { key: 'movimentos', label: `Movimentos (${passaporte.movimentos.length})` },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setAba(tab.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${aba === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Aba Dados */}
      {aba === 'passaporte' && (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {[
            { label: 'Espécie', valor: passaporte.especie },
            { label: 'Raça', valor: passaporte.raca || '—' },
            { label: 'Sexo', valor: passaporte.sexo === 'MACHO' ? '♂ Macho' : '♀ Fêmea' },
            { label: 'Nascimento', valor: passaporte.dataNascimento ? fmt(passaporte.dataNascimento) : '—' },
            { label: 'Peso de Entrada', valor: `${passaporte.pesoEntrada} kg` },
            { label: 'Peso Atual', valor: `${passaporte.pesoAtual} kg` },
            { label: 'Ganho de Peso', valor: `+${(passaporte.pesoAtual - passaporte.pesoEntrada).toFixed(1)} kg` },
            { label: 'Fazenda Origem', valor: passaporte.origemFazenda || '—' },
            { label: 'UF Origem', valor: passaporte.origemUF || '—' },
            { label: 'Propriedade Atual', valor: passaporte.propriedade },
            { label: 'Proprietário', valor: passaporte.proprietario },
            { label: 'Lote', valor: passaporte.lote ? `${passaporte.lote.nome} (${OBJ_LABEL[passaporte.lote.objetivo]})` : '—' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-500">{row.label}</span>
              <span className="font-medium text-slate-800">{row.valor}</span>
            </div>
          ))}
        </div>
      )}

      {/* Aba Saúde */}
      {aba === 'saude' && (
        <div className="space-y-3">
          <button onClick={() => setAdicionandoSaude(v => !v)}
            className="w-full border border-dashed border-emerald-300 rounded-xl py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium">
            + Adicionar Registro de Saúde
          </button>

          {adicionandoSaude && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Tipo</label>
                  <select value={formSaude.tipo} onChange={e => setFormSaude(f => ({ ...f, tipo: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                    <option value="VACINA">Vacina</option>
                    <option value="MEDICACAO">Medicação</option>
                    <option value="EXAME">Exame</option>
                    <option value="CIRURGIA">Cirurgia</option>
                    <option value="OBSERVACAO">Observação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Data</label>
                  <input type="date" value={formSaude.data} onChange={e => setFormSaude(f => ({ ...f, data: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <input value={formSaude.descricao} onChange={e => setFormSaude(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Descrição *" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input value={formSaude.produto} onChange={e => setFormSaude(f => ({ ...f, produto: e.target.value }))}
                  placeholder="Produto/Vacina" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                <input value={formSaude.dose} onChange={e => setFormSaude(f => ({ ...f, dose: e.target.value }))}
                  placeholder="Dosagem" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAdicionandoSaude(false)}
                  className="flex-1 border border-slate-200 rounded-lg py-2 text-sm text-slate-600">Cancelar</button>
                <button onClick={salvarSaude} disabled={savingSaude}
                  className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
                  {savingSaude ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}

          {passaporte.saudes.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Nenhum registro sanitário ainda</p>
          ) : (
            <div className="space-y-2">
              {passaporte.saudes.map((s, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3">
                  <span className="text-lg">{TIPO_SAUDE_ICON[s.tipo] || '📝'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{s.descricao}</span>
                      <span className="text-xs text-slate-400">{fmt(s.data)}</span>
                    </div>
                    {s.produto && <p className="text-xs text-slate-500 mt-0.5">{s.produto}</p>}
                    <span className="text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 mt-1 inline-block">{s.tipo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba Movimentos */}
      {aba === 'movimentos' && (
        <div className="space-y-2">
          {passaporte.movimentos.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">Nenhuma movimentação registrada</p>
          ) : (
            passaporte.movimentos.map((m, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-lg">{TIPO_MOV_ICON[m.tipo] || '🔄'}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800">{m.tipo}</span>
                    <span className="text-xs text-slate-400">{fmt(m.data)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 space-x-2">
                    {m.origem && <span>De: {m.origem}</span>}
                    {m.destino && <span>Para: {m.destino}</span>}
                    {m.pesoNaData != null && <span>Peso: {m.pesoNaData} kg</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
