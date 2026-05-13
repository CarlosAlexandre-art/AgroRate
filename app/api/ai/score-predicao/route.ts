import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

// Regressão linear simples: y = a + b*x  (mínimos quadrados)
function linearRegression(points: { x: number; y: number }[]): { a: number; b: number; r2: number } {
  const n = points.length
  if (n < 2) return { a: points[0]?.y ?? 0, b: 0, r2: 0 }
  const sumX  = points.reduce((s, p) => s + p.x, 0)
  const sumY  = points.reduce((s, p) => s + p.y, 0)
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)
  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const a = (sumY - b * sumX) / n
  const yMean = sumY / n
  const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0)
  const ssRes = points.reduce((s, p) => s + (p.y - (a + b * p.x)) ** 2, 0)
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0
  return { a, b, r2: Math.round(r2 * 100) / 100 }
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      include: {
        properties: {
          include: {
            revenues: { orderBy: { date: 'asc' }, select: { amount: true, date: true } },
            costs:    { orderBy: { date: 'asc' }, select: { amount: true, date: true } },
            activities: { where: { status: 'DONE' }, orderBy: { updatedAt: 'asc' }, select: { updatedAt: true } },
          },
          take: 1,
        },
        agroRate: { select: { score: true, category: true, productionScore: true, efficiencyScore: true, behaviorScore: true, operationalScore: true, updatedAt: true } },
      },
    })

    const agroRate = user?.agroRate
    if (!agroRate) return NextResponse.json({ error: 'Score não calculado ainda' }, { status: 404 })

    const property = user?.properties[0]
    const revenues = property?.revenues ?? []
    const costs    = property?.costs ?? []
    const activities = property?.activities ?? []

    // Agrupa receita por mês (últimos 12 meses)
    const revenueByMonth: Record<string, number> = {}
    for (const r of revenues) {
      const k = monthKey(new Date(r.date))
      revenueByMonth[k] = (revenueByMonth[k] ?? 0) + Number(r.amount)
    }

    // Pontos para regressão linear (x = mês relativo, y = receita)
    const monthKeys = Object.keys(revenueByMonth).sort()
    const revPoints = monthKeys.map((k, i) => ({ x: i, y: revenueByMonth[k] }))
    const revReg = linearRegression(revPoints)

    // Tendência de atividades (últimos 6 meses)
    const actsByMonth: Record<string, number> = {}
    for (const a of activities) {
      const k = monthKey(new Date(a.updatedAt))
      actsByMonth[k] = (actsByMonth[k] ?? 0) + 1
    }
    const actKeys = Object.keys(actsByMonth).sort().slice(-6)
    const actPoints = actKeys.map((k, i) => ({ x: i, y: actsByMonth[k] }))
    const actReg = linearRegression(actPoints)

    // Velocidade de crescimento do score (pontos/mês)
    const scoreVelocity = revReg.b > 0 ? Math.round(revReg.b / 1000) : 0

    // Previsão de score em 30/60/90 dias
    const currentScore = agroRate.score
    const trend = revReg.b > 100 ? 'crescente' : revReg.b < -100 ? 'decrescente' : 'estável'
    const monthlyDelta = Math.round((revReg.b / (revPoints[revPoints.length - 1]?.y || 1)) * 50)

    const pred30  = Math.min(1000, Math.max(0, currentScore + monthlyDelta))
    const pred60  = Math.min(1000, Math.max(0, currentScore + monthlyDelta * 2))
    const pred90  = Math.min(1000, Math.max(0, currentScore + monthlyDelta * 3))

    // Próxima categoria
    const CATEGORIES = [
      { min: 900, name: 'ELITE' }, { min: 750, name: 'HIGH' },
      { min: 600, name: 'GOOD' }, { min: 450, name: 'REGULAR' },
      { min: 300, name: 'LOW' }, { min: 0, name: 'CRITICAL' },
    ]
    const nextCat = CATEGORIES.find(c => c.min > currentScore && c.min <= pred90)
    const pontosParaProxima = CATEGORIES.find(c => c.min > currentScore)?.min
    const diasParaProxima = pontosParaProxima && monthlyDelta > 0
      ? Math.ceil(((pontosParaProxima - currentScore) / monthlyDelta) * 30)
      : null

    // NIM gera plano de ação personalizado
    const planoIA = await groq([{
      role: 'user',
      content: `Você é um analista de crédito rural especialista em produtores brasileiros.
Analise os dados abaixo e gere um plano de ação personalizado para melhorar o AgroRate Score.

Score atual: ${currentScore}/1000 (${agroRate.category})
Sub-scores: Produção ${agroRate.productionScore} | Eficiência ${agroRate.efficiencyScore} | Comportamento ${agroRate.behaviorScore} | Operacional ${agroRate.operationalScore}

Análise de tendência (regressão linear):
- Tendência de receita: ${trend} (slope R$ ${revReg.b.toFixed(0)}/mês, R² = ${revReg.r2})
- Tendência de atividades: slope ${actReg.b.toFixed(1)}/mês
- Previsão 30 dias: ${pred30} pts | 60 dias: ${pred60} pts | 90 dias: ${pred90} pts

${pontosParaProxima ? `Faltam ${pontosParaProxima - currentScore} pontos para a próxima categoria.` : 'Já está na categoria máxima.'}
${diasParaProxima ? `Estimativa de ${diasParaProxima} dias para atingir a próxima categoria mantendo o ritmo atual.` : ''}

Gere:
1. Diagnóstico em 2 frases (sub-score mais fraco + impacto)
2. 3 ações específicas e práticas para os próximos 30 dias
3. Meta realista: score esperado em 90 dias e como atingir`,
    }], 600)

    return NextResponse.json({
      scoreAtual: currentScore,
      categoria: agroRate.category,
      tendencia: trend,
      previsao: { dias30: pred30, dias60: pred60, dias90: pred90 },
      proximaCategoria: pontosParaProxima ? {
        nome: nextCat?.name ?? CATEGORIES.find(c => c.min > currentScore)?.name,
        pontosNecessarios: pontosParaProxima - currentScore,
        diasEstimados: diasParaProxima,
      } : null,
      regressao: {
        receita: { slope: Math.round(revReg.b), r2: revReg.r2, mesesAnalisados: revPoints.length },
        atividades: { slope: Math.round(actReg.b * 10) / 10, mesesAnalisados: actPoints.length },
        velocidadeScore: scoreVelocity,
      },
      planoIA,
      modelo: 'Regressão Linear + NVIDIA NIM llama-3.3-70b',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
