import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ erro: 'Não autenticado — sem sessão ativa' })
  }

  const byId = await prisma.user.findUnique({
    where: { supabaseId: authUser.id },
    include: { properties: { select: { id: true, name: true } } },
  })

  const byEmail = byId ? null : await prisma.user.findUnique({
    where: { email: authUser.email! },
    include: { properties: { select: { id: true, name: true } } },
  })

  return NextResponse.json({
    sessao: {
      supabaseId: authUser.id,
      email: authUser.email,
      provider: authUser.app_metadata?.provider,
    },
    userNoBancoById: byId
      ? { id: byId.id, name: byId.name, email: byId.email, supabaseId: byId.supabaseId, propriedades: byId.properties }
      : null,
    userNoBancoByEmail: byEmail
      ? { id: byEmail.id, name: byEmail.name, email: byEmail.email, supabaseId: byEmail.supabaseId, propriedades: byEmail.properties }
      : null,
  })
}
