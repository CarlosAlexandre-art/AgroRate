'use client'

import { useState, useEffect, useRef, CSSProperties } from 'react'

const PERGUNTAS = [
  { id: 1, pergunta: 'Sua propriedade rural possui escritura registrada em cartório?', opcoes: ['Sim, documentação completa', 'Sim, mas com pendências', 'Não possuo escritura', 'Não sei / Preciso verificar'] },
  { id: 2, pergunta: 'Sua propriedade possui CAR (Cadastro Ambiental Rural)?', opcoes: ['Sim, regularizado', 'Em andamento', 'Não possui', 'Não sei'] },
  { id: 3, pergunta: 'Você possui CCIR (Certificado de Cadastro de Imóvel Rural) atualizado?', opcoes: ['Sim, atualizado', 'Desatualizado', 'Não possuo', 'Não sei'] },
  { id: 4, pergunta: 'Você tem contratos formais com prestadores de serviço agrícola?', opcoes: ['Sim, todos formalizados', 'Alguns formalizados', 'Nenhum formalizado', 'Não contrato prestadores'] },
  { id: 5, pergunta: 'Você possui planejamento sucessório para seus bens rurais?', opcoes: ['Sim, testamento/holding', 'Em processo', 'Não possuo', 'Nunca pensei nisso'] },
  { id: 6, pergunta: 'Já teve problema com crédito rural por falta de documentação?', opcoes: ['Nunca tive problema', 'Uma vez', 'Sim, frequentemente', 'Nunca solicitei crédito'] },
  { id: 7, pergunta: 'Você possui assessoria jurídica especializada no agro?', opcoes: ['Sim, assessoria ativa', 'Uso quando necessário', 'Não possuo', 'Nunca precisei'] },
]

type Diagnostico = { score: number; nivel: string; vulnerabilidades: { tipo: string; descricao: string }[]; recomendacao: string; prioridade: string }
type Slot = { id: string; data: string; durMinutos: number; modalidade: string }
type Etapa = 'landing' | 'dados' | 'quiz' | 'analisando' | 'resultado' | 'agendar' | 'agendado'

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useInView()
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  )
}

const scoreColor = (s: number) => s < 40 ? '#ef4444' : s < 65 ? '#f59e0b' : '#22c55e'

