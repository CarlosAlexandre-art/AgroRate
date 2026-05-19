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
    if (!propertyId) return NextResponse.json({ certidoes: [] })

    const certidoes = await prisma.certidao.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ certidoes })
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
    const certidao = await prisma.certidao.create({
      data: {
        propertyId,
        tipo: body.tipo,
        numero: body.numero,
        emissao: body.emissao ? new Date(body.emissao) : undefined,
        validade: body.validade ? new Date(body.validade) : undefined,
        status: body.status ?? 'PENDENTE',
        observacoes: body.observacoes,
      },
    })
    return NextResponse.json({ certidao }, { status: 201 })
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

    await prisma.certidao.deleteMany({ where: { id, propertyId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

    const certidao = await prisma.certidao.update({
      where: { id },
      data: { status: updates.status, numero: updates.numero, observacoes: updates.observacoes },
    })
    return NextResponse.json({ certidao })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
