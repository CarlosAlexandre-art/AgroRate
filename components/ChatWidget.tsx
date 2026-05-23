'use client'

import { useState, useRef, useEffect } from 'react'

const WA = 'https://wa.me/5585986027333?text=Ol%C3%A1%2C+vim+pelo+AgroRate+e+gostaria+de+mais+informa%C3%A7%C3%B5es%21'

const LINKS: Record<string, string> = {
  'Acessar SmartAgroOS': 'https://agroos.site',
  'Acessar AgroCore': 'https://agrocore.live',
  'Falar com especialista': WA,
}

const WELCOME_CHIPS = ['Como funciona o score?', 'É gratuito?', 'Como melhorar meu score?', 'Integração com SmartAgroOS', 'Falar com especialista']

type Msg = { role: 'user' | 'bot'; text: string }

function parseReply(raw: string) {
  const m = raw.match(/CHIPS:\s*(.+)$/m)
  const chips = m ? m[1].split('|').map(s => s.trim()).filter(Boolean) : ['Falar com especialista']
  const text = raw.replace(/CHIPS:.*$/m, '').trim()
  return { text, chips }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [chips, setChips] = useState<string[]>(WELCOME_CHIPS)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [badge, setBadge] = useState(false)
  const history = useRef<{ role: string; content: string }[]>([])
  const msgsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setMsgs([{ role: 'bot', text: 'Olá! 👋 Sou o assistente do <strong>AgroRate</strong>. Como posso ajudar com seu crédito rural?' }])
    }, 300)
    const t2 = setTimeout(() => setBadge(true), 9000)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs, loading])

  function handleOpen() {
    setOpen(o => !o)
    setBadge(false)
  }

  async function askAI(userMsg: string) {
    history.current.push({ role: 'user', content: userMsg })
    setLoading(true)
    setChips([])
    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.current.slice(-10) }),
      })
      const d = await r.json()
      const raw = d.ok && d.text ? d.text : 'Tive um problema técnico. Tente novamente! 😊\nCHIPS: Falar com especialista'
      const reply = parseReply(raw)
      history.current.push({ role: 'assistant', content: raw })
      setMsgs(prev => [...prev, { role: 'bot', text: reply.text }])
      setChips(reply.chips)
    } catch {
      setMsgs(prev => [...prev, { role: 'bot', text: 'Sem conexão agora. Fale pelo WhatsApp! 📱' }])
      setChips(['Falar com especialista'])
    }
    setLoading(false)
  }

  function handleChip(label: string) {
    if (LINKS[label]) { window.open(LINKS[label], '_blank'); return }
    setMsgs(prev => [...prev, { role: 'user', text: label }])
    askAI(label)
  }

  function handleSend() {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMsgs(prev => [...prev, { role: 'user', text: msg }])
    askAI(msg)
  }

  return (
    <>
      {/* Chat window */}
      <div className={`fixed bottom-[calc(1.75rem+66px)] right-7 z-[8500] w-[340px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ maxHeight: 530 }}>
        {/* Header */}
        <div className="bg-gradient-to-br from-[#065f46] to-[#047857] px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-none">AgroRate Assistente</p>
            <p className="text-emerald-200 text-xs mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse inline-block" />
              online agora
            </p>
          </div>
          <a href={WA} target="_blank" rel="noreferrer"
            className="bg-[#25d366] text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-[#1da851] transition-colors flex-shrink-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12c0 2.73 1.09 5.2 2.86 7L3 22l3.94-1.06C8.55 21.63 10.23 22 12 22z"/></svg>
            WhatsApp
          </a>
        </div>

        {/* Messages */}
        <div ref={msgsRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[160px] max-h-[270px]">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[90%] px-3 py-2 rounded-xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#065f46] text-white self-end rounded-br-sm font-medium' : 'bg-emerald-50 text-slate-800 self-start rounded-bl-sm border border-emerald-100'}`}
              dangerouslySetInnerHTML={{ __html: m.text }} />
          ))}
          {loading && (
            <div className="max-w-[90%] px-3 py-2 rounded-xl text-sm bg-emerald-50 self-start border border-emerald-100 rounded-bl-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-[#065f46] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#065f46] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#065f46] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          )}
        </div>

        {/* Quick chips */}
        {chips.length > 0 && (
          <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-slate-100 flex-shrink-0">
            {chips.map(c => (
              <button key={c} onClick={() => handleChip(c)}
                className="px-2.5 py-1 border border-[#065f46]/25 text-[#065f46] rounded-full text-xs hover:bg-emerald-50 hover:border-[#065f46]/50 transition-all whitespace-nowrap">
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2 p-2.5 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua dúvida..."
            maxLength={200}
            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#065f46]/30 focus:border-[#065f46]/40 transition-all min-w-0 placeholder:text-slate-300"
          />
          <button onClick={handleSend} disabled={loading}
            className="w-8 h-8 bg-[#065f46] rounded-lg flex items-center justify-center flex-shrink-0 hover:bg-[#047857] disabled:opacity-50 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22 11 13M11 13L2 9l20-7" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* FAB */}
      <button onClick={handleOpen} title="Chat AgroRate"
        className="fixed bottom-7 right-7 z-[8600] w-14 h-14 rounded-full bg-gradient-to-br from-[#065f46] to-[#047857] border-none shadow-lg shadow-emerald-900/40 flex items-center justify-center hover:scale-105 hover:shadow-emerald-900/60 transition-all relative">
        <svg className={`absolute transition-all duration-200 ${open ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 22C17.52 22 22 17.52 22 12S17.52 2 12 2 2 6.48 2 12c0 2.73 1.09 5.2 2.86 7L3 22l3.94-1.06C8.55 21.63 10.23 22 12 22z" fill="rgba(255,255,255,.2)" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="8.5" cy="12" r="1.2" fill="white"/><circle cx="12" cy="12" r="1.2" fill="white"/><circle cx="15.5" cy="12" r="1.2" fill="white"/>
        </svg>
        <svg className={`absolute transition-all duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M14 4L4 14M4 4l10 10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        {badge && !open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold">1</span>
        )}
      </button>
    </>
  )
}
