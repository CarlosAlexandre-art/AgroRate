'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AnalisarDocumentoCredito from '@/components/AnalisarDocumentoCredito'

const SCORE_COLOR = (s: number) =>
  s >= 900 ? '#b45309' : s >= 750 ? '#065f46' : s >= 600 ? '#0d9488' : s >= 450 ? '#1d4ed8' : s >= 300 ? '#c2410c' : '#b91c1c'
const SCORE_LABEL = (s: number) =>
  s >= 900 ? 'Elite' : s >= 750 ? 'Alto' : s >= 600 ? 'Bom' : s >= 450 ? 'Regular' : s >= 300 ? 'Baixo' : 'Crítico'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Meu Score',
  '/dashboard/credito': 'Ofertas de Crédito',
  '/dashboard/parceiros': 'Parceiros Financeiros',
  '/dashboard/historico': 'Histórico do Score',
  '/dashboard/simulacoes': 'Minhas Simulações',
  '/dashboard/documentos': 'Documentos',
  '/dashboard/verificacao': 'Verificação Documental',
  '/dashboard/relatorio': 'Relatório',
  '/dashboard/alertas': 'Alertas',
  '/dashboard/ia': 'Conselheiro IA',
  '/dashboard/equipe-ia': 'Equipe IA',
  '/dashboard/config': 'Configurações',
  '/dashboard/assinaturas': 'Assinaturas',
  '/dashboard/fatores': 'Fatores de Impacto',
  '/dashboard/certificacoes': 'Certificações',
  '/dashboard/calculadora-pronaf': 'Calculadora PRONAF',
  '/dashboard/contratos': 'Histórico de Contratos',
  '/dashboard/garantias': 'Garantias',
  '/dashboard/seguro-rural': 'Seguro Rural',
  '/dashboard/fluxo-caixa': 'Fluxo de Caixa da Safra',
  '/dashboard/certidoes': 'Certidões Fiscais',
  '/dashboard/compartilhamento': 'Acesso Contador',
  '/dashboard/planner-credito': 'Planner de Crédito',
  '/dashboard/renegociacao': 'Simulador de Renegociação',
}

const NAV: { group: string; items: { href: string; label: string; icon: React.ReactNode; badge?: string }[] }[] = [
  {
    group: 'Score',
    items: [
      {
        href: '/dashboard',
        label: 'Meu Score',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/><path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M12 10V6"/><path d="M17.7 14l-1.73-1"/></svg>,
      },
      {
        href: '/dashboard/historico',
        label: 'Histórico',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      },
      {
        href: '/dashboard/fatores',
        label: 'Fatores de Impacto',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
      },
      {
        href: '/dashboard/certificacoes',
        label: 'Certificações',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M12 15l-2 5-3-1 1-4"/><path d="M12 15l2 5 3-1-1-4"/><circle cx="12" cy="8" r="5"/></svg>,
      },
      {
        href: '/dashboard/relatorio',
        label: 'Relatório PDF',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      },
    ],
  },
  {
    group: 'Crédito',
    items: [
      {
        href: '/dashboard/credito',
        label: 'Ofertas',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M7 15h2m4 0h2"/></svg>,
      },
      {
        href: '/dashboard/simulacoes',
        label: 'Simulações',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M9 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-3"/><path d="M9 15h3l8.5-8.5a1.5 1.5 0 0 0-3-3L9 12v3"/><path d="M16 5l3 3"/></svg>,
      },
      {
        href: '/dashboard/parceiros',
        label: 'Parceiros',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        href: '/dashboard/calculadora-pronaf',
        label: 'Calculadora PRONAF',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>,
      },
      {
        href: '/dashboard/contratos',
        label: 'Contratos',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>,
      },
      {
        href: '/dashboard/garantias',
        label: 'Garantias',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
      },
      {
        href: '/dashboard/seguro-rural',
        label: 'Seguro Rural',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7"/></svg>,
      },
    ],
  },
  {
    group: 'Gestão',
    items: [
      {
        href: '/dashboard/documentos',
        label: 'Documentos',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
      },
      {
        href: '/dashboard/verificacao',
        label: 'Verificação',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
      },
      {
        href: '/dashboard/alertas',
        label: 'Alertas',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      },
      {
        href: '/dashboard/fluxo-caixa',
        label: 'Fluxo de Caixa',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      },
      {
        href: '/dashboard/certidoes',
        label: 'Certidões Fiscais',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>,
      },
      {
        href: '/dashboard/compartilhamento',
        label: 'Acesso Contador',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
      },
    ],
  },
  {
    group: 'IA & Suporte',
    items: [
      {
        href: '/dashboard/ia',
        label: 'Conselheiro IA',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M12 2a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H8l-4 2v-4a8 8 0 0 1 0-16z"/><path d="M8 12h8M8 8h5"/></svg>,
      },
      {
        href: '/dashboard/equipe-ia',
        label: 'Equipe IA',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.798-1.442 2.798H4.24c-1.47 0-2.441-1.798-1.442-2.798L4.2 15.3"/></svg>,
      },
      {
        href: '/dashboard/planner-credito',
        label: 'Planner de Crédito',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
      },
      {
        href: '/dashboard/renegociacao',
        label: 'Renegociação',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
      },
      {
        href: '/dashboard/assinaturas',
        label: 'Assinaturas',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4m4 0h2"/></svg>,
      },
      {
        href: '/dashboard/oryon-legal',
        label: 'ORYON Legal',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><path d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97Z"/></svg>,
      },
      {
        href: '/dashboard/config',
        label: 'Configurações',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      },
    ],
  },
]

