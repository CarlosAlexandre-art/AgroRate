'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Msg = { role: 'user' | 'ai'; text: string; ts: string }
type ScoreData = {
  score: number; category: string
  productionScore: number; efficiencyScore: number
  behaviorScore: number; operationalScore: number
  totalRevenue: number; marginRate: number
}

const CHIPS = [
  'Como posso aumentar meu score?',
  'Qual crédito está disponível para mim agora?',
  'Como melhorar minha eficiência?',
  'O que é o score de comportamento?',
  'Qual parceiro tem as melhores taxas?',
  'Quanto crédito posso conseguir?',
]

export default function IAPage() {
  const [scoreData, setScoreData] = useState<ScoreData | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingScore, setLoadingScore] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoadingScore(false); return }
      const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
      if (res.ok) { const j = await res.json(); setScoreData(j) }
      setLoadingScore(false)
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  async function send(question: string) {
    if (!question.trim() || loading) return
    const ts = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setMsgs(m => [...m, { role: 'user', text: question, ts }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/credito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scoreData, question }),
      })
      const json = await res.json()
      const aiTs = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      if (!res.ok || !json.resposta) {
        setMsgs(m => [...m, { role: 'ai', text: 'Não consegui gerar uma resposta agora. Tente novamente em instantes.', ts: aiTs }])
      } else {
        setMsgs(m => [...m, { role: 'ai', text: json.resposta, ts: aiTs }])
      }
    } catch {
      const aiTs = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      setMsgs(m => [...m, { role: 'ai', text: 'Erro de conexão. Verifique sua internet e tente novamente.', ts: aiTs }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">

      {/* Context bar */}
      {scoreData && (
        <div className="bg-violet-50 border-b border-violet-100 px-5 py-2.5 flex items-center gap-4 text-xs flex-shrink-0">
          <span className="text-violet-600 font-semibold">🌾 IA conectada ao seu perfil:</span>
          <span className="text-violet-700 font-bold">Score {scoreData.score}</span>
          <span className="text-violet-500">·</span>
          <span className="text-violet-600">Produção {scoreData.productionScore}</span>
          <span className="text-violet-500">·</span>
          <span className="text-violet-600">Eficiência {scoreData.efficiencyScore}</span>
          <span className="text-violet-500">·</span>
          <span className="text-violet-600">Comportamento {scoreData.behaviorScore}</span>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Mensagem de boas-vindas */}
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-3xl mb-4">🌾</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Conselheiro AgroRate</h2>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
              {loadingScore
                ? 'Carregando seu perfil...'
                : scoreData
                  ? `Olá! Estou analisando seu score de ${scoreData.score} pontos. Pergunte qualquer coisa sobre crédito rural, seu score ou como melhorá-lo.`
                  : 'Configure sua fazenda no AgroOS para que eu possa analisar seu perfil com dados reais.'}
            </p>
            {!loadingScore && scoreData && (
              <div className="grid grid-cols-2 gap-2 max-w-md w-full">
                {CHIPS.slice(0, 4).map(chip => (
                  <button key={chip} onClick={() => send(chip)}
                    className="text-xs text-left px-3 py-2.5 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all text-slate-600">
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mensagens */}
        {msgs.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
              msg.role === 'ai' ? 'bg-violet-100 text-violet-600' : 'bg-[#065f46] text-white text-xs font-bold'
            }`}>
              {msg.role === 'ai' ? '🌾' : 'Eu'}
            </div>
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#065f46] text-white rounded-tr-sm'
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br/>}</span>
                ))}
              </div>
              {msg.ts && <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.ts}</span>}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-sm flex-shrink-0">🌾</div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-300 animate-bounce" style={{ animationDelay: '0ms' }}/>
                <div className="w-2 h-2 rounded-full bg-violet-300 animate-bounce" style={{ animationDelay: '150ms' }}/>
                <div className="w-2 h-2 rounded-full bg-violet-300 animate-bounce" style={{ animationDelay: '300ms' }}/>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Chips de sugestão (quando há mensagens) */}
      {msgs.length > 0 && !loading && (
        <div className="px-5 py-2 flex gap-2 overflow-x-auto flex-shrink-0 border-t border-slate-50">
          {CHIPS.map(chip => (
            <button key={chip} onClick={() => send(chip)}
              className="text-xs whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-violet-300 hover:text-violet-700 transition-all text-slate-500 flex-shrink-0">
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0">
        <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pergunte sobre seu score, crédito ou sua fazenda..."
            disabled={loading || loadingScore}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all disabled:opacity-50 placeholder:text-slate-300"
          />
          <button type="submit" disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-slate-300 text-center mt-2">Alimentado por LLaMA 3.3 70B · Groq · Respostas podem conter erros</p>
      </div>
    </div>
  )
}
