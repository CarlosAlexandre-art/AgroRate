import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasAccess } from '@/lib/plan-guard'

export default async function EquipeIALayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const plan = await getUserPlan(user.id)
  const isEnterprise = hasAccess(plan, 'enterprise')

  if (!isEnterprise) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white mb-2">Equipe IA — Plano Enterprise</h1>
          <p className="text-slate-400 text-sm max-w-sm">
            Agentes autônomos de crédito rural estão disponíveis exclusivamente no plano <strong className="text-white">Enterprise</strong>.
            Automatize análises de score, monitoramento de risco e estratégias de crédito.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard/assinaturas"
            className="bg-emerald-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Ver plano Enterprise
          </Link>
          <Link
            href="/dashboard"
            className="border border-white/10 text-slate-300 font-semibold px-6 py-3 rounded-xl hover:bg-white/5 transition-colors"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
