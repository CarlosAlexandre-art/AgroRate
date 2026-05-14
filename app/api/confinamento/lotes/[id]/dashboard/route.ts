import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import {
  calcGMD, calcCabecasAtuais, calcCustoPorArroba,
  calcEficienciaAlimentar, calcPrevisaoAbate, calcMargemEstimada,
  calcScoreLote, calcPesoAtual, type ResumoLote,
} from '@/lib/confinamento'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { id } = await params
    const sp = request.nextUrl.searchParams
    const custoRacaoKg = Number(sp.get('custoRacaoKg') || 1.8)
    const precoArroba = Number(sp.get('precoArroba') || 320)
    const pesoAlvoKg = Number(sp.get('pesoAlvoKg') || 480)

    const lote = await prisma.lote.findUnique({
      where: { id },
      include: { diarios: { orderBy: { data: 'asc' } } },
    })
    if (!lote) return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 })

    const resumo: ResumoLote = {
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

    const gmd = calcGMD(resumo)
    const pesoAtual = calcPesoAtual(resumo)
    const cabecasAtuais = calcCabecasAtuais(resumo)
    const mortalidadeTotal = lote.diarios.reduce((s, d) => s + d.mortalidade, 0)
    const mortalidadeRate = lote.cabecasEntrada > 0 ? (mortalidadeTotal / lote.cabecasEntrada) * 100 : 0
    const previsaoAbate = calcPrevisaoAbate(resumo, pesoAlvoKg)
    const custoArroba = calcCustoPorArroba(resumo, custoRacaoKg)
    const eficienciaAlimentar = calcEficienciaAlimentar(resumo)
    const margemEstimada = calcMargemEstimada(resumo, precoArroba, custoRacaoKg, pesoAlvoKg)
    const scoreLote = calcScoreLote(resumo)

    // Tendência GMD: últimos 7 registros com pesagem
    const comPeso = lote.diarios.filter(d => d.pesoMedio != null).slice(-7)
    const tendenciaGMD = comPeso.map((d, i) => ({
      data: d.data,
      peso: Number(d.pesoMedio),
      ganho: i === 0 ? 0 : Number(d.pesoMedio) - Number(comPeso[i - 1].pesoMedio),
    }))

    const diasConfinado = Math.round(
      (Date.now() - new Date(lote.dataEntrada).getTime()) / 86_400_000
    )

    return NextResponse.json({
      loteId: id,
      nome: lote.nome,
      objetivo: lote.objetivo,
      status: lote.status,
      especie: lote.especie,
      raca: lote.raca,
      diasConfinado,
      cabecasEntrada: lote.cabecasEntrada,
      cabecasAtuais,
      mortalidadeTotal,
      mortalidadeRate: +mortalidadeRate.toFixed(2),
      pesoMedioEntrada: Number(lote.pesoMedioEntrada),
      pesoAtual: +pesoAtual.toFixed(1),
      ganhoTotal: +(pesoAtual - Number(lote.pesoMedioEntrada)).toFixed(1),
      gmd: +gmd.toFixed(3),
      metaGMD: Number(lote.metaGMD),
      atingindoMeta: gmd >= Number(lote.metaGMD),
      eficienciaAlimentar: +eficienciaAlimentar.toFixed(3),
      custoEntrada: Number(lote.custoEntrada),
      custoArroba: +custoArroba.toFixed(2),
      margemEstimada: +margemEstimada.toFixed(2),
      previsaoAbate: previsaoAbate?.toISOString() ?? null,
      scoreLote,
      tendenciaGMD,
      totalRegistrosDiarios: lote.diarios.length,
    })
  } catch (error) {
    console.error('GET /api/confinamento/lotes/[id]/dashboard:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
