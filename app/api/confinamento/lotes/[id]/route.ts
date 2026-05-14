import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const lote = await prisma.lote.findUnique({
      where: { id },
      include: {
        animais: true,
        diarios: { orderBy: { data: 'asc' } },
      },
    })
    if (!lote) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

    return NextResponse.json({
      ...lote,
      pesoMedioEntrada: Number(lote.pesoMedioEntrada),
      custoEntrada: Number(lote.custoEntrada),
      metaGMD: Number(lote.metaGMD),
    })
  } catch (error) {
    console.error('GET /api/confinamento/lotes/[id]:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    const lote = await prisma.lote.update({
      where: { id },
      data: {
        nome: body.nome,
        raca: body.raca,
        objetivo: body.objetivo,
        status: body.status,
        dataPrevistaAbate: body.dataPrevistaAbate ? new Date(body.dataPrevistaAbate) : undefined,
        dataAbate: body.dataAbate ? new Date(body.dataAbate) : undefined,
        metaGMD: body.metaGMD != null ? Number(body.metaGMD) : undefined,
      },
    })

    return NextResponse.json(lote)
  } catch (error) {
    console.error('PATCH /api/confinamento/lotes/[id]:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    await prisma.lote.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/confinamento/lotes/[id]:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
