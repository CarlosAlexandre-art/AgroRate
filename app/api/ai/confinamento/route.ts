import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groqStream } from '@/lib/groq'
import {
  calcGMD, calcCabecasAtuais, calcCustoPorArroba,
  calcEficienciaAlimentar, calcPrevisaoAbate, calcMargemEstimada,
  calcScoreLote, calcPesoAtual, type ResumoLote,
} from '@/lib/confinamento'

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
    const propertyId = body.propertyId || dbUser.properties[0].id
    const pergunta = body.pergunta as string | undefined

    // Busca todos os lotes ativos com diários
    const lotes = await prisma.lote.findMany({
      where: { propertyId, status: 'ATIVO' },
      include: { diarios: { orderBy: { data: 'asc' } } },
    })

    if (lotes.length === 0) {
      return NextResponse.json({ texto: 'Nenhum lote ativo encontrado. Cadastre um lote para receber análise da IA.' })
    }

    const resumosLotes = lotes.map(l => {
      const resumo = buildResumo(l)
      const mortalidadeTotal = l.diarios.reduce((s, d) => s + d.mortalidade, 0)
      return {
        nome: l.nome,
        objetivo: l.objetivo,
        especie: l.especie,
        raca: l.raca,
        diasConfinado: Math.round((Date.now() - new Date(l.dataEntrada).getTime()) / 86_400_000),
        cabecasEntrada: l.cabecasEntrada,
        cabecasAtuais: calcCabecasAtuais(resumo),
        mortalidadeTotal,
        pesoMedioEntrada: Number(l.pesoMedioEntrada),
        pesoAtual: +calcPesoAtual(resumo).toFixed(1),
        gmd: +calcGMD(resumo).toFixed(3),
        metaGMD: Number(l.metaGMD),
        eficienciaAlimentar: +calcEficienciaAlimentar(resumo).toFixed(3),
        custoPorArroba: +calcCustoPorArroba(resumo).toFixed(2),
        margemEstimada: +calcMargemEstimada(resumo).toFixed(2),
        previsaoAbate: calcPrevisaoAbate(resumo)?.toLocaleDateString('pt-BR') ?? 'indeterminado',
        scoreLote: calcScoreLote(resumo),
        totalRegistrosDiarios: l.diarios.length,
      }
    })

    const contexto = `
Você é um especialista em pecuária e confinamento bovino do AgroRate. Analise os dados abaixo e forneça insights práticos e objetivos em português brasileiro.

DADOS DOS LOTES ATIVOS:
${resumosLotes.map((l, i) => `
Lote ${i + 1}: ${l.nome}
- Espécie/Raça: ${l.especie} ${l.raca ? `(${l.raca})` : ''}
- Objetivo: ${l.objetivo}
- Dias confinado: ${l.diasConfinado}
- Cabeças: ${l.cabecasAtuais}/${l.cabecasEntrada} (mortalidade: ${l.mortalidadeTotal})
- Peso: entrada ${l.pesoMedioEntrada}kg → atual ${l.pesoAtual}kg
- GMD: ${l.gmd} kg/dia (meta: ${l.metaGMD} kg/dia) — ${l.gmd >= l.metaGMD ? 'ATINGINDO META' : 'ABAIXO DA META'}
- Eficiência Alimentar: ${l.eficienciaAlimentar}
- Custo/arroba: R$ ${l.custoPorArroba}
- Margem estimada: R$ ${l.margemEstimada.toLocaleString('pt-BR')}
- Previsão de abate: ${l.previsaoAbate}
- Score do lote: ${l.scoreLote}/100
- Registros diários: ${l.totalRegistrosDiarios}
`).join('')}

Responda de forma direta, com dicas práticas e alertas prioritários. Use linguagem acessível para produtores rurais. Máximo de 400 palavras.
${pergunta ? `\nPergunta específica do produtor: "${pergunta}"` : ''}
`

    const stream = await groqStream([
      { role: 'system', content: 'Você é um consultor técnico especialista em confinamento bovino e pecuária de precisão. Suas análises são práticas, diretas e baseadas em dados.' },
      { role: 'user', content: contexto },
    ])

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('POST /api/ai/confinamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
