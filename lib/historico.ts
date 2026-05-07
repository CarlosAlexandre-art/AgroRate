import { prisma } from '@/lib/prisma'

// ─── Tipos de histórico ───────────────────────────────────────────────────────

export interface HistoricoEntry {
  id: string
  userId: string
  tipo: 'SCORE_CALCULATION' | 'DOCUMENT_UPLOAD' | 'CREDIT_REQUEST' | 'VERIFICATION' | 'PLAN_CHANGE' | 'SHARING'
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  entidadeId: string
  entidadeTipo: string
  dadosAntigos?: any
  dadosNovos?: any
  descricao: string
  ip?: string
  userAgent?: string
  createdAt: Date
}

// ─── Criar entrada no histórico ─────────────────────────────────────────────────

export async function criarHistorico(params: {
  userId: string
  tipo: HistoricoEntry['tipo']
  acao: HistoricoEntry['acao']
  entidadeId: string
  entidadeTipo: string
  dadosAntigos?: any
  dadosNovos?: any
  descricao: string
  request?: Request
}) {
  try {
    const entry = {
      userId: params.userId,
      tipo: params.tipo,
      acao: params.acao,
      entidadeId: params.entidadeId,
      entidadeTipo: params.entidadeTipo,
      dadosAntigos: params.dadosAntigos ? JSON.stringify(params.dadosAntigos) : null,
      dadosNovos: params.dadosNovos ? JSON.stringify(params.dadosNovos) : null,
      descricao: params.descricao,
      ip: params.request ? getClientIP(params.request) : null,
      userAgent: params.request ? params.request.headers.get('user-agent') || undefined : undefined,
      createdAt: new Date()
    }

    // Salvar no banco (se tiver tabela de histórico)
    // await prisma.historicoAgroRate.create({ data: entry })

    console.log('📝 Histórico AgroRate criado:', entry)
    return entry
  } catch (error) {
    console.error('Erro ao criar histórico AgroRate:', error)
    return null
  }
}

// ─── Consultar histórico ─────────────────────────────────────────────────────

export async function consultarHistorico(params: {
  userId?: string
  tipo?: HistoricoEntry['tipo']
  dataInicio?: Date
  dataFim?: Date
  limite?: number
}) {
  try {
    // Consultar no banco (se tiver tabela)
    // const historico = await prisma.historicoAgroRate.findMany({
    //   where: {
    //     ...(params.userId && { userId: params.userId }),
    //     ...(params.tipo && { tipo: params.tipo }),
    //     createdAt: {
    //       ...(params.dataInicio && { gte: params.dataInicio }),
    //       ...(params.dataFim && { lte: params.dataFim })
    //     }
    //   },
    //   orderBy: { createdAt: 'desc' },
    //   take: params.limite || 100
    // })

    // return historico

    // Mock para teste
    return []
  } catch (error) {
    console.error('Erro ao consultar histórico AgroRate:', error)
    return []
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

// ─── Exportar histórico para PDF ───────────────────────────────────────────────

export async function exportarHistoricoPDF(params: {
  userId: string
  dataInicio?: Date
  dataFim?: Date
}) {
  const historico = await consultarHistorico(params)
  
  // Lógica de exportação PDF aqui
  // Usar jsPDF ou similar
  
  return {
    filename: `historico_agrorate_${new Date().toISOString().split('T')[0]}.pdf`,
    data: historico
  }
}
