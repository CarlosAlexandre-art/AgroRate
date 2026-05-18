import { prisma } from '@/lib/prisma'

const db = prisma as any

export type ToolName =
  | 'buscar_score_desagregado'
  | 'buscar_historico_score'
  | 'buscar_documentos_propriedade'
  | 'buscar_ofertas_credito'
  | 'buscar_verificacoes_oficiais'
  | 'buscar_margem_financeira'
  | 'criar_alerta_credito'

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'buscar_score_desagregado',
      description: 'Busca o score AgroRate completo com os 4 sub-scores: produção, eficiência, comportamento e operacional. Retorna score atual, categoria e benchmarks.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID da propriedade (opcional, usa o da sessão)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_historico_score',
      description: 'Busca o histórico de evolução do score AgroRate ao longo do tempo para análise de tendência.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID da propriedade (opcional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_documentos_propriedade',
      description: 'Lista todos os documentos da propriedade com seu impacto no score, status de validade e se são obrigatórios.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID da propriedade (opcional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_ofertas_credito',
      description: 'Lista ofertas de crédito disponíveis filtradas pelo score atual do produtor.',
      parameters: {
        type: 'object',
        properties: {
          scoreAtual: { type: 'number', description: 'Score atual do produtor para filtrar ofertas compatíveis' },
        },
        required: ['scoreAtual'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_verificacoes_oficiais',
      description: 'Verifica o status das certificações oficiais: QUOD, CAFIR, CAR, CAF e DAP do produtor.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID da propriedade (opcional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_margem_financeira',
      description: 'Analisa receitas vs custos dos últimos 90 dias para calcular margem financeira e fluxo de caixa.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID da propriedade (opcional)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'criar_alerta_credito',
      description: 'Cria um alerta no sistema para notificar o produtor sobre oportunidades ou riscos de crédito.',
      parameters: {
        type: 'object',
        properties: {
          propertyId: { type: 'string', description: 'ID da propriedade' },
          mensagem: { type: 'string', description: 'Mensagem do alerta' },
          tipo: { type: 'string', description: 'Tipo do alerta: CREDITO, SCORE, DOCUMENTO, RISCO' },
        },
        required: ['mensagem', 'tipo'],
      },
    },
  },
]

