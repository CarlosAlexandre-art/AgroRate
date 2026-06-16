'use client'

import { useState } from 'react'
import Link from 'next/link'

const COR1 = '#ca8a04'
const COR2 = '#fbbf24'

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: '⏳ Aguardando confirmação',
  CONFIRMADA: '✅ Confirmada',
  REAGENDADA: '🔄 Reagendada',
  CANCELADA: '❌ Cancelada',
  CONCLUIDA: '🏁 Concluída',
}
const STATUS_COLOR: Record<string, string> = {
  PENDENTE: '#f59e0b', CONFIRMADA: '#22c55e', REAGENDADA: '#3b82f6', CANCELADA: '#ef4444', CONCLUIDA: '#8b5cf6',
}

type Slot = { id: string; data: string; durMinutos: number; modalidade: string }
type Reuniao = { id: string; status: string; modalidade: string; linkOnline?: string; slot?: Slot; createdAt: string }
type Lead = { id: string; nome: string; telefone: string; score?: number; nivel?: string; recomendacao?: string; reunioes: Reuniao[] }

export default function MinhaAgendaPage() {
  const [telefone, setTelefone] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [leads, setLeads] = useState<Lead[] | null>(null)

  async function buscar() {
    if (telefone.replace(/\D/g, '').length < 8) return
    setBuscando(true)
    try {
      const res = await fetch(`/api/oryon-legal/minha-agenda?telefone=${encodeURIComponent(telefone)}`)
      const data = await res.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch { setLeads([]) }
    setBuscando(false)
  }

  const todasReunioes = leads?.flatMap(l => l.reunioes.map(r => ({ ...r, lead: l }))) ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'system-ui,sans-serif' }}>
      <div style={{ background: `linear-gradient(135deg,${COR1},${COR2})`, padding: '24px 20px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <Link href="/oryon-legal" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
            ← Voltar
          </Link>
          <h1 style={{ color: 'white', fontWeight: 900, fontSize: '22px', margin: 0 }}>📅 Minha Agenda</h1>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '4px' }}>Consulte o status das suas reuniões</p>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Seu WhatsApp
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="tel"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()}
              placeholder="(85) 9 0000-0000"
              style={{ flex: 1, padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = COR2}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <button
              onClick={buscar}
              disabled={buscando || telefone.replace(/\D/g, '').length < 8}
              style={{ padding: '12px 20px', background: telefone.replace(/\D/g, '').length >= 8 ? `linear-gradient(135deg,${COR1},${COR2})` : '#d1d5db', color: 'white', fontWeight: 700, border: 'none', borderRadius: '10px', cursor: telefone.replace(/\D/g, '').length >= 8 ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
            >
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>
        </div>

        {leads !== null && (
          <>
            {todasReunioes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <p style={{ fontWeight: 600, marginBottom: '6px', color: '#374151' }}>Nenhuma reunião encontrada</p>
                <p style={{ fontSize: '14px' }}>Verifique o número ou faça um novo diagnóstico.</p>
                <Link href="/oryon-legal" style={{ display: 'inline-block', marginTop: '16px', padding: '12px 24px', background: `linear-gradient(135deg,${COR1},${COR2})`, color: 'white', fontWeight: 700, borderRadius: '12px', textDecoration: 'none', fontSize: '14px' }}>
                  Fazer diagnóstico →
                </Link>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '12px' }}>
                  {todasReunioes.length} reunião(ões) encontrada(s)
                </div>
                {todasReunioes.map(r => {
                  const dataHora = r.slot ? new Date(r.slot.data).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }) : 'Sem horário definido'
                  const gcalStart = r.slot ? new Date(r.slot.data).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''
                  const gcalEnd = r.slot ? new Date(new Date(r.slot.data).getTime() + ((r.slot.durMinutos || 60) * 60000)).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z' : ''
                  const gcalUrl = gcalStart ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Consultoria ORYON Legal')}&dates=${gcalStart}/${gcalEnd}&details=${encodeURIComponent('Reunião com especialista jurídica ORYON Legal' + (r.linkOnline ? '\nLink: ' + r.linkOnline : ''))}` : ''

                  return (
                    <div key={r.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '12px', borderLeft: `4px solid ${STATUS_COLOR[r.status] ?? '#e5e7eb'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: '#111827', fontSize: '15px' }}>{r.lead.nome}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: `${STATUS_COLOR[r.status]}20`, color: STATUS_COLOR[r.status] }}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Data</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{dataHora}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Modalidade</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>{r.modalidade === 'ONLINE' ? '💻 Online' : '📍 Presencial'}</div>
                        </div>
                        {r.linkOnline && r.status === 'CONFIRMADA' && (
                          <div>
                            <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>Link da reunião</div>
                            <a href={r.linkOnline} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', fontWeight: 600, color: COR1, textDecoration: 'none' }}>
                              🔗 Acessar reunião
                            </a>
                          </div>
                        )}
                        {r.lead.recomendacao && (
                          <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '8px', fontSize: '13px', color: '#78350f', borderLeft: `3px solid ${COR2}` }}>
                            {r.lead.recomendacao}
                          </div>
                        )}
                      </div>

                      {gcalUrl && r.status === 'CONFIRMADA' && (
                        <a href={gcalUrl} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', marginTop: '14px', padding: '12px', background: `linear-gradient(135deg,#92400e,#d97706,${COR2})`, color: 'white', fontWeight: 700, textAlign: 'center', borderRadius: '10px', textDecoration: 'none', fontSize: '13px', boxShadow: '0 2px 8px rgba(217,119,6,0.3)' }}>
                          📅 Adicionar ao Google Calendar ✨
                        </a>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
