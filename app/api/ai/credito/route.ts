import { NextRequest, NextResponse } from 'next/server'
import { groq } from '@/lib/groq'

export async function POST(request: NextRequest) {
  try {
    const { score, category, productionScore, efficiencyScore, behaviorScore, operationalScore, totalRevenue, marginRate, question } = await request.json()

    const temScore = score != null && !isNaN(Number(score))
    const contexto = temScore
      ? `Dados do produtor:
- AgroRate Score: ${score} (categoria: ${category})
- Produção: ${productionScore}/1000 | Eficiência: ${efficiencyScore}/1000
- Comportamento: ${behaviorScore}/1000 | Operacional: ${operationalScore}/1000
- Receita: R$ ${Number(totalRevenue || 0).toLocaleString('pt-BR')} | Margem: ${Math.round(Number(marginRate || 0) * 100)}%`
      : 'O produtor ainda não tem dados de produção cadastrados.'

    const resposta = await groq([
      {
        role: 'system',
        content: `Você é o Conselheiro AgroRate, assistente do sistema AgroRate de avaliação de produtores rurais brasileiros.
Seu papel é ajudar produtores rurais a entender seu perfil no sistema, interpretar métricas e sugerir melhorias na operação.
Responda sempre em português, de forma direta e prática, com no máximo 3 parágrafos curtos.
Não recuse perguntas sobre o sistema AgroRate — seu objetivo é ajudar o produtor a usar a plataforma.`,
      },
      {
        role: 'user',
        content: `${contexto}

Pergunta do produtor: ${question || 'Como posso melhorar meu score no AgroRate?'}`,
      },
    ], 512)

    return NextResponse.json({ resposta })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AI crédito erro:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
