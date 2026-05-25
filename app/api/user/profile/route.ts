import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    return NextResponse.json({
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone ?? '',
      avatarUrl: dbUser.avatarUrl ?? '',
      createdAt: dbUser.createdAt,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json()
    const { name, phone, avatarUrl } = body

    const data: Record<string, string> = {}
    if (name?.trim()) data.name = name.trim()
    if (phone !== undefined) data.phone = phone.trim()
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl

    await prisma.user.update({ where: { supabaseId: user.id }, data })

    if (name?.trim()) {
      await supabase.auth.updateUser({ data: { name: name.trim() } })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }
}
