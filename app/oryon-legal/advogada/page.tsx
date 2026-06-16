'use client'

import { useState, useEffect } from 'react'

type Slot = { id: string; data: string; durMinutos: number; modalidade: string; ocupado: boolean }
type Reuniao = { id: string; status: string; modalidade: string; linkOnline?: string; observacoes?: string; createdAt: string; _waLink?: string; lead: { nome: string; telefone: string; email?: string; score?: number; nivel?: string; recomendacao?: string; prioridade?: string }; slot?: Slot }

const SENHA_KEY = 'oryon_adv_senha'
const COR = '#b45309'
const COR2 = '#f59e0b'

const STATUS_LABEL: Record<string, string> = { PENDENTE: '⏳ Pendente', CONFIRMADA: '✅ Confirmada', REAGENDADA: '🔄 Reagendada', CANCELADA: '❌ Cancelada', CONCLUIDA: '🏁 Concluída' }
const STATUS_COLOR: Record<string, string> = { PENDENTE: '#f59e0b', CONFIRMADA: '#22c55e', REAGENDADA: '#3b82f6', CANCELADA: '#ef4444', CONCLUIDA: '#8b5cf6' }

function BotaoGcal({ status, slot, lead, link }: { status: string; slot?: Slot | null; lead: { nome: string; telefone: string }; link?: string }) {
  if (status !== 'CONFIRMADA' || !slot) return null
  try {
    const start = new Date(slot.data).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const end = new Date(new Date(slot.data).getTime() + ((slot.durMinutos || 60) * 60000)).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consultoria ORYON Legal — ' + lead.nome)}&dates=${start}/${end}&details=${encodeURIComponent('Cliente: ' + lead.nome + '\nWhatsApp: ' + lead.telefone + (link ? '\nLink: ' + link : ''))}`
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', padding: '10px', background: 'linear-gradient(135deg,#92400e,#d97706,#fbbf24)', color: 'white', fontWeight: 700, textAlign: 'center', borderRadius: '8px', textDecoration: 'none', marginBottom: '8px', fontSize: '13px' }}>
        📅 Adicionar ao meu Google Calendar ✨
      </a>
    )
  } catch { return null }
}

