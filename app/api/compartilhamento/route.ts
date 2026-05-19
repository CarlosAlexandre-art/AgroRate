import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

async function getPropertyId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { supabaseId: userId },
    include: { properties: { take: 1 } },
  })
  return user?.properties[0]?.id ?? null
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const propertyId = await getPropertyId(session.user.id)
    if (!propertyId) return NextResponse.json({ shares: [] })

    const shares = await prisma.propertyShare.findMany({
      where: { propertyId },
      orderBy: { invitedAt: 'desc' },
    })
    return NextResponse.json({ shares })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const propertyId = await getPropertyId(session.user.id)
    if (!propertyId) return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })

    const body = await req.json()
    const share = await prisma.propertyShare.upsert({
      where: { propertyId_email: { propertyId, email: body.email } },
      update: { role: body.role ?? 'VISUALIZADOR', status: 'PENDING', invitedAt: new Date() },
      create: {
        propertyId,
        email: body.email,
        nome: body.nome,
        role: body.role ?? 'VISUALIZADOR',
        invitedAt: new Date(),
      },
    })
    return NextResponse.json({ share }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const propertyId = await getPropertyId(session.user.id)
    if (!propertyId) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    await prisma.propertyShare.deleteMany({ where: { id, propertyId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
