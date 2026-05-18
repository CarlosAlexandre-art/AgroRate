import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/lib/agent-engine'

const db = prisma as any

export const maxDuration = 60

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const agent = await db.agentConfig.findUnique({ where: { id: params.id } })
    if (!agent || agent.userId !== dbUser.id) return NextResponse.json({ error: 'Agente não encontrado' }, { status: 404 })

    const resultado = await runAgent(params.id, dbUser.id)
    return NextResponse.json({ ok: true, resultado })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao executar agente' }, { status: 500 })
  }
}
