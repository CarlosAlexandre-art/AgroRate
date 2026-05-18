import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const db = prisma as any

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    const agent = await db.agentConfig.findUnique({
      where: { id: params.id },
      include: { runs: { orderBy: { startedAt: 'desc' }, take: 10, select: { id: true, status: true, startedAt: true, finishedAt: true, resultado: true, erro: true } } },
    })
    if (!agent || agent.userId !== dbUser?.id) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
    return NextResponse.json(agent)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    const agent = await db.agentConfig.findUnique({ where: { id: params.id } })
    if (!agent || agent.userId !== dbUser?.id) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const body = await req.json()
    const updated = await db.agentConfig.update({
      where: { id: params.id },
      data: {
        nome: body.nome ?? agent.nome,
        role: body.role ?? agent.role,
        systemPrompt: body.systemPrompt ?? agent.systemPrompt,
        tools: body.tools ?? agent.tools,
        trigger: body.trigger ?? agent.trigger,
        ativo: body.ativo ?? agent.ativo,
      },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await db.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
    const agent = await db.agentConfig.findUnique({ where: { id: params.id } })
    if (!agent || agent.userId !== dbUser?.id) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await db.agentConfig.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}
