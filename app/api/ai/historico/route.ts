import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser) return NextResponse.json([])

  const messages = await prisma.aiChatMessage.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const { role, text } = await req.json()
  if (!role || !text) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })

  const msg = await prisma.aiChatMessage.create({
    data: { userId: dbUser.id, role, text },
  })
  return NextResponse.json(msg, { status: 201 })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser) return NextResponse.json({ ok: true })

  await prisma.aiChatMessage.deleteMany({ where: { userId: dbUser.id } })
  return NextResponse.json({ ok: true })
}
