import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { groq } from '@/lib/groq'

export const maxDuration = 60

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { supabaseId: authUser.id },
      select: {
        name: true,
        cpfMasked: true,
        cnpjMasked: true,
        phone: true,
        properties: {
          take: 1,
          select: {
            name: true,
            location: true,
            sizeHectares: true,
            fields: { select: { name: true, sizeHectares: true } },
            revenues: {
              orderBy: { date: 'desc' },
              take: 24,
              select: { amount: true, category: true, date: true },
            },
            costs: {
              orderBy: { date: 'desc' },
              take: 24,
              select: { amount: true, category: true, date: true },
            },
            activities: {
              where: { status: 'DONE' },
              orderBy: { updatedAt: 'desc' },
              take: 30,
              select: { type: true, updatedAt: true },
            },
            documents: {
              select: { name: true, category: true, expiry: true, scoreImpact: true, required: true },
            },
            agroRate: {
              select: {
                score: true, category: true,
                productionScore: true, efficiencyScore: true, behaviorScore: true, operationalScore: true,
                totalRevenue: true, totalCosts: true, productivity: true, marginRate: true,
                paymentOnTimeRate: true, dataCompleteness: true,
                // Verificações regulatórias
                quodScore: true, quodFaixa: true, quodCapacidade: true, quodVerifiedAt: true,
                cafirNumero: true, cafirSituacao: true, cafirArea: true,
                carNumero: true, carSituacao: true, carAreaTotal: true,
                dapNumero: true, dapSituacao: true,
                cafNumero: true, cafSituacao: true,
              },
            },
            creditRequests: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: { requestedAmount: true, approvedAmount: true, status: true, createdAt: true, interestRate: true, termMonths: true },
            },
          },
        },
        bankConsents: { select: { institution: true, active: true } },
      },
    })

    const property = user?.properties[0]
    const agroRate = property?.agroRate
    if (!agroRate) return NextResponse.json({ error: 'Score AgroRate não encontrado. Calcule o score primeiro.' }, { status: 404 })

    const hoje = new Date()
    const receitas  = property?.revenues ?? []
    const custos    = property?.costs ?? []
    const atividades = property?.activities ?? []
    const docs      = property?.documents ?? []
    const creditos  = property?.creditRequests ?? []

    // Resumo financeiro
    const receitaTotal  = receitas.reduce((s, r) => s + Number(r.amount), 0)
    const custoTotal    = custos.reduce((s, c) => s + Number(c.amount), 0)
    const resultadoLiquido = receitaTotal - custoTotal
    const margem = receitaTotal > 0 ? ((resultadoLiquido / receitaTotal) * 100).toFixed(1) : '0'
    const area   = Number(property?.sizeHectares ?? 0)
    const receitaHa = area > 0 ? (receitaTotal / area).toFixed(0) : 'n/d'

    // Receita dos últimos 6 meses
    const seisMesesAtras = new Date(hoje); seisMesesAtras.setMonth(hoje.getMonth() - 6)
    const receitaRecente = receitas
      .filter(r => new Date(r.date) >= seisMesesAtras)
      .reduce((s, r) => s + Number(r.amount), 0)

    // Documentos vencidos ou vencendo
    const docsVencidos  = docs.filter(d => d.expiry && new Date(d.expiry) < hoje)
    const docsVencendo  = docs.filter(d => {
      if (!d.expiry) return false
      const dias = Math.ceil((new Date(d.expiry).getTime() - hoje.getTime()) / 86400000)
      return dias > 0 && dias <= 90
    })
    const docsObrigatorios = docs.filter(d => d.required)

    // Histórico de crédito
    const creditosAprovados = creditos.filter(c => c.status === 'APPROVED' || c.status === 'CONTRACTED')
    const creditosRejeitados = creditos.filter(c => c.status === 'REJECTED')
    const creditosAtivos = creditos.filter(c => c.status === 'CONTRACTED')
    const comprometimentoAtual = creditosAtivos.reduce((s, c) => s + Number(c.requestedAmount), 0)

    // Verificações regulatórias
    const verif = {
      cafir: agroRate.cafirNumero
        ? `OK — Nº ${agroRate.cafirNumero} (${agroRate.cafirSituacao ?? 'regular'}, ${agroRate.cafirArea ?? area + ' ha'})`
        : 'NÃO VERIFICADO',
      car: agroRate.carNumero
        ? `OK — Nº ${agroRate.carNumero} (${agroRate.carSituacao ?? 'regular'}, ${agroRate.carAreaTotal ?? area + ' ha'})`
        : 'NÃO VERIFICADO',
      dap: agroRate.dapNumero ? `OK — DAP ${agroRate.dapSituacao ?? 'ativa'}` : 'NÃO VERIFICADO',
      caf: agroRate.cafNumero ? `OK — CAF ${agroRate.cafSituacao ?? 'ativa'}` : 'NÃO VERIFICADO',
      quod: agroRate.quodScore
        ? `Score QUOD ${agroRate.quodScore} — ${agroRate.quodFaixa} (capacidade: ${agroRate.quodCapacidade ?? 'não informada'})`
        : 'NÃO CONSULTADO',
    }

    // Consentimentos bancários (Open Finance)
    const openFinance = user?.bankConsents?.filter(b => b.active).map(b => b.institution).join(', ') || 'nenhum'

    const prompt = `Você é um analista sênior de crédito rural do sistema AgroRate (OryonAG) com 20 anos de experiência em financiamento agrícola brasileiro.

Realize um UNDERWRITING AGRÍCOLA completo e emita um parecer formal de crédito.

═══ IDENTIFICAÇÃO ═══
Produtor: ${user?.name}
CPF/CNPJ: ${user?.cpfMasked ?? user?.cnpjMasked ?? 'não informado'}
Propriedade: ${property?.name}${property?.location ? ` — ${property.location}` : ''}
Área total: ${area > 0 ? area + ' ha' : 'não informada'} | Talhões: ${property?.fields.length ?? 0}

═══ SCORE AGRODIGITAL ═══
AgroRate Score: ${agroRate.score}/1000 — Categoria: ${agroRate.category}
• Produção: ${agroRate.productionScore}/250
• Eficiência: ${agroRate.efficiencyScore}/250
• Comportamento: ${agroRate.behaviorScore}/250
• Operacional: ${agroRate.operationalScore}/250
Pontualidade de pagamentos: ${(Number(agroRate.paymentOnTimeRate) * 100).toFixed(0)}%
Completude de dados: ${(Number(agroRate.dataCompleteness) * 100).toFixed(0)}%

═══ CAPACIDADE DE PAGAMENTO ═══
Receita total registrada: R$${receitaTotal.toFixed(0)}
Custo total: R$${custoTotal.toFixed(0)}
Resultado líquido: R$${resultadoLiquido.toFixed(0)}
Margem: ${margem}%
Receita por hectare: R$${receitaHa}/ha
Receita últimos 6 meses: R$${receitaRecente.toFixed(0)}
Atividades concluídas: ${atividades.length}

═══ VERIFICAÇÕES REGULATÓRIAS ═══
CAFIR (imóvel rural): ${verif.cafir}
CAR (ambiental): ${verif.car}
DAP (agricultor familiar): ${verif.dap}
CAF (cooperativa): ${verif.caf}
Bureau QUOD: ${verif.quod}
Open Finance: ${openFinance}

═══ DOCUMENTAÇÃO ═══
Total de documentos: ${docs.length}
Documentos obrigatórios: ${docsObrigatorios.length}
Documentos vencidos: ${docsVencidos.length}
Documentos vencendo (90 dias): ${docsVencendo.length}

═══ HISTÓRICO DE CRÉDITO ═══
Solicitações anteriores: ${creditos.length}
Aprovados/Contratados: ${creditosAprovados.length}
Rejeitados: ${creditosRejeitados.length}
Comprometimento atual: R$${comprometimentoAtual.toFixed(0)}

═══ INSTRUÇÃO ═══
Emita um parecer de underwriting COMPLETO. Responda APENAS com JSON válido, sem markdown:
{
  "veredicto": "APROVADO" | "CONDICIONAL" | "RECUSADO",
  "pontuacaoRisco": 0-100,
  "classeRisco": "A" | "B" | "C" | "D" | "E",
  "resumoExecutivo": "2-3 frases com o raciocínio central da decisão",
  "capacidadePagamento": {
    "avaliacao": "forte/adequada/limitada/insuficiente",
    "dscr": "estimativa do índice de cobertura do serviço da dívida",
    "observacao": "frase explicativa"
  },
  "garantiasRecomendadas": ["lista de garantias necessárias para este perfil"],
  "condicoesEspecificas": ["condições para aprovação (se CONDICIONAL) ou motivos de recusa (se RECUSADO)"],
  "linhasRecomendadas": [
    {
      "linha": "nome da linha",
      "entidade": "banco/coop",
      "valorMax": "estimativa R$",
      "taxaEstimada": "% a.a.",
      "prazoMax": "meses",
      "requisito": "exigência principal"
    }
  ],
  "fatoresPositivos": ["pontos favoráveis identificados"],
  "fatoresRisco": ["riscos identificados"],
  "pendenciasDocumentais": ["documentos faltantes ou vencidos que impactam a análise"],
  "proximosPassos": ["ações recomendadas ao produtor"],
  "validadeParecerDias": 30
}`

    const resultado = await groq([{ role: 'user', content: prompt }], 1500)

    let parecer: Record<string, unknown>
    try {
      const clean = resultado.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parecer = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Não foi possível estruturar o parecer de underwriting' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      geradoEm: hoje.toISOString(),
      produtor: user?.name,
      propriedade: property?.name,
      scoreAgroRate: agroRate.score,
      categoria: agroRate.category,
      parecer,
    })
  } catch (e: any) {
    console.error('[Underwriting Error]', e?.message)
    return NextResponse.json({ error: e?.message ?? 'Erro interno' }, { status: 500 })
  }
}
