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
    if (!propertyId) return NextResponse.json({ planos: [] })

    const planos = await prisma.creditPlan.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ planos })
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

    if (body.action === 'analisar') {
      // Análise de IA via Groq
      const GROQ_API_KEY = process.env.GROQ_API_KEY
      if (!GROQ_API_KEY) return NextResponse.json({ error: 'Groq não configurado' }, { status: 500 })

      const prompt = `Você é um especialista em crédito rural brasileiro. Analise o plano de crédito abaixo e forneça uma análise detalhada com:
1. Diagnóstico das necessidades de crédito
2. Linha(s) de crédito mais adequada(s) (PRONAF, PRONAMP, Moderinfra, etc.)
3. Estratégia de financiamento (timing, priorização)
4. Alertas de riscos e cuidados
5. Estimativa de impacto no score AgroRate

Dados do plano:
- Safra: ${body.safra}
- Cultura principal: ${body.cultura || 'Não especificado'}
- Área: ${body.areaHectares || 'Não especificado'} hectares
- Necessidades listadas: ${body.necessidades || 'Não especificado'}
- Total estimado: R$ ${body.totalNecessidade || 'Não calculado'}
- Score AgroRate atual: ${body.scoreAtual || 'Não disponível'}

Seja objetivo e prático. Responda em português.`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const err = await response.text()
        if (err.includes('429') || err.includes('rate_limit')) {
          const match = err.match(/(\d+\.?\d*)\s*s/)
          const retryAfter = match ? Math.ceil(parseFloat(match[1])) : 15
          return NextResponse.json({ error: 'RATE_LIMIT', retryAfter }, { status: 429 })
        }
        return NextResponse.json({ error: 'Erro na IA' }, { status: 500 })
      }

      const aiData = await response.json()
      const analise = aiData.choices[0]?.message?.content ?? 'Análise não disponível'

      const plano = await prisma.creditPlan.create({
        data: {
          propertyId,
          safra: body.safra,
          cultura: body.cultura,
          areaHectares: body.areaHectares,
          necessidades: body.necessidades,
          totalNecessidade: body.totalNecessidade,
          observacoes: body.observacoes,
          status: 'ATIVO',
          iaAnalise: analise,
        },
      })
      return NextResponse.json({ plano, analise }, { status: 201 })
    }

    // Salvar rascunho
    const plano = await prisma.creditPlan.create({
      data: {
        propertyId,
        safra: body.safra,
        cultura: body.cultura,
        areaHectares: body.areaHectares,
        necessidades: body.necessidades,
        totalNecessidade: body.totalNecessidade,
        observacoes: body.observacoes,
        status: 'RASCUNHO',
      },
    })
    return NextResponse.json({ plano }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
