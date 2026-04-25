'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type DocCategory = 'propriedade' | 'fiscal' | 'ambiental' | 'credito'

interface DocTemplate {
  name: string
  category: DocCategory
  required: boolean
  scoreImpact: number
}

interface PropertyDocument {
  id: string
  name: string
  category: string
  fileUrl: string
  fileName: string
  expiry: string | null
  scoreImpact: number
  required: boolean
  createdAt: string
}

const CAT_META: Record<DocCategory, { label: string; icon: string }> = {
  propriedade: { label: 'Propriedade', icon: '🏡' },
  fiscal:      { label: 'Fiscal',      icon: '📋' },
  ambiental:   { label: 'Ambiental',   icon: '🌿' },
  credito:     { label: 'Crédito',     icon: '💳' },
}

// Documentos padrão que o produtor deve ter
const TEMPLATES: DocTemplate[] = [
  { name: 'CCIR – Certificado de Cadastro de Imóvel Rural', category: 'propriedade', required: true,  scoreImpact: 80 },
  { name: 'ITR – Imposto Territorial Rural',                category: 'fiscal',      required: true,  scoreImpact: 60 },
  { name: 'DAP/CAF – Declaração Aptidão Pronaf',           category: 'credito',     required: false, scoreImpact: 120 },
  { name: 'CAR – Cadastro Ambiental Rural',                 category: 'ambiental',   required: true,  scoreImpact: 90 },
  { name: 'Contrato de Arrendamento',                       category: 'propriedade', required: false, scoreImpact: 40 },
  { name: 'Certidão Negativa de Débitos Federais',         category: 'fiscal',      required: false, scoreImpact: 50 },
  { name: 'Licença Ambiental',                             category: 'ambiental',   required: false, scoreImpact: 30 },
  { name: 'Contrato Social (PJ) / CPF (PF)',               category: 'credito',     required: true,  scoreImpact: 70 },
]

const MAX_IMPACT = TEMPLATES.reduce((s, t) => s + t.scoreImpact, 0)

function docStatus(doc: PropertyDocument | null): 'valido' | 'vencendo' | 'vencido' | 'pendente' {
  if (!doc) return 'pendente'
  if (!doc.expiry) return 'valido'
  const exp = new Date(doc.expiry)
  const now = new Date()
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff < 0) return 'vencido'
  if (diff < 30) return 'vencendo'
  return 'valido'
}

const STATUS_META = {
  valido:   { label: 'Válido',    bg: 'bg-emerald-50', text: 'text-emerald-700', icon: '✅' },
  vencendo: { label: 'Vencendo',  bg: 'bg-amber-50',   text: 'text-amber-700',   icon: '⚠️' },
  vencido:  { label: 'Vencido',   bg: 'bg-red-50',     text: 'text-red-700',     icon: '❌' },
  pendente: { label: 'Pendente',  bg: 'bg-slate-100',  text: 'text-slate-500',   icon: '📎' },
}

