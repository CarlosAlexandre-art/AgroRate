'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const SCORE_COLOR = (s: number) =>
  s >= 900 ? '#b45309' : s >= 750 ? '#065f46' : s >= 600 ? '#0d9488' : s >= 450 ? '#1d4ed8' : s >= 300 ? '#c2410c' : '#b91c1c'

const SCORE_LABEL = (s: number) =>
  s >= 900 ? 'Elite' : s >= 750 ? 'Alto' : s >= 600 ? 'Bom' : s >= 450 ? 'Regular' : s >= 300 ? 'Baixo' : 'Crítico'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Meu Score',
  '/dashboard/credito': 'Crédito',
  '/dashboard/parceiros': 'Parceiros',
  '/dashboard/historico': 'Histórico',
  '/dashboard/ia': 'Conselheiro IA',
  '/dashboard/config': 'Configurações',
}

const NAV_MAIN = [
  {
    href: '/dashboard',
    label: 'Score',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2z" opacity=".3"/>
        <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/>
        <path d="M12 10V6"/>
        <path d="M17.7 14l-1.73-1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/credito',
    label: 'Crédito',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <rect x="2" y="5" width="20" height="14" rx="3"/>
        <path d="M2 10h20"/>
        <path d="M7 15h2m4 0h2"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/parceiros',
    label: 'Parceiros',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/historico',
    label: 'Histórico',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/ia',
    label: 'IA',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 2a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H8l-4 2v-4a8 8 0 0 1 0-16z"/>
        <path d="M8 12h8M8 8h5"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/config',
    label: 'Config',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

const NAV_ECO = [
  { href: 'https://agrolink-opal.vercel.app', label: 'AgroCore', color: 'bg-amber-500', dot: '🌾' },
  { href: 'https://agros-os.vercel.app', label: 'AgroOS', color: 'bg-emerald-500', dot: '🖥️' },
]

function RailIcon({ href, label, icon, active, onClick }: { href: string; label: string; icon: React.ReactNode; active: boolean; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="group relative flex items-center justify-center">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 ${
        active
          ? 'bg-[#065f46] text-white shadow-lg shadow-emerald-900/40'
          : 'text-slate-500 hover:bg-white/8 hover:text-slate-300'
      }`}>
        {icon}
      </div>
      {active && <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-1 h-7 bg-[#10b981] rounded-r-full" />}
      <div className="absolute left-14 z-50 hidden group-hover:flex items-center gap-0 pointer-events-none">
        <div className="w-2 h-2 bg-[#1e293b] rotate-45 -mr-1 flex-shrink-0" />
        <div className="bg-[#1e293b] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          {label}
        </div>
      </div>
    </Link>
  )
}

function ScoreBadge({ score }: { score: number | null }) {
  if (!score) return (
    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center">
      <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
    </div>
  )
  const color = SCORE_COLOR(score)
  const label = SCORE_LABEL(score)
  return (
    <div className="group relative flex items-center justify-center">
      <div className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center border border-white/10 hover:border-white/20 transition-all cursor-default"
        style={{ background: `${color}22` }}>
        <div className="text-[11px] font-black leading-none" style={{ color }}>{score}</div>
        <div className="text-[8px] font-bold leading-none mt-0.5" style={{ color, opacity: 0.8 }}>{label}</div>
      </div>
      <div className="absolute left-14 z-50 hidden group-hover:flex items-center pointer-events-none">
        <div className="w-2 h-2 bg-[#1e293b] rotate-45 -mr-1 flex-shrink-0" />
        <div className="bg-[#1e293b] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          Meu score atual
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
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
      setUserName(name)
      setUserInitial(name[0]?.toUpperCase() || 'U')
      const res = await fetch(`/api/agrorate/score?userId=${user.id}`)
      if (res.ok) { const j = await res.json(); setScore(j.score) }
    })
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard'

  const Rail = () => (
    <aside className="flex flex-col items-center bg-[#0b1120] h-full w-[68px] py-5 gap-0 border-r border-white/5">
      {/* Logo */}
      <Link href="/" className="mb-6 group relative flex items-center justify-center">
        <svg width={38} height={38} viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="10" fill="#065f46"/>
          <path d="M9 22 A10 10 0 0 1 27 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" fill="none"/>
          <path d="M9 22 A10 10 0 0 1 24 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          <circle cx="18" cy="22" r="2" fill="white"/>
          <line x1="18" y1="22" x2="23" y2="14.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M11 27 C11 27 13 23 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M11 27 C13 25 15 24 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        </svg>
        <div className="absolute left-14 z-50 hidden group-hover:flex items-center pointer-events-none">
          <div className="w-2 h-2 bg-[#1e293b] rotate-45 -mr-1 flex-shrink-0" />
          <div className="bg-[#1e293b] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
            AgroRate — Página inicial
          </div>
        </div>
      </Link>

      {/* Nav principal */}
      <nav className="flex flex-col items-center gap-1.5 flex-1 px-2">
        {NAV_MAIN.map(item => {
          const exact = item.href === '/dashboard'
          const active = exact ? pathname === item.href : pathname.startsWith(item.href)
          return <RailIcon key={item.href} {...item} active={active} onClick={() => setMobileOpen(false)} />
        })}

        {/* Divisor */}
        <div className="my-3 w-8 h-px bg-white/8" />

        {/* Ecossistema */}
        {NAV_ECO.map(item => (
          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
            className="group relative flex items-center justify-center">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-600 hover:bg-white/8 hover:text-slate-400 transition-all text-base">
              {item.dot}
            </div>
            <div className="absolute left-14 z-50 hidden group-hover:flex items-center pointer-events-none">
              <div className="w-2 h-2 bg-[#1e293b] rotate-45 -mr-1 flex-shrink-0" />
              <div className="bg-[#1e293b] text-white text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl flex items-center gap-1.5">
                {item.label}
                <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>
            </div>
          </a>
        ))}
      </nav>

      {/* Bottom: score + user */}
      <div className="flex flex-col items-center gap-2 px-2">
        <ScoreBadge score={score} />
        <div className="group relative flex items-center justify-center">
          <button onClick={handleSignOut}
            className="w-11 h-11 rounded-2xl bg-[#065f46]/20 border border-[#065f46]/30 flex items-center justify-center text-emerald-400 text-sm font-black hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
            {userInitial}
          </button>
          <div className="absolute left-14 z-50 hidden group-hover:flex items-center pointer-events-none">
            <div className="w-2 h-2 bg-[#1e293b] rotate-45 -mr-1 flex-shrink-0" />
            <div className="bg-[#1e293b] text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl text-left">
              <div className="text-white">{userName}</div>
              <div className="text-red-400 mt-0.5">Clique para sair</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      {/* Desktop rail */}
      <div className="hidden md:flex flex-shrink-0 relative">
        <Rail />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative flex-shrink-0">
            <Rail />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-slate-100 px-5 py-0 flex items-center gap-4 flex-shrink-0 h-14">
          <button className="md:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors -ml-1" onClick={() => setMobileOpen(true)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-bold text-slate-800 text-base">{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-3">
            {score !== null && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border"
                style={{ color: SCORE_COLOR(score), background: `${SCORE_COLOR(score)}15`, borderColor: `${SCORE_COLOR(score)}30` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: SCORE_COLOR(score) }} />
                {score} · {SCORE_LABEL(score)}
              </div>
            )}
            <Link href="/dashboard/credito"
              className="flex items-center gap-1.5 bg-[#065f46] text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-[#047857] transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <rect x="2" y="5" width="20" height="14" rx="3"/>
                <path d="M2 10h20"/>
              </svg>
              Ver crédito
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
