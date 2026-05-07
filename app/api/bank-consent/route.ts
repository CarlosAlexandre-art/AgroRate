import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser) return NextResponse.json([])

  const consents = await prisma.bankConsent.findMany({
    where: { userId: dbUser.id },
    select: { institution: true, active: true, grantedAt: true },
  })
  return NextResponse.json(consents)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { id: true } })
  if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const { institution, active } = await req.json()
  if (!institution || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const consent = await prisma.bankConsent.upsert({
    where: { userId_institution: { userId: dbUser.id, institution } },
    create: {
      userId: dbUser.id,
      institution,
      active,
      grantedAt: active ? new Date() : null,
      revokedAt: active ? null : new Date(),
    },
    update: {
      active,
      grantedAt: active ? new Date() : undefined,
      revokedAt: active ? null : new Date(),
    },
  })
  return NextResponse.json(consent)
}
