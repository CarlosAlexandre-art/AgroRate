import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

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

// Sazonalidade agrícola brasileira — fator de oportunidade de crédito por mês
function getSazonalidade(mes: number): { fator: string; descricao: string } {
  const sazo: Record<number, { fator: string; descricao: string }> = {
    1:  { fator: 'ALTA',  descricao: 'Colheita soja Cerrado — receita prevista' },
    2:  { fator: 'ALTA',  descricao: 'Pico colheita soja — melhor momento para crédito' },
    3:  { fator: 'MEDIA', descricao: '1ª safra milho — fluxo de caixa positivo' },
    4:  { fator: 'MEDIA', descricao: 'Entressafra início — custo de manutenção' },
    5:  { fator: 'BAIXA', descricao: 'Entressafra — menor liquidez do produtor' },
    6:  { fator: 'BAIXA', descricao: 'Safrinha milho — aguardar colheita' },
    7:  { fator: 'MEDIA', descricao: 'Colheita safrinha — novo fluxo de caixa' },
    8:  { fator: 'MEDIA', descricao: 'Planejamento safra nova — momento de capitalizar' },
    9:  { fator: 'ALTA',  descricao: 'Início plantio soja — crédito de custeio em demanda' },
    10: { fator: 'ALTA',  descricao: 'Plantio intenso — maior demanda por insumos e serviços' },
    11: { fator: 'MEDIA', descricao: 'Plantio tardio — ajustes de plano' },
    12: { fator: 'BAIXA', descricao: 'Fim de ano — menor atividade bancária' },
  }
  return sazo[mes] ?? { fator: 'MEDIA', descricao: 'Mês neutro' }
}