export async function executarTool(
  nome: ToolName,
  args: Record<string, unknown>,
  propertyId: string,
): Promise<string> {
  const pid = (args.propertyId as string) || propertyId
  try {
    switch (nome) {
      case 'buscar_score_desagregado': {
        const rate = await db.agroRate.findUnique({
          where: { propertyId: pid },
          select: {
            score: true, category: true,
            productionScore: true, efficiencyScore: true, behaviorScore: true, operationalScore: true,
            totalRevenue: true, totalCosts: true, marginRate: true,
            dataCompleteness: true, paymentOnTimeRate: true, lastCalculated: true,
          },
        })
        if (!rate) return 'Score AgroRate ainda não calculado para esta propriedade.'
        return JSON.stringify({
          score: rate.score, categoria: rate.category,
          subScores: {
            producao: rate.productionScore,
            eficiencia: rate.efficiencyScore,
            comportamento: rate.behaviorScore,
            operacional: rate.operationalScore,
          },
          financeiro: {
            receita: Number(rate.totalRevenue),
            custos: Number(rate.totalCosts),
            margem: Number(rate.marginRate),
          },
          completude: Number(rate.dataCompleteness),
          pontualidade: Number(rate.paymentOnTimeRate),
          ultimoCalculo: rate.lastCalculated,
        })
      }

      case 'buscar_historico_score': {
        const rate = await db.agroRate.findUnique({
          where: { propertyId: pid },
          select: { trendHistory: true, score: true, category: true },
        })
        if (!rate) return 'Sem histórico de score disponível.'
        return JSON.stringify({ scoreAtual: rate.score, categoria: rate.category, historico: rate.trendHistory })
      }

      case 'buscar_documentos_propriedade': {
        const docs = await db.propertyDocument.findMany({
          where: { propertyId: pid },
          select: { name: true, category: true, scoreImpact: true, required: true, expiry: true, createdAt: true },
          orderBy: { scoreImpact: 'desc' },
        })
        const hoje = new Date()
        const resultado = docs.map((d: any) => ({
          nome: d.name,
          categoria: d.category,
          impactoScore: d.scoreImpact,
          obrigatorio: d.required,
          valido: d.expiry ? new Date(d.expiry) > hoje : true,
          vencimento: d.expiry,
        }))
        const vencidos = resultado.filter((d: any) => !d.valido).length
        const impactoTotal = resultado.reduce((s: number, d: any) => s + (d.impactoScore || 0), 0)
        return JSON.stringify({ total: docs.length, vencidos, impactoTotal, documentos: resultado })
      }

      case 'buscar_ofertas_credito': {
        const score = (args.scoreAtual as number) || 500
        const ofertas = await db.creditOffer.findMany({
          where: { isActive: true, minScore: { lte: score }, maxScore: { gte: score } },
          select: {
            name: true, description: true,
            minAmount: true, maxAmount: true,
            minRate: true, maxRate: true,
            minTerm: true, maxTerm: true,
            partner: { select: { name: true, type: true } },
          },
          take: 10,
        })
        return JSON.stringify({ scoreConsultado: score, totalOfertas: ofertas.length, ofertas })
      }

      case 'buscar_verificacoes_oficiais': {
        const rate = await db.agroRate.findUnique({
          where: { propertyId: pid },
          select: {
            quodScore: true, quodFaixa: true, quodVerifiedAt: true, quodValidUntil: true,
            cafirNumero: true, cafirSituacao: true, cafirVerifiedAt: true, cafirValidUntil: true,
            carNumero: true, carSituacao: true, carVerifiedAt: true, carValidUntil: true,
            cafNumero: true, cafSituacao: true, cafVerifiedAt: true, cafValidUntil: true,
            dapNumero: true, dapSituacao: true, dapVerifiedAt: true, dapValidUntil: true,
          },
        })
        if (!rate) return 'Nenhuma verificação oficial realizada ainda.'
        const hoje = new Date()
        return JSON.stringify({
          QUOD: { score: rate.quodScore, faixa: rate.quodFaixa, valido: rate.quodValidUntil ? new Date(rate.quodValidUntil) > hoje : false },
          CAFIR: { numero: rate.cafirNumero, situacao: rate.cafirSituacao, valido: rate.cafirValidUntil ? new Date(rate.cafirValidUntil) > hoje : false },
          CAR: { numero: rate.carNumero, situacao: rate.carSituacao, valido: rate.carValidUntil ? new Date(rate.carValidUntil) > hoje : false },
          CAF: { numero: rate.cafNumero, situacao: rate.cafSituacao, valido: rate.cafValidUntil ? new Date(rate.cafValidUntil) > hoje : false },
          DAP: { numero: rate.dapNumero, situacao: rate.dapSituacao, valido: rate.dapValidUntil ? new Date(rate.dapValidUntil) > hoje : false },
        })
      }

      case 'buscar_margem_financeira': {
        const noventa = new Date()
        noventa.setDate(noventa.getDate() - 90)
        const [receitas, custos] = await Promise.all([
          db.revenue.findMany({
            where: { propertyId: pid, date: { gte: noventa } },
            select: { amount: true, category: true },
          }),
          db.cost.findMany({
            where: { propertyId: pid, date: { gte: noventa } },
            select: { amount: true, category: true },
          }),
        ])
        const totalR = receitas.reduce((s: number, r: any) => s + Number(r.amount), 0)
        const totalC = custos.reduce((s: number, c: any) => s + Number(c.amount), 0)
        return JSON.stringify({
          periodo: '90 dias',
          receitas: { total: totalR, qtd: receitas.length },
          custos: { total: totalC, qtd: custos.length },
          lucro: totalR - totalC,
          margem: totalR > 0 ? ((totalR - totalC) / totalR * 100).toFixed(1) + '%' : '0%',
        })
      }

      case 'criar_alerta_credito': {
        await db.alert.create({
          data: {
            propertyId: pid,
            message: args.mensagem as string,
            type: (args.tipo as string) || 'CREDITO',
          },
        })
        return `Alerta criado com sucesso: ${args.mensagem}`
      }

      default:
        return `Ferramenta "${nome}" não reconhecida.`
    }
  } catch (e: any) {
    return `Erro ao executar ${nome}: ${e?.message ?? 'erro desconhecido'}`
  }
}
