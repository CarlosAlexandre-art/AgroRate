import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const saudes = await prisma.animalSaude.findMany({
      where: { animalId: id },
      orderBy: { data: 'desc' },
    })
    return NextResponse.json(saudes)
  } catch (error) {
    console.error('GET /api/confinamento/animais/[id]/saude:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { tipo, descricao, produto, dose, veterinario, proximaDose, data } = body

    if (!descricao) return NextResponse.json({ error: 'descricao é obrigatória' }, { status: 400 })

    const saude = await prisma.animalSaude.create({
      data: {
        animalId: id,
        tipo: tipo || 'OBSERVACAO',
        descricao,
        produto: produto || null,
        dose: dose || null,
        veterinario: veterinario || null,
        proximaDose: proximaDose ? new Date(proximaDose) : null,
        data: data ? new Date(data) : new Date(),
      },
    })
    return NextResponse.json(saude, { status: 201 })
  } catch (error) {
    console.error('POST /api/confinamento/animais/[id]/saude:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
