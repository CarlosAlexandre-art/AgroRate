import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const diarios = await prisma.loteDiario.findMany({
      where: { loteId: id },
      orderBy: { data: 'desc' },
    })

    return NextResponse.json(diarios.map(d => ({
      ...d,
      pesoMedio: d.pesoMedio != null ? Number(d.pesoMedio) : null,
      consumoRacao: Number(d.consumoRacao),
      consumoAgua: Number(d.consumoAgua),
    })))
  } catch (error) {
    console.error('GET /api/confinamento/lotes/[id]/diario:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { data, pesoMedio, consumoRacao, consumoAgua, mortalidade, medicacao, observacoes } = body

    const diario = await prisma.loteDiario.create({
      data: {
        loteId: id,
        data: data ? new Date(data) : new Date(),
        pesoMedio: pesoMedio != null ? Number(pesoMedio) : null,
        consumoRacao: Number(consumoRacao || 0),
        consumoAgua: Number(consumoAgua || 0),
        mortalidade: Number(mortalidade || 0),
        medicacao: medicacao || null,
        observacoes: observacoes || null,
      },
    })

    // Atualiza pesoAtual nos animais do lote se houve pesagem
    if (pesoMedio != null) {
      await prisma.animal.updateMany({
        where: { loteId: id },
        data: { pesoAtual: Number(pesoMedio) },
      })
    }

    return NextResponse.json(diario, { status: 201 })
  } catch (error) {
    console.error('POST /api/confinamento/lotes/[id]/diario:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
