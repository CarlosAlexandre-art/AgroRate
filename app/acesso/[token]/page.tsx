'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ROLE_META: Record<string, { label: string; cor: string; permissoes: string[] }> = {
  VISUALIZADOR: {
    label: 'Visualizador',
    cor: '#60a5fa',
    permissoes: ['Score AgroRate', 'Lista de documentos', 'Relatórios básicos'],
  },
  CONTADOR: {
    label: 'Contador',
    cor: '#34d399',
    permissoes: ['Score AgroRate completo', 'Certidões (CAR, CAFIR, DAP, QUOD)', 'Fluxo de caixa (12 meses)', 'Documentos fiscais com download', 'Contratos de crédito ativos'],
  },
  COLABORADOR: {
    label: 'Colaborador',
    cor: '#f59e0b',
    permissoes: ['Tudo do Contador', 'Garantias vinculadas', 'Edição de dados financeiros'],
  },
}

interface InviteInfo {
  nome?: string
  email: string
  role: string
  status: string
  invitedAt: string
  acceptedAt?: string
  property: {
    name: string
    location?: string
    sizeHectares: number
    ownerName: string
    ownerPhone?: string
    ownerEmail: string
  }
}

export default function AceitarConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t)
      fetch(`/api/acesso/${t}`)
        .then(r => r.json())
        .then(d => {
          if (d.error) setError(d.error)
          else {
            setInvite(d)
            if (d.status === 'ACTIVE') setAccepted(true)
          }
        })
        .catch(() => setError('Não foi possível carregar o convite.'))
        .finally(() => setLoading(false))
    })
  }, [params])

  async function aceitar() {
    setAccepting(true)
    try {
      const r = await fetch(`/api/acesso/${token}`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) { setError(d.error ?? 'Erro ao aceitar convite'); return }
      setAccepted(true)
      setTimeout(() => router.push(`/colaborador/${token}`), 1200)
    } finally {
      setAccepting(false)
    }
  }

  const meta = invite ? (ROLE_META[invite.role] ?? ROLE_META.VISUALIZADOR) : null

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #020c14 0%, #041410 50%, #020c14 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Grid sutil */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(52,211,153,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,.03) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="7" fill="#22c55e" opacity=".9"/>
              <circle cx="16" cy="16" r="13" stroke="#22c55e" strokeWidth="1.5" strokeOpacity=".3"/>
              <circle cx="6" cy="8" r="2" fill="#4ade80" opacity=".6"/>
              <circle cx="26" cy="8" r="2" fill="#4ade80" opacity=".5"/>
              <circle cx="26" cy="24" r="2" fill="#22c55e" opacity=".6"/>
              <circle cx="6" cy="24" r="2" fill="#4ade80" opacity=".5"/>
            </svg>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#a7f3d0', letterSpacing: '-.02em' }}>AgroRate</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,.35)', marginTop: '4px', letterSpacing: '.08em' }}>ACESSO COLABORATIVO</div>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(52,211,153,.18)', borderRadius: '20px', padding: '32px', backdropFilter: 'blur(8px)' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid rgba(52,211,153,.3)', borderTopColor: '#34d399', borderRadius: '50%', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              <div style={{ color: 'rgba(255,255,255,.4)', fontSize: '14px', marginTop: '16px' }}>Carregando convite…</div>
            </div>
          )}

          {!loading && error && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Convite inválido</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '14px' }}>{error}</div>
              <Link href="/login" style={{ display: 'inline-block', marginTop: '24px', color: '#34d399', fontSize: '14px', textDecoration: 'none' }}>← Ir para o login</Link>
            </div>
          )}

          {!loading && !error && invite && (
            <>
              {/* Quem convidou */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Convite de</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(52,211,153,.15)', border: '1px solid rgba(52,211,153,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: '#34d399' }}>
                    {invite.property.ownerName[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '16px' }}>{invite.property.ownerName}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)' }}>{invite.property.ownerEmail}</div>
                  </div>
                </div>
              </div>

              {/* Propriedade */}
              <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Propriedade</div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '18px', marginBottom: '4px' }}>{invite.property.name}</div>
                {invite.property.location && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)', marginBottom: '4px' }}>📍 {invite.property.location}</div>}
                {invite.property.sizeHectares > 0 && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)' }}>🌾 {invite.property.sizeHectares.toLocaleString('pt-BR')} hectares</div>}
              </div>

              {/* Role */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: '12px' }}>Seu nível de acesso</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,.05)', border: `1px solid ${meta!.cor}40`, borderRadius: '10px', padding: '8px 14px', marginBottom: '16px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: meta!.cor }} />
                  <span style={{ fontWeight: 700, color: meta!.cor, fontSize: '14px' }}>{meta!.label}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {meta!.permissoes.map(p => (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="8" fill="rgba(52,211,153,.12)"/>
                        <path d="M5 8l2 2 4-4" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              {accepted ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ fontSize: '36px', marginBottom: '12px' }}>✅</div>
                  <div style={{ fontWeight: 700, color: '#34d399', fontSize: '16px', marginBottom: '4px' }}>Acesso confirmado!</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.45)' }}>Redirecionando para o portal…</div>
                </div>
              ) : (
                <>
                  <button
                    onClick={aceitar}
                    disabled={accepting}
                    style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '1px solid rgba(52,211,153,.35)', background: 'rgba(52,211,153,.15)', color: '#34d399', fontWeight: 800, fontSize: '15px', cursor: accepting ? 'not-allowed' : 'pointer', opacity: accepting ? .7 : 1, transition: 'all .2s', letterSpacing: '.02em' }}
                  >
                    {accepting ? 'Confirmando acesso…' : 'Aceitar Convite'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,.3)' }}>
                    Convidado em {new Date(invite.invitedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
