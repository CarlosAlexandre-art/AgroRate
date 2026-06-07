'use client'

import { useState } from 'react'

const SERVICOS = [
  { icon: '🏡', label: 'Regularização Rural' },
  { icon: '📄', label: 'Contratos Agrícolas' },
  { icon: '🏛️', label: 'Holding Familiar' },
  { icon: '🔒', label: 'Blindagem Patrimonial' },
  { icon: '👨‍👩‍👧', label: 'Planejamento Sucessório' },
  { icon: '💳', label: 'Recuperação de Crédito' },
  { icon: '🏢', label: 'Consultoria Empresarial Rural' },
  { icon: '📋', label: 'Análise Documental' },
]

const OBJETIVOS = [
  'Regularização de imóvel rural',
  'Contratos com prestadores',
  'Proteção patrimonial',
  'Planejamento sucessório',
  'Holding familiar',
  'Recuperação de crédito rural',
  'Outro',
]

export default function OryonLegalPage() {
  const [etapa, setEtapa] = useState<'landing' | 'formulario' | 'enviado'>('landing')
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', cidade: '', estado: '', objetivo: '' })
  const [enviando, setEnviando] = useState(false)

  async function enviar() {
    setEnviando(true)
    try {
      await fetch('/api/oryon-legal/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, origem: 'AgroRate' }),
      })
      setEtapa('enviado')
    } catch {
      setEtapa('enviado')
    } finally {
      setEnviando(false)
    }
  }

  if (etapa === 'enviado') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Solicitação enviada!</h2>
        <p className="text-gray-500 max-w-sm mb-6">
          Nossa especialista jurídica entrará em contato em até 24 horas com um diagnóstico inicial gratuito.
        </p>
        <button onClick={() => setEtapa('landing')} className="px-6 py-3 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 transition">
          Voltar
        </button>
      </div>
    )
  }

  if (etapa === 'formulario') {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <button onClick={() => setEtapa('landing')} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← Voltar
        </button>
        <h2 className="text-2xl font-black text-gray-800 mb-1">Solicitar Consultoria</h2>
        <p className="text-gray-500 text-sm mb-6">Preencha os dados abaixo. Nossa especialista entrará em contato em até 24h.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nome completo</label>
            <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Seu nome"
              className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">WhatsApp</label>
            <input type="tel" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(85) 9 0000-0000"
              className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">E-mail</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="seu@email.com"
              className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cidade</label>
              <input type="text" value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} placeholder="Sua cidade"
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</label>
              <input type="text" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="UF" maxLength={2}
                className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Objetivo principal</label>
            <select value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
              className="mt-1 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
              <option value="">Selecione...</option>
              {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={enviar}
          disabled={enviando || !form.nome || !form.telefone || !form.objetivo}
          className="mt-6 w-full py-4 bg-green-700 text-white font-black rounded-xl hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {enviando ? 'Enviando...' : 'Solicitar Consultoria Gratuita'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-3">Suas informações são protegidas e usadas apenas para contato jurídico.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
          ⚖️ ORYON Legal
        </div>
        <h1 className="text-3xl font-black text-gray-800 leading-tight mb-3">
          Proteção Jurídica, Patrimonial e Empresarial para o Agro
        </h1>
        <p className="text-gray-500 text-base max-w-md mx-auto">
          Assessoria especializada integrada ao seu perfil de crédito. Regularize sua situação jurídica e aumente sua capacidade de acesso a financiamentos.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <p className="text-sm text-amber-800">
          <strong>Sabia que</strong> produtores com documentação regularizada têm até 3x mais facilidade na aprovação de crédito rural?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {SERVICOS.map(s => (
          <div key={s.label} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm font-semibold text-gray-700">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-8">
        <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Como funciona</div>
        <div className="space-y-2 text-sm text-green-800">
          <div className="flex items-start gap-2"><span>🔍</span><span>Analisamos seu perfil de crédito e identificamos pendências jurídicas que podem estar bloqueando seu acesso</span></div>
          <div className="flex items-start gap-2"><span>📋</span><span>Você recebe um diagnóstico inicial gratuito</span></div>
          <div className="flex items-start gap-2"><span>👩‍⚖️</span><span>Nossa especialista entra em contato com um plano de ação personalizado</span></div>
        </div>
      </div>

      <button
        onClick={() => setEtapa('formulario')}
        className="w-full py-4 bg-green-700 text-white font-black text-lg rounded-2xl hover:bg-green-800 transition shadow-lg"
      >
        Solicitar Consultoria Gratuita
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">Sem compromisso. Diagnóstico inicial 100% gratuito.</p>
    </div>
  )
}
