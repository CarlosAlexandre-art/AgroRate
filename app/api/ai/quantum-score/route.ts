import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'
import { solveQUBOWithCIQuanta } from '@/lib/ciquanta'

export const maxDuration = 60

// Cada ação possível para melhorar o score de crédito rural
interface ScoreAction {
  id: string
  label: string
  ganhoEstimado: number   // pontos de score
  esforco: number         // 1-5 (1=fácil, 5=difícil)
  categoria: 'documento' | 'dados' | 'comportamento' | 'financeiro'
  conflitaCom?: string[]  // ids de ações mutuamente exclusivas
}

function buildActionsForUser(agroRate: any, property: any): ScoreAction[] {
  const actions: ScoreAction[] = []

  if (!agroRate.cafirNumero)
    actions.push({ id: 'cafir', label: 'Verificar imóvel no CAFIR', ganhoEstimado: 35, esforco: 2, categoria: 'documento' })
  if (!agroRate.carNumero)
    actions.push({ id: 'car', label: 'Regularizar CAR da propriedade', ganhoEstimado: 40, esforco: 3, categoria: 'documento' })
  if (!agroRate.dapNumero)
    actions.push({ id: 'dap', label: 'Emitir DAP/CAF', ganhoEstimado: 25, esforco: 2, categoria: 'documento' })
  if (!agroRate.quodScore)
    actions.push({ id: 'quod', label: 'Consultar bureau de crédito (QUOD)', ganhoEstimado: 20, esforco: 1, categoria: 'financeiro' })

  if (Number(agroRate.dataCompleteness) < 0.8)
    actions.push({ id: 'dados', label: 'Completar dados da propriedade (≥80%)', ganhoEstimado: 30, esforco: 2, categoria: 'dados' })

  if (agroRate.productionScore < 180)
    actions.push({ id: 'producao', label: 'Registrar produção e colheitas dos últimos 12 meses', ganhoEstimado: 45, esforco: 3, categoria: 'dados' })

  if (agroRate.efficiencyScore < 180)
    actions.push({ id: 'eficiencia', label: 'Adicionar atividades e insumos da safra atual', ganhoEstimado: 40, esforco: 2, categoria: 'dados' })

  if (Number(agroRate.paymentOnTimeRate) < 0.9)
    actions.push({ id: 'pontualidade', label: 'Quitar pendências em aberto no prazo', ganhoEstimado: 50, esforco: 4, categoria: 'comportamento' })

  const revenues = property?.revenues ?? []
  if (revenues.length < 6)
    actions.push({ id: 'receitas', label: 'Lançar receitas dos últimos 6 meses', ganhoEstimado: 28, esforco: 2, categoria: 'financeiro' })

  const docs = property?.documents ?? []
  const vencendo = docs.filter((d: any) => {
    if (!d.expiry) return false
    const dias = Math.ceil((new Date(d.expiry).getTime() - Date.now()) / 86400000)
    return dias > 0 && dias <= 30
  })
  if (vencendo.length > 0)
    actions.push({ id: 'docs_vencer', label: `Renovar ${vencendo.length} documento(s) vencendo em 30 dias`, ganhoEstimado: 20, esforco: 2, categoria: 'documento' })

  if (agroRate.behaviorScore < 150)
    actions.push({ id: 'historico', label: 'Solicitar crédito de menor valor para construir histórico', ganhoEstimado: 35, esforco: 3, categoria: 'comportamento', conflitaCom: ['pontualidade'] })

  return actions.slice(0, 20) // CIQuanta: máx 20 qubits
}

