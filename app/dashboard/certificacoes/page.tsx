'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface AgroRateData {
  dapNumero?: string
  dapSituacao?: string
  carNumero?: string
  carSituacao?: string
  cafirNumero?: string
  cafNumero?: string
  cafSituacao?: string
  verificacaoBonus: number
  score: number
}

type Status = 'ATIVO' | 'PENDENTE' | 'INATIVO' | 'NAO_CADASTRADO'

function getStatus(numero?: string, situacao?: string): Status {
  if (!numero) return 'NAO_CADASTRADO'
  if (!situacao) return 'PENDENTE'
  const s = situacao.toLowerCase()
  if (s.includes('ativ')) return 'ATIVO'
  if (s.includes('inat') || s.includes('cancel')) return 'INATIVO'
  return 'PENDENTE'
}

const STATUS_META: Record<Status, { label: string; color: string; bg: string; glow: string }> = {
  ATIVO:         { label: 'Ativo', color: '#34d399', bg: 'rgba(52,211,153,0.1)', glow: 'rgba(52,211,153,0.2)' },
  PENDENTE:      { label: 'Pendente', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', glow: 'rgba(251,191,36,0.15)' },
  INATIVO:       { label: 'Inativo', color: '#f87171', bg: 'rgba(248,113,113,0.1)', glow: 'rgba(248,113,113,0.15)' },
  NAO_CADASTRADO: { label: 'Não cadastrado', color: '#64748b', bg: 'rgba(100,116,139,0.1)', glow: 'rgba(100,116,139,0.1)' },
}

export default function CertificacoesPage() {
  const [data, setData] = useState<AgroRateData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      try {
        const res = await fetch(`/api/agrorate/score?userId=${session.user.id}`)
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const certs = data ? [
    {
      id: 'dap',
      nome: 'DAP',
      titulo: 'Declaração de Aptidão ao PRONAF',
      numero: data.dapNumero,
      status: getStatus(data.dapNumero, data.dapSituacao),
      bonus: data.dapNumero ? (data.dapSituacao?.toLowerCase().includes('ativ') ? 50 : 20) : 0,
      maxBonus: 50,
      descricao: 'Comprova que você é agricultor familiar apto ao PRONAF. Necessária para linhas especiais de crédito.',
      impacto: 'Acesso a taxas de 0.25% a.m.',
      emissao: 'MDA / Sindicato Rural',
      href: '/dashboard/verificacao',
    },
    {
      id: 'car',
      nome: 'CAR',
      titulo: 'Cadastro Ambiental Rural',
      numero: data.carNumero,
      status: getStatus(data.carNumero, data.carSituacao),
      bonus: data.carNumero ? (data.carSituacao?.toLowerCase().includes('ativo') ? 30 : 10) : 0,
      maxBonus: 30,
      descricao: 'Registro público eletrônico da propriedade rural. Regularidade ambiental obrigatória.',
      impacto: 'Regularidade ambiental exigida',
      emissao: 'SICAR / Secretaria Estadual',
      href: '/dashboard/verificacao',
    },
    {
      id: 'cafir',
      nome: 'CAFIR',
      titulo: 'Cadastro de Imóveis Rurais',
      numero: data.cafirNumero,
      status: getStatus(data.cafirNumero),
      bonus: data.cafirNumero ? 25 : 0,
      maxBonus: 25,
      descricao: 'Cadastro do imóvel rural no INCRA. Garante a regularidade fundiária da propriedade.',
      impacto: 'Regularidade fundiária comprovada',
      emissao: 'INCRA',
      href: '/dashboard/verificacao',
    },
    {
      id: 'caf',
      nome: 'CAF',
      titulo: 'Cadastro da Agricultura Familiar',
      numero: data.cafNumero,
      status: getStatus(data.cafNumero, data.cafSituacao),
      bonus: data.cafNumero ? (data.cafSituacao?.toLowerCase().includes('ativ') ? 20 : 8) : 0,
      maxBonus: 20,
      descricao: 'Registro unificado da agricultura familiar. Simplifica o acesso a políticas públicas.',
      impacto: 'Acesso a programas federais',
      emissao: 'MDA / Portal Gov.br',
      href: '/dashboard/verificacao',
    },
  ] : []

  const totalBonus = certs.reduce((s, c) => s + c.bonus, 0)
  const maxBonus = 125

  return (
    <div className="min-h-full relative overflow-hidden" style={{
      background: 'linear-gradient(160deg, #020c14 0%, #041a0c 45%, #020c14 100%)',
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(52,211,153,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,0.04) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }}/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, rgba(96,165,250,0.07) 0%, transparent 70%)' }}/>

      <div className="relative z-10 p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pt-2">
          <div className="flex-1">
            <div className="text-xs font-bold tracking-widest text-blue-400/70 uppercase mb-1">Regularidade Documental</div>
            <h1 className="text-3xl font-black tracking-tight" style={{
              background: 'linear-gradient(135deg, #bfdbfe 0%, #60a5fa 50%, #2563eb 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Certificações</h1>
            <p className="text-sm text-slate-400 mt-1">Documentos regulatórios que amplificam seu score e acesso ao crédito</p>
          </div>
          {data && (
            <div className="flex-shrink-0 text-center px-5 py-3 rounded-2xl border"
              style={{ background: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.2)' }}>
              <div className="text-xs font-bold text-blue-400/70 uppercase tracking-widest mb-1">Bônus Total</div>
              <div className="text-4xl font-black" style={{ color: '#60a5fa' }}>+{totalBonus}</div>
              <div className="text-xs text-slate-500 mt-1">de +{maxBonus} possíveis</div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"/>
          </div>
        )}

        {/* Progresso total */}
        {data && (
          <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Potencial de Bônus</span>
              <span className="text-xs font-bold text-slate-300">{totalBonus} / {maxBonus} pts</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${(totalBonus / maxBonus) * 100}%`,
                  background: 'linear-gradient(90deg, #60a5fa, #34d399)',
                  boxShadow: '0 0 10px rgba(96,165,250,0.5)',
                }}/>
            </div>
          </div>
        )}

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {certs.map(cert => {
            const meta = STATUS_META[cert.status]
            return (
              <div key={cert.id} className="rounded-2xl p-5 border transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg tracking-widest"
                        style={{ background: meta.bg, color: meta.color }}>
                        {cert.nome}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white leading-tight">{cert.titulo}</div>
                  </div>
                  {cert.bonus > 0 && (
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-2xl font-black" style={{ color: meta.color }}>+{cert.bonus}</div>
                      <div className="text-xs text-slate-500">pontos</div>
                    </div>
                  )}
                </div>

                {/* Número */}
                {cert.numero && (
                  <div className="text-xs font-mono text-slate-400 mb-3 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {cert.numero}
                  </div>
                )}

                <p className="text-xs text-slate-500 mb-3">{cert.descricao}</p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600">{cert.emissao}</div>
                  {cert.status === 'NAO_CADASTRADO' ? (
                    <Link href={cert.href}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}>
                      Verificar →
                    </Link>
                  ) : (
                    <div className="text-xs font-bold" style={{ color: meta.color }}>
                      +{cert.maxBonus} pts máx
                    </div>
                  )}
                </div>

                {/* Bar de bonus */}
                <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${(cert.bonus / cert.maxBonus) * 100}%`,
                      background: `linear-gradient(90deg, ${meta.color}80, ${meta.color})`,
                    }}/>
                </div>
              </div>
            )
          })}
        </div>

        {!loading && data && totalBonus < maxBonus && (
          <div className="rounded-2xl p-4 border" style={{ background: 'rgba(251,191,36,0.05)', borderColor: 'rgba(251,191,36,0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Oportunidade</span>
            </div>
            <p className="text-sm text-slate-300">
              Você pode ganhar mais <span className="text-amber-400 font-bold">+{maxBonus - totalBonus} pontos</span> regularizando suas certificações.{' '}
              <Link href="/dashboard/verificacao" className="text-blue-400 font-bold hover:underline">Verificar documentos →</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