// Preços de referência de commodities por mês (aproximados, mercado BR)
function getCommodityContext(mes: number): string {
  const tendencias: Record<number, string> = {
    1:  'Soja: pressionada pela oferta BR. Milho: firme pré-colheita. Boi: alta temporada.',
    2:  'Soja: colheita BR pressiona preço. Milho: queda sazonal. Boi: estável.',
    3:  'Soja: exportações aceleradas. Milho: colheita 1ª safra. Boi: alta.',
    4:  'Soja: dólar define. Milho: 2ª safra em formação. Boi: estável.',
    5:  'Soja: estoque pós-colheita. Milho: safrinha crescendo. Boi: retração.',
    6:  'Soja: demanda China. Milho: safrinha maturação. Boi: pastagem escassa.',
    7:  'Soja: exportação 2º semestre. Milho: colheita safrinha — queda. Boi: pico oferta.',
    8:  'Soja: início nova temporada. Milho: oferta alta pós-colheita. Boi: queda.',
    9:  'Soja: plantio = demanda insumos. Milho: estoque alto. Boi: retomada.',
    10: 'Soja: expectativas safra nova. Milho: fundo de preço. Boi: recuperação.',
    11: 'Soja: estimativas USDA. Milho: demanda etanol. Boi: alta pré-festas.',
    12: 'Soja: clima determina. Milho: demanda festas. Boi: máximo do ano.',
  }
  return tendencias[mes] ?? 'Mercado indefinido.'
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { allowed } = rateLimit(`ai:${authUser.id}`, 20, 3600_000)
    if (!allowed) {
      return NextResponse.json({ error: 'Limite de chamadas IA atingido. Tente novamente em 1 hora.' }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: {
        name: true,
        properties: {
          take: 1,
          select: {
            revenues:   { orderBy: { date: 'asc' }, select: { amount: true, date: true } },
            costs:      { orderBy: { date: 'asc' }, select: { amount: true, date: true } },
            activities: { where: { status: 'DONE' }, orderBy: { updatedAt: 'asc' }, select: { updatedAt: true } },
            documents:  { select: { category: true, expiry: true, scoreImpact: true, required: true } },
            agroRate: {
              select: {
                score: true, category: true,
                productionScore: true, efficiencyScore: true, behaviorScore: true, operationalScore: true,
                paymentOnTimeRate: true, dataCompleteness: true, trendHistory: true,
                quodScore: true, quodFaixa: true, quodVerifiedAt: true,
                cafirNumero: true, cafirSituacao: true,
                carNumero: true, carSituacao: true,
                dapNumero: true, dapSituacao: true,
                updatedAt: true,
              },
            },
            creditRequests: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { requestedAmount: true, status: true, createdAt: true },
            },
          },
        },
      },
    })

    const property = user?.properties[0]
    const agroRate = property?.agroRate
    if (!agroRate) return NextResponse.json({ error: 'Score não calculado ainda' }, { status: 404 })

    const revenues   = property?.revenues ?? []
    const costs      = property?.costs ?? []
    const activities = property?.activities ?? []
    const documents  = property?.documents ?? []
    const creditRequests = property?.creditRequests ?? []

    // Regressão de receita por mês
    const revenueByMonth: Record<string, number> = {}
    for (const r of revenues) {
      const k = monthKey(new Date(r.date))
      revenueByMonth[k] = (revenueByMonth[k] ?? 0) + Number(r.amount)
    }
    const monthKeys = Object.keys(revenueByMonth).sort()
    const revPoints = monthKeys.map((k, i) => ({ x: i, y: revenueByMonth[k] }))
    const revReg = linearRegression(revPoints)

    // Regressão de atividades (últimos 6 meses)
    const actsByMonth: Record<string, number> = {}
    for (const a of activities) {
      const k = monthKey(new Date(a.updatedAt))
      actsByMonth[k] = (actsByMonth[k] ?? 0) + 1
    }
    const actKeys   = Object.keys(actsByMonth).sort().slice(-6)
    const actPoints = actKeys.map((k, i) => ({ x: i, y: actsByMonth[k] }))
    const actReg    = linearRegression(actPoints)

    const currentScore = agroRate.score
    const trend = revReg.b > 100 ? 'crescente' : revReg.b < -100 ? 'decrescente' : 'estável'
    const monthlyDelta = Math.round((revReg.b / (revPoints[revPoints.length - 1]?.y || 1)) * 50)

    const pred30 = Math.min(1000, Math.max(0, currentScore + monthlyDelta))
    const pred60 = Math.min(1000, Math.max(0, currentScore + monthlyDelta * 2))
    const pred90 = Math.min(1000, Math.max(0, currentScore + monthlyDelta * 3))

    const CATEGORIES = [
      { min: 900, name: 'ELITE' }, { min: 750, name: 'HIGH' },
      { min: 600, name: 'GOOD' }, { min: 450, name: 'REGULAR' },
      { min: 300, name: 'LOW' }, { min: 0, name: 'CRITICAL' },
    ]
    const nextCat = CATEGORIES.find(c => c.min > currentScore && c.min <= pred90)
    const pontosParaProxima = CATEGORIES.find(c => c.min > currentScore)?.min
    const diasParaProxima = pontosParaProxima && monthlyDelta > 0
      ? Math.ceil(((pontosParaProxima - currentScore) / monthlyDelta) * 30) : null

    // Contexto sazonal
    const mesAtual = new Date().getMonth() + 1
    const sazo = getSazonalidade(mesAtual)
    const commodities = getCommodityContext(mesAtual)

    // Status de documentos críticos
    const docStatus = {
      cafir: agroRate.cafirNumero ? `verificado (${agroRate.cafirSituacao ?? 'ativo'})` : 'não verificado',
      car:   agroRate.carNumero   ? `verificado (${agroRate.carSituacao ?? 'ativo'})`   : 'não verificado',
      dap:   agroRate.dapNumero   ? 'verificada' : 'não verificada',
      quod:  agroRate.quodScore   ? `${agroRate.quodScore} (${agroRate.quodFaixa})` : 'não consultado',
    }
    const docsVencendo = documents.filter(d => {
      if (!d.expiry) return false
      const dias = Math.ceil((new Date(d.expiry).getTime() - Date.now()) / 86400000)
      return dias > 0 && dias <= 60
    })

    // Histórico de crédito na plataforma
    const creditHistory = creditRequests.length > 0
      ? creditRequests.map(c => `${c.status} — R$${Number(c.requestedAmount).toFixed(0)}`).join(', ')
      : 'nenhuma solicitação anterior'

    const planoIA = await groq([{
      role: 'user',
      content: `Você é um analista sênior de crédito rural especializado em produtores brasileiros.
Analise os dados e gere um plano de ação personalizado para melhorar o AgroRate Score.

SCORE ATUAL: ${currentScore}/1000 (${agroRate.category})
Sub-scores: Produção ${agroRate.productionScore}/250 | Eficiência ${agroRate.efficiencyScore}/250 | Comportamento ${agroRate.behaviorScore}/250 | Operacional ${agroRate.operationalScore}/250
Taxa de pontualidade: ${(Number(agroRate.paymentOnTimeRate) * 100).toFixed(0)}% | Completude de dados: ${(Number(agroRate.dataCompleteness) * 100).toFixed(0)}%

ANÁLISE DE TENDÊNCIA (regressão linear):
- Tendência de receita: ${trend} (slope R$${revReg.b.toFixed(0)}/mês, R²=${revReg.r2})
- Tendência de atividades: slope ${actReg.b.toFixed(1)}/mês
- Previsão 30 dias: ${pred30} pts | 60 dias: ${pred60} pts | 90 dias: ${pred90} pts

${pontosParaProxima ? `Faltam ${pontosParaProxima - currentScore} pontos para a próxima categoria.` : 'Já está na categoria máxima.'}
${diasParaProxima ? `Estimativa de ${diasParaProxima} dias para atingir a próxima categoria mantendo o ritmo atual.` : ''}

DOCUMENTOS REGULATÓRIOS:
- CAFIR: ${docStatus.cafir} | CAR: ${docStatus.car} | DAP/CAF: ${docStatus.dap} | QUOD: ${docStatus.quod}
${docsVencendo.length > 0 ? `- ⚠️ ${docsVencendo.length} documento(s) vencendo em menos de 60 dias` : '- Documentos em dia'}

HISTÓRICO DE CRÉDITO NA PLATAFORMA: ${creditHistory}

CONTEXTO SAZONAL (${new Date().toLocaleString('pt-BR', { month: 'long' })}):
- Oportunidade de crédito: ${sazo.fator} — ${sazo.descricao}
- Mercado: ${commodities}

Gere:
1. Diagnóstico em 2 frases (sub-score mais fraco + impacto no crédito)
2. 3 ações específicas e práticas para os próximos 30 dias (considere a sazonalidade atual)
3. Meta realista: score esperado em 90 dias e linha de crédito que poderá acessar`,
    }], 700)

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
        receita:     { slope: Math.round(revReg.b), r2: revReg.r2, mesesAnalisados: revPoints.length },
        atividades:  { slope: Math.round(actReg.b * 10) / 10, mesesAnalisados: actPoints.length },
        velocidadeScore: Math.round(revReg.b / 1000),
      },
      sazonalidade: {
        mes: new Date().toLocaleString('pt-BR', { month: 'long' }),
        fatorOportunidade: sazo.fator,
        contexto: sazo.descricao,
        commodities,
      },
      documentos: {
        cafir: docStatus.cafir,
        car:   docStatus.car,
        dap:   docStatus.dap,
        quod:  docStatus.quod,
        vencendoEm60dias: docsVencendo.length,
      },
      planoIA,
      modelo: 'Regressão Linear + Sazonalidade Agrícola BR + LLaMA 3.3 70B',
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