// QUBO do problema de seleção de ações:
// Minimizar: -ganho_total + penalidade_de_esforço + penalidade_de_conflitos
// x_i = 1 → executar ação i
function buildActionQUBO(actions: ScoreAction[], budgetEsforco = 10): number[][] {
  const n = actions.length
  const Q: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  const lambda = 5 // peso da penalidade de orçamento de esforço

  for (let i = 0; i < n; i++) {
    const { ganhoEstimado, esforco } = actions[i]
    // Recompensa por ganho normalizado, custo por esforço
    Q[i][i] = -(ganhoEstimado / 10) + (esforco * lambda * (2 * esforco - 2 * budgetEsforco - 1)) / (budgetEsforco ** 2)

    for (let j = i + 1; j < n; j++) {
      // Penalidade de conflito explícito
      const conflita = actions[i].conflitaCom?.includes(actions[j].id) ||
                       actions[j].conflitaCom?.includes(actions[i].id)
      const penConflito = conflita ? 8 : 0

      // Penalidade de orçamento (ambas selecionadas aumentam esforço total)
      const penOrcamento = (2 * lambda * actions[i].esforco * actions[j].esforco) / (budgetEsforco ** 2)

      Q[i][j] = penOrcamento + penConflito
    }
  }

  return Q
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { allowed } = rateLimit(`quantum-score:${authUser.id}`, 10, 3600_000)
    if (!allowed) return NextResponse.json({ error: 'Limite atingido. Tente em 1 hora.' }, { status: 429 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: {
        properties: {
          take: 1,
          select: {
            revenues:  { select: { amount: true, date: true } },
            documents: { select: { category: true, expiry: true, required: true } },
            agroRate: {
              select: {
                score: true, category: true,
                productionScore: true, efficiencyScore: true,
                behaviorScore: true, operationalScore: true,
                paymentOnTimeRate: true, dataCompleteness: true,
                cafirNumero: true, cafirSituacao: true,
                carNumero: true, carSituacao: true,
                dapNumero: true, dapSituacao: true,
                quodScore: true, quodFaixa: true,
              },
            },
          },
        },
      },
    })

    const property = user?.properties[0]
    const agroRate = property?.agroRate
    if (!agroRate) return NextResponse.json({ error: 'Score não calculado ainda' }, { status: 404 })

    const actions = buildActionsForUser(agroRate, property)
    if (actions.length === 0) {
      return NextResponse.json({
        scoreAtual: agroRate.score,
        mensagem: 'Parabéns! Todos os fatores de melhoria já estão completos.',
        acoes: [],
        quantum: { solver: 'N/A', motivo: 'Nenhuma ação disponível' },
      })
    }

    const Q = buildActionQUBO(actions)

    let solution: number[]
    let quantumInfo: Record<string, unknown>
    let jobId = ''

    if (process.env.CIQUANTA_API_KEY) {
      try {
        const cqResult = await solveQUBOWithCIQuanta(Q, `agrorate-score-${authUser.id.slice(0, 8)}`)
        solution = cqResult.solution
        jobId = cqResult.jobId
        quantumInfo = {
          solver: `CIQuanta — ${process.env.CIQUANTA_BACKEND ?? 'Jiuyuan'}`,
          backend: 'hardware_quantum',
          jobId,
          energy: cqResult.energy,
          qubits: actions.length,
        }
      } catch {
        // Fallback: greedy por ganho/esforço
        solution = greedySolution(actions)
        quantumInfo = { solver: 'Greedy heurístico (fallback)', backend: 'classical' }
      }
    } else {
      solution = greedySolution(actions)
      quantumInfo = { solver: 'Greedy heurístico', backend: 'classical' }
    }

    const acoesRecomendadas = actions
      .filter((_, i) => solution[i] === 1)
      .sort((a, b) => b.ganhoEstimado - a.ganhoEstimado)

    const ganhoTotal = acoesRecomendadas.reduce((s, a) => s + a.ganhoEstimado, 0)
    const scoreProjetado = Math.min(1000, agroRate.score + ganhoTotal)

    return NextResponse.json({
      scoreAtual: agroRate.score,
      categoria: agroRate.category,
      scoreProjetado,
      ganhoEstimado: ganhoTotal,
      acoes: acoesRecomendadas.map(a => ({
        label: a.label,
        ganhoEstimado: a.ganhoEstimado,
        esforco: a.esforco,
        categoria: a.categoria,
      })),
      todasAcoes: actions.length,
      acoesRecomendadas: acoesRecomendadas.length,
      quantum: quantumInfo,
      modelo: 'QUBO Knapsack — Otimização Quântica de Score de Crédito Rural',
    })
  } catch (e: any) {
    console.error('quantum-score erro:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

function greedySolution(actions: ScoreAction[]): number[] {
  const indexed = actions.map((a, i) => ({ i, ratio: a.ganhoEstimado / a.esforco }))
  indexed.sort((a, b) => b.ratio - a.ratio)
  const sol = new Array(actions.length).fill(0)
  let esfortoUsado = 0
  for (const { i } of indexed) {
    if (esfortoUsado + actions[i].esforco <= 10) {
      sol[i] = 1
      esfortoUsado += actions[i].esforco
    }
  }
  return sol
}
