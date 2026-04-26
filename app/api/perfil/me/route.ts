import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: {
        properties: {
          take: 1,
          include: { agroRate: true },
        },
      },
    })
    if (!dbUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

    const agroRate = dbUser.properties[0]?.agroRate

    return NextResponse.json({
      name:             dbUser.name,
      email:            dbUser.email,
      plan:             dbUser.plan,
      cpfMasked:        dbUser.cpfMasked,
      stripeCustomerId: dbUser.stripeCustomerId,
      agroRate: agroRate ? {
        quodVerifiedAt:  agroRate.quodVerifiedAt,
        cafirVerifiedAt: agroRate.cafirVerifiedAt,
        carVerifiedAt:   agroRate.carVerifiedAt,
        cafVerifiedAt:   agroRate.cafVerifiedAt,
        dossieVerifiedAt: agroRate.dossieVerifiedAt,
      } : null,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