export default function OryonLegalPage() {
  const [etapa, setEtapa] = useState<Etapa>('landing')
  const [passo, setPasso] = useState(0)
  const [respostas, setRespostas] = useState<string[]>(Array(PERGUNTAS.length).fill(''))
  const [dados, setDados] = useState({ nome: '', telefone: '', email: '', cidade: '', estado: '' })
  const [diagnostico, setDiagnostico] = useState<Diagnostico | null>(null)
  const [leadId, setLeadId] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null)
  const [modalidade, setModalidade] = useState<'ONLINE' | 'PRESENCIAL'>('ONLINE')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    if (etapa === 'agendar') {
      fetch('/api/oryon-legal/slots')
        .then(r => r.json())
        .then(data => setSlots(Array.isArray(data) ? data : []))
        .catch(() => setSlots([]))
    }
  }, [etapa])

  async function analisar() {
    setEtapa('analisando')
    try {
      const res = await fetch('/api/oryon-legal/diagnostico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respostas: PERGUNTAS.map((p, i) => ({ pergunta: p.pergunta, resposta: respostas[i] || 'Não respondeu' })),
          dadosUsuario: dados,
        }),
      })
      const data = await res.json()
      setDiagnostico(data.diagnostico)
      setLeadId(data.leadId ?? null)
      setEtapa('resultado')
    } catch {
      setDiagnostico({ score: 45, nivel: 'ALTO', vulnerabilidades: [{ tipo: '🔴', descricao: 'Pendências identificadas' }], recomendacao: 'Consultoria jurídica recomendada', prioridade: 'ALTA' })
      setEtapa('resultado')
    }
  }

  async function agendar() {
    if (!leadId) return
    try {
      const res = await fetch('/api/oryon-legal/reunioes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, slotId: slotSelecionado, modalidade }),
      })
      if (res.ok) setEtapa('agendado')
      else alert('Erro ao agendar. Tente novamente.')
    } catch { alert('Erro de conexão. Tente novamente.') }
  }

  const cor1 = '#ca8a04'
  const cor2 = '#fbbf24'
  const inputStyle: CSSProperties = { width: '100%', padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '12px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }
  const labelStyle: CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }

  // ── AGENDADO ──
  if (etapa === 'agendado') {
    const slot = slots.find(s => s.id === slotSelecionado)
    const dataHora = slot ? new Date(slot.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }) : 'Sem horário específico'
    const gcalStart = slot ? new Date(slot.data).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''
    const gcalEnd = slot ? new Date(new Date(slot.data).getTime() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''
    const gcalUrl = gcalStart ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consultoria ORYON Legal')}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent('Reunião com especialista jurídica ORYON Legal')}` : ''
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f0fdf4,#f8f9fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `linear-gradient(135deg,${cor1},${cor2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(202,138,4,0.3)' }}>📅</div>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#111827', marginBottom: '10px' }}>Reunião solicitada!</h1>
          <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>Nossa especialista recebeu sua solicitação e confirmará em breve.</p>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: '20px', textAlign: 'left' }}>
            {[{ l: 'Data solicitada', v: dataHora }, { l: 'Modalidade', v: modalidade === 'ONLINE' ? '💻 Online' : '📍 Presencial' }].map(r => (
              <div key={r.l} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>{r.l}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{r.v}</div>
              </div>
            ))}
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Próximos passos</div>
              {['A especialista analisa e confirma', 'Você recebe confirmação por e-mail', 'Na data combinada, acessam o link ou se encontram'].map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                  <span style={{ color: cor2, fontWeight: 700 }}>0{i + 1}</span><span>{t}</span>
                </div>
              ))}
            </div>
          </div>
          {gcalUrl && (
            <a href={gcalUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px', background: 'linear-gradient(135deg,#92400e,#d97706,#fbbf24)', color: 'white', fontWeight: 800, borderRadius: '14px', textDecoration: 'none', marginBottom: '10px', boxShadow: '0 4px 20px rgba(217,119,6,0.5)', textAlign: 'center' }}>
              📅 Adicionar ao Google Calendar ✨
            </a>
          )}
          <a href="/oryon-legal/minha-agenda" style={{ display: 'block', padding: '14px', background: `linear-gradient(135deg,${cor1},${cor2})`, color: 'white', fontWeight: 700, textAlign: 'center', borderRadius: '14px', textDecoration: 'none' }}>
            📅 Ver Minha Agenda
          </a>
          <button onClick={() => setEtapa('landing')} style={{ width: '100%', padding: '12px', background: 'none', color: '#9ca3af', fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer', marginTop: '4px' }}>
            ← Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  // ── AGENDAR ──
  if (etapa === 'agendar') {
    const d = diagnostico!
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ background: `linear-gradient(135deg,${cor1},${cor2})`, padding: '20px 24px' }}>
          <button onClick={() => setEtapa('resultado')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', marginBottom: '12px' }}>←</button>
          <h2 style={{ color: 'white', fontWeight: 900, fontSize: '22px', margin: 0 }}>Agendar Reunião</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '4px' }}>Score: {d.score}/100 · Prioridade: {d.prioridade}</p>
        </div>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>Como prefere a reunião?</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['ONLINE', 'PRESENCIAL'] as const).map(m => (
                <button key={m} onClick={() => setModalidade(m)} style={{ flex: 1, padding: '12px', border: `2px solid ${modalidade === m ? cor2 : '#e5e7eb'}`, borderRadius: '12px', background: modalidade === m ? '#fffbeb' : 'white', color: modalidade === m ? cor2 : '#374151', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
                  {m === 'ONLINE' ? '💻 Online' : '📍 Presencial'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>Escolha um horário disponível</div>
            {slots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📅</div>
                Nenhum horário disponível no momento.<br />
                <span style={{ fontSize: '13px' }}>A especialista adicionará novos horários em breve.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {slots.map(s => {
                  const dt = new Date(s.data)
                  const sel = slotSelecionado === s.id
                  return (
                    <button key={s.id} onClick={() => setSlotSelecionado(s.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: `2px solid ${sel ? cor2 : '#e5e7eb'}`, borderRadius: '12px', background: sel ? '#fffbeb' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: sel ? cor2 : '#111827', fontSize: '15px' }}>
                          {dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                          {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {s.durMinutos}min · {s.modalidade === 'ONLINE' ? '💻 Online' : '📍 Presencial'}
                        </div>
                      </div>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${sel ? cor2 : '#d1d5db'}`, background: sel ? cor2 : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {sel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button onClick={agendar} disabled={!leadId} style={{ width: '100%', padding: '16px', background: leadId ? `linear-gradient(135deg,${cor1},${cor2})` : '#d1d5db', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '14px', cursor: leadId ? 'pointer' : 'not-allowed', boxShadow: leadId ? '0 4px 16px rgba(217,119,6,0.3)' : 'none' }}>
            {slotSelecionado ? 'Confirmar Agendamento →' : 'Solicitar Agendamento (sem horário fixo) →'}
          </button>
          <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>A especialista confirmará por e-mail</p>
        </div>
      </div>
    )
  }

  // ── RESULTADO ──
  if (etapa === 'resultado' && diagnostico) {
    const d = diagnostico
    const circ = 2 * Math.PI * 40
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ background: `linear-gradient(135deg,${cor1},${cor2})`, padding: '32px 24px', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Diagnóstico ORYON Legal</div>
          <h2 style={{ fontSize: '28px', fontWeight: 900, margin: '0 0 4px' }}>{dados.nome.split(' ')[0]}, seu resultado está pronto</h2>
          <p style={{ opacity: 0.7, fontSize: '14px' }}>Análise baseada em suas respostas + IA jurídica especializada</p>
        </div>

        <div style={{ maxWidth: '640px', margin: '-24px auto 0', padding: '0 20px 40px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor(d.score)} strokeWidth="10"
                    strokeDasharray={`${(d.score / 100) * circ} ${circ}`} strokeLinecap="round" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: scoreColor(d.score), lineHeight: 1 }}>{d.score}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>/ 100</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Nível de risco</div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: scoreColor(d.score) }}>{d.nivel}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Prioridade: <strong style={{ color: '#374151' }}>{d.prioridade}</strong></div>
              </div>
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '10px' }}>Vulnerabilidades encontradas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {d.vulnerabilidades.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: v.tipo === '🔴' ? '#fef2f2' : v.tipo === '🟡' ? '#fffbeb' : '#f0fdf4', fontSize: '14px', color: v.tipo === '🔴' ? '#991b1b' : v.tipo === '🟡' ? '#92400e' : '#166534', fontWeight: 500 }}>
                  <span>{v.tipo}</span><span>{v.descricao}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', borderLeft: `4px solid ${cor2}` }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: cor2, textTransform: 'uppercase', marginBottom: '6px' }}>Recomendação</div>
              <div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{d.recomendacao}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => setEtapa('agendar')} style={{ padding: '16px', background: `linear-gradient(135deg,${cor1},${cor2})`, color: 'white', fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '14px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(217,119,6,0.3)' }}>
              📅 Agendar Reunião com a Especialista
            </button>
            <a href="https://talitamartinsadv.com.br" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '14px', background: 'white', color: cor1, fontWeight: 700, textAlign: 'center', borderRadius: '14px', textDecoration: 'none', border: `1.5px solid ${cor1}` }}>
              ⚖️ Conhecer a especialista
            </a>
            <button onClick={() => setEtapa('landing')} style={{ padding: '12px', background: 'none', color: '#9ca3af', fontWeight: 500, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
              ← Voltar ao início
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── ANALISANDO ──
  if (etapa === 'analisando') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(160deg,${cor1},${cor2})`, fontFamily: 'system-ui,sans-serif', textAlign: 'center', padding: '32px' }}>
      <div style={{ fontSize: '56px', marginBottom: '20px', animation: 'spin 2s linear infinite' }}>⚖️</div>
      <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>Analisando suas respostas...</h2>
      <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', maxWidth: '300px', lineHeight: 1.6 }}>Nossa IA jurídica está gerando seu diagnóstico personalizado.</p>
      <div style={{ display: 'flex', gap: '6px', marginTop: '24px' }}>
        {[0, 1, 2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.5)', animation: `bounce 1.2s ease ${i * 0.2}s infinite` }} />)}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  )

  // ── QUIZ ──
  if (etapa === 'quiz') {
    const q = PERGUNTAS[passo]
    const sel = respostas[passo]
    return (
      <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ background: `linear-gradient(135deg,${cor1},${cor2})`, padding: '20px 24px' }}>
          <button onClick={() => passo > 0 ? setPasso(p => p - 1) : setEtapa('dados')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', marginBottom: '12px' }}>←</button>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            {PERGUNTAS.map((_, i) => <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i < passo ? 'white' : i === passo ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }} />)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Pergunta {passo + 1} de {PERGUNTAS.length}</div>
        </div>
        <div style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '24px', lineHeight: 1.4 }}>{q.pergunta}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {q.opcoes.map(op => (
              <button key={op} onClick={() => setRespostas(r => { const n = [...r]; n[passo] = op; return n })} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', border: `2px solid ${sel === op ? cor2 : '#e5e7eb'}`, borderRadius: '14px', cursor: 'pointer', background: sel === op ? '#fffbeb' : 'white', color: sel === op ? cor2 : '#374151', fontWeight: sel === op ? 700 : 500, fontSize: '15px', textAlign: 'left' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${sel === op ? cor2 : '#d1d5db'}`, background: sel === op ? cor2 : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {sel === op && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', display: 'block' }} />}
                </span>
                {op}
              </button>
            ))}
          </div>
          <button
            onClick={() => passo < PERGUNTAS.length - 1 ? setPasso(p => p + 1) : analisar()}
            disabled={!sel}
            style={{ width: '100%', padding: '16px', background: sel ? `linear-gradient(135deg,${cor1},${cor2})` : '#d1d5db', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '14px', cursor: sel ? 'pointer' : 'not-allowed' }}>
            {passo < PERGUNTAS.length - 1 ? 'Próxima →' : 'Gerar Diagnóstico IA →'}
          </button>
        </div>
      </div>
    )
  }

  // ── DADOS ──
  if (etapa === 'dados') return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: `linear-gradient(135deg,${cor1},${cor2})`, padding: '20px 24px' }}>
        <button onClick={() => setEtapa('landing')} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', marginBottom: '12px' }}>←</button>
        <h2 style={{ color: 'white', fontWeight: 900, fontSize: '22px', margin: 0 }}>Seus dados</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '4px' }}>Para personalizar e enviar seu diagnóstico</p>
      </div>
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {([['nome', 'Nome completo', 'text', 'Seu nome', 'required'], ['telefone', 'WhatsApp', 'tel', '(85) 9 0000-0000', 'required'], ['email', 'E-mail', 'email', 'seu@email.com', '']] as const).map(([k, l, t, p, req]) => (
              <div key={k}>
                <label style={labelStyle}>{l} {req && <span style={{ color: '#ef4444' }}>*</span>}</label>
                <input type={t} value={(dados as Record<string, string>)[k]} onChange={e => setDados(d => ({ ...d, [k]: e.target.value }))} placeholder={p} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = cor2} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Cidade</label>
                <input type="text" value={dados.cidade} onChange={e => setDados(d => ({ ...d, cidade: e.target.value }))} placeholder="Sua cidade" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = cor2} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
              <div>
                <label style={labelStyle}>UF</label>
                <input type="text" value={dados.estado} onChange={e => setDados(d => ({ ...d, estado: e.target.value }))} placeholder="CE" maxLength={2} style={{ ...inputStyle, textTransform: 'uppercase' }}
                  onFocus={e => e.target.style.borderColor = cor2} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>
            <button onClick={() => dados.nome && dados.telefone && setEtapa('quiz')} disabled={!dados.nome || !dados.telefone} style={{ padding: '16px', background: dados.nome && dados.telefone ? `linear-gradient(135deg,${cor1},${cor2})` : '#d1d5db', color: 'white', fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '14px', cursor: dados.nome && dados.telefone ? 'pointer' : 'not-allowed' }}>
              Iniciar Diagnóstico →
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── LANDING ──
  return (
    <div style={{ fontFamily: 'system-ui,sans-serif', background: 'white', overflowX: 'hidden' }}>
      <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,#1c0700 0%,#78350f 35%,#ca8a04 70%,#fbbf24 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {[500, 700, 900].map((size, i) => (
          <div key={size} style={{ position: 'absolute', width: `${size}px`, height: `${size}px`, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${1 + scrollY * 0.0004 * (i + 1)})` }} />
        ))}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 16px', borderRadius: '999px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            ORYON Legal · Diagnóstico Inteligente
          </div>
          <h1 style={{ fontSize: 'clamp(32px,6vw,56px)', fontWeight: 900, color: 'white', lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em' }}>
            Descubra os riscos<br /><span style={{ color: '#fbbf24' }}>jurídicos da sua fazenda</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
            Diagnóstico jurídico inteligente em 3 minutos. IA analisa sua situação e conecta você à especialista certa.
          </p>
          <button onClick={() => setEtapa('dados')} style={{ padding: '18px 40px', background: 'white', color: cor1, fontWeight: 800, fontSize: '16px', border: 'none', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            Fazer Diagnóstico Gratuito →
          </button>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px' }}>7 perguntas · IA jurídica · Score personalizado · Gratuito</p>
          <a href="/oryon-legal/minha-agenda" style={{ marginTop: '16px', display: 'inline-block', padding: '12px 28px', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '14px', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '12px', textDecoration: 'none' }}>
            📅 Minha Agenda
          </a>
        </div>
      </div>

      <div style={{ background: '#f8f9fa', padding: '80px 24px' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: cor2, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Processo completo</div>
              <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#111827' }}>Como funciona o diagnóstico</h2>
            </div>
          </Fade>
          {[
            { n: '01', icon: '📋', t: '7 perguntas sobre sua situação', d: 'Documentação, contratos, sucessão, crédito. Leva menos de 3 minutos.' },
            { n: '02', icon: '🤖', t: 'IA jurídica analisa tudo', d: 'LLaMA 3.3 70B analisa suas respostas e gera um score de risco real.' },
            { n: '03', icon: '📊', t: 'Você recebe seu Score Jurídico', d: 'Score de 0 a 100, nível de risco, vulnerabilidades e recomendações.' },
            { n: '04', icon: '📅', t: 'Agende uma reunião', d: 'Escolha um horário disponível. A especialista confirma por e-mail.' },
            { n: '05', icon: '✅', t: 'Reunião confirmada', d: 'Notificação por e-mail com link Google Calendar. Reagendamento se necessário.' },
          ].map((p, i) => (
            <Fade key={p.n} delay={i * 100}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', alignItems: 'flex-start' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `linear-gradient(135deg,${cor1},${cor2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, boxShadow: '0 4px 12px rgba(202,138,4,0.3)' }}>{p.icon}</div>
                <div style={{ paddingTop: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: cor2, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>Etapa {p.n}</div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>{p.t}</div>
                  <div style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>{p.d}</div>
                </div>
              </div>
            </Fade>
          ))}
        </div>
      </div>

      <div style={{ background: `linear-gradient(160deg,${cor1},${cor2})`, padding: '80px 24px', textAlign: 'center' }}>
        <Fade>
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, color: 'white', marginBottom: '16px', lineHeight: 1.2 }}>Conheça os riscos<br />da sua operação agora</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', marginBottom: '36px' }}>Diagnóstico gratuito · IA especializada · Agendamento integrado</p>
            <button onClick={() => setEtapa('dados')} style={{ padding: '18px 48px', background: 'white', color: cor1, fontWeight: 800, fontSize: '17px', border: 'none', borderRadius: '16px', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
              Iniciar Diagnóstico Gratuito →
            </button>
          </div>
        </Fade>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} *{box-sizing:border-box}`}</style>
    </div>
  )
}
