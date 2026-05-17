'use client'

import { useState, useRef, useCallback } from 'react'

type Estado = 'idle' | 'analisando' | 'resultado' | 'erro'

type DadosCredito = {
  tipoDocumento: string
  resumo: string
  dadosIdentificacao: Record<string, string | null>
  dadosFinanceiros: Record<string, string | null>
  indicadoresCredito: {
    capacidadePagamento: string
    comprometimentoRenda: string
    pontosPositivos: string[]
    pontosAtencao: string[]
  }
  informacoesAgricolas: Record<string, string | null>
  recomendacaoAnalista: string
  justificativa: string
  documentosFaltantes: string[]
  confianca: string
}

const RECOMENDACAO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  aprovado_sem_restricao: {
    label: 'Aprovado sem restrição',
    color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/20', icon: '✅',
  },
  aprovado_com_garantia: {
    label: 'Aprovado com garantia',
    color: 'text-amber-300', bg: 'bg-amber-500/15', border: 'border-amber-500/20', icon: '🔐',
  },
  analise_adicional: {
    label: 'Análise adicional necessária',
    color: 'text-blue-300', bg: 'bg-blue-500/15', border: 'border-blue-500/20', icon: '🔍',
  },
  alto_risco: {
    label: 'Alto risco — não recomendado',
    color: 'text-red-300', bg: 'bg-red-500/15', border: 'border-red-500/20', icon: '⛔',
  },
}

function formatarCampo(val: unknown): string {
  if (!val || val === 'null') return '—'
  return String(val)
}

