'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

type DocStatus = 'valido' | 'vencendo' | 'vencido' | 'pendente'
type DocCategory = 'propriedade' | 'fiscal' | 'ambiental' | 'credito'

interface Document {
  id: string
  name: string
  category: DocCategory
  status: DocStatus
  expiry?: string
  uploadedAt?: string
  file?: string
  required: boolean
  scoreImpact: number
}

const STATUS_META: Record<DocStatus, { label: string; bg: string; text: string; icon: string }> = {
  valido:    { label: 'Válido',       bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✅' },
  vencendo:  { label: 'Vencendo',     bg: 'bg-amber-50',   text: 'text-amber-700',   icon: '⚠️' },
  vencido:   { label: 'Vencido',      bg: 'bg-red-50',     text: 'text-red-700',     icon: '❌' },
  pendente:  { label: 'Pendente',     bg: 'bg-slate-100',  text: 'text-slate-500',   icon: '📎' },
}

const CAT_META: Record<DocCategory, { label: string; icon: string }> = {
  propriedade: { label: 'Propriedade', icon: '🏡' },
  fiscal:      { label: 'Fiscal',      icon: '📋' },
  ambiental:   { label: 'Ambiental',   icon: '🌿' },
  credito:     { label: 'Crédito',     icon: '💳' },
}

const DOCS: Document[] = [
  { id: '1', name: 'CCIR – Certificado de Cadastro de Imóvel Rural', category: 'propriedade', status: 'valido',   expiry: '2026-12-31', uploadedAt: '2025-01-15', required: true,  scoreImpact: 80 },
  { id: '2', name: 'ITR – Imposto Territorial Rural',                category: 'fiscal',      status: 'vencendo', expiry: '2026-05-03', uploadedAt: '2025-05-01', required: true,  scoreImpact: 60 },
  { id: '3', name: 'DAP/CAF – Declaração Aptidão Pronaf',           category: 'credito',     status: 'valido',   expiry: '2027-03-20', uploadedAt: '2025-03-20', required: false, scoreImpact: 120 },
  { id: '4', name: 'CAR – Cadastro Ambiental Rural',                 category: 'ambiental',   status: 'vencido',  expiry: '2025-12-31', uploadedAt: '2024-01-10', required: true,  scoreImpact: 90 },
  { id: '5', name: 'Contrato de Arrendamento',                       category: 'propriedade', status: 'pendente', required: false, scoreImpact: 40 },
  { id: '6', name: 'Certidão Negativa de Débitos Federais',         category: 'fiscal',      status: 'pendente', required: false, scoreImpact: 50 },
  { id: '7', name: 'Licença Ambiental',                             category: 'ambiental',   status: 'pendente', required: false, scoreImpact: 30 },
  { id: '8', name: 'Contrato Social (PJ) / CPF (PF)',               category: 'credito',     status: 'valido',   expiry: '2030-01-01', uploadedAt: '2025-01-01', required: true,  scoreImpact: 70 },
]

export default function DocumentosPage() {
  const [docs, setDocs] = useState<Document[]>(DOCS)
  const [filterCat, setFilterCat] = useState<DocCategory | 'todos'>('todos')
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'todos'>('todos')
  const [dragging, setDragging] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [targetDocId, setTargetDocId] = useState<string | null>(null)

  const totalImpact = docs.filter(d => d.status === 'valido').reduce((s, d) => s + d.scoreImpact, 0)
  const maxImpact = docs.reduce((s, d) => s + d.scoreImpact, 0)

  const visible = docs.filter(d => {
    const catOk = filterCat === 'todos' || d.category === filterCat
    const statusOk = filterStatus === 'todos' || d.status === filterStatus
    return catOk && statusOk
  })

  function handleUploadClick(docId: string) {
    setTargetDocId(docId)
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !targetDocId) return
    setUploading(targetDocId)
    setTimeout(() => {
      setDocs(prev => prev.map(d =>
        d.id === targetDocId
          ? { ...d, status: 'valido', uploadedAt: new Date().toISOString().split('T')[0], file: file.name }
          : d
      ))
      setUploading(null)
      setUploaded(targetDocId)
      setTimeout(() => setUploaded(null), 3000)
    }, 1500)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent, docId: string) {
    e.preventDefault()
    setDragging(null)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    setUploading(docId)
    setTimeout(() => {
      setDocs(prev => prev.map(d =>
        d.id === docId
          ? { ...d, status: 'valido', uploadedAt: new Date().toISOString().split('T')[0], file: file.name }
          : d
      ))
      setUploading(null)
      setUploaded(docId)
      setTimeout(() => setUploaded(null), 3000)
    }, 1500)
  }

  const pendingRequired = docs.filter(d => d.required && d.status !== 'valido').length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange}/>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-slate-500 text-sm">Certidões e documentos que compõem seu perfil de crédito</p>
        </div>
      </div>

      {/* Alerta documentos obrigatórios */}
      {pendingRequired > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <div className="font-semibold text-amber-800 text-sm mb-1">{pendingRequired} documento{pendingRequired > 1 ? 's' : ''} obrigatório{pendingRequired > 1 ? 's' : ''} pendente{pendingRequired > 1 ? 's' : ''}</div>
            <div className="text-amber-700 text-xs leading-relaxed">
              Documentos obrigatórios impactam diretamente seu score operacional. Faça o upload para desbloquear seu potencial de crédito completo.
            </div>
          </div>
        </div>
      )}

      {/* Score Impact Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-slate-800 text-sm">Impacto documental no score</span>
          <span className="text-sm font-bold text-[#065f46]">{totalImpact} / {maxImpact} pts potenciais</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#065f46] to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${(totalImpact / maxImpact) * 100}%` }}/>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-400">{((totalImpact / maxImpact) * 100).toFixed(0)}% aproveitado</span>
          <span className="text-xs text-[#065f46] font-semibold">+{maxImpact - totalImpact} pts disponíveis</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('todos')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterCat === 'todos' ? 'bg-[#065f46] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#065f46]/30'}`}>
          Todos
        </button>
        {(Object.keys(CAT_META) as DocCategory[]).map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterCat === c ? 'bg-[#065f46] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#065f46]/30'}`}>
            {CAT_META[c].icon} {CAT_META[c].label}
          </button>
        ))}
        <div className="h-8 w-px bg-slate-200 self-center mx-1"/>
        {(Object.keys(STATUS_META) as DocStatus[]).map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'todos' : s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${filterStatus === s ? 'bg-slate-800 text-white border-slate-800' : `${STATUS_META[s].bg} ${STATUS_META[s].text} border-transparent`}`}>
            {STATUS_META[s].icon} {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Documentos */}
      <div className="space-y-3">
        {visible.map(doc => {
          const meta = STATUS_META[doc.status]
          const cat = CAT_META[doc.category]
          const isUploading = uploading === doc.id
          const isUploaded = uploaded === doc.id
          return (
            <div key={doc.id}
              onDragOver={e => { e.preventDefault(); setDragging(doc.id) }}
              onDragLeave={() => setDragging(null)}
              onDrop={e => handleDrop(e, doc.id)}
              className={`bg-white rounded-2xl border-2 p-5 transition-all ${dragging === doc.id ? 'border-[#065f46] bg-emerald-50' : 'border-slate-100'}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-semibold text-slate-900 text-sm">{doc.name}</span>
                      {doc.required && (
                        <span className="ml-2 text-[10px] font-bold text-red-500 uppercase tracking-wider">Obrigatório</span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${meta.bg} ${meta.text}`}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                    <span>{cat.label}</span>
                    {doc.expiry && <span>Vence: {new Date(doc.expiry).toLocaleDateString('pt-BR')}</span>}
                    {doc.uploadedAt && <span>Enviado: {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</span>}
                    <span className="font-semibold text-[#065f46]">+{doc.scoreImpact} pts no score</span>
                  </div>

                  {isUploaded ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                      Documento enviado com sucesso!
                    </div>
                  ) : isUploading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="w-4 h-4 border-2 border-[#065f46] border-t-transparent rounded-full animate-spin"/>
                      Enviando...
                    </div>
                  ) : doc.status === 'pendente' ? (
                    <button onClick={() => handleUploadClick(doc.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-[#065f46] border border-[#065f46]/30 rounded-xl px-3 py-2 hover:bg-emerald-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                      Enviar documento · PDF, JPG, PNG
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button onClick={() => handleUploadClick(doc.id)}
                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
                        Atualizar
                      </button>
                      {doc.status === 'vencido' && (
                        <span className="text-xs text-red-600 font-semibold">Renovação necessária</span>
                      )}
                      {doc.status === 'vencendo' && (
                        <span className="text-xs text-amber-600 font-semibold">Renove em breve</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {dragging === doc.id && (
                <div className="mt-3 border-2 border-dashed border-[#065f46] rounded-xl p-4 text-center text-sm text-[#065f46] font-semibold">
                  Solte o arquivo aqui para enviar
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dica */}
      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div>
          <div className="font-semibold text-blue-800 text-sm mb-1">Dica de score</div>
          <p className="text-blue-700 text-xs leading-relaxed">
            Manter todos os documentos válidos pode adicionar até <strong>{maxImpact} pontos</strong> ao seu score operacional — a dimensão com maior peso em análises de crédito rural. Documentos vencidos reduzem sua pontuação automaticamente.
          </p>
        </div>
      </div>
    </div>
  )
}
