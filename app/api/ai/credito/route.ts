import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { score, category, productionScore, efficiencyScore, behaviorScore, operationalScore, totalRevenue, marginRate, question } = await request.json()

    const resposta = await groq([
      {
        role: 'system',
        content: `Você é um especialista em crédito rural e analista financeiro do agro.
Analise o perfil do produtor e responda de forma direta, prática e em português.
Seja específico sobre o que o produtor pode fazer para melhorar seu acesso a crédito.
Máximo 3 parágrafos curtos.`,
      },
      {
        role: 'user',
        content: `Score AgroRate: ${score} (${category})
Produção: ${productionScore}/1000 | Eficiência: ${efficiencyScore}/1000
Comportamento: ${behaviorScore}/1000 | Operacional: ${operationalScore}/1000
Receita total: R$ ${Number(totalRevenue).toLocaleString('pt-BR')}
Margem: ${Math.round(Number(marginRate) * 100)}%

Pergunta: ${question || 'Como posso melhorar meu score e qual crédito está disponível para mim agora?'}`,
      },
    ], 512)

    return NextResponse.json({ resposta })
  } catch (error) {
    console.error('AI crédito erro:', error)
    return NextResponse.json({ error: 'Erro ao gerar análise' }, { status: 500 })
  }
}
