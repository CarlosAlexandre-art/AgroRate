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
  '/dashboard/credito': 'Ofertas de Crédito',
  '/dashboard/parceiros': 'Parceiros Financeiros',
  '/dashboard/historico': 'Histórico do Score',
  '/dashboard/ia': 'Conselheiro IA',
  '/dashboard/config': 'Configurações',
}

const NAV_MAIN = [
  {
    href: '/dashboard', label: 'Meu Score',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z" opacity=".2" fill="currentColor" stroke="none"/><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"/><path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M12 10V6"/><path d="M17.7 14l-1.73-1"/></svg>,
  },
  {
    href: '/dashboard/credito', label: 'Crédito',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M7 15h2m4 0h2"/></svg>,
  },
  {
    href: '/dashboard/parceiros', label: 'Parceiros',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    href: '/dashboard/historico', label: 'Histórico',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  },
  {
    href: '/dashboard/ia', label: 'Conselheiro IA',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><path d="M12 2a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H8l-4 2v-4a8 8 0 0 1 0-16z"/><path d="M8 12h8M8 8h5"/></svg>,
  },
  {
    href: '/dashboard/config', label: 'Configurações',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 flex-shrink-0"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
]

const NAV_ECO = [
  { href: 'https://agrolink-opal.vercel.app', label: 'AgroCore', dot: 'bg-amber-400' },
  { href: 'https://agros-os.vercel.app', label: 'AgroOS', dot: 'bg-emerald-400' },
]

function NavItem({ href, label, icon, active, onClick }: { href: string; label: string; icon: React.ReactNode; active: boolean; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-[#065f46] text-white shadow-sm shadow-emerald-900/20'
          : 'text-slate-400 hover:text-white hover:bg-white/8'
      }`}>
      <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-white'}>{icon}</span>
      {label}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('U')
  const [score, setScore] = useState<number | null>(null)
  const [scoreLoaded, setScoreLoaded] = useState(false)
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
      try {
        const res = await fetch(`/api/agrorate/score?userId=${user.id}`)
        if (res.ok) { const j = await res.json(); setScore(j.score) }
      } catch { /* score indisponível */ }
      setScoreLoaded(true)
    })
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard'

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside className={`flex flex-col bg-[#0f172a] h-full ${mobile ? 'w-72' : 'w-60'} border-r border-white/5`}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width={32} height={32} viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="#065f46"/>
            <path d="M9 22 A10 10 0 0 1 27 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.35" fill="none"/>
            <path d="M9 22 A10 10 0 0 1 24 14" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <circle cx="18" cy="22" r="2" fill="white"/>
            <line x1="18" y1="22" x2="23" y2="14.5" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M11 27 C11 27 13 23 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M11 27 C13 25 15 24 16 22" stroke="#6ee7b7" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          </svg>
          <div>
            <div className="font-bold text-white text-base leading-none">AgroRate</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-none">Score de Crédito Rural</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Principal</div>
        {NAV_MAIN.map(item => {
          const exact = item.href === '/dashboard'
          const active = exact ? pathname === item.href : pathname.startsWith(item.href)
          return <NavItem key={item.href} {...item} active={active} onClick={() => setMobileOpen(false)} />
        })}

        <div className="pt-4 pb-1">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">Ecossistema</div>
          {NAV_ECO.map(eco => (
            <a key={eco.href} href={eco.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-white hover:bg-white/8 transition-all">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${eco.dot}`}/>
              {eco.label}
              <svg className="w-3 h-3 ml-auto text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </a>
          ))}
        </div>
      </nav>

      {/* Score badge */}
      {scoreLoaded && score !== null && (
        <div className="mx-3 mb-2 px-3 py-2.5 rounded-xl border border-white/8 bg-white/4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Meu AgroRate</div>
            <div className="font-black text-lg leading-none mt-0.5" style={{ color: SCORE_COLOR(score) }}>{score}</div>
          </div>
          <div className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ color: SCORE_COLOR(score), background: `${SCORE_COLOR(score)}20` }}>
            {SCORE_LABEL(score)}
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-3 py-3 border-t border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-[#065f46] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{userName}</div>
            <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-red-400 transition-colors text-left">
              Sair da conta
            </button>
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
              <div className="hidden sm:flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl border"
                style={{ color: SCORE_COLOR(score), background: `${SCORE_COLOR(score)}12`, borderColor: `${SCORE_COLOR(score)}30` }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: SCORE_COLOR(score) }}/>
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
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
