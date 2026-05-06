import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function getPropertyId(userId: string): Promise<string | null> {
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: userId },
    include: { properties: { take: 1 } },
  })
  return dbUser?.properties[0]?.id ?? null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const propertyId = await getPropertyId(user.id)
    if (!propertyId) return NextResponse.json({ alerts: [] })

    const alerts = await prisma.alert.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ alerts })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { alertId, markAll } = await req.json()
    const propertyId = await getPropertyId(user.id)
    if (!propertyId) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    if (markAll) {
      await prisma.alert.updateMany({
        where: { propertyId, isRead: false },
        data: { isRead: true },
      })
    } else if (alertId) {
      await prisma.alert.updateMany({
        where: { id: alertId, propertyId },
        data: { isRead: true },
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
