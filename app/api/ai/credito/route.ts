import { groq } from '@/lib/groq'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan, hasAccess } from '@/lib/plan-guard'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Rate limit: 20 chamadas IA por hora por usuário
  const { allowed } = rateLimit(`ai:${user.id}`, 20, 3600_000)
  if (!allowed) {
    return NextResponse.json({ error: 'Limite de chamadas IA atingido. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const plan = await getUserPlan(user.id)
  if (!hasAccess(plan, 'pro')) {
    return NextResponse.json({ error: 'Plano Pro ou superior necessário para usar o Conselheiro IA.' }, { status: 403 })
  }

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
