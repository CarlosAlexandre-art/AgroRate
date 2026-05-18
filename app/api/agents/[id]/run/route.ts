import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/lib/agent-engine'

const db = prisma as any

export const maxDuration = 60

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const agent = await db.agentConfig.findUnique({ where: { id } })
    if (!agent || agent.userId !== dbUser.id) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

    const resultado = await runAgent(id, dbUser.id)
    return NextResponse.json({ ok: true, resultado })
  } catch (e: any) {
    const msg = e?.message ?? ''
    if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('Rate limit')) {
      const match = msg.match(/(\d+\.?\d*)\s*s/)
      const retryAfter = match ? Math.ceil(parseFloat(match[1])) : 15
      return NextResponse.json({ error: 'RATE_LIMIT', retryAfter }, { status: 429 })
    }
    return NextResponse.json({ error: msg || 'Erro ao executar agente' }, { status: 500 })
  }
}
