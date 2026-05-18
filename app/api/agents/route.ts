import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const db = prisma as any

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const agents = await db.agentConfig.findMany({
      where: { userId: dbUser.id },
      include: {
        runs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { id: true, status: true, startedAt: true, finishedAt: true, resultado: true, erro: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(agents)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const body = await req.json()
    const agent = await db.agentConfig.create({
      data: {
        userId: dbUser.id,
        nome: body.nome,
        role: body.role,
        tipo: body.tipo || 'CUSTOMIZADO',
        systemPrompt: body.systemPrompt || null,
        tools: body.tools || [],
        trigger: body.trigger || 'MANUAL',
        ativo: true,
      },
    })

    return NextResponse.json(agent, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}
