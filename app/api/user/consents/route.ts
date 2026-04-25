import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })

    const agroRate = dbUser?.properties[0]?.agroRate
    const stored = (agroRate?.benchmarkComparison as Record<string, unknown> | null) ?? {}
    const consents = (stored.__consents ?? {}) as Record<string, boolean>

    return NextResponse.json({ consents })
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { consents } = await request.json()

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1, include: { agroRate: true } } },
    })

    const property = dbUser?.properties[0]
    if (!property) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const existing = (property.agroRate?.benchmarkComparison as Record<string, unknown> | null) ?? {}
    const updated = { ...existing, __consents: consents }

    await prisma.agroRate.upsert({
      where: { propertyId: property.id },
      update: { benchmarkComparison: updated },
      create: { propertyId: property.id, benchmarkComparison: updated },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar consentimentos' }, { status: 500 })
  }
}
