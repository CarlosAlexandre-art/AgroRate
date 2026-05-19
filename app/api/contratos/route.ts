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
    if (!propertyId) return NextResponse.json({ contratos: [] })

    const contratos = await prisma.loanContract.findMany({
      where: { propertyId },
      orderBy: { dataContratacao: 'desc' },
    })
    return NextResponse.json({ contratos })
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
    const contrato = await prisma.loanContract.create({
      data: {
        propertyId,
        banco: body.banco,
        linha: body.linha,
        valor: body.valor,
        taxaAnual: body.taxaAnual ?? 0,
        prazo: body.prazo,
        dataContratacao: new Date(body.dataContratacao),
        dataVencimento: body.dataVencimento ? new Date(body.dataVencimento) : undefined,
        valorParcela: body.valorParcela,
        status: body.status ?? 'ATIVO',
        observacoes: body.observacoes,
      },
    })
    return NextResponse.json({ contrato }, { status: 201 })
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

    await prisma.loanContract.deleteMany({ where: { id, propertyId } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
