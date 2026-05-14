import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { calcGMD, calcCabecasAtuais, calcScoreLote, calcPesoAtual, type ResumoLote } from '@/lib/confinamento'

function buildResumo(lote: {
  cabecasEntrada: number
  pesoMedioEntrada: unknown
  custoEntrada: unknown
  metaGMD: unknown
  dataEntrada: Date
  diarios: { data: Date; pesoMedio: unknown; consumoRacao: unknown; mortalidade: number }[]
}): ResumoLote {
  return {
    cabecasEntrada: lote.cabecasEntrada,
    pesoMedioEntrada: Number(lote.pesoMedioEntrada),
    custoEntrada: Number(lote.custoEntrada),
    metaGMD: Number(lote.metaGMD),
    dataEntrada: lote.dataEntrada,
    diarios: lote.diarios.map(d => ({
      data: d.data,
      pesoMedio: d.pesoMedio != null ? Number(d.pesoMedio) : null,
      consumoRacao: Number(d.consumoRacao),
      mortalidade: d.mortalidade,
    })),
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      include: { properties: { take: 1 } },
    })
    if (!dbUser || !dbUser.properties[0]) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    const propertyId = request.nextUrl.searchParams.get('propertyId') || dbUser.properties[0].id

    const lotes = await prisma.lote.findMany({
      where: { propertyId },
      include: { diarios: { orderBy: { data: 'asc' } }, animais: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const resultado = lotes.map(l => {
      const resumo = buildResumo(l)
      return {
        ...l,
        pesoMedioEntrada: Number(l.pesoMedioEntrada),
        custoEntrada: Number(l.custoEntrada),
        metaGMD: Number(l.metaGMD),
        gmd: calcGMD(resumo),
        pesoAtual: calcPesoAtual(resumo),
        cabecasAtuais: calcCabecasAtuais(resumo),
        scoreLote: calcScoreLote(resumo),
        totalAnimais: l.animais.length,
        diarios: undefined,
        animais: undefined,
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    console.error('GET /api/confinamento/lotes:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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
    const { nome, especie, raca, objetivo, dataEntrada, dataPrevistaAbate, cabecasEntrada, pesoMedioEntrada, custoEntrada, metaGMD } = body

    if (!nome || !cabecasEntrada) {
      return NextResponse.json({ error: 'nome e cabecasEntrada são obrigatórios' }, { status: 400 })
    }

    const lote = await prisma.lote.create({
      data: {
        propertyId: dbUser.properties[0].id,
        nome,
        especie: especie || 'BOVINO',
        raca: raca || null,
        objetivo: objetivo || 'ABATE',
        dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
        dataPrevistaAbate: dataPrevistaAbate ? new Date(dataPrevistaAbate) : null,
        cabecasEntrada: Number(cabecasEntrada),
        pesoMedioEntrada: Number(pesoMedioEntrada || 0),
        custoEntrada: Number(custoEntrada || 0),
        metaGMD: Number(metaGMD || 1.2),
      },
    })

    return NextResponse.json(lote, { status: 201 })
  } catch (error) {
    console.error('POST /api/confinamento/lotes:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