export default function AnalisarDocumentoCredito() {
  const [estado, setEstado] = useState<Estado>('idle')
  const [modalAberto, setModalAberto] = useState(false)
  const [dados, setDados] = useState<DadosCredito | null>(null)
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [erro, setErro] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const analisar = useCallback(async (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setErro('Formato não suportado. Use PDF, JPG, PNG ou WEBP.')
      setEstado('erro')
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      setErro('Arquivo muito grande. Máximo 15 MB.')
      setEstado('erro')
      return
    }
    setNomeArquivo(file.name)
    setEstado('analisando')
    setErro('')
    try {
      const form = new FormData()
      form.append('documento', file)
      const res = await fetch('/api/ai/analisar-documento-credito', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro na análise')
      setDados(data.dados)
      setEstado('resultado')
    } catch (e: any) {
      setErro(e.message || 'Erro ao analisar documento')
      setEstado('erro')
    }
  }, [])

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) analisar(file)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) analisar(file)
  }

  function fechar() {
    setModalAberto(false)
    setEstado('idle')
    setDados(null)
    setErro('')
    setNomeArquivo('')
  }

  const recConfig = dados ? (RECOMENDACAO_CONFIG[dados.recomendacaoAnalista] ?? RECOMENDACAO_CONFIG.analise_adicional) : null

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setModalAberto(true)}
        className="fixed z-50 w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          bottom: '1.5rem',
          right: '1.5rem',
          background: 'linear-gradient(135deg,#065f46,#047857)',
          boxShadow: '0 0 16px rgba(6,95,70,.45)',
        }}
        title="Analisar documento financeiro com IA"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      </button>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg,#0f172a 0%,#062010 100%)',
              border: '1px solid rgba(255,255,255,.1)',
              boxShadow: '0 24px 64px rgba(0,0,0,.6)',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between flex-shrink-0"
              style={{ background: 'rgba(6,95,70,.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(6,95,70,.25)' }}>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Análise de Documento de Crédito</div>
                  <div className="text-[10px] text-slate-500 font-mono">AgroRate IA · LLaMA 4 Scout Vision</div>
                </div>
              </div>
              <button onClick={fechar} className="text-slate-500 hover:text-white transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Upload */}
              {(estado === 'idle' || estado === 'erro') && (
                <>
                  <div
                    className={`rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                      dragOver ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/15 hover:border-emerald-500/50 hover:bg-white/4'
                    }`}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(6,95,70,.2)' }}>
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">Envie o documento financeiro</p>
                      <p className="text-[11px] text-slate-500 mt-1">PDF, JPG, PNG, WEBP — máx. 15 MB</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {['📊 Extrato Bancário', '📋 Declaração IR', '📜 DAP/CAF', '📑 Contrato', '🧾 Nota Fiscal'].map(t => (
                        <span key={t} className="text-[10px] px-2 py-1 rounded-full text-emerald-300"
                          style={{ background: 'rgba(6,95,70,.2)', border: '1px solid rgba(6,95,70,.3)' }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={onFileChange} />

                  {estado === 'erro' && (
                    <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-300">{erro}</p>
                    </div>
                  )}
                </>
              )}

              {/* Carregando */}
              {estado === 'analisando' && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                    <div className="absolute inset-0 rounded-full border-2 border-t-emerald-500 animate-spin" />
                    <div className="absolute inset-3 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(6,95,70,.2)' }}>
                      <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Analisando documento...</p>
                    <p className="text-[11px] text-slate-500 mt-1">{nomeArquivo}</p>
                    <p className="text-[11px] text-slate-500">IA extraindo dados para análise de crédito</p>
                  </div>
                </div>
              )}

              {/* Resultado */}
              {estado === 'resultado' && dados && recConfig && (
                <div className="space-y-4">
                  {/* Recomendação */}
                  <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${recConfig.bg} border ${recConfig.border}`}>
                    <span className="text-2xl">{recConfig.icon}</span>
                    <div>
                      <div className={`text-sm font-bold ${recConfig.color}`}>{recConfig.label}</div>
                      <div className="text-[11px] text-slate-400">{dados.tipoDocumento} · Confiança {dados.confianca}</div>
                    </div>
                  </div>

                  {/* Resumo */}
                  <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Resumo analista</div>
                    <p className="text-[12px] text-slate-300 leading-relaxed">{dados.resumo}</p>
                  </div>

                  {/* Dados financeiros */}
                  {dados.dadosFinanceiros && Object.values(dados.dadosFinanceiros).some(v => v && v !== 'null') && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Dados financeiros extraídos</div>
                      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,.08)' }}>
                        {Object.entries(dados.dadosFinanceiros).filter(([, v]) => v && v !== 'null').map(([key, val], i) => (
                          <div key={key} className="flex gap-3 px-3 py-2.5 border-b border-white/5 last:border-0"
                            style={{ background: i % 2 === 0 ? 'rgba(255,255,255,.02)' : 'transparent' }}>
                            <span className="text-[11px] text-slate-500 w-36 flex-shrink-0 mt-0.5 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-[12px] text-slate-200 font-medium">{formatarCampo(val)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Indicadores */}
                  {dados.indicadoresCredito && (
                    <div className="grid grid-cols-2 gap-3">
                      {dados.indicadoresCredito.capacidadePagamento && (
                        <div className="rounded-xl p-3" style={{ background: 'rgba(6,95,70,.1)', border: '1px solid rgba(6,95,70,.2)' }}>
                          <div className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold mb-1">Cap. Pagamento</div>
                          <p className="text-[12px] text-emerald-200 font-semibold">{dados.indicadoresCredito.capacidadePagamento}</p>
                        </div>
                      )}
                      {dados.indicadoresCredito.comprometimentoRenda && (
                        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Comprometimento</div>
                          <p className="text-[12px] text-slate-200 font-semibold">{dados.indicadoresCredito.comprometimentoRenda}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pontos positivos */}
                  {dados.indicadoresCredito?.pontosPositivos?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Pontos favoráveis</div>
                      {dados.indicadoresCredito.pontosPositivos.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-emerald-300 mb-1">
                          <span className="text-emerald-400 flex-shrink-0">✓</span>{p}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pontos de atenção */}
                  {dados.indicadoresCredito?.pontosAtencao?.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Pontos de atenção</div>
                      {dados.indicadoresCredito.pontosAtencao.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-amber-300 mb-1">
                          <span className="text-amber-400 flex-shrink-0">⚠</span>{p}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Documentos faltantes */}
                  {dados.documentosFaltantes?.length > 0 && (
                    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)' }}>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Documentos recomendados</div>
                      {dados.documentosFaltantes.map((d, i) => (
                        <div key={i} className="text-[11px] text-slate-400 flex items-center gap-2 mb-1">
                          <span className="text-slate-600">→</span>{d}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => { setEstado('idle'); setDados(null) }}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}
                  >
                    Analisar outro documento
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
