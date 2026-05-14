import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser || !dbUser.properties[0]) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    const sp = request.nextUrl.searchParams
    const propertyId = sp.get('propertyId') || dbUser.properties[0].id
    const loteId = sp.get('loteId')

    const animais = await prisma.animal.findMany({
      where: { propertyId, ...(loteId ? { loteId } : {}) },
      include: {
        lote: { select: { id: true, nome: true, objetivo: true } },
        saudes: { orderBy: { data: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(animais.map(a => ({
      ...a,
      pesoEntrada: Number(a.pesoEntrada),
      pesoAtual: Number(a.pesoAtual),
    })))
  } catch (error) {
    console.error('GET /api/confinamento/animais:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser || !dbUser.properties[0]) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { loteId, sisbovNumero, brincoNumero, nome, especie, raca, sexo, dataNascimento, pesoEntrada, origemFazenda, origemUF } = body

    if (!sexo) {
      return NextResponse.json({ error: 'sexo é obrigatório' }, { status: 400 })
    }

    const animal = await prisma.animal.create({
      data: {
        propertyId: dbUser.properties[0].id,
        loteId: loteId || null,
        sisbovNumero: sisbovNumero || null,
        brincoNumero: brincoNumero || null,
        nome: nome || null,
        especie: especie || 'BOVINO',
        raca: raca || null,
        sexo,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
        pesoEntrada: Number(pesoEntrada || 0),
        pesoAtual: Number(pesoEntrada || 0),
        origemFazenda: origemFazenda || null,
        origemUF: origemUF || null,
      },
    })

    // Registra movimento de entrada
    await prisma.animalMovimento.create({
      data: {
        animalId: animal.id,
        tipo: 'ENTRADA',
        origem: origemFazenda || null,
        destino: dbUser.properties[0].id,
        pesoNaData: Number(pesoEntrada || 0),
        motivo: 'Cadastro inicial',
      },
    })

    return NextResponse.json(animal, { status: 201 })
  } catch (error) {
    console.error('POST /api/confinamento/animais:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