const NAV_ECO = [
  { href: 'https://agrolink-opal.vercel.app', label: 'AgroCore', dot: 'bg-[#679d3f]' },
  { href: 'https://agroos.site', label: 'SmartAgroOS', dot: 'bg-emerald-400' },
]

function NavItem({ href, label, icon, active, badge, onClick }: { href: string; label: string; icon: React.ReactNode; active: boolean; badge?: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
        active ? 'bg-[#065f46] text-white shadow-sm shadow-emerald-900/40' : 'text-slate-400 hover:text-white hover:bg-white/8'
      }`}>
      <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
          {badge}
        </span>
      )}
    </Link>
  )
}

function PushPrompt({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function ativar() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })
        const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
        await fetch('/api/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
        }).catch(() => {})
        setDone(true)
        setTimeout(onDone, 1500)
      } else {
        onDone()
      }
    } catch { onDone() }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(160deg,#0f172a,#062418)' }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#065f46]/40 border border-[#065f46]/30 flex items-center justify-center flex-shrink-0 text-lg">🔔</div>
            <div>
              <div className="font-bold text-white text-sm leading-snug">Fique por dentro do seu score</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Receba alertas 2x ao dia quando seu AgroRate mudar.</div>
            </div>
          </div>
          {done ? (
            <div className="text-center py-2 text-emerald-400 font-bold text-sm">✓ Notificações ativadas!</div>
          ) : (
            <div className="flex gap-2 mt-3">
              <button onClick={onDone} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Depois
              </button>
              <button onClick={ativar} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all" style={{ background: 'linear-gradient(135deg,#065f46,#047857)' }}>
                {loading ? 'Aguarde…' : '🔔 Ativar agora'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('U')
  const [score, setScore] = useState<number | null>(null)
  const [scoreLoaded, setScoreLoaded] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showPushPrompt, setShowPushPrompt] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    function syncStorage() {
      try {
        const n = parseInt(localStorage.getItem('agrorate_unread_count') ?? '0', 10)
        setUnreadCount(isNaN(n) ? 0 : n)
        const s = parseInt(localStorage.getItem('agrorate_current_score') ?? '', 10)
        if (!isNaN(s)) setScore(s)
      } catch { /* ignore */ }
    }
    syncStorage()
    window.addEventListener('storage', syncStorage)
    return () => window.removeEventListener('storage', syncStorage)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { router.push('/login'); return }
      const user = session.user
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
      setUserName(name)
      setUserInitial(name[0]?.toUpperCase() || 'U')
      try {
        const res = await fetch(`/api/agrorate/score?userId=${user.id}`)
        if (res.ok) { const j = await res.json(); setScore(j.score) }
      } catch { /* score indisponível */ }
      setScoreLoaded(true)

      // Push notification opt-in silencioso (só se permissão já foi concedida ou padrão)
      if (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
        Notification.permission !== 'denied'
      ) {
        try {
          const reg = await navigator.serviceWorker.ready
          const existing = await reg.pushManager.getSubscription()
          if (!existing && Notification.permission === 'granted') {
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            })
            const { endpoint, keys } = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
            await fetch('/api/push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint, p256dh: keys.p256dh, auth: keys.auth }),
            }).catch(() => {})
          }
        } catch { /* push não disponível */ }
      }
    })
  }, [router])

  useEffect(() => {
    if (!scoreLoaded) return
    try {
      if (localStorage.getItem('agrorate_push_prompted')) return
      if (!('Notification' in window) || Notification.permission === 'denied') return
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return
      const t = setTimeout(() => setShowPushPrompt(true), 2000)
      return () => clearTimeout(t)
    } catch { /* ignore */ }
  }, [scoreLoaded])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard'

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside className={`flex flex-col h-full ${mobile ? 'w-72' : 'w-60'} border-r border-white/5`} style={{background: 'linear-gradient(180deg, #0b1628 0%, #0f172a 55%, #062418 100%)'}}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/8 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width={30} height={30} viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="#065f46"/>
            <path d="M9 22 A10 10 0 0 1 27 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" fill="none"/>
            <path d="M9 22 A10 10 0 0 1 24 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <circle cx="18" cy="22" r="2" fill="white"/>
            <line x1="18" y1="22" x2="23" y2="14.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M11 27 C11 27 13 23 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M11 27 C13 25 15 24 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          </svg>
          <div>
            <div className="font-bold text-white text-sm leading-none">AgroRate</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-none">Score de Crédito Rural</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {NAV.map(section => (
          <div key={section.group}>
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-1.5">{section.group}</div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const exact = item.href === '/dashboard'
                const active = exact ? pathname === item.href : pathname.startsWith(item.href)
                return <NavItem key={item.href} {...item} active={active} onClick={() => setMobileOpen(false)} />
              })}
            </div>
          </div>
        ))}

        {/* Ecossistema */}
        <div>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-1.5">Ecossistema</div>
          <div className="space-y-0.5">
            {NAV_ECO.map(eco => (
              <a key={eco.href} href={eco.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/8 transition-all">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${eco.dot}`}/>
                {eco.label}
                <svg className="w-3 h-3 ml-auto text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Score badge */}
      {scoreLoaded && score !== null && (
        <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl border border-white/8 bg-white/4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Meu AgroRate</div>
            <div className="font-black text-xl leading-none mt-0.5" style={{ color: SCORE_COLOR(score) }}>{score}</div>
          </div>
          <div className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: SCORE_COLOR(score), background: `${SCORE_COLOR(score)}20` }}>
            {SCORE_LABEL(score)}
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-3 border-t border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[#065f46] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{userName}</div>
            <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Sair</button>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
          <div className="relative flex-shrink-0"><Sidebar mobile/></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-5 flex items-center gap-4 flex-shrink-0 h-14">
          <button className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors -ml-1" onClick={() => setMobileOpen(true)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <h1 className="font-bold text-slate-800 text-base">{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-3">
            {scoreLoaded && score !== null && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border"
                style={{ color: SCORE_COLOR(score), background: `${SCORE_COLOR(score)}12`, borderColor: `${SCORE_COLOR(score)}30` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: SCORE_COLOR(score) }}/>
                {score} · {SCORE_LABEL(score)}
              </div>
            )}
            <Link href="/dashboard/alertas"
              className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/dashboard/credito"
              className="btn-primary flex items-center gap-1.5 bg-[#065f46] text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-[#047857] shadow-sm shadow-emerald-900/30 hover:shadow-emerald-800/40 hover:shadow-md">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>
              </svg>
              Ver crédito
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
      <AnalisarDocumentoCredito />
      {showPushPrompt && (
        <PushPrompt onDone={() => {
          try { localStorage.setItem('agrorate_push_prompted', '1') } catch {}
          setShowPushPrompt(false)
        }} />
      )}
    </div>
  )
}
