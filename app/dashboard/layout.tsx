'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  {
    group: 'Score',
    items: [
      {
        href: '/dashboard',
        label: 'Meu Score',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Crédito',
    items: [
      {
        href: '/dashboard/credito',
        label: 'Ofertas',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      },
      {
        href: '/dashboard/parceiros',
        label: 'Parceiros',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        href: '/dashboard/historico',
        label: 'Histórico',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Ecossistema',
    items: [
      {
        href: 'https://agrolink-opal.vercel.app',
        label: 'AgroCore',
        external: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        ),
      },
      {
        href: 'https://agros-os.vercel.app',
        label: 'AgroOS',
        external: true,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
          </svg>
        ),
      },
    ],
  },
]

function NavLink({ href, label, icon, external, onClick }: { href: string; label: string; icon: React.ReactNode; external?: boolean; onClick?: () => void }) {
  const pathname = usePathname()
  const exact = href === '/dashboard'
  const active = !external && (exact ? pathname === href : pathname.startsWith(href))

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/8 transition-all group">
        <span className="text-slate-500 group-hover:text-white transition-colors">{icon}</span>
        {label}
        <svg className="w-3 h-3 ml-auto text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    )
  }

  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
        active ? 'bg-[#065f46] text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/8'
      }`}>
      <span className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}>{icon}</span>
      {label}
    </Link>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userInitial, setUserInitial] = useState('U')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
      setUserName(name)
      setUserInitial(name[0]?.toUpperCase() || 'U')
    })
  }, [router])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside className={`flex flex-col bg-[#0f172a] h-full ${mobile ? 'w-full' : 'w-64'}`}>
      <div className="px-5 py-5 border-b border-white/8 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#065f46] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">AR</span>
          </div>
          <div>
            <div className="font-bold text-white text-base leading-none">AgroRate</div>
            <div className="text-[10px] text-slate-500 mt-0.5 leading-none">Score de Crédito Rural</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {NAV.map(section => (
          <div key={section.group}>
            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-2">
              {section.group}
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => (
                <NavLink key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[#065f46] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white font-medium truncate">{userName}</div>
            <button onClick={handleSignOut} className="text-xs text-slate-500 hover:text-red-400 transition-colors text-left">
              Sair
            </button>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden">
      <div className="hidden md:flex flex-shrink-0"><Sidebar /></div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 flex-shrink-0"><Sidebar mobile /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 h-16">
          <button className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-gray-100 transition-colors" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-800">AgroRate</span>
            <span>— Score de Crédito Rural</span>
          </div>
          <Link href="/dashboard/credito" className="ml-auto flex items-center gap-1.5 bg-[#065f46] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#047857] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Ver crédito
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
