import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { groqStream, Msg } from '@/lib/groq'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Não autenticado', { status: 401 })

  // Rate limit: 20 chamadas IA por hora por usuário
  const { allowed } = rateLimit(`ai:${user.id}`, 20, 3600_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Limite de chamadas IA atingido. Tente novamente em 1 hora.' }, { status: 429 })
  }

    const { messages }: { messages: Msg[] } = await req.json()

    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        name: true,
        score: true,
        category: true,
        productionScore: true,
        efficiencyScore: true,
        behaviorScore: true,
        operationalScore: true,
        totalRevenue: true,
        totalCosts: true,
        productivity: true,
        marginRate: true,
        activityCount: true,
        plan: true,
        properties: {
          take: 3,
          select: { name: true, type: true, sizeHectares: true, location: true },
        },
      },
    })

    if (!dbUser) return new Response('Usuário não encontrado', { status: 404 })

    const score = dbUser.score ?? 0
    const scoreLabel = score >= 900 ? 'Elite' : score >= 750 ? 'Alto' : score >= 600 ? 'Bom' : score >= 450 ? 'Regular' : score >= 300 ? 'Baixo' : 'Crítico'
    const receita = Number(dbUser.totalRevenue ?? 0)
    const custo = Number(dbUser.totalCosts ?? 0)
    const margem = Number(dbUser.marginRate ?? 0)
    const propriedades = dbUser.properties

    const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    const systemPrompt = `Você é o Agente Financeiro do AgroRate, copiloto de inteligência financeira rural da OryonAG. Responda SEMPRE em português brasileiro. Seja objetivo, empático e use os dados concretos do produtor. Máximo 4 parágrafos. Use linguagem acessível mas profissional.

PRODUTOR: ${dbUser.name} | Plano: ${dbUser.plan} | Hoje: ${hoje}

SCORE DE CRÉDITO RURAL: ${score}/1000 (${scoreLabel} — categoria ${dbUser.category ?? 'REGULAR'})
- Produção: ${dbUser.productionScore}/250 | Eficiência: ${dbUser.efficiencyScore}/250 | Comportamento: ${dbUser.behaviorScore}/250 | Operacional: ${dbUser.operationalScore}/250

FINANCEIRO:
- Receita total registrada: R$${receita.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Custo total: R$${custo.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Resultado: R$${(receita - custo).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
- Margem: ${(margem * 100).toFixed(1)}%
- Atividades registradas: ${dbUser.activityCount}

PROPRIEDADES (${propriedades.length}): ${propriedades.map(p => `${p.name}${p.location ? ` (${p.location})` : ''}${p.sizeHectares ? ` — ${p.sizeHectares} ha` : ''}`).join('; ') || 'nenhuma'}

LINHAS DE CRÉDITO RURAL DE REFERÊNCIA:
- PRONAF Custeio: 5-6% a.a. até R$250.000 | PRONAF Mais Alimentos: 6-7% a.a.
- FCO Rural: 7-9% a.a. | Moderfrota: 7% a.a.
- BB Crédito Rural: 8-12% a.a. | Sicoob/Sicredi: 7-10% a.a.
- CPR Física: sem juros, amortiza com produção

DIRETRIZES:
- Analise o perfil de crédito e sugira linhas adequadas ao score
- Se score < 450: orientar para melhoria antes de solicitar crédito
- Se score >= 750: apresentar oportunidades premium
- Sempre calcular custo efetivo total (CET) aproximado nas sugestões
- Alertar sobre armadilhas de crédito rural (prazo curto vs ciclo da cultura)`

    const stream = await groqStream([
      { role: 'system', content: systemPrompt },
      ...messages,
    ])

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (e: any) {
    console.error('[AgenteFinanceiro Error]', e?.message)
    return new Response(JSON.stringify({ error: e?.message ?? 'Erro interno' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
