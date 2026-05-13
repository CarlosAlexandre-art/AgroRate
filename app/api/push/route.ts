import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const { endpoint, p256dh, auth } = await req.json()
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Dados de subscription inválidos' }, { status: 422 })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: { userId: dbUser.id, endpoint, p256dh, auth },
      update: { p256dh, auth },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push] Erro ao salvar subscription:', error)
    return NextResponse.json({ error: 'Erro ao salvar subscription' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: 'endpoint obrigatório' }, { status: 422 })

    await prisma.pushSubscription.deleteMany({ where: { endpoint } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[push] Erro ao remover subscription:', error)
    return NextResponse.json({ error: 'Erro ao remover subscription' }, { status: 500 })
  }
}