export default function AdvogadaPage() {
  const [senha, setSenha] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [aba, setAba] = useState<'reunioes' | 'slots' | 'leads'>('reunioes')
  const [reunioes, setReunioes] = useState<Reuniao[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [novoSlot, setNovoSlot] = useState({ data: '', hora: '', durMinutos: '60', modalidade: 'ONLINE' })
  const [editando, setEditando] = useState<string | null>(null)
  const [patchForm, setPatchForm] = useState({ status: '', linkOnline: '', observacoes: '' })
  const [waLink, setWaLink] = useState<string | null>(null)

  useEffect(() => {
    const s = sessionStorage.getItem(SENHA_KEY)
    if (s) { setSenha(s); setAutenticado(true) }
  }, [])

  useEffect(() => {
    if (autenticado) { carregarReunioes(); carregarSlots() }
  }, [autenticado])

  async function login() {
    setLoading(true)
    const res = await fetch('/api/oryon-legal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    })
    if (res.ok) { sessionStorage.setItem(SENHA_KEY, senha); setAutenticado(true) }
    else alert('Senha incorreta')
    setLoading(false)
  }

  async function carregarReunioes() {
    try {
      const res = await fetch(`/api/oryon-legal/reunioes?senha=${encodeURIComponent(senha)}`)
      if (res.ok) {
        const data = await res.json()
        setReunioes(Array.isArray(data) ? data.filter((r: Reuniao) => r?.lead?.nome) : [])
      }
    } catch { setReunioes([]) }
  }

  async function carregarSlots() {
    const res = await fetch('/api/oryon-legal/slots')
    if (res.ok) setSlots(await res.json())
  }

  async function criarSlot() {
    if (!novoSlot.data || !novoSlot.hora) return
    const data = new Date(`${novoSlot.data}T${novoSlot.hora}:00`)
    await fetch('/api/oryon-legal/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: data.toISOString(), durMinutos: parseInt(novoSlot.durMinutos), modalidade: novoSlot.modalidade, senha }),
    })
    setNovoSlot({ data: '', hora: '', durMinutos: '60', modalidade: 'ONLINE' })
    carregarSlots()
  }

  async function deletarSlot(id: string) {
    await fetch('/api/oryon-legal/slots', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, senha }) })
    carregarSlots()
  }

  async function atualizarReuniao(id: string) {
    const res = await fetch('/api/oryon-legal/reunioes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, senha, ...patchForm }),
    })
    const data = await res.json()
    // Mostra link WhatsApp para a advogada clicar e notificar o cliente
    if (data._waLink && patchForm.status === 'CONFIRMADA') {
      setWaLink(data._waLink)
    }
    setEditando(null)
    carregarReunioes()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: 'white' }
  const lbl: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '5px' }

  if (!autenticado) return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,${COR},${COR2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '36px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚖️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#111827', marginBottom: '4px' }}>Painel da Especialista</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>ORYON Legal · Acesso restrito</p>
        <input type="password" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} placeholder="Senha de acesso" style={{ ...inp, padding: '14px 16px', fontSize: '15px', marginBottom: '12px' }} />
        <button onClick={login} disabled={loading || !senha} style={{ width: '100%', padding: '14px', background: `linear-gradient(135deg,${COR},${COR2})`, color: 'white', fontWeight: 800, fontSize: '15px', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
          {loading ? 'Verificando...' : 'Entrar →'}
        </button>
      </div>
    </div>
  )

  const pendentes = reunioes.filter(r => r.status === 'PENDENTE').length

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui,sans-serif' }}>
      {/* Modal WhatsApp pós-confirmação */}
      {waLink && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '28px', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#111827', marginBottom: '8px' }}>Reunião confirmada!</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>O cliente foi notificado por e-mail. Clique abaixo para também enviar via WhatsApp.</p>
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              style={{ display: 'block', padding: '14px', background: '#25d366', color: 'white', fontWeight: 800, borderRadius: '12px', textDecoration: 'none', marginBottom: '10px' }}>
              💬 Notificar cliente via WhatsApp
            </a>
            <button onClick={() => setWaLink(null)} style={{ width: '100%', padding: '12px', background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <div style={{ background: `linear-gradient(135deg,${COR},${COR2})`, padding: '20px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ color: 'white', fontWeight: 900, fontSize: '20px', margin: 0 }}>⚖️ Painel ORYON Legal</h1>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px', margin: '2px 0 0' }}>Gestão de leads, reuniões e disponibilidade</p>
          </div>
          {pendentes > 0 && <div style={{ background: '#ef4444', color: 'white', fontWeight: 800, fontSize: '13px', padding: '6px 14px', borderRadius: '999px' }}>{pendentes} pendente{pendentes > 1 ? 's' : ''}</div>}
        </div>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex' }}>
          {([['reunioes', '📅 Reuniões'], ['slots', '🗓️ Disponibilidade'], ['leads', '👥 Todos os leads']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setAba(k)} style={{ padding: '14px 20px', border: 'none', background: 'none', fontWeight: aba === k ? 800 : 500, color: aba === k ? COR2 : '#6b7280', borderBottom: `3px solid ${aba === k ? COR2 : 'transparent'}`, cursor: 'pointer', fontSize: '14px' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px' }}>

        {aba === 'reunioes' && (
          <div>
            {reunioes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
                <p>Nenhuma reunião ainda</p>
              </div>
            ) : reunioes.map(r => (
              <div key={r.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px', borderLeft: `4px solid ${STATUS_COLOR[r.status] ?? '#e5e7eb'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>{r.lead.nome}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: `${STATUS_COLOR[r.status]}20`, color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
                      {r.lead.score && <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#fef3c7', color: '#92400e' }}>Score: {r.lead.score}/100</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <a href={`https://wa.me/55${r.lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#25d366', fontWeight: 700, textDecoration: 'none' }}>💬 {r.lead.telefone}</a>
                      {r.lead.email && <span style={{ fontSize: '13px', color: '#6b7280' }}>✉️ {r.lead.email}</span>}
                    </div>
                    {r.slot && <div style={{ fontSize: '13px', color: '#374151', fontWeight: 600 }}>📅 {new Date(r.slot.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })} · {r.modalidade === 'ONLINE' ? '💻 Online' : '📍 Presencial'}</div>}
                    {r.lead.recomendacao && <div style={{ marginTop: '8px', padding: '10px', background: '#fffbeb', borderRadius: '8px', fontSize: '13px', color: '#78350f', borderLeft: '3px solid #fbbf24' }}>{r.lead.recomendacao}</div>}
                  </div>
                  <button onClick={() => { setEditando(r.id); setPatchForm({ status: r.status, linkOnline: r.linkOnline ?? '', observacoes: r.observacoes ?? '' }) }}
                    style={{ padding: '8px 16px', background: COR2, color: 'white', fontWeight: 700, fontSize: '13px', border: 'none', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}>
                    Gerenciar
                  </button>
                </div>

                {editando === r.id && (
                  <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    {/* WhatsApp do cliente em destaque */}
                    <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '10px', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '2px' }}>Cliente</div>
                        <div style={{ fontWeight: 800, color: '#111827' }}>{r.lead.nome}</div>
                      </div>
                      <a href={`https://wa.me/55${r.lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                        style={{ padding: '10px 16px', background: '#25d366', color: 'white', fontWeight: 800, borderRadius: '10px', textDecoration: 'none', fontSize: '14px' }}>
                        💬 {r.lead.telefone}
                      </a>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={lbl}>Status</label>
                        <select value={patchForm.status} onChange={e => setPatchForm(p => ({ ...p, status: e.target.value }))} style={inp}>
                          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={lbl}>Link Online</label>
                        <input type="text" value={patchForm.linkOnline} onChange={e => setPatchForm(p => ({ ...p, linkOnline: e.target.value }))} placeholder="https://meet.google.com/..." style={inp} />
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={lbl}>Observações</label>
                      <textarea value={patchForm.observacoes} onChange={e => setPatchForm(p => ({ ...p, observacoes: e.target.value }))} placeholder="Notas internas..." rows={2}
                        style={{ ...inp, resize: 'vertical' }} />
                    </div>
                    <BotaoGcal status={patchForm.status} slot={r.slot} lead={r.lead} link={patchForm.linkOnline} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => atualizarReuniao(r.id)} style={{ flex: 1, padding: '10px', background: '#22c55e', color: 'white', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Salvar e notificar cliente</button>
                      <button onClick={() => setEditando(null)} style={{ padding: '10px 16px', background: '#f3f4f6', color: '#374151', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {aba === 'slots' && (
          <div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', marginBottom: '16px' }}>➕ Adicionar horário disponível</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={lbl}>Data</label>
                  <input type="date" value={novoSlot.data} onChange={e => setNovoSlot(s => ({ ...s, data: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Horário</label>
                  <input type="time" value={novoSlot.hora} onChange={e => setNovoSlot(s => ({ ...s, hora: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Duração</label>
                  <select value={novoSlot.durMinutos} onChange={e => setNovoSlot(s => ({ ...s, durMinutos: e.target.value }))} style={inp}>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="90">1h30</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Modalidade</label>
                  <select value={novoSlot.modalidade} onChange={e => setNovoSlot(s => ({ ...s, modalidade: e.target.value }))} style={inp}>
                    <option value="ONLINE">💻 Online</option>
                    <option value="PRESENCIAL">📍 Presencial</option>
                  </select>
                </div>
              </div>
              <button onClick={criarSlot} disabled={!novoSlot.data || !novoSlot.hora} style={{ width: '100%', padding: '12px', background: novoSlot.data && novoSlot.hora ? `linear-gradient(135deg,${COR},${COR2})` : '#d1d5db', color: 'white', fontWeight: 700, border: 'none', borderRadius: '10px', cursor: novoSlot.data && novoSlot.hora ? 'pointer' : 'not-allowed' }}>
                Adicionar horário
              </button>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>Horários cadastrados</h3>
            {slots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', background: 'white', borderRadius: '16px' }}>Nenhum horário cadastrado ainda</div>
            ) : slots.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: '12px', padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#111827', fontSize: '15px' }}>{new Date(s.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{s.durMinutos}min · {s.modalidade === 'ONLINE' ? '💻 Online' : '📍 Presencial'} · {s.ocupado ? '🔴 Ocupado' : '🟢 Disponível'}</div>
                </div>
                {!s.ocupado && (
                  <button onClick={() => deletarSlot(s.id)} style={{ padding: '8px 14px', background: '#fef2f2', color: '#ef4444', fontWeight: 700, border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                    Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {aba === 'leads' && (
          <div>
            {reunioes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>👥</div>
                <p>Nenhum lead ainda</p>
              </div>
            ) : reunioes.map(r => (
              <div key={r.id} style={{ background: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '15px' }}>{r.lead.nome}</span>
                  {r.lead.score && <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#fef3c7', color: '#92400e' }}>Score {r.lead.score}/100</span>}
                  {r.lead.nivel && <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#f3f4f6', color: '#374151' }}>{r.lead.nivel}</span>}
                  {r.lead.prioridade && <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: '#fef2f2', color: '#991b1b' }}>{r.lead.prioridade}</span>}
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <a href={`https://wa.me/55${r.lead.telefone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#25d366', fontWeight: 700, textDecoration: 'none' }}>💬 {r.lead.telefone}</a>
                  {r.lead.email && <span style={{ fontSize: '13px', color: '#6b7280' }}>✉️ {r.lead.email}</span>}
                </div>
                {r.lead.recomendacao && <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{r.lead.recomendacao}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