export default function DocumentosPage() {
  const [docs, setDocs] = useState<PropertyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState<DocCategory | 'todos'>('todos')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'valido' | 'vencendo' | 'vencido' | 'pendente'>('todos')
  const [uploading, setUploading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expiryModal, setExpiryModal] = useState<{ templateName: string } | null>(null)
  const [expiryValue, setExpiryValue] = useState('')
  const [pendingFile, setPendingFile] = useState<{ file: File; templateName: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const activeTemplate = useRef<DocTemplate | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/documentos')
      if (res.ok) setDocs(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Map template name → uploaded doc
  function getDoc(templateName: string) {
    return docs.find(d => d.name === templateName) ?? null
  }

  function handleUploadClick(template: DocTemplate) {
    activeTemplate.current = template
    fileRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeTemplate.current) return
    const tpl = activeTemplate.current
    e.target.value = ''
    // Ask for expiry date for relevant docs
    const needsExpiry = tpl.category !== 'credito' || tpl.name.includes('ITR') || tpl.name.includes('CAR')
    if (needsExpiry) {
      setPendingFile({ file, templateName: tpl.name })
      setExpiryValue('')
      setExpiryModal({ templateName: tpl.name })
    } else {
      uploadFile(file, tpl, null)
    }
  }

  async function uploadFile(file: File, tpl: DocTemplate, expiry: string | null) {
    setUploading(tpl.name)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('name', tpl.name)
      fd.append('category', tpl.category)
      fd.append('scoreImpact', String(tpl.scoreImpact))
      fd.append('required', String(tpl.required))
      if (expiry) fd.append('expiry', expiry)

      const existing = getDoc(tpl.name)
      if (existing) {
        await fetch(`/api/documentos/${existing.id}`, { method: 'PATCH', body: fd })
      } else {
        await fetch('/api/documentos', { method: 'POST', body: fd })
      }
      await load()
    } finally {
      setUploading(null)
    }
  }

  async function handleDelete(doc: PropertyDocument) {
    setDeleting(doc.id)
    try {
      await fetch(`/api/documentos/${doc.id}`, { method: 'DELETE' })
      setDocs(prev => prev.filter(d => d.id !== doc.id))
    } finally {
      setDeleting(null)
    }
  }

  function confirmExpiry() {
    if (!pendingFile || !activeTemplate.current) return
    setExpiryModal(null)
    uploadFile(pendingFile.file, activeTemplate.current, expiryValue || null)
    setPendingFile(null)
  }

  const totalImpact = TEMPLATES.reduce((s, tpl) => {
    const doc = getDoc(tpl.name)
    const st = docStatus(doc)
    return st === 'valido' ? s + tpl.scoreImpact : s
  }, 0)

  const pendingRequired = TEMPLATES.filter(t => t.required && docStatus(getDoc(t.name)) !== 'valido').length

  const visible = TEMPLATES.filter(tpl => {
    const catOk = filterCat === 'todos' || tpl.category === filterCat
    const st = docStatus(getDoc(tpl.name))
    const statusOk = filterStatus === 'todos' || st === filterStatus
    return catOk && statusOk
  })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />

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

      {pendingRequired > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">⚠️</span>
          <div>
            <div className="font-semibold text-amber-800 text-sm mb-1">
              {pendingRequired} documento{pendingRequired > 1 ? 's' : ''} obrigatório{pendingRequired > 1 ? 's' : ''} pendente{pendingRequired > 1 ? 's' : ''}
            </div>
            <div className="text-amber-700 text-xs leading-relaxed">
              Documentos obrigatórios impactam diretamente seu score operacional. Faça o upload para desbloquear seu potencial de crédito completo.
            </div>
          </div>
        </div>
      )}

      {/* Score Impact */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-slate-800 text-sm">Impacto documental no score</span>
          <span className="text-sm font-bold text-[#065f46]">{totalImpact} / {MAX_IMPACT} pts potenciais</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#065f46] to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${(totalImpact / MAX_IMPACT) * 100}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs text-slate-400">{((totalImpact / MAX_IMPACT) * 100).toFixed(0)}% aproveitado</span>
          <span className="text-xs text-[#065f46] font-semibold">+{MAX_IMPACT - totalImpact} pts disponíveis</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat('todos')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterCat === 'todos' ? 'bg-[#065f46] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#065f46]/30'}`}>
          Todos
        </button>
        {(Object.keys(CAT_META) as DocCategory[]).map(c => (
          <button key={c} onClick={() => setFilterCat(filterCat === c ? 'todos' : c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${filterCat === c ? 'bg-[#065f46] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#065f46]/30'}`}>
            {CAT_META[c].icon} {CAT_META[c].label}
          </button>
        ))}
        <div className="h-8 w-px bg-slate-200 self-center mx-1" />
        {(['valido', 'vencendo', 'vencido', 'pendente'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(filterStatus === s ? 'todos' : s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${filterStatus === s ? 'bg-slate-800 text-white border-slate-800' : `${STATUS_META[s].bg} ${STATUS_META[s].text} border-transparent`}`}>
            {STATUS_META[s].icon} {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading && (
          <div className="text-center text-slate-400 py-12 text-sm">Carregando documentos...</div>
        )}
        {!loading && visible.map(tpl => {
          const doc = getDoc(tpl.name)
          const st = docStatus(doc)
          const meta = STATUS_META[st]
          const cat = CAT_META[tpl.category]
          const isUploading = uploading === tpl.name
          const isDeleting = doc && deleting === doc.id
          return (
            <div key={tpl.name} className="bg-white rounded-2xl border-2 border-slate-100 p-5 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <span className="font-semibold text-slate-900 text-sm">{tpl.name}</span>
                      {tpl.required && (
                        <span className="ml-2 text-[10px] font-bold text-red-500 uppercase tracking-wider">Obrigatório</span>
                      )}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${meta.bg} ${meta.text}`}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                    <span>{cat.label}</span>
                    {doc?.expiry && <span>Vence: {new Date(doc.expiry).toLocaleDateString('pt-BR')}</span>}
                    {doc?.createdAt && <span>Enviado: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>}
                    {doc?.fileName && <span className="text-slate-300">· {doc.fileName}</span>}
                    <span className="font-semibold text-[#065f46]">+{tpl.scoreImpact} pts</span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {isUploading || isDeleting ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <div className="w-4 h-4 border-2 border-[#065f46] border-t-transparent rounded-full animate-spin" />
                        {isUploading ? 'Enviando...' : 'Removendo...'}
                      </div>
                    ) : st === 'pendente' ? (
                      <button onClick={() => handleUploadClick(tpl)}
                        className="flex items-center gap-2 text-xs font-semibold text-[#065f46] border border-[#065f46]/30 rounded-xl px-3 py-2 hover:bg-emerald-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Enviar documento · PDF, JPG, PNG
                      </button>
                    ) : (
                      <>
                        {doc && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-slate-500 hover:text-[#065f46] transition-colors underline underline-offset-2">
                            Visualizar
                          </a>
                        )}
                        <button onClick={() => handleUploadClick(tpl)}
                          className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
                          Atualizar
                        </button>
                        {doc && (
                          <button onClick={() => handleDelete(doc)}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors">
                            Remover
                          </button>
                        )}
                        {st === 'vencido' && <span className="text-xs text-red-600 font-semibold">Renovação necessária</span>}
                        {st === 'vencendo' && <span className="text-xs text-amber-600 font-semibold">Renove em breve</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Dica */}
      {!loading && (
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <div className="font-semibold text-blue-800 text-sm mb-1">Dica de score</div>
            <p className="text-blue-700 text-xs leading-relaxed">
              Manter todos os documentos válidos pode adicionar até <strong>{MAX_IMPACT} pontos</strong> ao seu score operacional. Documentos vencidos reduzem sua pontuação automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Modal de validade */}
      {expiryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-slate-900 mb-1">Data de vencimento</h3>
            <p className="text-xs text-slate-500 mb-4">Informe a validade de <strong>{expiryModal.templateName}</strong> (deixe em branco se não tiver prazo).</p>
            <input
              type="date"
              value={expiryValue}
              onChange={e => setExpiryValue(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46] mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setExpiryModal(null); setPendingFile(null) }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmExpiry}
                className="flex-1 py-2.5 bg-[#065f46] text-white rounded-xl text-sm font-bold hover:bg-[#047857] transition-colors">
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
